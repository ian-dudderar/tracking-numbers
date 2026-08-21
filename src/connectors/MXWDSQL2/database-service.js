const db = require("./db");

async function fetchSalesDocuments(customerNumber, lastPollDate) {
  console.log("Fetching sales documents updated since:", lastPollDate);
  const query = `
  SELECT Sales_Doc_Num,
  Sales_Doc_ID,
  DEX_ROW_TS,
  Customer_PO_Num,
  Warehouse_Code,
  USRDEF03
  FROM [MAX].[dbo].[spvSalesDocumentSearchDEX]
  WHERE DEX_ROW_TS >= @lastPollDate
  AND Status LIKE '%TRK%'
  AND Sales_Doc_Type = 'ORDER'
  AND Customer_Num = @customerNumber

  `;

  const result = await db.query(query, {
    lastPollDate: lastPollDate,
    customerNumber,
  });

  return result;
}
// Retrieves a list of License Plate Detail IDS for a sales document number
async function queryLicensePlateDetailIDs(salesDocNum) {
  console.log(`Fetching license plate detail IDs for: ${salesDocNum}`);
  const query = `SELECT License_Plate_Detail_ID FROM [MAX].[dbo].[spLicensePlateSOPLink] WHERE Sales_Doc_Num = @id`;
  const result = await db.query(query, { id: salesDocNum });
  return result;
}

// Retrieves detailed information for a given License Plate Detail ID
async function queryLicensePlateDetails(detailID) {
  console.log(`Fetching details for License_Plate_Detail_ID: ${detailID}`);
  const query = `SELECT License_Plate_ID, Item_Number FROM [MAX].[dbo].[spLicensePlateDetail] WHERE License_Plate_Detail_ID = @id`;
  const result = await db.query(query, { id: detailID });
  return result;
}

async function queryTrackingNumber(licensePlateID) {
  console.log(
    `Fetching tracking number for License_Plate_ID: ${licensePlateID}`,
  );
  const query = `SELECT Tracking_Number FROM [MAX].[dbo].[spLicensePlate] WHERE License_Plate_ID = @id`;
  const result = await db.query(query, { id: licensePlateID });
  return result;
}

async function querySkus(itemNumber) {
  console.log(`Fetching SKUs for Item_Number: ${itemNumber}`);
  const query = `SELECT ShortName FROM MAX.dbo.CAL_WDS_Inventory WHERE ID = @id`;
  const result = await db.query(query, { id: itemNumber });
  return result;
}

module.exports = {
  fetchSalesDocuments,
  queryLicensePlateDetailIDs,
  queryLicensePlateDetails,
  queryTrackingNumber,
  querySkus,
};
