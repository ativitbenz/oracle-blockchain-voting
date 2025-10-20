import app from "./src/app.js";
import { initializePool, closePool } from "./src/config/database.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Initialize Oracle connection pool
    console.log("🔄 Initializing Oracle Database connection...");
    await initializePool();

    // Start Express server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`\n📚 Available endpoints:`);
      console.log(`\n   📊 Polls:`);
      console.log(`      GET    /api/polls`);
      console.log(`      GET    /api/polls/:id`);
      console.log(`      POST   /api/polls`);
      console.log(`      GET    /api/polls/:id/results`);
      console.log(`      GET    /api/polls/:id/recipients`);
      console.log(`\n   🗳️  Votes:`);
      console.log(`      POST   /api/votes/:pollId`);
      console.log(`      POST   /api/votes/:pollId/verify-pin`);
      console.log(`      POST   /api/votes/:pollId/resend-pin`);
      console.log(`      GET    /api/votes/:voteId/verify`);
      console.log(`\n   🔗 Transactions (Blockchain):`);
      console.log(`      GET    /api/transactions`);
      console.log(`      GET    /api/transactions/analysis`);
      console.log(`      GET    /api/transactions/stats`);
      console.log(`      GET    /api/transactions/verify`);
      console.log(`      GET    /api/transactions/chain/:chainId`);
      console.log(`      GET    /api/transactions/:id`);
      console.log(`\n   🔐 Blockchain:`);
      console.log(`      GET    /api/blockchain/verify`);
      console.log(`      GET    /api/blockchain/metadata`);
      console.log(`\n✅ Backend ready!\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Shutting down server...");
  try {
    await closePool();
    console.log("✅ Server shut down successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the server
startServer();
