import { executeQuery } from "../config/database.js";
import { generatePin, hashPin, verifyPin, isPinExpired } from "./pinService.js";
import { sendPinEmail } from "./emailService.js";

/**
 * Add recipients for a poll and send PIN emails
 * @param {number} pollId - Poll ID
 * @param {Array<string>} emails - List of recipient emails
 * @param {object} pollInfo - Poll information for email
 * @returns {Promise<object>} Result with success/failure counts
 */
export const addRecipientsAndSendPins = async (pollId, emails, pollInfo) => {
  const results = {
    success: [],
    failed: [],
  };

  // Gmail rate limiting: Add delay between emails to avoid hitting limits
  const DELAY_BETWEEN_EMAILS = 100; // milliseconds (0.1 second)

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    // Generate PIN
    const pin = generatePin();
    const pinHash = hashPin(pin);

    // Insert recipient into database
    const recipientsTable =
      process.env.RECIPIENTS_TABLE || "poll_recipients_v2";
    const sql = `
      INSERT INTO ${recipientsTable} (poll_id, email, pin_hash)
      VALUES (:pollId, :email, :pinHash)
    `;

    await executeQuery(sql, {
      pollId,
      email: email.toLowerCase().trim(),
      pinHash,
    });

    // Send PIN email - if this fails, throw error immediately
    await sendPinEmail({
      to: email,
      pollTitle: pollInfo.title,
      pollDescription: pollInfo.description,
      pin,
      pollId,
      startTime: pollInfo.startTime,
      endTime: pollInfo.endTime,
    });

    results.success.push(email);

    // Add delay between emails (except for the last one)
    if (i < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_EMAILS));
      console.log(`📧 Email sent to ${email} (${i + 1}/${emails.length})`);
    }
  }

  console.log(`✅ All ${emails.length} emails sent successfully`);
  return results;
};

/**
 * Add recipients and send PINs within a transaction
 * @param {object} connection - Database connection
 * @param {number} pollId - Poll ID
 * @param {Array<string>} emails - List of recipient emails
 * @param {object} pollInfo - Poll information for email
 * @returns {Promise<object>} Result with success/failure counts
 */
export const addRecipientsAndSendPinsInTransaction = async (
  connection,
  pollId,
  emails,
  pollInfo,
) => {
  const results = {
    success: [],
    failed: [],
  };

  // Gmail rate limiting: Add delay between emails to avoid hitting limits
  // Free Gmail accounts have a limit of 500 emails per day
  const DELAY_BETWEEN_EMAILS = 100; // milliseconds (0.1 second)

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    // Generate PIN
    const pin = generatePin();
    const pinHash = hashPin(pin);

    // Insert recipient into database using the transaction connection
    const recipientsTable =
      process.env.RECIPIENTS_TABLE || "poll_recipients_v2";
    const sql = `
      INSERT INTO ${recipientsTable} (poll_id, email, pin_hash)
      VALUES (:pollId, :email, :pinHash)
    `;

    await connection.execute(sql, {
      pollId,
      email: email.toLowerCase().trim(),
      pinHash,
    });

    // Send PIN email - if this fails, transaction will be rolled back
    await sendPinEmail({
      to: email,
      pollTitle: pollInfo.title,
      pollDescription: pollInfo.description,
      pin,
      pollId,
      startTime: pollInfo.startTime,
      endTime: pollInfo.endTime,
    });

    results.success.push(email);

    // Add delay between emails (except for the last one)
    // This helps prevent hitting Gmail rate limits
    if (i < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_EMAILS));
      console.log(`📧 Email sent to ${email} (${i + 1}/${emails.length})`);
    }
  }

  console.log(`✅ All ${emails.length} emails sent successfully`);
  return results;
};

/**
 * Verify recipient's PIN
 * @param {number} pollId - Poll ID
 * @param {string} email - Recipient email
 * @param {string} pin - PIN to verify
 * @returns {Promise<object>} Verification result
 */
export const verifyRecipientPin = async (pollId, email, pin) => {
  // Get recipient record
  const recipientsTable = process.env.RECIPIENTS_TABLE || "poll_recipients_v2";
  const sql = `
    SELECT
      recipient_id,
      pin_hash,
      is_verified,
      has_voted,
      pin_sent_at,
      pin_attempts
    FROM ${recipientsTable}
    WHERE poll_id = :pollId AND LOWER(email) = LOWER(:email)
  `;

  const result = await executeQuery(sql, { pollId, email });

  if (result.rows.length === 0) {
    throw new Error("Recipient not found for this poll");
  }

  const recipient = result.rows[0];

  // Check if already verified
  if (recipient.IS_VERIFIED === 1) {
    return {
      success: true,
      message: "Already verified",
      recipientId: recipient.RECIPIENT_ID,
    };
  }

  // Check PIN expiry
  if (isPinExpired(recipient.PIN_SENT_AT)) {
    throw new Error("PIN has expired. Please request a new one.");
  }

  // Check max attempts (5 attempts)
  if (recipient.PIN_ATTEMPTS >= 5) {
    throw new Error("Maximum PIN attempts exceeded. Please request a new PIN.");
  }

  // Verify PIN
  const isValid = verifyPin(pin, recipient.PIN_HASH);

  if (!isValid) {
    // Increment failed attempts
    const updateSql = `
      UPDATE ${recipientsTable}
      SET pin_attempts = pin_attempts + 1
      WHERE recipient_id = :recipientId
    `;
    await executeQuery(updateSql, { recipientId: recipient.RECIPIENT_ID });

    const attemptsLeft = 5 - (recipient.PIN_ATTEMPTS + 1);
    return {
      success: false,
      message: "Invalid PIN. Please try again.",
      attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0,
    };
  }

  // Mark as verified
  const verifySql = `
    UPDATE ${recipientsTable}
    SET is_verified = 1,
        verified_at = CURRENT_TIMESTAMP
    WHERE recipient_id = :recipientId
  `;
  await executeQuery(verifySql, { recipientId: recipient.RECIPIENT_ID });

  return {
    success: true,
    message: "PIN verified successfully",
    recipientId: recipient.RECIPIENT_ID,
  };
};

