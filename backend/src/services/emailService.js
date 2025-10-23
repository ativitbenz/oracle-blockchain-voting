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
    <title>Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;background-color:#ffffff;">
        <tr>
            <td align="center" style="padding:20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color:#4285f4;padding:24px 40px;">
                            <h1 style="margin:0;font-size:24px;font-weight:400;color:#ffffff;">Verification Code</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:40px 40px 32px 40px;background-color:#ffffff;border:1px solid #dadce0;border-top:none;">
                            <p style="margin:0 0 20px 0;font-size:14px;line-height:1.5;color:#202124;">Hi,</p>

                            <p style="margin:0 0 20px 0;font-size:14px;line-height:1.5;color:#202124;">You have been invited to vote on:</p>

                            <!-- Poll Title -->
                            <p style="margin:0 0 12px 0;font-size:16px;font-weight:bold;line-height:1.4;color:#202124;">"${pollTitle}"</p>

                            <!-- Poll Description -->
                            ${pollDescription ? `<p style="margin:0 0 24px 0;font-size:14px;line-height:1.5;color:#5f6368;">${pollDescription}</p>` : ""}

                            <p style="margin:0 0 20px 0;font-size:14px;line-height:1.5;color:#202124;">Your verification code is:</p>

                            <!-- PIN Code -->
                            <div style="text-align:center;margin:32px 0;">
                                <p style="margin:0;font-size:48px;font-weight:bold;letter-spacing:8px;color:#202124;">${pin}</p>
                            </div>

                            <!-- Voting Period -->
                            ${startTimeString || endTimeString ? `<p style="margin:24px 0 16px 0;font-size:14px;line-height:1.5;color:#202124;">Voting period: ${startTimeString || ""}${startTimeString && endTimeString ? " - " : ""}${endTimeString || ""}</p>` : ""}

                            <p style="margin:16px 0;font-size:14px;line-height:1.5;color:#202124;">This code expires on <strong>${expiryString}</strong>.</p>

                            <p style="margin:20px 0 32px 0;font-size:14px;line-height:1.5;color:#202124;">If you did not request this code, someone else may be trying to access your voting. <strong>Do not forward or give this code to anyone.</strong></p>

                            <!-- CTA Button -->
                            <div style="text-align:center;margin:32px 0 24px 0;">
                                <a href="${voteLink}" style="display:inline-block;padding:12px 32px;background-color:#4285f4;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;border-radius:4px;">Vote Now</a>
                            </div>

                            <p style="margin:24px 0 4px 0;font-size:14px;line-height:1.5;color:#202124;">Sincerely yours,</p>
                            <p style="margin:0 0 24px 0;font-size:14px;line-height:1.5;color:#202124;">The Voting System team</p>

                            <!-- Footer -->
                            <div style="border-top:1px solid #dadce0;padding-top:20px;margin-top:20px;">
                                <p style="margin:0;font-size:12px;line-height:1.5;color:#5f6368;text-align:center;">This is an automated message. Please do not reply to this email.</p>
                            </div>
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
VERIFICATION CODE

Hi,

You have been invited to vote on:

"${pollTitle}"
${pollDescription ? `\n${pollDescription}\n` : ""}
Your verification code is:

${pin}
${startTimeString || endTimeString ? `\nVoting period: ${startTimeString || ""}${startTimeString && endTimeString ? " - " : ""}${endTimeString || ""}\n` : ""}
This code expires on ${expiryString}.

If you did not request this code, someone else may be trying to access your voting. Do not forward or give this code to anyone.

Vote now: ${voteLink}

Sincerely yours,
The Voting System team

---
This is an automated message. Please do not reply to this email.
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
      const frontendUrl = process.env.FRONTEND_URL;
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
    const frontendUrl = process.env.FRONTEND_URL;
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
