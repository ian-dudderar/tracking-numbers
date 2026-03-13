const ChannelAdvisorConnector = require("./channel-advisor-connector");
const ChannelAdvisor = ChannelAdvisorConnector.getInstance();
require("dotenv").config();

async function postOrderTracking(order) {
  const orderId = order.CA_Order_ID;
  const lineItems = order.License_Plates;
  if (!orderId || !lineItems) {
    throw new Error("Order ID and Line Items are required.");
  }
  for (const item of lineItems) {
    const { SKU, Tracking_number } = item;
    await ChannelAdvisor.Orders.Shipment.post(orderId, SKU, Tracking_number);
  }

  return null;
}

module.exports = {
  postOrderTracking,
};
