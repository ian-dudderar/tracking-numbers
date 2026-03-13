require("dotenv").config();

class SalespadConnector {
  static instance;

  static getInstance() {
    if (!this.instance) this.instance = new SalespadConnector();
    return this.instance;
  }

  constructor() {
    this.SESSION_ID = process.env.SP_SESSION_ID;
    this.URL = process.env.SP_API;
  }

  async makeRequest(endpoint, method = "GET", params = {}, body = null) {
    if (!this.SESSION_ID || !this.URL) {
      console.error(
        "Missing Salespad configuration. Check environment variables.",
      );
      return null;
    }

    const headers = new Headers();
    headers.append("Session-ID", this.SESSION_ID);

    const queryString = new URLSearchParams(params).toString();
    const url = `${this.URL}${endpoint}${queryString ? `?${queryString}` : ""}`;
    console.log(`Making ${method} request to: ${url}`);

    const options = { method, headers };
    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${url}`, options);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Request failed: ${res.status} - ${errorText}`);
    }
    const data = await res.json();
    // console.log("Request comleted successfully. Response data:");
    // console.log(data);

    return data;
  }
}

module.exports = SalespadConnector;
