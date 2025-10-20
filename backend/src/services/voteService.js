import { executeQuery } from "../config/database.js";
import { getPollById } from "./pollService.js";
import * as recipientService from "./recipientService.js";
import crypto from "crypto";

/**
 * Generate voter hash for anonymization
 */
const generateVoterHash = (identifier = null) => {
  if (!identifier) {
    // Generate random hash if no identifier provided
    return crypto.randomBytes(32).toString("hex");
  }
  // Hash the identifier
  return crypto.createHash("sha256").update(identifier).digest("hex");
};

/**
 * Submit a vote to blockchain table (handles both public and private)
 */
export const submitVote = async (pollId, optionId, email = null) => {
  // Get poll details
  const poll = await getPollById(pollId);

  // Validate poll is active
  if (poll.status !== "active") {
    throw new Error("Poll is not active");
  }

  // Check if poll has ended
  const now = new Date();
  const endTime = new Date(poll.endTime);
  if (now > endTime) {
    throw new Error("Poll has ended");
  }

  // Find the option
  const option = poll.options.find((opt) => opt.id === optionId);
  if (!option) {
    throw new Error("Invalid option");
  }

  // Handle private poll voting
  if (poll.pollType === "private") {
    if (!email) {
      throw new Error("Email is required for private poll voting");
    }

    // Check if recipient exists
    const hasVoted = await recipientService.hasRecipientVoted(pollId, email);
    if (hasVoted) {
      throw new Error("You have already voted in this poll");
    }

    // Check if recipient is verified (has valid PIN verification)
    const recipientsTable =
      process.env.RECIPIENTS_TABLE || "poll_recipients_v2";
    const checkVerifiedSql = `
      SELECT is_verified
      FROM ${recipientsTable}
      WHERE poll_id = :pollId AND LOWER(email) = LOWER(:email)
    `;
    const verifiedResult = await executeQuery(checkVerifiedSql, {
      pollId,
      email,
    });

    console.log("🔍 Vote Authorization Debug:");
    console.log("   Poll ID:", pollId);
    console.log("   Email:", email);
    console.log("   Recipients Table:", recipientsTable);
    console.log("   Found recipient:", verifiedResult.rows.length > 0);
    if (verifiedResult.rows.length > 0) {
      console.log("   Is verified:", verifiedResult.rows[0].IS_VERIFIED);
    }

    if (verifiedResult.rows.length === 0) {
      throw new Error("You are not authorized to vote in this poll");
    }

    if (verifiedResult.rows[0].IS_VERIFIED !== 1) {
      throw new Error("Please verify your PIN before voting");
    }

    // Use email as voter identifier for private polls
    const voterIdentifier = email.toLowerCase().trim();

    // Insert vote
    const votesTable = process.env.BLOCKCHAIN_TABLE || "votes_blockchain_v3";
    const sql = `
      INSERT INTO ${votesTable} (
        poll_id,
        option_id,
        voter_identifier,
        poll_title,
        option_name,
        vote_timestamp
      ) VALUES (
        :pollId,
        :optionId,
        :voterIdentifier,
        :pollTitle,
        :optionName,
        SYSTIMESTAMP
      )
    `;

    const binds = {
      pollId,
      optionId,
      voterIdentifier,
      pollTitle: poll.title,
      optionName: option.name,
    };

    await executeQuery(sql, binds);

    // Mark recipient as voted
    await recipientService.markRecipientAsVoted(pollId, email);

    // Get the vote that was just inserted
    const getVoteSql = `
      SELECT
        ORABCTAB_CHAIN_ID$ as chain_id,
        ORABCTAB_SEQ_NUM$ as seq_num
      FROM ${votesTable}
      WHERE poll_id = :pollId
        AND voter_identifier = :voterIdentifier
      ORDER BY ORABCTAB_SEQ_NUM$ DESC
      FETCH FIRST 1 ROW ONLY
    `;

    const voteResult = await executeQuery(getVoteSql, {
      pollId,
      voterIdentifier,
    });

    if (voteResult.rows.length === 0) {
      throw new Error("Vote was not inserted properly");
    }

    const chainId = voteResult.rows[0].CHAIN_ID;
    const seqNum = voteResult.rows[0].SEQ_NUM;

    // Get blockchain verification data
    const verification = await getVoteVerificationByCompositeKey(
      chainId,
      seqNum,
    );

    return {
      success: true,
      chainId,
      seqNum,
      poll: {
        id: poll.id,
        title: poll.title,
        pollType: poll.pollType,
      },
      option: {
        id: option.id,
        name: option.name,
      },
      verification,
    };
  }

  // Handle public poll voting (anonymous)
  const voterHash = generateVoterHash(email);

  // Insert vote
  const votesTable = process.env.BLOCKCHAIN_TABLE || "votes_blockchain_v3";
  const sql = `
    INSERT INTO ${votesTable} (
      poll_id,
      option_id,
      voter_identifier,
      poll_title,
      option_name,
      vote_timestamp
    ) VALUES (
      :pollId,
      :optionId,
      :voterIdentifier,
      :pollTitle,
      :optionName,
      SYSTIMESTAMP
    )
  `;

  const binds = {
    pollId,
    optionId,
    voterIdentifier: voterHash,
    pollTitle: poll.title,
    optionName: option.name,
  };

  await executeQuery(sql, binds);

  // Get the vote that was just inserted
  const getVoteSql = `
    SELECT
      ORABCTAB_CHAIN_ID$ as chain_id,
      ORABCTAB_SEQ_NUM$ as seq_num
    FROM ${votesTable}
    WHERE poll_id = :pollId
      AND voter_identifier = :voterIdentifier
    ORDER BY ORABCTAB_SEQ_NUM$ DESC
    FETCH FIRST 1 ROW ONLY
  `;

  const voteResult = await executeQuery(getVoteSql, {
    pollId,
    voterIdentifier: voterHash,
  });

  if (voteResult.rows.length === 0) {
    throw new Error("Vote was not inserted properly");
  }

  const chainId = voteResult.rows[0].CHAIN_ID;
  const seqNum = voteResult.rows[0].SEQ_NUM;

  // Get blockchain verification data
  const verification = await getVoteVerificationByCompositeKey(chainId, seqNum);

  return {
    success: true,
    chainId,
    seqNum,
    poll: {
      id: poll.id,
      title: poll.title,
      pollType: poll.pollType, 
    },
    option: {
      id: option.id,
      name: option.name,
    },
    verification,
  };
};

