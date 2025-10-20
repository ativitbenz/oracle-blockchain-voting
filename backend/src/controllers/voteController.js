import * as voteService from "../services/voteService.js";
import * as recipientService from "../services/recipientService.js";
import * as pollService from "../services/pollService.js";

/**
 * Submit vote (handles both public and private)
 */
export const submitVote = async (req, res) => {
  try {
    const pollId = parseInt(req.params.pollId);
    const { optionId, email } = req.body;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        error: "Option ID is required",
      });
    }

    // Get poll to check type
    const poll = await pollService.getPollById(pollId);

    // For private polls, email is required
    if (poll.pollType === "private" && !email) {
      return res.status(400).json({
        success: false,
        error: "Email is required for private polls",
      });
    }

    const result = await voteService.submitVote(pollId, optionId, email);

    res.status(201).json({
      success: true,
      data: result,
      message: "Vote submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting vote:", error);
    const statusCode =
      error.message.includes("not active") ||
      error.message.includes("ended") ||
      error.message.includes("not verified") ||
      error.message.includes("already voted") ||
      error.message.includes("not authorized") ||
      error.message.includes("Invalid option")
        ? 400
        : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Verify PIN for private poll voting
 */
export const verifyPinForVoting = async (req, res) => {
  try {
    const pollId = parseInt(req.params.pollId);
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({
        success: false,
        error: "Email and PIN are required",
      });
    }

    const result = await recipientService.verifyRecipientPin(
      pollId,
      email,
      pin,
    );

    // Check if verification failed (invalid PIN)
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
        attemptsLeft: result.attemptsLeft,
      });
    }

    res.json({
      success: true,
      data: result,
      message: "PIN verified successfully",
    });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Resend PIN for private poll
 */
export const resendPinForVoting = async (req, res) => {
  try {
    const pollId = parseInt(req.params.pollId);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Get poll info for email
    const poll = await pollService.getPollById(pollId);

    const result = await recipientService.resendPin(pollId, email, {
      title: poll.title,
      description: poll.description,
    });

    res.json({
      success: true,
      data: result,
      message: "PIN resent successfully",
    });
  } catch (error) {
    console.error("Error resending PIN:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get vote verification
 */
export const getVoteVerification = async (req, res) => {
  try {
    const { voteId } = req.params;
    const verification = await voteService.getVoteVerification(voteId);
    res.json({
      success: true,
      data: verification,
    });
  } catch (error) {
    console.error("Error fetching vote verification:", error);
    const statusCode = error.message === "Vote not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Verify vote
 */
export const verifyVote = async (req, res) => {
  try {
    const { voteId } = req.params;
    const result = await voteService.verifyVote(voteId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error verifying vote:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  submitVote,
  getVoteVerification,
  verifyVote,
};
