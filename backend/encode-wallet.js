/**
 * Script สำหรับแปลง Oracle Wallet files เป็น Base64
 * เพื่อนำไปใส่ใน Railway Environment Variables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const walletDir = path.join(__dirname, 'wallet');

// ไฟล์ที่ต้องแปลง
const walletFiles = [
  'cwallet.sso',
  'ewallet.p12',
  'ewallet.pem',
  'keystore.jks',
  'ojdbc.properties',
  'sqlnet.ora',
  'tnsnames.ora',
  'truststore.jks'
];

console.log('🔐 กำลังแปลง Oracle Wallet files เป็น Base64...\n');
console.log('=' .repeat(80));

const encodedWallets = {};

walletFiles.forEach(filename => {
  const filePath = path.join(walletDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ไม่พบไฟล์: ${filename}`);
    return;
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const variableName = `WALLET_${filename.replace(/[.-]/g, '_').toUpperCase()}`;

    encodedWallets[variableName] = base64;

    const sizeKB = (fileBuffer.length / 1024).toFixed(2);
    const base64SizeKB = (base64.length / 1024).toFixed(2);

    console.log(`✅ ${filename}`);
    console.log(`   ตัวแปร: ${variableName}`);
    console.log(`   ขนาดต้นฉบับ: ${sizeKB} KB`);
    console.log(`   ขนาด Base64: ${base64SizeKB} KB`);
    console.log(`   ความยาว: ${base64.length} characters`);
    console.log('');
  } catch (error) {
    console.error(`❌ ไม่สามารถแปลง ${filename}:`, error.message);
  }
});

console.log('=' .repeat(80));
console.log('\n📋 สำเร็จ! บันทึกผลลัพธ์ไปยัง: wallet-base64.json\n');

// บันทึกเป็น JSON
const outputFile = path.join(__dirname, 'wallet-base64.json');
fs.writeFileSync(outputFile, JSON.stringify(encodedWallets, null, 2));

console.log('✨ ขั้นตอนถัดไป:');
console.log('');
console.log('1. เปิดไฟล์ wallet-base64.json');
console.log('2. คัดลอกเนื้อหา');
console.log('3. ไปที่ Railway Dashboard > Variables > Raw Editor');
console.log('4. วางเป็น Environment Variables');
console.log('');
console.log('ตัวอย่าง:');
console.log('  WALLET_CWALLET_SSO=<base64_string>');
console.log('  WALLET_EWALLET_P12=<base64_string>');
console.log('  ...');
console.log('');
console.log('⚠️  หมายเหตุ: ไฟล์ README ไม่ได้ถูกแปลงเพราะไม่จำเป็นสำหรับการเชื่อมต่อ');
console.log('');
