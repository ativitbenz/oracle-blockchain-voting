import { executeQuery, executeTransaction } from "../config/database.js";
import oracledb from "oracledb";

/**
 * Calculate poll status based on timestamps
 */
const calculatePollStatus = (startTime, endTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    return "upcoming";
  } else if (now > end) {
    return "closed";
  } else {
    return "active";
  }
};

/**
 * Get all polls with their options and vote counts
 * Optimized to fetch all options in a single query (fixes N+1 problem)
 */
export const getAllPolls = async () => {
  const tableName = process.env.IMMUTABLE_TABLE || "polls_immutable_v2";
  const votesTable = process.env.BLOCKCHAIN_TABLE || "votes_blockchain_v3";
  const optionsTable = process.env.OPTIONS_TABLE || "poll_options_v2";

  // Get all polls
  const pollsSql = `
    SELECT
      p.poll_id,
      p.title,
      p.description,
      p.start_time,
      p.end_time,
      p.created_at,
      p.status,
      p.poll_type,
      COUNT(v.ORABCTAB_SEQ_NUM$) as total_votes
    FROM ${tableName} p
    LEFT JOIN ${votesTable} v ON p.poll_id = v.poll_id
    GROUP BY p.poll_id, p.title, p.description, p.start_time,
             p.end_time, p.created_at, p.status, p.poll_type
    ORDER BY p.created_at DESC
  `;

  const pollsResult = await executeQuery(pollsSql);

  if (pollsResult.rows.length === 0) {
    return [];
  }

  // Get all options for all polls in a single query
  const pollIds = pollsResult.rows.map((row) => row.POLL_ID);
  const optionsSql = `
    SELECT
      po.poll_id,
      po.option_id,
      po.option_name,
      po.option_description,
      po.display_order,
      COUNT(v.option_id) as votes
    FROM ${optionsTable} po
    LEFT JOIN ${votesTable} v ON po.poll_id = v.poll_id
      AND po.option_id = v.option_id
    WHERE po.poll_id IN (${pollIds.map((_, i) => `:id${i}`).join(",")})
    GROUP BY po.poll_id, po.option_id, po.option_name, po.option_description, po.display_order
    ORDER BY po.poll_id, po.display_order
  `;

  const binds = {};
  pollIds.forEach((id, i) => {
    binds[`id${i}`] = id;
  });

  const optionsResult = await executeQuery(optionsSql, binds);

  // Group options by poll_id
  const optionsByPoll = {};
  optionsResult.rows.forEach((row) => {
    if (!optionsByPoll[row.POLL_ID]) {
      optionsByPoll[row.POLL_ID] = [];
    }
    optionsByPoll[row.POLL_ID].push({
      id: row.OPTION_ID,
      name: row.OPTION_NAME,
      description: row.OPTION_DESCRIPTION || "",
      votes: row.VOTES || 0,
    });
  });

  // Combine polls with their options
  const polls = pollsResult.rows.map((poll) => ({
    id: poll.POLL_ID,
    title: poll.TITLE,
    description: poll.DESCRIPTION,
    startTime: poll.START_TIME,
    endTime: poll.END_TIME,
    createdAt: poll.CREATED_AT,
    status: calculatePollStatus(poll.START_TIME, poll.END_TIME),
    pollType: poll.POLL_TYPE || "public",
    totalVotes: poll.TOTAL_VOTES,
    hasVoted: false, // TODO: implement voter tracking
    options: optionsByPoll[poll.POLL_ID] || [],
  }));

  return polls;
};

/**
 * Get single poll by ID
 * @param {number} pollId - Poll ID
 * @param {string} email - Optional email for private poll vote checking
 */
export const getPollById = async (pollId, email = null) => {
  const tableName = process.env.IMMUTABLE_TABLE || "polls_immutable_v2";
  const votesTable = process.env.BLOCKCHAIN_TABLE || "votes_blockchain_v3";

  const sql = `
    SELECT
      p.poll_id,
      p.title,
      p.description,
      p.start_time,
      p.end_time,
      p.created_at,
      p.status,
      p.poll_type,
      COUNT(v.ORABCTAB_SEQ_NUM$) as total_votes
    FROM ${tableName} p
    LEFT JOIN ${votesTable} v ON p.poll_id = v.poll_id
    WHERE p.poll_id = :pollId
    GROUP BY p.poll_id, p.title, p.description, p.start_time,
             p.end_time, p.created_at, p.status, p.poll_type
  `;

  const result = await executeQuery(sql, { pollId });

  if (result.rows.length === 0) {
    throw new Error("Poll not found");
  }

  const poll = result.rows[0];
  const options = await getPollOptions(pollId);

  // Check if user has voted for private polls
  let hasVoted = false;
  if (poll.POLL_TYPE === "private" && email) {
    // Import recipientService here to avoid circular dependency
    const { hasRecipientVoted } = await import("./recipientService.js");
    hasVoted = await hasRecipientVoted(pollId, email);
  }

  return {
    id: poll.POLL_ID,
    title: poll.TITLE,
    description: poll.DESCRIPTION,
    startTime: poll.START_TIME,
    endTime: poll.END_TIME,
    createdAt: poll.CREATED_AT,
    status: calculatePollStatus(poll.START_TIME, poll.END_TIME),
    pollType: poll.POLL_TYPE || "public",
    totalVotes: poll.TOTAL_VOTES,
    hasVoted,
    options,
  };
};

