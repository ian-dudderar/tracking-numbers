const SalespadConnector = require("./salespad-connector");
const Salespad = SalespadConnector.getInstance();

async function fetchSalesDocuments(lastPollDate) {
  console.log("Fetching sales documents updated since:", lastPollDate);
  const isoDate = new Date(lastPollDate).toISOString();
  const salesDocuments = await Salespad.makeRequest(
    "/SalesDocumentSearch",
    "GET",
    {
      $filter: `(Warehouse_Code eq 'BARRETT' or (Warehouse_Code eq 'CASTLEGATE' and Customer_Num ne '0003500')) and Sales_Doc_Type eq 'INVOICE' and Doc_Date ge datetime'${isoDate}'`,
      $orderby: "Doc_Date asc", // Ensure we get the oldest first to update last poll date correctly
    },
  );
  return salesDocuments;
}

async function fetchSalesDocument(poNumber) {
  console.log("Fetching sales document:", poNumber);
  const salesDocuments = await Salespad.makeRequest(
    "/SalesDocumentSearch",
    "GET",
    {
      $filter: `Customer_PO_Num eq '${poNumber}'`,
      $orderby: "Doc_Date asc", // Ensure we get the oldest first to update last poll date correctly
    },
  );
  return salesDocuments;
}

module.exports = {
  fetchSalesDocuments,
  fetchSalesDocument,
};
