const fs = require("fs");

const RETRY_TYPES = ["LICENSE_PLATE_PROCESSING", "POST_ORDER_TRACKING"]; // Example retryable types

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
  //   {
  //   "type": "post_order_tracking",
  //   "payload": {
  //     "orderId": "10742742"
  //   },
  //   "retryCount": 1,
  //   "lastAttempt": "...",
  //   "createdAt": "..."
  // }
  fs.appendFileSync("files/errors/failures.log", JSON.stringify(entry) + "\n");
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

  fs.appendFileSync(
    "files/queues/retry_queue.jsonl",
    JSON.stringify(entry) + "\n",
  );
}

function isRetryable(error) {
  const status = error.api?.status;

  // Or not in the retryable types list
  if (error.type && !RETRY_TYPES.includes(error.type)) return false;
  if (!status) return false;

  return status === 429 || (status >= 500 && status <= 503);
}

module.exports = {
  handleError,
};
