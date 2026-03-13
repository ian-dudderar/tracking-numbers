const SalespadConnector = require("./salespad-connector");
const Salespad = SalespadConnector.getInstance();

async function fetchSalesDocuments(lastPollDate) {
  console.log("Fetching sales documents updated since:", lastPollDate);
  const isoDate = new Date(lastPollDate).toISOString();
  const salesDocuments = await Salespad.makeRequest(
    "/SalesDocumentHistory",
    "GET",
    {
      $filter: `(Warehouse_Code eq 'BARRETT') and Sales_Doc_Type eq 'INVOICE' and DEX_ROW_TS ge datetime'${isoDate}'`,
      // $top: 3,
    },
  );
  return salesDocuments;
}

module.exports = {
  fetchSalesDocuments,
};
