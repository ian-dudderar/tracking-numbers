const fs = require("fs");
const path = require("path");

const RETRY_TYPES = new Set([
  "LICENSE_PLATE_PROCESSING",
  "POST_ORDER_TRACKING",
]);

function handleError(error) {
  console.error("Error:", error.message);
  recordFailure(error);
  if (isRetryable(error)) {
    enqueueRetry(error);
  }
}

function recordFailure(error) {
  const entry = {
    createdAt: new Date().toISOString(),
    type: error.type || "Unknown",
    message: error.message || "No message",
    payload: error.payload || {},
  };
  const dir = path.join(process.cwd(), "files", "errors");
  const filePath = path.join(dir, "failures.log");

  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(entry) + "\n");
}

function enqueueRetry(error) {
  const entry = {
    createdAt: new Date().toISOString(),
    lastAttempt: new Date().toISOString(),
    retryCount: 0,
    type: error.type || "Unknown",
    message: error.message || "No message",
    payload: error.payload || {},
  };

  const dir = path.join(process.cwd(), "files", "errors");
  const filePath = path.join(dir, "retry_queue.jsonl");

  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(entry) + "\n");
}

function isRetryable(error) {
  const status = error.api?.status;

  // Or not in the retryable types list
  if (error.type && !RETRY_TYPES.has(error.type)) return false;
  if (!status) return false;

  return status === 429 || (status >= 500 && status <= 503);
}

module.exports = {
  handleError,
};
