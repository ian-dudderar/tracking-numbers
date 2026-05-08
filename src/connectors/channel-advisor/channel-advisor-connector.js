const Bottleneck = require("bottleneck");
require("dotenv").config();

const BASE_URL = `https://api.channeladvisor.com`;

// Bottleneck for limiting API calls
const CHANNEL_ADVISOR_CALL_LIMIT = 5;

const limiter = new Bottleneck({
  maxConcurrent: CHANNEL_ADVISOR_CALL_LIMIT,
});

/**
 * Singleton class for interacting with the ChannelAdvisor API.
 */
class ChannelAdvisorConnector {
  static instance;

  static getInstance() {
    if (!this.instance) this.instance = new ChannelAdvisorConnector();
    return this.instance;
  }

  constructor() {
    if (ChannelAdvisorConnector.instance) {
      throw new Error(
        "ChannelAdvisorAPI is a singleton. Use ChannelAdvisorAPI.getInstance() instead.",
      );
    }

    const applicationId = process.env["CA_APPLICATION_ID"];
    const refreshToken = process.env["CA_REFRESH_TOKEN"];
    const sharedSecret = process.env["CA_SHARED_SECRET"];
    if (!applicationId || !refreshToken || !sharedSecret) {
      throw new Error(
        "No CA_APPLICATION_ID, CA_REFRESH_TOKEN, or CA_SHARED_SECRET set in environment variables.",
      );
    }
    this.applicationId = applicationId;
    this.refreshToken = refreshToken;
    this.sharedSecret = sharedSecret;

    this.accessToken = undefined;

    ChannelAdvisorConnector.instance = this;
  }

  /**
   * Retrieves an access token from the ChannelAdvisor API.
   * Requires the applicationId, refreshToken, and sharedSecret to be set in the environment variables.
   * @returns The access token
   */

  async getAccessToken() {
    const url = `${BASE_URL}/oauth2/token`;

    const data = `${this.applicationId}:${this.sharedSecret}`;
    const encodedData = Buffer.from(data).toString("base64");

    const responseBody = await this.makeRequest({
      url,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${encodedData}`,
      },
      data: `grant_type=refresh_token&refresh_token=${this.refreshToken}`,
      skipAuth: true,
    });

    const accessToken = responseBody.access_token;

    this.accessToken = accessToken;

    return this.accessToken;
  }

  /**
   * Ensures that the access token is set. If it is not set, it will be retrieved.
   * Should be called before making any requests to the ChannelAdvisor API.
   */
  async ensureAccessToken() {
    if (!this.accessToken) {
      await this.getAccessToken();
    }
  }

  /**
   * Converts the ChannelAdvisorQueryOptions object into a URLSearchParams object.
   * @param options The ChannelAdvisorQueryOptions object
   * @returns The URLSearchParams object
   */
  convertOptionsToQueryString(options) {
    const params = new URLSearchParams(options);
    return params.toString();
  }

  /**
   * Makes a request to the ChannelAdvisor API.
   * Appends the access token to the request headers.
   * @param options The request options
   * @returns The response body
   */
  async makeRequest(options) {
    var { url, method, data, headers, skipAuth } = options;

    // Ensure that the access token is set
    if (!skipAuth) {
      await this.ensureAccessToken();
    }

    // Set the request headers
    let fetchParams = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
    };

    // If there is data, add it to the request body
    if (data) {
      fetchParams.body = typeof data === "string" ? data : JSON.stringify(data);
    }

    // If there are headers, add them to the request headers
    if (headers) {
      fetchParams["headers"] = headers;
    }

    // Make the request
    const response = await limiter.schedule(() => fetch(url, fetchParams));
    const status = response.status;
    const text = await response.text();
    const responseBody = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const error = new Error("Request failed.");
      error.api = {
        status,
        message: responseBody?.Message || null,
      };
      throw error;
    }

    return responseBody;
  }

  async fetchAllPages(url) {
    const accumulator = [];
    let nextUrl = url;
    while (nextUrl) {
      console.log("Fetching URL:", nextUrl);
      const page = await this.makeRequest({ url: nextUrl, method: "GET" });
      console.log(page);
      console.log(page["@odata.nextLink"]);

      // Append current page results
      if (Array.isArray(page.value)) {
        accumulator.push(...page.value);
      }

      // Determine next page URL
      nextUrl = page["@odata.nextLink"]
        ? page["@odata.nextLink"].startsWith("http")
          ? page["@odata.nextLink"]
          : `${BASE_URL}${page["@odata.nextLink"]}`
        : null;

      console.log("After Next URL:", nextUrl);
    }
    return accumulator;
  }

  Orders = {
    Shipment: {
      post: async (orderId, sku, trackingNumber) => {
        if (!orderId) {
          throw new Error("ID and data are required for posting shipment");
        }
        const body = {
          Value: {
            TrackingNumber: `${trackingNumber}`,
            PreventMarketplaceCommunication: false,
            Items: [
              {
                Sku: `${sku}`,
                Quantity: 1,
              },
            ],
          },
        };
        await this.ensureAccessToken();

        const url = `${BASE_URL}/v1/Orders(${orderId})/Ship`;
        return this.makeRequest({
          url: url,
          method: "POST",
          data: body,
        });
      },
    },
  };

  async waitForExport(token) {
    let status = await this.Products.Export.get(token);
    while (status.Status !== "Complete") {
      console.log(`Export status: ${status.Status}`);
      await new Promise((res) => setTimeout(res, 5000));
      status = await this.Products.Export.get(token);
    }
    return status.ResponseFileUrl;
  }
}

module.exports = ChannelAdvisorConnector;
