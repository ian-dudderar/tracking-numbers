const db = require("./connectors/MXWDSQL2/db");
const fs = require("fs");
const path = require("path");

const { handleError } = require("./utils/error-handlers");

const { pollData, setLastPollDate } = require("./scripts/poll");
const { parseSalesDocuments, parseOrderItems } = require("./utils/parsers");
const { addLicensePlates } = require("./scripts/add-license-plates");
const { uploadTrackingNumbers } = require("./scripts/upload-tracking-numbers");
const {
  getOrderItems,
  getProductAttribute,
  postTrackingNumber,
} = require("./connectors/channel-advisor/channel-advisor-service");

// const args = process.argv.slice(2);
// const getArg = (name) => {
//   const arg = args.find((a) => a.startsWith(`${name}=`));
//   return arg ? arg.split("=")[1] : undefined;
// };

// const poNum = getArg("poNum");

run();

async function run(poNum = null) {
  // Determines whether we run the entire program or just a single order based on presence of poNum argument
  const brand = process.argv[2].toLowerCase();

  // await executeWorkflow(config);
  await executeWorkflow(brand.toUpperCase());
}

async function executeWorkflow(brand) {
  console.log("Starting workflow execution...");
  console.log(brand);
  const CODE = process.env[`${brand}_CODE`];

  try {
    // Step 0) Connect to DB
    await db.connect();
    // Step 1) Poll Data
    const { pollRes, lastPollDate } = await pollData(CODE);
    // Step 2) Parse Data
    const salesDocuments = parseSalesDocuments(pollRes);
    // Step 3) Add and Hydrate License Plates
    await addLicensePlates(salesDocuments);
    // Step 4) Save Sales Documents to file
    saveToFile(salesDocuments);
    // const fileContents = await fs.promises.readFile(
    //   "./files/data/sales_documents.json",
    //   "utf8",
    // );
    // const salesDocuments = JSON.parse(fileContents);
    for (const order of salesDocuments) {
      const orderId = order.CA_Order_ID;
      let lineItems, trackingMap;
      try {
        await getOrderItems(orderId);
        const items = await getOrderItems(orderId);
        lineItems = extractLineItems(items);
        trackingMap = generateTrackingMap(order.License_Plates);
      } catch (e) {
        const error = new Error(
          `Failed to fetch/prepare order ${order.Customer_PO_Num} (CA ID: ${orderId})`,
          { cause: e },
        );
        error.type = "ORDER_ITEM_FETCH";
        error.payload = { orderId, poNum: order.Customer_PO_Num };
        handleError(error);
        continue;
      }
      console.log(
        `Order: ${order.Customer_PO_Num}. ChannelAdvisor ID: ${order.CA_Order_ID}`,
      );
      for (const lineItem of lineItems) {
        try {
          const gpItemNum = await getProductAttribute(
            lineItem.ca_id,
            "GP Item Number",
          );
          const trackingNums = trackingMap.get(gpItemNum.toUpperCase());
          const trackingNum = trackingNums ? trackingNums.shift() : null;
          await postTrackingNumber(orderId, trackingNum, lineItem.sku);
        } catch (e) {
          const error = new Error(
            `Failed to post tracking number for SKU ${lineItem.sku} on order ${order.Customer_PO_Num}`,
            { cause: e },
          );
          error.type = "POST_ORDER_TRACKING";
          error.payload = { orderId, sku: lineItem.sku, caId: lineItem.ca_id };
          handleError(error);
        }
      }
    }
  } catch (error) {
    if (!error.type) error.type = "System";
    handleError(error);
  } finally {
    console.log("Ending workflow execution...");
    await db.close();
  }
}

function generateTrackingMap(licensePlates) {
  const data = new Map();
  for (const licensePlate of licensePlates) {
    const gpItemNumber = licensePlate.Item_Number.toUpperCase();
    if (!data.has(gpItemNumber)) {
      data.set(gpItemNumber, []);
    }
    data.get(gpItemNumber).push(licensePlate.Tracking_number);
  }
  return data;
}

function extractLineItems(order) {
  const lineItems = [];
  for (const item of order.items) {
    if (!item.is_bundle) {
      for (let x = 1; x <= item.quantity; x++) {
        lineItems.push({
          sku: item.sku,
          ca_id: item.ca_id,
        });
      }
    } else {
      for (const component of item.bundle_components) {
        for (let x = 1; x <= component.quantity; x++) {
          lineItems.push({
            sku: component.sku,
            quantity: component.quantity,
            ca_id: component.ca_id,
          });
        }
      }
    }
  }
  return lineItems;
}

function saveToFile(salesDocuments) {
  const jsonData = JSON.stringify(salesDocuments, null, 2);

  const dir = path.join(process.cwd(), "files", "data");
  const filePath = path.join(dir, "sales_documents.json");

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, jsonData);
}
