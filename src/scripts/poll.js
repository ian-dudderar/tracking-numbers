const { getLastPollDate, setLastPollDate } = require("../utils/poll-helpers");
const {
  fetchSalesDocuments,
  fetchSalesDocument,
} = require("../connectors/salespad/salespad-service");

async function pollData(poNumber = null) {
  if (!poNumber) {
    try {
      const lastPollDate =
        getLastPollDate() || new Date(Date.now() - 24 * 60 * 60 * 1000); // default 24h ago

      // Add order by date ASC to ensure we can update the last poll date correctly after processing
      const pollRes = await fetchSalesDocuments(lastPollDate);
      return { pollRes, lastPollDate };
    } catch (e) {
      throw new Error(`Polling failed: ${e.message}`);
    }
  } else {
    const pollRes = await fetchSalesDocument(poNumber);
    return { pollRes, lastPollDate: null };
  }
}

module.exports = { pollData, setLastPollDate };
