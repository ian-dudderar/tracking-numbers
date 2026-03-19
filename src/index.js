const db = require("./connectors/MXWDSQL2/db");

const { pollData, setLastPollDate } = require("./scripts/poll");
const { parseSalesDocuments } = require("./utils/parsers");
const { addLicensePlates } = require("./scripts/add-license-plates");
const { uploadTrackingNumbers } = require("./scripts/upload-tracking-numbers");

const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find((a) => a.startsWith(`${name}=`));
  return arg ? arg.split("=")[1] : undefined;
};

const poNum = getArg("poNum");

run(poNum);

async function run(poNum = null) {
  if (!poNum) {
    console.log("Polling for new orders since last poll date...");
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
  } else {
    console.log(`Processing order with PO Number: ${poNum}`);
    try {
      await db.connect();
      const { pollRes, lastPollDate } = await pollData(poNum); // Poll failed, system failure
      const salesDocuments = parseSalesDocuments(pollRes);
      await addLicensePlates(salesDocuments); // License Plates failed, system failure
      await uploadTrackingNumbers(salesDocuments, null); // Upload failed as a whole, not individual, system failure
    } catch (e) {
      console.error("Error during polling:", e);
    } finally {
      console.log("Polling process completed.");
      await db.close();
    }
  }
}
