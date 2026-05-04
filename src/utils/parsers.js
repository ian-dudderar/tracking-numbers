function parseSalesDocuments(data) {
  const documents = data.Items || [];
  return documents.map((doc) => {
    try {
      return {
        Sales_Doc_Num: doc.Sales_Doc_Num.trim(),
        DEX_ROW_TS: doc.Doc_Date.trim(),
        CA_Order_ID: doc.USRDEF03.trim(),
        Customer_PO_Num: doc.Customer_PO_Num.trim(),
        Warehouse: doc.Warehouse_Code.trim(),
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
  parseSalesDocuments,
};
