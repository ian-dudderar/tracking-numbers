const ChannelAdvisorConnector = require("./channel-advisor-connector");
const ChannelAdvisor = ChannelAdvisorConnector.getInstance();

const { handleError } = require("../../utils/error-handlers");

require("dotenv").config();

async function postOrderTracking(order) {
  const orderId = order.CA_Order_ID;
  const lineItems = order.License_Plates;
  const missingParams = [];
  if (!orderId) missingParams.push("Order ID");
  if (!lineItems) missingParams.push("Line Items");
  if (missingParams.length > 0) {
    const error = new Error(`${missingParams.join(" and ")} required.`);
    error.type = "MISSING_PARAMS";
    error.payload = { order };
    handleError(error);
    return;
  }

  console.log("Posting tracking for order:", orderId);
  try {
    for (const item of lineItems) {
      const { SKU, Tracking_number } = item;
      await ChannelAdvisor.Orders.Shipment.post(orderId, SKU, Tracking_number);
    }
  } catch (e) {
    const error = new Error(`Error posting tracking for order ${orderId}.`, {
      cause: e,
    });
    error.type = "POST_ORDER_TRACKING";
    error.payload = { order };
    handleError(error);
  }

  return null;
}

module.exports = {
  postOrderTracking,
};
