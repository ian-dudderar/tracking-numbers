const ChannelAdvisorConnector = require("./channel-advisor-connector");
const ChannelAdvisor = ChannelAdvisorConnector.getInstance();

const { handleError } = require("../../utils/error-handlers");
const { parseOrderItems } = require("../../utils/parsers");

require("dotenv").config();

async function getProductAttribute(productId, attributes) {
  const res = await ChannelAdvisor.Products.Attribute.get(
    productId,
    attributes,
  );
  const value = res.Value;
  return value;
}

async function getOrderItems(orderId) {
  const res = await ChannelAdvisor.Orders.Items.get(orderId);
  const order = parseOrderItems(res);
  return order;
}

async function postTrackingNumber(orderId, trackingNumber, sku) {
  console.log(`Setting Tracking Number: ${trackingNumber} for SKU: ${sku}`);
  // await ChannelAdvisor.Orders.Shipment.post(orderId, sku, trackingNumber);
}

module.exports = {
  getProductAttribute,
  getOrderItems,
  postTrackingNumber,
};
