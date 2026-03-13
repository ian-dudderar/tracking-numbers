const {
  getLPDetailID,
  getLPDetails,
  getTrackingNumber,
  getSkus,
} = require("../utils/license-plates-helpers");

const fs = require("fs"); // Node.js file system module

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
    const jsonData = JSON.stringify(salesDocuments, null, 2);
    fs.writeFile("files/data.json", jsonData, (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log("File successfully written!");
      }
    });
    // return salesDocuments;
  } catch (e) {
    throw new Error(`Polling failed: ${e.message}`);
  }
}

module.exports = { addLicensePlates };