/**
 * Get poll options with vote counts
 */
export const getPollOptions = async (pollId) => {
  const optionsTable = process.env.OPTIONS_TABLE || "poll_options_v2";
  const votesTable = process.env.BLOCKCHAIN_TABLE || "votes_blockchain_v3";

  const sql = `
    SELECT
      po.option_id,
      po.option_name,
      po.option_description,
      po.display_order,
      COUNT(v.option_id) as votes
    FROM ${optionsTable} po
    LEFT JOIN ${votesTable} v ON po.poll_id = v.poll_id
      AND po.option_id = v.option_id
    WHERE po.poll_id = :pollId
    GROUP BY po.option_id, po.option_name, po.option_description, po.display_order
    ORDER BY po.display_order
  `;

  const result = await executeQuery(sql, { pollId });

  return result.rows.map((row) => ({
    id: row.OPTION_ID,
    name: row.OPTION_NAME,
    description: row.OPTION_DESCRIPTION || "",
    votes: row.VOTES || 0,
  }));
};

/**
 * Create new poll
 */
export const createPoll = async (pollData) => {
  const {
    title,
    description,
    startTime,
    endTime,
    options,
    pollType = "public",
    recipients = [], // Extract recipients but don't bind to SQL
    createdBy = "system",
  } = pollData;

  // Use transaction to ensure all-or-nothing operation
  return await executeTransaction(async (connection) => {
    const tableName = process.env.IMMUTABLE_TABLE || "polls_immutable_v2";

    // Direct INSERT instead of stored procedure (to support poll_type)
    const sql = `
      INSERT INTO ${tableName} (
        title,
        description,
        poll_type,
        start_time,
        end_time,
        created_by
      ) VALUES (
        :title,
        :description,
        :pollType,
        TO_TIMESTAMP(:startTime, 'YYYY-MM-DD"T"HH24:MI:SS'),
        TO_TIMESTAMP(:endTime, 'YYYY-MM-DD"T"HH24:MI:SS'),
        :createdBy
      ) RETURNING poll_id INTO :pollId
    `;

    const binds = {
      title,
      description,
      pollType,
      startTime,
      endTime,
      createdBy,
      pollId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await connection.execute(sql, binds);
    // pollId comes back as an array, extract the first element
    const pollId = Array.isArray(result.outBinds.pollId)
      ? result.outBinds.pollId[0]
      : result.outBinds.pollId;

    // Insert options
    const optionsTable = process.env.OPTIONS_TABLE || "poll_options_v2";
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      // Extract only the fields we need, ignore any extra fields like 'id'
      const optionName = typeof option === "string" ? option : option.name;
      const optionDescription =
        typeof option === "string" ? null : option.description || null;

      const optionSql = `
        INSERT INTO ${optionsTable} (poll_id, option_name, option_description, display_order)
        VALUES (:pollId, :name, :description, :displayOrder)
      `;

      const optionBinds = {
        pollId: pollId,
        name: optionName,
        description: optionDescription,
        displayOrder: i + 1,
      };

      await connection.execute(optionSql, optionBinds);
    }

    // Handle recipients for private polls
    if (pollType === "private" && recipients && recipients.length > 0) {
      // Import recipient service
      const { addRecipientsAndSendPinsInTransaction } = await import(
        "./recipientService.js"
      );

      // Add recipients and send PIN emails (within same transaction)
      await addRecipientsAndSendPinsInTransaction(
        connection,
        pollId,
        recipients,
        {
          title,
          description,
          startTime,
          endTime,
        },
      );
    }

    // Return pollId to fetch after transaction commits
    return pollId;
  });

  // Fetch and return the created poll after transaction is committed
  return await getPollById(createdPollId);
};

/**
 * Get poll results
 */
export const getPollResults = async (pollId) => {
  const poll = await getPollById(pollId);

  return {
    pollId: poll.id,
    title: poll.title,
    totalVotes: poll.totalVotes,
    results: poll.options.map((option) => ({
      optionId: option.id,
      optionName: option.name,
      votes: option.votes,
      percentage:
        poll.totalVotes > 0
          ? ((option.votes / poll.totalVotes) * 100).toFixed(2)
          : 0,
    })),
  };
};

export default {
  getAllPolls,
  getPollById,
  getPollOptions,
  createPoll,
  getPollResults,
};
