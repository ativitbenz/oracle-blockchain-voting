import express from "express";
import * as voteController from "../controllers/voteController.js";

const router = express.Router();

// POST /api/votes/:pollId - Submit vote (public or private)
router.post("/:pollId", voteController.submitVote);

// POST /api/votes/:pollId/verify-pin - Verify PIN for private poll
router.post("/:pollId/verify-pin", voteController.verifyPinForVoting);

// POST /api/votes/:pollId/resend-pin - Resend PIN for private poll
router.post("/:pollId/resend-pin", voteController.resendPinForVoting);

// GET /api/votes/:voteId/verify - Get vote verification
router.get("/:voteId/verify", voteController.getVoteVerification);

// GET /api/votes/:voteId/check - Verify vote exists
router.get("/:voteId/check", voteController.verifyVote);

export default router;
