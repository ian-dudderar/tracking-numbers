const {
  getLPDetailID,
  hydrateLicensePlate,
} = require("../utils/license-plates-helpers");

const { handleError } = require("../utils/error-handlers");

async function addLicensePlates(salesDocuments) {
  for (const salesDocument of salesDocuments) {
    try {
      await getLPDetailID(salesDocument);
      for (const licensePlate of salesDocument.License_Plates || []) {
        await hydrateLicensePlate(licensePlate);
      }
    } catch (e) {
      const error = new Error(
        `Error processing sales document: ${salesDocument.Sales_Document}`,
        { cause: e },
      );
      error.type = "LICENSE_PLATE_PROCESSING";
      error.payload = { salesDocument }; // Do we need brackets idk
      handleError(error);
    }
  }
  console.log("Finished adding license  IDs.");
}

module.exports = { addLicensePlates };
