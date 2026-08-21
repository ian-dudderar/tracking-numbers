const {
  queryLicensePlateDetailIDs,
  queryLicensePlateDetails,
  queryTrackingNumber,
  querySkus,
} = require("../connectors/MXWDSQL2/database-service");

// Querys the Database and attaches the License Plate Detail ID to the sales document object
async function getLPDetailID(salesDocument) {
  const id = salesDocument.Sales_Doc_Num;
  if (!id) {
    console.log(
      `Sales document ${salesDocument} does not have a Sales_Doc_Num`,
    );
    return;
  }
  const res = await queryLicensePlateDetailIDs(id);
  if (!res || res.length === 0) {
    console.log(`No license plate details found for sales document ${id}`);
    return;
  }
  const licensePlates = res.map((row) => ({
    License_Plate_Detail_ID: row.License_Plate_Detail_ID,
  }));
  salesDocument.License_Plates = licensePlates;
}

async function hydrateLicensePlate(licensePlate) {
  await getLPDetails(licensePlate);
  await getTrackingNumber(licensePlate);
  // await getSkus(licensePlate);
}

async function getLPDetails(licensePlate) {
  const detailID = licensePlate.License_Plate_Detail_ID;
  if (!detailID) return;
  const res = await queryLicensePlateDetails(detailID);
  if (!res || res.length === 0) return;
  const lpId = res[0]?.License_Plate_ID || null;
  const itemNumber = res[0]?.Item_Number || null;
  if (!lpId || !itemNumber) return null;
  licensePlate.License_Plate_ID = lpId;
  licensePlate.Item_Number = itemNumber;
}

async function getTrackingNumber(licensePlate) {
  const lpID = licensePlate.License_Plate_ID;
  if (!lpID) return;
  const res = await queryTrackingNumber(lpID);
  if (!res || res.length === 0) return;
  licensePlate.Tracking_number = res[0]?.Tracking_Number || null;
}

async function getSkus(licensePlate) {
  const itemNum = licensePlate.Item_Number;
  if (!itemNum) return;
  const res = await querySkus(itemNum);
  if (!res || res.length === 0) return;
  licensePlate.SKU = res[0]?.ShortName || null;
}

module.exports = {
  getLPDetailID,
  hydrateLicensePlate,
};
