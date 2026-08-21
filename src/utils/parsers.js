function parseOrderItems(order) {
  // console.log(data[0]);
  return {
    ca_order_id: order.ID,
    po_num: order.SiteOrderID,
    items:
      order.Items?.map((item) => ({
        sku: item.Sku,
        ca_id: item.ProductID,
        quantity: item.Quantity,
        is_bundle: item.IsBundle,
        bundle_components:
          item.BundleComponents?.map((component) => ({
            sku: component.Sku,
            ca_id: component.ProductID,
            quantity: component.Quantity,
          })) || [],
      })) || [],
  };
  return orders.map((order) => {
    try {
      return {
        ca_order_id: order.ID,
        po_num: order.SiteOrderID,
        items:
          order.Items?.map((item) => ({
            sku: item.Sku,
            ca_id: item.ProductID,
            quantity: item.Quantity,
            is_bundle: item.IsBundle,
            bundle_components:
              item.BundleComponents?.map((component) => ({
                sku: component.Sku,
                ca_id: component.ProductID,
                quantity: component.Quantity,
              })) || [],
          })) || [],
      };
    } catch (e) {
      const error = new Error(
        `Parsing failed for order with CA_Order_ID: ${order.ID}. ${e}`,
        { cause: e },
      );
      error.type = "PARSING";
      error.payload = {
        CA_Order_ID: order.CA_Order_ID || "Unknown",
        License_Plates: order.License_Plates || [],
      };
      throw error;
    }
  });
}

function parseSalesDocuments(data) {
  const documents = data || [];
  console.log(`Parsing ${documents.length} sales documents...`);
  return documents.map((doc) => {
    try {
      // console.log(`Parsing document: ${doc}`);
      return {
        Sales_Doc_Num: doc.Sales_Doc_Num?.trim(),
        DEX_ROW_TS: doc.DEX_ROW_TS,
        CA_Order_ID: doc.USRDEF03?.trim(),
        Customer_PO_Num: doc.Customer_PO_Num?.trim(),
        Warehouse: doc.Warehouse_Code?.trim(),
      };
    } catch (e) {
      const error = new Error(
        `Parsing failed for document with Sales_Doc_Num: ${doc.Sales_Doc_Num}.`,
        { cause: e },
      );
      error.type = "PARSING";
      error.payload = {
        Sales_Doc_Num: doc.Sales_Doc_Num || "Unknown",
        DEX_ROW_TS: doc.Doc_Date || "Unknown",
        CA_Order_ID: doc.USRDEF03 || "Unknown",
        Customer_PO_Num: doc.Customer_PO_Num || "Unknown",
        Warehouse: doc.Warehouse_Code || "Unknown",
      };
      throw error;
    }
  });
}

module.exports = {
  parseOrderItems,
  parseSalesDocuments,
};
