import express from "express";
import * as transactionController from "../controllers/transactionController.js";

const router = express.Router();

// GET /api/transactions - Get all transactions (simple list)
router.get("/", transactionController.getAllTransactions);

// GET /api/transactions/analysis - Get detailed analysis (for blockchain page)
router.get("/analysis", transactionController.getDetailedAnalysis);

// GET /api/transactions/stats - Get transaction statistics
router.get("/stats", transactionController.getTransactionStatistics);

// GET /api/transactions/verify - Verify blockchain integrity
router.get("/verify", transactionController.verifyBlockchainIntegrity);

// GET /api/transactions/chain/:chainId - Get chain details
router.get("/chain/:chainId", transactionController.getChainDetails);

// GET /api/transactions/:id - Get single transaction (chainId:seqNum)
router.get("/:id", transactionController.getTransactionById);

export default router;
