const db = require("./connectors/MXWDSQL2/db");

const { pollData, setLastPollDate } = require("./scripts/poll");
const { parseSalesDocuments } = require("./utils/parsers");
const { addLicensePlates } = require("./scripts/add-license-plates");
const { uploadTrackingNumbers } = require("./scripts/upload-tracking-numbers");
const fs = require("fs").promises;

async function run() {
  try {
    await db.connect();
    const { pollRes, lastPollDate } = await pollData(); // Poll failed, system failure
    const salesDocuments = parseSalesDocuments(pollRes);
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

async function test() {
  try {
    // await db.connect();
    // const { pollRes, lastPollDate } = await pollData(); // Poll failed, system failure
    // const salesDocuments = parseSalesDocuments(pollRes);
    // await addLicensePlates(salesDocuments); // License Plates failed, system failure

    const fileContents = await fs.readFile("./files/data.json", "utf8");
    const lastPollDate = await fs.readFile("./files/lastPoll.json", "utf8");
    const salesDocuments = JSON.parse(fileContents);
    // console.log("Sales Documents:", salesDocuments);
    // try {
    //   const newPollDate = await uploadTrackingNumbers(
    //     salesDocuments,
    //     lastPollDate,
    //   );
    //   setLastPollDate(newPollDate);
    // } catch (e) {
    //   console.error("Error running script");
    // }
  } catch (e) {
    console.error("Error during polling:", e);
  } finally {
    console.log("Polling process completed.");
    await db.close();
  }
}

run();