/**
 * Resend PIN to recipient
 * @param {number} pollId - Poll ID
 * @param {string} email - Recipient email
 * @param {object} pollInfo - Poll information
 * @returns {Promise<object>} Resend result
 */
export const resendPin = async (pollId, email, pollInfo) => {
  // Check if recipient exists
  const recipientsTable = process.env.RECIPIENTS_TABLE || "poll_recipients_v2";
  const checkSql = `
    SELECT recipient_id, is_verified, has_voted
    FROM ${recipientsTable}
    WHERE poll_id = :pollId AND LOWER(email) = LOWER(:email)
  `;

  const result = await executeQuery(checkSql, { pollId, email });

  if (result.rows.length === 0) {
    throw new Error("Recipient not found for this poll");
  }

  const recipient = result.rows[0];

  if (recipient.IS_VERIFIED === 1) {
    throw new Error("PIN already verified. You can proceed to vote.");
  }

  if (recipient.HAS_VOTED === 1) {
    throw new Error("You have already voted in this poll.");
  }

  // Generate new PIN
  const pin = generatePin();
  const pinHash = hashPin(pin);

  // Update PIN in database
  const updateSql = `
    UPDATE ${recipientsTable}
    SET pin_hash = :pinHash,
        pin_sent_at = CURRENT_TIMESTAMP,
        pin_attempts = 0
    WHERE recipient_id = :recipientId
  `;

  await executeQuery(updateSql, {
    pinHash,
    recipientId: recipient.RECIPIENT_ID,
  });

  // Send new PIN email
  await sendPinEmail({
    to: email,
    pollTitle: pollInfo.title,
    pollDescription: pollInfo.description,
    pin,
    pollId,
    startTime: pollInfo.startTime,
    endTime: pollInfo.endTime,
  });

  return {
    success: true,
    message: "New PIN sent to your email",
  };
};

/**
 * Check if recipient has already voted
 * @param {number} pollId - Poll ID
 * @param {string} email - Recipient email
 * @returns {Promise<boolean>} True if already voted
 */
export const hasRecipientVoted = async (pollId, email) => {
  const recipientsTable = process.env.RECIPIENTS_TABLE || "poll_recipients_v2";
  const sql = `
    SELECT has_voted
    FROM ${recipientsTable}
    WHERE poll_id = :pollId AND LOWER(email) = LOWER(:email)
  `;

  const result = await executeQuery(sql, { pollId, email });

  if (result.rows.length === 0) {
    return false;
  }

  return result.rows[0].HAS_VOTED === 1;
};

/**
 * Mark recipient as voted
 * @param {number} pollId - Poll ID
 * @param {string} email - Recipient email
 */
export const markRecipientAsVoted = async (pollId, email) => {
  const recipientsTable = process.env.RECIPIENTS_TABLE || "poll_recipients_v2";
  const sql = `
    UPDATE ${recipientsTable}
    SET has_voted = 1,
        voted_at = CURRENT_TIMESTAMP
    WHERE poll_id = :pollId AND LOWER(email) = LOWER(:email)
  `;

  await executeQuery(sql, { pollId, email });
};

/**
 * Get all recipients for a poll with their voting status
 * @param {number} pollId - Poll ID
 * @returns {Promise<Array>} List of recipients
 */
export const getPollRecipients = async (pollId) => {
  const recipientsTable = process.env.RECIPIENTS_TABLE || "poll_recipients_v2";
  const sql = `
    SELECT
      recipient_id,
      email,
      is_verified,
      has_voted,
      pin_sent_at,
      verified_at,
      voted_at,
      pin_attempts
    FROM ${recipientsTable}
    WHERE poll_id = :pollId
    ORDER BY email ASC
  `;

  const result = await executeQuery(sql, { pollId });

  return result.rows.map((row) => ({
    id: row.RECIPIENT_ID,
    email: row.EMAIL,
    isVerified: row.IS_VERIFIED === 1,
    hasVoted: row.HAS_VOTED === 1,
    pinSentAt: row.PIN_SENT_AT,
    verifiedAt: row.VERIFIED_AT,
    votedAt: row.VOTED_AT,
    pinAttempts: row.PIN_ATTEMPTS || 0,
  }));
};

export default {
  addRecipientsAndSendPins,
  addRecipientsAndSendPinsInTransaction,
  verifyRecipientPin,
  resendPin,
  hasRecipientVoted,
  markRecipientAsVoted,
  getPollRecipients,
};
