import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import pollsRouter from "./routes/polls.js";
import votesRouter from "./routes/votes.js";
import transactionsRouter from "./routes/transactions.js";
import blockchainRouter from "./routes/blockchain.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
// Parse CORS allowed origins from environment variable
const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ||
  "http://localhost:3000,https://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      // Allow any devtunnels.ms domain
      if (/\.devtunnels\.ms$/.test(new URL(origin).hostname)) {
        return callback(null, true);
      }

      // Allow specified origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log rejected origin for debugging
      console.warn(`❌ CORS rejected origin: ${origin}`);
      console.log(`✅ Allowed origins: ${allowedOrigins.join(", ")}`);

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api/polls", pollsRouter);
app.use("/api/votes", votesRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/blockchain", blockchainRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

export default app;
