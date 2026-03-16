function parseSalesDocuments(data) {
  const documents = data.Items || [];
  return documents.map((doc) => {
    return {
      Sales_Doc_Num: doc.Sales_Doc_Num.trim(),
      DEX_ROW_TS: doc.DEX_ROW_TS,
      CA_Order_ID: doc.USRDEF03.trim(),
      Customer_PO_Num: doc.Customer_PO_Num.trim(),
      Warehouse: doc.Warehouse_Code.trim(),
    };
  });
}

module.exports = {
  parseSalesDocuments,
};
