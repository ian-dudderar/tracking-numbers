require("dotenv").config();
const sql = require("mssql");

class DatabaseConnector {
  static instance;

  constructor() {
    this.pool = null; // actual connection pool
    this.connecting = null; // promise to prevent race conditions
  }

  // Singleton getter
  static getInstance() {
    if (!DatabaseConnector.instance) {
      console.log("Creating new DatabaseConnector instance");
      DatabaseConnector.instance = new DatabaseConnector();
    }
    return DatabaseConnector.instance;
  }

  // Initialize connection pool
  async connect() {
    if (this.pool?.connected) return this.pool; // already connected
    if (this.pool && !this.pool.connected) {
      this.pool = null; // stale/closed pool reference
    }
    if (this.connecting) return this.connecting; // connection in progress

    console.log("Connecting to database...");
    const config = {
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: false, // set true if using TLS
        enableArithAbort: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    this.connecting = (async () => {
      try {
        const pool = new sql.ConnectionPool(config);
        await pool.connect();

        // Optional: listen for pool errors
        pool.on("error", (err) => {
          console.error("SQL Pool Error:", err);
        });

        this.pool = pool;

        console.log("Database connected successfully.");
        return pool;
      } catch (err) {
        console.error("Database connection failed:", err);
        throw err;
      } finally {
        this.connecting = null; // clear the connecting promise
      }
    })();

    return this.connecting;
  }

  // Run a query safely
  async query(queryString, params = {}) {
    const pool = await this.connect();
    const request = pool.request();

    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.query(queryString);
    return result.recordset;
  }

  // Close the connection pool
  async close() {
    console.log("Closing database pool...");
    if (this.connecting) {
      await this.connecting.catch(() => null);
    }

    if (!this.pool) {
      return;
    }

    try {
      await this.pool.close();
      console.log("Database pool closed.");
    } catch (err) {
      console.error("Error closing database pool:", err);
    } finally {
      this.pool = null;
    }
  }
}

module.exports = DatabaseConnector;
