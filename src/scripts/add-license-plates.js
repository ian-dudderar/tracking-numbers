const {
  getLPDetailID,
  getLPDetails,
  getTrackingNumber,
  getSkus,
} = require("../utils/license-plates-helpers");

async function addLicensePlates(salesDocuments) {
  try {
    for (const salesDocument of salesDocuments) {
      await getLPDetailID(salesDocument);
      for (const licensePlate of salesDocument.License_Plates || []) {
        await getLPDetails(licensePlate);
        await getTrackingNumber(licensePlate);
        await getSkus(licensePlate);
      }
    }
  } catch (e) {
    throw new Error(`Polling failed: ${e.message}`);
  }
}

module.exports = { addLicensePlates };
