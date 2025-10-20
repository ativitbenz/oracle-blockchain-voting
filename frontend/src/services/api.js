// API Service Layer for Oracle Backend
import { API_BASE_URL } from "../config/api";

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (parseError) {
        // ignore JSON parse errors
      }
      const errorMessage =
        (errorBody && (errorBody.message || errorBody.error)) ||
        "API request failed";
      const error = new Error(errorMessage);
      error.status = response.status;
      if (errorBody) error.details = errorBody;
      throw error;
    }

    const result = await response.json();

    // If response has success and data structure, return data
    if (result.success !== undefined && result.data !== undefined) {
      return result.data;
    }

    return result;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// ============= POLLS API =============

/**
 * Get all polls
 * @returns {Promise<Array>} List of all polls
 */
export const getAllPolls = async () => {
  return apiCall("/polls");
};

/**
 * Get single poll by ID
 * @param {number} pollId - Poll ID
 * @param {string} email - Optional email for private poll vote checking
 * @returns {Promise<Object>} Poll details
 */
export const getPollById = async (pollId, email = null) => {
  const endpoint = email
    ? `/polls/${pollId}?email=${encodeURIComponent(email)}`
    : `/polls/${pollId}`;
  return apiCall(endpoint);
};

/**
 * Create new poll
 * @param {Object} pollData - Poll data
 * @returns {Promise<Object>} Created poll
 */
export const createPoll = async (pollData) => {
  return apiCall("/polls", {
    method: "POST",
    body: JSON.stringify(pollData),
  });
};

// ============= VOTING API =============

/**
 * Verify PIN for voting
 * @param {number} pollId - Poll ID
 * @param {string} email - Recipient email
 * @param {string} pin - PIN code
 * @returns {Promise<Object>} Verification result
 */
export const verifyPin = async (pollId, email, pin) => {
  return apiCall(`/votes/${pollId}/verify-pin`, {
    method: "POST",
    body: JSON.stringify({
      email,
      pin,
    }),
  });
};

/**
 * Resend PIN to email
 * @param {number} pollId - Poll ID
 * @param {string} email - Recipient email
 * @returns {Promise<Object>} Resend confirmation
 */
export const resendPin = async (pollId, email) => {
  return apiCall(`/votes/${pollId}/resend-pin`, {
    method: "POST",
    body: JSON.stringify({
      email,
    }),
  });
};

/**
 * Submit a vote
 * @param {number} pollId - Poll ID
 * @param {number} optionId - Option ID
 * @param {string} email - Optional email for authenticated voting
 * @returns {Promise<Object>} Vote confirmation with blockchain data
 */
export const submitVote = async (pollId, optionId, email = null) => {
  return apiCall(`/votes/${pollId}`, {
    method: "POST",
    body: JSON.stringify({
      optionId,
      email,
    }),
  });
};

// ============= TRANSACTIONS API =============

/**
 * Get all blockchain transactions
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} List of transactions
 */
export const getAllTransactions = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams
    ? `/transactions?${queryParams}`
    : "/transactions";
  return apiCall(endpoint);
};

/**
 * Get single transaction by ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} Transaction details
 */
export const getTransactionById = async (transactionId) => {
  return apiCall(`/transactions/${transactionId}`);
};

/**
 * Verify transaction on blockchain
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} Verification result
 */
export const verifyTransaction = async (transactionId) => {
  return apiCall(`/transactions/${transactionId}/verify`);
};

// ============= STATISTICS API =============

/**
 * Get voting statistics
 * @returns {Promise<Object>} Statistics data
 */
export const getStatistics = async () => {
  return apiCall("/statistics");
};

/**
 * Get poll results
 * @param {number} pollId - Poll ID
 * @returns {Promise<Object>} Poll results
 */
export const getPollResults = async (pollId) => {
  return apiCall(`/polls/${pollId}/results`);
};

/**
 * Get poll recipients (for private polls)
 * @param {number} pollId - Poll ID
 * @returns {Promise<Array>} List of recipients with voting status
 */
export const getPollRecipients = async (pollId) => {
  return apiCall(`/polls/${pollId}/recipients`);
};

// ============= BLOCKCHAIN VERIFICATION API =============

/**
 * Get blockchain chain verification
 * @returns {Promise<Object>} Chain integrity status
 */
export const verifyBlockchainIntegrity = async () => {
  return apiCall("/blockchain/verify");
};

/**
 * Get blockchain metadata
 * @returns {Promise<Object>} Blockchain metadata
 */
export const getBlockchainMetadata = async () => {
  return apiCall("/blockchain/metadata");
};

export default {
  // Polls
  getAllPolls,
  getPollById,
  createPoll,
  getPollRecipients,

  // Voting
  verifyPin,
  resendPin,
  submitVote,

  // Transactions
  getAllTransactions,
  getTransactionById,
  verifyTransaction,

  // Statistics
  getStatistics,
  getPollResults,

  // Blockchain
  verifyBlockchainIntegrity,
  getBlockchainMetadata,
};
