const fs = require("fs");

const lines = fs
  .readFileSync("files/errors/failures.log", "utf-8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map(JSON.parse);

const latestFailures = new Map();

console.log("hit!");

for (const entry of lines) {
  const existing = latestFailures.get(entry.orderId);

  if (
    !existing ||
    new Date(entry.lastAttempt) > new Date(existing.lastAttempt)
  ) {
    latestFailures.set(entry.orderId, entry);
  }
}

for (const failure of latestFailures.values()) {
  try {
    // await processOrder(failure.orderId);
    console.log(`Processing order ${failure.error}...`);

    // success → remove or mark resolved (we'll refine this next step)
  } catch (err) {
    // update retry count and write back (next step)
  }
}
