const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "..", "..", "files", "lastPoll.json");

function getLastPollDate() {
  console.log("Getting last poll date...", FILE_PATH);
  try {
    if (!fs.existsSync(FILE_PATH)) return null;
    const data = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(data);
    const lastPollDate = new Date(parsed.lastPoll);
    console.log("Last poll date read from file:", lastPollDate);
    return new Date(lastPollDate);
  } catch (err) {
    console.error("Error reading last poll date:", err);
    return null;
  }
}

function setLastPollDate(date) {
  console.log("Setting last poll date...", date);
  try {
    fs.writeFileSync(
      FILE_PATH,
      JSON.stringify({ lastPoll: date.toISOString() }),
      "utf8",
    );
  } catch (err) {
    console.error("Error writing last poll date:", err);
  }
}

module.exports = {
  getLastPollDate,
  setLastPollDate,
};
