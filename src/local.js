const db = require("./connectors/MXWDSQL2/db");

const { setLastPollDate } = require("./scripts/poll");
const { addLicensePlates } = require("./scripts/add-license-plates");
const { uploadTrackingNumbers } = require("./scripts/upload-tracking-numbers");
const fs = require("fs").promises;

async function run() {
  try {
    const fileContents = await fs.readFile("./files/data.json", "utf8");
    const lastPollDate = await fs.readFile("./files/lastPoll.json", "utf8");
    const salesDocuments = JSON.parse(fileContents);
    await addLicensePlates(salesDocuments); // License Plates failed, system failure
    const newPollDate = await uploadTrackingNumbers(
      salesDocuments,
      lastPollDate,
    ); // Upload failed as a whole, not individual, system failure
    setLastPollDate(newPollDate);
  } catch (e) {
    console.error("Error during polling:", e);
  } finally {
    console.log("Polling process completed.");
    await db.close();
  }
}

run();
