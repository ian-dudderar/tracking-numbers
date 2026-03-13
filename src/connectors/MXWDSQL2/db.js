const DatabaseConnector = require("./database-connector");

// Shared singleton instance for this process.
const db = DatabaseConnector.getInstance();

module.exports = db;
