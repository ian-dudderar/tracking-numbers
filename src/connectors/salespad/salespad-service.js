const SalespadConnector = require("./salespad-connector");
const Salespad = SalespadConnector.getInstance();

async function fetchSalesDocuments(lastPollDate) {
  console.log("Fetching sales documents updated since:", lastPollDate);
  const isoDate = new Date(lastPollDate).toISOString();
  const salesDocuments = await Salespad.makeRequest("/SalesDocument", "GET", {
    $filter: `(Warehouse_Code eq 'BARRETT' or (Warehouse_Code eq 'CASTLEGATE')) and Sales_Doc_Type eq 'ORDER' and DEX_ROW_TS ge datetime'${isoDate}'`,
    $orderby: "DEX_ROW_TS asc", // Ensure we get the oldest first to update last poll date correctly
  });
  return salesDocuments;
}

async function fetchSalesDocument(poNumber) {
  console.log("Fetching sales document:", poNumber);
  const salesDocuments = await Salespad.makeRequest(
    "/SalesDocumentHistory",
    "GET",
    {
      $filter: `Customer_PO_Num eq '${poNumber}'`,
      $orderby: "DEX_ROW_TS asc", // Ensure we get the oldest first to update last poll date correctly
    },
  );
  return salesDocuments;
}

module.exports = {
  fetchSalesDocuments,
  fetchSalesDocument,
};
