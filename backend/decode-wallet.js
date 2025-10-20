/**
 * Script สำหรับ decode Base64 wallet files กลับเป็นไฟล์
 * ใช้ตอน startup บน Railway
 */

import fs from "fs";
import path from "path";

/**
 * Decode wallet files from environment variables
 */
export function decodeWalletFiles() {
  const walletDir = process.env.WALLET_LOCATION || "/app/wallet";

  console.log(
    "🔐 กำลัง decode Oracle Wallet files จาก Environment Variables...",
  );

  // สร้าง wallet directory ถ้ายังไม่มี
  if (!fs.existsSync(walletDir)) {
    fs.mkdirSync(walletDir, { recursive: true });
    console.log(`✅ สร้าง directory: ${walletDir}`);
  }

  // Wallet files mapping
  const walletFiles = {
    WALLET_CWALLET_SSO: "cwallet.sso",
    WALLET_EWALLET_P12: "ewallet.p12",
    WALLET_EWALLET_PEM: "ewallet.pem",
    WALLET_KEYSTORE_JKS: "keystore.jks",
    WALLET_OJDBC_PROPERTIES: "ojdbc.properties",
    WALLET_SQLNET_ORA: "sqlnet.ora",
    WALLET_TNSNAMES_ORA: "tnsnames.ora",
    WALLET_TRUSTSTORE_JKS: "truststore.jks",
  };

  let decodedCount = 0;
  let errorCount = 0;

  Object.entries(walletFiles).forEach(([envVar, filename]) => {
    const base64Content = process.env[envVar];

    if (!base64Content) {
      console.log(`⚠️  ไม่พบ ${envVar} ใน environment variables`);
      errorCount++;
      return;
    }

    try {
      const buffer = Buffer.from(base64Content, "base64");
      const filePath = path.join(walletDir, filename);

      // Write file with permissions 0600 (read/write for owner only)
      fs.writeFileSync(filePath, buffer, { mode: 0o600 });

      const sizeKB = (buffer.length / 1024).toFixed(2);
      console.log(`✅ Decoded: ${filename} (${sizeKB} KB)`);
      decodedCount++;
    } catch (error) {
      console.error(`❌ ไม่สามารถ decode ${filename}:`, error.message);
      errorCount++;
    }
  });

  console.log("");
  console.log(
    `📊 สรุป: decode สำเร็จ ${decodedCount} ไฟล์, ล้มเหลว ${errorCount} ไฟล์`,
  );
  console.log("");

  if (errorCount > 0) {
    throw new Error(`Failed to decode ${errorCount} wallet file(s)`);
  }

  return walletDir;
}

// ถ้ารันโดยตรง (สำหรับทดสอบ)
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    decodeWalletFiles();
    console.log("✅ Wallet files decoded successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}
