// Load environment variables FIRST (before importing emailService)
import dotenv from "dotenv";
dotenv.config();

// Import email service AFTER loading env vars
import { sendPinEmail, testEmailConfig } from "./src/services/emailService.js";

/**
 * Test email sending functionality
 */
async function testEmail() {
  console.log("=".repeat(60));
  console.log("📧 Testing Email Configuration");
  console.log("=".repeat(60));
  console.log();

  // Check environment variables
  console.log("Environment Variables:");
  console.log(
    "  RESEND_API_KEY:",
    process.env.RESEND_API_KEY ? "✓ Set" : "✗ Not set",
  );
  console.log("  FROM_EMAIL:", process.env.FROM_EMAIL || "✗ Not set");
  console.log(
    "  FRONTEND_URL:",
    process.env.FRONTEND_URL || "http://localhost:3000",
  );
  console.log();

  // Test configuration
  console.log("Testing Resend configuration...");
  const configValid = await testEmailConfig();
  console.log();

  if (!configValid) {
    console.error(
      "❌ Email configuration is invalid. Please check your environment variables.",
    );
    process.exit(1);
  }

  // Test sending email
  console.log("=".repeat(60));
  console.log("📨 Sending Test Email");
  console.log("=".repeat(60));
  console.log();

  const testRecipient = process.env.FROM_EMAIL; // Send to yourself for testing

  if (!testRecipient) {
    console.error("❌ FROM_EMAIL is not set. Cannot send test email.");
    process.exit(1);
  }

  console.log(`Sending test email to: ${testRecipient}`);
  console.log();

  try {
    const result = await sendPinEmail({
      to: testRecipient,
      pollTitle: "Test Poll - Email Configuration Test",
      pollDescription:
        "This is a test email to verify Resend configuration is working correctly.",
      pin: "123456",
      pollId: "test-poll-123",
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });

    console.log("✅ Email sent successfully!");
    console.log();
    console.log("Result:", JSON.stringify(result, null, 2));
    console.log();
    console.log("=".repeat(60));
    console.log("✓ Test completed successfully!");
    console.log("=".repeat(60));
    console.log();
    console.log(`📬 Please check your inbox at: ${testRecipient}`);
    console.log();

    process.exit(0);
  } catch (error) {
    console.error();
    console.error("❌ Failed to send email!");
    console.error();
    console.error("Error:", error.message);
    console.error();

    if (error.response) {
      console.error("Resend Response:");
      console.error(JSON.stringify(error.response, null, 2));
      console.error();
    }

    console.log("=".repeat(60));
    console.log("Common Issues:");
    console.log("=".repeat(60));
    console.log();
    console.log("1. API Key Invalid:");
    console.log("   - Make sure RESEND_API_KEY starts with 're_'");
    console.log("   - Create a new API Key at https://resend.com/api-keys");
    console.log();
    console.log("2. FROM_EMAIL Not Set:");
    console.log("   - Use FROM_EMAIL=onboarding@resend.dev for testing");
    console.log("   - Or verify your own domain in Resend Dashboard");
    console.log();
    console.log("3. Check Resend Dashboard:");
    console.log("   - https://resend.com/emails");
    console.log("   - View logs and delivery status");
    console.log();

    process.exit(1);
  }
}

// Run test
testEmail();
