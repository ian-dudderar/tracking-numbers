const ChannelAdvisorConnector = require("./channel-advisor-connector");
const ChannelAdvisor = ChannelAdvisorConnector.getInstance();

const { handleError } = require("../../utils/error-handlers");

require("dotenv").config();

async function postOrderTracking(order) {
  const orderId = order.CA_Order_ID;
  const lineItems = order.License_Plates;
  if (!orderId || !lineItems) {
    const error = new Error("Order ID and Line Items are required.");
    error.type = "POST_ORDER_TRACKING";
    error.payload = { order };
    handleError(error);
    return;
  }
  try {
    for (const item of lineItems) {
      const { SKU, Tracking_number } = item;
      await ChannelAdvisor.Orders.Shipment.post(orderId, SKU, Tracking_number);
    }
  } catch (e) {
    // error.orderId = orderId;
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
