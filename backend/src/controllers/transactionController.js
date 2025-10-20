import * as transactionService from "../services/transactionService.js";

/**
 * Get all transactions (simple list)
 */
export const getAllTransactions = async (req, res) => {
  try {
    const filters = {
      pollId: req.query.pollId,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      limit: req.query.limit || 100,
    };

    const transactions = await transactionService.getAllTransactions(filters);
    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get detailed transaction analysis (for blockchain analysis page)
 */
export const getDetailedAnalysis = async (req, res) => {
  try {
    const analysis = await transactionService.getDetailedTransactionAnalysis();
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Error getting transaction analysis:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get transaction by composite ID (chainId:seqNum)
 */
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Parse composite ID (format: "chainId:seqNum")
    const [chainId, seqNum] = id.split(":").map(Number);

    if (!chainId || !seqNum) {
      return res.status(400).json({
        success: false,
        error: "Invalid transaction ID format. Expected format: chainId:seqNum",
      });
    }

    const transaction = await transactionService.getTransactionById(
      chainId,
      seqNum,
    );
    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    const statusCode = error.message === "Transaction not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get chain details
 */
export const getChainDetails = async (req, res) => {
  try {
    const chainId = parseInt(req.params.chainId);
    const details = await transactionService.getChainDetails(chainId);
    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error("Error getting chain details:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Verify blockchain integrity
 */
export const verifyBlockchainIntegrity = async (req, res) => {
  try {
    const result = await transactionService.verifyBlockchainIntegrity();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error verifying blockchain:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get blockchain metadata
 */
export const getBlockchainMetadata = async (req, res) => {
  try {
    const metadata = await transactionService.getBlockchainMetadata();
    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error("Error fetching blockchain metadata:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get transaction statistics
 */
export const getTransactionStatistics = async (req, res) => {
  try {
    const stats = await transactionService.getTransactionStatistics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching transaction statistics:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  getAllTransactions,
  getDetailedAnalysis,
  getTransactionById,
  getChainDetails,
  verifyBlockchainIntegrity,
  getBlockchainMetadata,
  getTransactionStatistics,
};
