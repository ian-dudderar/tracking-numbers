const db = require("./connectors/MXWDSQL2/db");
const fs = require("fs");
const path = require("path");

const { handleError } = require("./utils/error-handlers");

const { pollData, setLastPollDate } = require("./scripts/poll");
const { parseSalesDocuments } = require("./utils/parsers");
const { addLicensePlates } = require("./scripts/add-license-plates");
const { uploadTrackingNumbers } = require("./scripts/upload-tracking-numbers");

// const args = process.argv.slice(2);
// const getArg = (name) => {
//   const arg = args.find((a) => a.startsWith(`${name}=`));
//   return arg ? arg.split("=")[1] : undefined;
// };

// const poNum = getArg("poNum");

run();

async function run(poNum = null) {
  const isBatch = !poNum;

  // Determines whether we run the entire program or just a single order based on presence of poNum argument
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

  // await executeWorkflow(config);
  await executeWorkflow();
}

async function executeWorkflow(
  config = {
    mode: "batch",
    pollArg: undefined,
    shouldSave: true,
    shouldSetPollDate: true,
    message: "Polling for new orders since last poll date...",
  },
) {
  console.log("Starting workflow execution...");
  try {
    // Step 0) Connect to DB
    await db.connect();

    // Step 1) Poll Data
    const { pollRes, lastPollDate } = await pollData(config.pollArg);

    // Step 2) Parse Data
    const salesDocuments = parseSalesDocuments(pollRes);

    // Step 3) Add and Hydrate License Plates
    await addLicensePlates(salesDocuments);

    // Step 4) Save Sales Documents to file
    saveToFile(salesDocuments);

    // Step 5) Upload Tracking Numbers
    const newPollDate = await uploadTrackingNumbers(
      salesDocuments,
      config.mode === "batch" ? lastPollDate : null,
    );

    // Step 6) Set new poll date if in batch mode
    if (config.shouldSetPollDate) {
      setLastPollDate(newPollDate);
    }
  } catch (error) {
    if (!error.type) error.type = "System";
    handleError(error);
  } finally {
    console.log("Ending workflow execution...");
    await db.close();
  }
}

function saveToFile(salesDocuments) {
  const jsonData = JSON.stringify(salesDocuments, null, 2);

  const dir = path.join(process.cwd(), "files", "data");
  const filePath = path.join(dir, "sales_documents.json");

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, jsonData);
}
