const {
  postOrderTracking,
} = require("../connectors/channel-advisor/channel-advisor-service");

const { handleError } = require("../utils/error-handlers");

async function uploadTrackingNumbers(salesDocuments, lastPollDate) {
  let pollDate = lastPollDate;

  // Per Order
  for (const salesDocument of salesDocuments) {
    await postOrderTracking(salesDocument);

    // We keep track of the most recently updated order that has been successfully processed
    // So that the next time we poll, we only pull orders past that date.
    // Note that for this to work, orders must be pulled by date in ASC order
    const updated = new Date(salesDocument.DEX_ROW_TS);
    if (updated > pollDate) {
      pollDate = updated;
    }
  }
  return pollDate;
}

module.exports = { uploadTrackingNumbers };
