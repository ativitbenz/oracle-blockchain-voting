import oracledb from "oracledb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Determine if using Oracle Cloud Wallet (deprecated - use Easy Connect instead)
const useWallet =
  process.env.USE_WALLET === "true" && process.env.WALLET_LOCATION;

// Oracle DB Configuration
const dbConfig = useWallet
  ? {
      // Oracle Cloud Wallet configuration
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING, // e.g., dbname_high
      walletLocation:
        process.env.WALLET_LOCATION || path.join(__dirname, "../../wallet"),
      walletPassword: process.env.WALLET_PASSWORD,
      poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
      poolMax: parseInt(process.env.DB_POOL_MAX) || 20,
      poolIncrement: parseInt(process.env.DB_POOL_INCREMENT) || 2,
      queueTimeout: parseInt(process.env.DB_QUEUE_TIMEOUT) || 120000,
      queueMax: parseInt(process.env.DB_QUEUE_MAX) || 500,
      enableStatistics: true,
    }
  : {
      // Traditional connection
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
      poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
      poolMax: parseInt(process.env.DB_POOL_MAX) || 20,
      poolIncrement: parseInt(process.env.DB_POOL_INCREMENT) || 2,
      queueTimeout: parseInt(process.env.DB_QUEUE_TIMEOUT) || 120000,
      queueMax: parseInt(process.env.DB_QUEUE_MAX) || 500,
      enableStatistics: true,
    };

let pool = null;

/**
 * Initialize Oracle connection pool
 */
export const initializePool = async () => {
  try {
    // Set Oracle client to return results as objects
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

    // Disable auto-commit to allow manual transaction control
    oracledb.autoCommit = false;

    // Configure Oracle Cloud Wallet if enabled
    if (useWallet) {
      console.log("🔐 Using Oracle Cloud Wallet authentication");
      console.log(`📁 Wallet location: ${dbConfig.walletLocation}`);

      // Get Oracle Instant Client path from environment variable
      const instantClientPath =
        process.env.ORACLE_INSTANT_CLIENT_PATH ||
        path.join(process.cwd(), "instantclient_23_9");

      console.log(`📦 Oracle Instant Client: ${instantClientPath}`);

      // Initialize Oracle client with wallet location
      oracledb.initOracleClient({
        configDir: dbConfig.walletLocation,
        libDir: instantClientPath,
      });

      // Create connection pool with wallet
      pool = await oracledb.createPool({
        user: dbConfig.user,
        password: dbConfig.password,
        connectString: dbConfig.connectString,
        poolMin: dbConfig.poolMin,
        poolMax: dbConfig.poolMax,
        poolIncrement: dbConfig.poolIncrement,
        queueTimeout: dbConfig.queueTimeout,
        queueMax: dbConfig.queueMax,
        enableStatistics: dbConfig.enableStatistics,
      });
    } else {
      // Traditional connection pool
      console.log("🔑 Using traditional authentication");
      pool = await oracledb.createPool(dbConfig);
    }

    console.log("✅ Oracle Database connection pool created successfully");
    console.log(`📊 Pool size: ${dbConfig.poolMin}-${dbConfig.poolMax}`);
    console.log(`⏱️  Queue timeout: ${dbConfig.queueTimeout}ms`);
    console.log(`📋 Queue max: ${dbConfig.queueMax}`);
    console.log(`🌐 Connection: ${dbConfig.connectString}`);

    return pool;
  } catch (error) {
    console.error("❌ Error creating Oracle connection pool:", error);
    throw error;
  }
};

/**
 * Get connection from pool
 */
export const getConnection = async () => {
  if (!pool) {
    throw new Error(
      "Database pool not initialized. Call initializePool() first.",
    );
  }

  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error("Error getting connection from pool:", error);
    if (pool) {
      console.error(
        `Pool status: ${pool.connectionsInUse}/${pool.connectionsOpen} connections in use`,
      );
    }
    throw error;
  }
};

/**
 * Close connection pool
 */
export const closePool = async () => {
  if (pool) {
    try {
      await pool.close(10); // 10 seconds drain time
      console.log("Database connection pool closed");
      pool = null;
    } catch (error) {
      console.error("Error closing connection pool:", error);
      throw error;
    }
  }
};

/**
 * Execute query with automatic connection management
 */
export const executeQuery = async (sql, binds = {}, options = {}) => {
  let connection;
  const startTime = Date.now();

  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, {
      ...options,
      autoCommit: true,
    });

    const duration = Date.now() - startTime;
    const slowQueryThreshold =
      parseInt(process.env.SLOW_QUERY_THRESHOLD) || 5000;
    if (duration > slowQueryThreshold) {
      console.warn(
        `⚠️ Slow query detected (${duration}ms):`,
        sql.substring(0, 100),
      );
    }

    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Error closing connection:", error);
      }
    }
  }
};

/**
 * Execute transaction with manual commit/rollback
 */
export const executeTransaction = async (callback) => {
  let connection;

  try {
    connection = await getConnection();

    // Execute callback with connection
    const result = await callback(connection);

    // Commit if successful
    await connection.commit();

    return result;
  } catch (error) {
    // Rollback on error
    if (connection) {
      try {
        await connection.rollback();
        console.log("Transaction rolled back due to error");
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Error closing connection:", error);
      }
    }
  }
};

/**
 * Get pool statistics
 */
export const getPoolStats = () => {
  if (pool) {
    return {
      connectionsOpen: pool.connectionsOpen,
      connectionsInUse: pool.connectionsInUse,
      poolMin: pool.poolMin,
      poolMax: pool.poolMax,
    };
  }
  return null;
};

export default {
  initializePool,
  getConnection,
  closePool,
  executeQuery,
  executeTransaction,
  getPoolStats,
};
