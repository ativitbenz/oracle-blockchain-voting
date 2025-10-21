import nodemailer from "nodemailer";

/**
 * Create SMTP transporter
 * Supports Gmail, Outlook, and other SMTP providers
 */
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || "smtp.office365.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false,
    },
  };

  const transporter = nodemailer.createTransport(config);
  console.log(`✓ SMTP configured: ${config.host}:${config.port}`);

  return transporter;
};

/**
 * Generate email HTML template for PIN
 * @param {object} params - Email parameters
 * @returns {string} HTML email content
 */
const generatePinEmailHtml = ({
  pollTitle,
  pollDescription,
  pin,
  voteLink,
  startTime,
  endTime,
}) => {
  // Calculate expiry time (24 hours from now)
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24);
  const expiryString = expiryDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format poll start and end times
  const startTimeString = startTime
    ? new Date(startTime).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const endTimeString = endTime
    ? new Date(endTime).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vote Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Segoe UI', Arial, sans-serif;color:#111827;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;background-color:#f5f5f5;">
        <tr>
            <td align="center" style="padding:40px 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">Voting System</p>
                            <h1 style="margin:12px 0 24px 0;font-size:22px;font-weight:600;color:#111827;">Voting Invitation</h1>
                            <h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#111827;">${pollTitle}</h2>
                            ${
                              pollDescription
                                ? `<p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#4b5563;">${pollDescription}</p>`
                                : ""
                            }
                            <p style="margin:0 0 24px 0;font-size:14px;color:#4b5563;">Use the PIN below to access the voting page.</p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;border:1px solid #d1d5db;border-radius:8px;">
                                <tr>
                                    <td style="padding:24px;text-align:center;">
                                        <p style="margin:0 0 12px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">PIN</p>
                                        <p style="margin:0;font-size:32px;font-weight:600;letter-spacing:0.4em;color:#111827;">${pin}</p>
                                        <p style="margin:16px 0 4px 0;font-size:12px;color:#6b7280;">The PIN can be used once.</p>
                                        <p style="margin:0;font-size:13px;color:#4b5563;">Expires ${expiryString}</p>
                                    </td>
                                </tr>
                            </table>
                            ${
                              startTimeString || endTimeString
                                ? `
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;border:1px solid #d1d5db;border-radius:8px;">
                                <tr>
                                    <td style="padding:16px;">
                                        <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">Voting period</p>
                                        ${
                                          startTimeString
                                            ? `<p style="margin:0;font-size:14px;color:#111827;">Opens: ${startTimeString}</p>`
                                            : ""
                                        }
                                        ${
                                          endTimeString
                                            ? `<p style="margin:${startTimeString ? "4px" : "0"} 0 0 0;font-size:14px;color:#111827;">Closes: ${endTimeString}</p>`
                                            : ""
                                        }
                                    </td>
                                </tr>
                            </table>
                            `
                                : ""
                            }
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${voteLink}" style="display:inline-block;padding:14px 32px;background-color:#111827;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">Open Voting Page</a>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;border-top:1px solid #e5e7eb;">
                                <tr>
                                    <td style="padding:16px 0 0 0;">
                                        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">This is an automated message. Please do not reply to this email.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

/**
 * Generate plain text email content
 */
const generatePinEmailText = ({
  pollTitle,
  pollDescription,
  pin,
  voteLink,
  startTime,
  endTime,
}) => {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24);
  const expiryString = expiryDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
Voting Invitation

Poll: ${pollTitle}
${pollDescription ? `${pollDescription}\n` : ""}${
    startTime || endTime
      ? `Voting period:${startTime ? ` Opens ${new Date(startTime).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}${endTime ? ` | Closes ${new Date(endTime).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}\n`
      : ""
  }PIN: ${pin}
The PIN can be used once.
Expires: ${expiryString}

Vote:
${voteLink}

---
This is an automated message. Please do not reply to this email.

Voting System
  `;
};

/**
 * Send PIN email to recipient using SMTP
 * @param {object} params - Email parameters
 * @returns {Promise<object>} Email send result
 */
export const sendPinEmail = async ({
  to,
  pollTitle,
  pollDescription,
  pin,
  pollId,
  startTime,
  endTime,
}) => {
  try {
    // Check if email is disabled in development
    if (process.env.DISABLE_EMAIL === "true") {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      console.log("📧 Email sending is disabled. PIN for", to, ":", pin);
      console.log(
        "Vote link:",
        `${frontendUrl}/vote/${pollId}?email=${encodeURIComponent(to)}`,
      );
      return {
        success: true,
        messageId: "dev-mode-no-email",
        devMode: true,
      };
    }

    // Check if SMTP is configured
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      throw new Error(
        "SMTP credentials not configured (SMTP_HOST, SMTP_USER, SMTP_PASS required)",
      );
    }

    const transporter = createTransporter();

    // Construct vote link with email parameter
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const voteLink = `${frontendUrl}/vote/${pollId}?email=${encodeURIComponent(to)}`;

    // Send email using SMTP
    const info = await transporter.sendMail({
      from: `"Voting System" <${process.env.SMTP_USER}>`,
      to: to,
      subject: `You're Invited to Vote: ${pollTitle}`,
      html: generatePinEmailHtml({
        pollTitle,
        pollDescription,
        pin,
        voteLink,
        startTime,
        endTime,
      }),
      text: generatePinEmailText({
        pollTitle,
        pollDescription,
        pin,
        voteLink,
        startTime,
        endTime,
      }),
    });

    console.log("✓ Email sent successfully:", {
      to,
      messageId: info.messageId,
      pollId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("✗ Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Test email configuration
 * @returns {Promise<boolean>} True if email config is valid
 */
export const testEmailConfig = async () => {
  try {
    if (!process.env.SMTP_HOST) {
      console.error("✗ SMTP_HOST is not configured");
      return false;
    }

    if (!process.env.SMTP_USER) {
      console.error("✗ SMTP_USER is not configured");
      return false;
    }

    if (!process.env.SMTP_PASS) {
      console.error("✗ SMTP_PASS is not configured");
      return false;
    }

    const transporter = createTransporter();
    await transporter.verify();

    console.log("✓ SMTP configuration is valid");
    return true;
  } catch (error) {
    console.error("✗ SMTP configuration error:", error.message);
    return false;
  }
};

export default {
  sendPinEmail,
  testEmailConfig,
};
