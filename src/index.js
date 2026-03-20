const db = require("./connectors/MXWDSQL2/db");
const fs = require("fs");

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
  const isBatch = !poNum;

  const config = isBatch
    ? {
        mode: "batch",
        pollArg: undefined,
        shouldSave: true,
        shouldSetPollDate: true,
        message: "Polling for new orders since last poll date...",
      }
    : {
        mode: "single",
        pollArg: poNum,
        shouldSave: false,
        shouldSetPollDate: false,
        message: `Processing order with PO Number: ${poNum}`,
      };

  await executeWorkflow(config);
}

async function executeWorkflow(config) {
  console.log(config.message);
  try {
    await db.connect();
    const { pollRes, lastPollDate } = await pollData(config.pollArg); // Poll failed, system failure

    const salesDocuments = parseSalesDocuments(pollRes);
    await addLicensePlates(salesDocuments); // License Plates failed, system failure

    if (config.shouldSave) {
      saveToFile(salesDocuments);
    }

    const newPollDate = await uploadTrackingNumbers(
      salesDocuments,
      config.mode === "batch" ? lastPollDate : null,
    ); // Upload failed as a whole, not individual, system failure

    if (config.shouldSetPollDate) {
      setLastPollDate(newPollDate);
    }
  } catch (e) {
    console.error("Error during polling:", e);
  } finally {
    console.log("Polling process completed.");
    await db.close();
  }
}

function saveToFile(salesDocuments) {
  const jsonData = JSON.stringify(salesDocuments, null, 2);

  fs.writeFile("files/data.json", jsonData, (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("File successfully written!");
    }
  });
}