/**
 * Get blockchain verification for a vote by composite key
 */
export const getVoteVerificationByCompositeKey = async (chainId, seqNum) => {
  const votesTable = process.env.BLOCKCHAIN_TABLE || "votes_blockchain_v3";

  const sql = `
    SELECT
      poll_id,
      option_id,
      poll_title,
      option_name,
      ORABCTAB_INST_ID$,
      ORABCTAB_CHAIN_ID$,
      ORABCTAB_SEQ_NUM$,
      ORABCTAB_CREATION_TIME$,
      RAWTOHEX(ORABCTAB_HASH$) as hash_hex
    FROM ${votesTable}
    WHERE ORABCTAB_CHAIN_ID$ = :chainId
      AND ORABCTAB_SEQ_NUM$ = :seqNum
  `;

  const result = await executeQuery(sql, { chainId, seqNum });

  if (result.rows.length === 0) {
    throw new Error("Vote not found");
  }

  const vote = result.rows[0];

  // Get previous hash (from previous vote in chain)
  let previousHash =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  if (vote.ORABCTAB_SEQ_NUM$ > 1) {
    const prevSql = `
      SELECT RAWTOHEX(ORABCTAB_HASH$) as hash_hex
      FROM ${votesTable}
      WHERE ORABCTAB_CHAIN_ID$ = :chainId
        AND ORABCTAB_SEQ_NUM$ = :prevSeq
    `;
    const prevResult = await executeQuery(prevSql, {
      chainId: vote.ORABCTAB_CHAIN_ID$,
      prevSeq: vote.ORABCTAB_SEQ_NUM$ - 1,
    });

    if (prevResult.rows.length > 0) {
      previousHash = "0x" + prevResult.rows[0].HASH_HEX;
    }
  }

  return {
    chainId: vote.ORABCTAB_CHAIN_ID$,
    seqNum: vote.ORABCTAB_SEQ_NUM$,
    timestamp: vote.ORABCTAB_CREATION_TIME$,
    hash: "0x" + vote.HASH_HEX,
    previousHash,
    chainSequence: vote.ORABCTAB_SEQ_NUM$,
    pollId: vote.POLL_ID,
    pollTitle: vote.POLL_TITLE,
    optionName: vote.OPTION_NAME,
  };
};

/**
 * Verify vote exists and get details by composite key
 */
export const verifyVote = async (chainId, seqNum) => {
  try {
    const verification = await getVoteVerificationByCompositeKey(
      chainId,
      seqNum,
    );
    return {
      valid: true,
      verification,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
};

/**
 * Check if voter has already voted (by identifier)
 */
export const hasVoted = async (pollId, voterIdentifier) => {
  const votesTable = process.env.BLOCKCHAIN_TABLE || "votes_blockchain_v3";

  const sql = `
    SELECT COUNT(*) as vote_count
    FROM ${votesTable}
    WHERE poll_id = :pollId
      AND voter_identifier = :voterIdentifier
  `;

  const result = await executeQuery(sql, { pollId, voterIdentifier });
  return result.rows[0].VOTE_COUNT > 0;
};

export default {
  submitVote,
  getVoteVerificationByCompositeKey,
  verifyVote,
  hasVoted,
};
