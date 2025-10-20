import * as pollService from "../services/pollService.js";
import * as recipientService from "../services/recipientService.js";

/**
 * Get all polls
 */
export const getAllPolls = async (req, res) => {
  try {
    const polls = await pollService.getAllPolls();
    res.json({
      success: true,
      data: polls,
    });
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get single poll by ID
 * Accepts optional email query parameter for private polls
 */
export const getPollById = async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const email = req.query.email || null;
    const poll = await pollService.getPollById(pollId, email);
    res.json({
      success: true,
      data: poll,
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
    const statusCode = error.message === "Poll not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Create new poll
 */
export const createPoll = async (req, res) => {
  try {
    // Extract and validate poll data
    const {
      title,
      description,
      startTime,
      endTime,
      options,
      pollType = "public",
      recipients = [],
      createdBy = "system",
    } = req.body;

    // Reconstruct pollData with explicit fields only
    const pollData = {
      title,
      description,
      startTime,
      endTime,
      options,
      pollType,
      recipients,
      createdBy,
    };

    const poll = await pollService.createPoll(pollData);
    res.status(201).json({
      success: true,
      data: poll,
      message: "Poll created successfully",
    });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get poll results
 */
export const getPollResults = async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const results = await pollService.getPollResults(pollId);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching poll results:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get poll recipients (for private polls)
 */
export const getPollRecipients = async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const recipients = await recipientService.getPollRecipients(pollId);
    res.json({
      success: true,
      data: recipients,
    });
  } catch (error) {
    console.error("Error fetching poll recipients:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  getAllPolls,
  getPollById,
  createPoll,
  getPollResults,
  getPollRecipients,
};
