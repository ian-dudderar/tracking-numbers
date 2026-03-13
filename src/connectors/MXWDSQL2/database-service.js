const db = require("./db");

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
  queryLicensePlateDetailIDs,
  queryLicensePlateDetails,
  queryTrackingNumber,
  querySkus,
};
