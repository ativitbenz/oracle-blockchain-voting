# 🚀 คู่มือการ Deploy Backend บน Render

Render เป็น PaaS ฟรีที่ใช้งานง่าย รองรับ Node.js และมี free tier

---

## 📋 ข้อกำหนดเบื้องต้น

1. ✅ มี Render account (สมัครฟรีที่ https://render.com)
2. ✅ เตรียมไฟล์ `wallet-base64.json` (จากการรัน `encode-wallet.js`)

---

## 🎯 มี 2 วิธีในการ Deploy

### วิธีที่ 1: Upload โดยตรง (ไม่ต้องใช้ GitHub) ⭐ แนะนำ
### วิธีที่ 2: เชื่อมต่อกับ GitHub (Auto-deploy)

---

## 🚀 วิธีที่ 1: Upload โดยตรง (ไม่ใช้ GitHub)

### ขั้นตอนที่ 1: สร้าง ZIP file

```bash
# ไปที่ backend folder
cd D:\github\oracleBlockchainTable\backend

# สร้าง ZIP (ยกเว้นไฟล์ที่ไม่จำเป็น)
# บน Windows: ใช้ File Explorer
```

**ไฟล์ที่ต้อง ZIP:**
```
backend/
├── src/
├── package.json
├── package-lock.json
├── server.js
├── decode-wallet.js
├── render.yaml
└── (ไม่ต้องใส่ node_modules, wallet/, instantclient)
```

### ขั้นตอนที่ 2: สร้าง Web Service บน Render

1. ไปที่ https://dashboard.render.com
2. คลิก **New** > **Web Service**
3. เลือก **Deploy an existing image from a registry** แล้วเลือก **Public Git repository**
   หรือคลิก **Upload a folder**
4. Upload ZIP file ที่สร้าง

### ขั้นตอนที่ 3: ตั้งค่า Service

```
Name: oracle-voting-backend
Region: Singapore (ใกล้ที่สุด)
Branch: (ถ้าใช้ Git)
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### ขั้นตอนที่ 4: เพิ่ม Environment Variables

คลิก **Advanced** > **Add Environment Variable**

#### วิธีที่ 1: เพิ่มทีละตัว
คลิก **Add Environment Variable** แล้วใส่ตาม `RENDER_VARIABLES.txt`

#### วิธีที่ 2: ใช้ Bulk Add (เร็วกว่า)
1. คลิก **Add from .env**
2. เปิดไฟล์ `RENDER_VARIABLES.txt`
3. Copy ทั้งหมด
4. Paste ลงไป
5. **อย่าลืม!** เปิดไฟล์ `wallet-base64.json` แล้ว copy Base64 values มาใส่ในตัวแปร `WALLET_*`

**ตัวอย่าง:**
```
WALLET_CWALLET_SSO=MIIDQzCCAiugAwIBAgIBADANBgkqhkiG9w0BAQsFADCBgTE...
WALLET_EWALLET_P12=MIIJvgIBAzCCCXoGCSqGSIb3DQEHAaCCCWsEgglnMIIJYz...
...
```

### ขั้นตอนที่ 5: Deploy

1. ตรวจสอบ Environment Variables ให้ครบ
2. คลิก **Create Web Service**
3. Render จะ:
   - รัน `npm install`
   - รัน `npm start`
   - Deploy ให้อัตโนมัติ

### ขั้นตอนที่ 6: รอ Deploy เสร็จ

ดู Logs ใน Dashboard:
```
🔐 Decoding Oracle Wallet files from environment variables...
✅ Wallet files decoded successfully
🔄 Initializing Oracle Database connection...
🚀 Server running on port 10000
```

### ขั้นตอนที่ 7: ได้ URL!

Render จะสร้าง URL ให้ เช่น:
```
https://oracle-voting-backend.onrender.com
```

---

## 🚀 วิธีที่ 2: เชื่อมต่อกับ GitHub

### ขั้นตอนที่ 1: Push code ขึ้น GitHub

```bash
cd D:\github\oracleBlockchainTable

# Initialize git (ถ้ายังไม่ได้)
git init
git add .
git commit -m "Initial commit"

# สร้าง repository ใหม่บน GitHub แล้ว push
git remote add origin https://github.com/your-username/oracle-voting.git
git branch -M main
git push -u origin main
```

### ขั้นตอนที่ 2: เชื่อมต่อกับ Render

1. ไปที่ https://dashboard.render.com
2. คลิก **New** > **Web Service**
3. คลิก **Connect a repository**
4. เลือก GitHub และ authorize
5. เลือก repository `oracle-voting`

### ขั้นตอนที่ 3: ตั้งค่า

```
Name: oracle-voting-backend
Region: Singapore
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### ขั้นตอนที่ 4: เพิ่ม Environment Variables

ทำเหมือนวิธีที่ 1

### ขั้นตอนที่ 5: Deploy

คลิก **Create Web Service**

---

## ⚙️ Environment Variables ที่ต้องใส่

### พื้นฐาน (28 ตัว):
```
NODE_ENV=production
PORT=10000
DB_USER=adw_oac
DB_PASSWORD=Welcome#1234
DB_CONNECTION_STRING=demo_high
USE_WALLET=true
WALLET_LOCATION=/opt/render/project/src/wallet
WALLET_PASSWORD=welcome1
ORACLE_INSTANT_CLIENT_PATH=/opt/oracle/instantclient
DB_POOL_MIN=5
DB_POOL_MAX=50
DB_POOL_INCREMENT=5
DB_QUEUE_TIMEOUT=60000
DB_QUEUE_MAX=1000
CORS_ORIGIN=https://0b8141c4.voting-oracle-blockchain-table.pages.dev
CORS_ALLOWED_ORIGINS=https://0b8141c4.voting-oracle-blockchain-table.pages.dev
BLOCKCHAIN_TABLE=votes_blockchain_v3
IMMUTABLE_TABLE=polls_immutable_v2
OPTIONS_TABLE=poll_options_v2
RECIPIENTS_TABLE=poll_recipients_v2
FRONTEND_URL=https://0b8141c4.voting-oracle-blockchain-table.pages.dev
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=benzativit@gmail.com
SMTP_PASS=lduy feqq tlxz ybfs
SMTP_CONNECTION_TIMEOUT=10000
SMTP_GREETING_TIMEOUT=5000
SMTP_SOCKET_TIMEOUT=10000
SMTP_MAX_CONNECTIONS=5
SMTP_MAX_MESSAGES=100
SLOW_QUERY_THRESHOLD=5000
```

### Wallet Files (8 ตัว) - จาก wallet-base64.json:
```
WALLET_CWALLET_SSO=<base64_string>
WALLET_EWALLET_P12=<base64_string>
WALLET_EWALLET_PEM=<base64_string>
WALLET_KEYSTORE_JKS=<base64_string>
WALLET_OJDBC_PROPERTIES=<base64_string>
WALLET_SQLNET_ORA=<base64_string>
WALLET_TNSNAMES_ORA=<base64_string>
WALLET_TRUSTSTORE_JKS=<base64_string>
```

**รวมทั้งหมด: 36 Environment Variables**

---

## 🔍 ตรวจสอบการ Deploy

### 1. ดู Logs

ใน Render Dashboard > Logs:
```
==> Building...
==> Installing dependencies
==> Starting server
🔐 Decoding Oracle Wallet files...
✅ Wallet files decoded successfully
🔄 Initializing Oracle Database connection...
✅ Connected to Oracle Database
🚀 Server running on port 10000
==> Your service is live 🎉
```

### 2. ทดสอบ Health Check

```bash
curl https://oracle-voting-backend.onrender.com/health
```

ควรได้:
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T..."
}
```

### 3. ทดสอบ API

```bash
curl https://oracle-voting-backend.onrender.com/api/polls
```

---

## ⚠️ ข้อควรระวัง - Free Plan Limitations

### Sleep after 15 minutes of inactivity
- เมื่อไม่มี request มา 15 นาที service จะ sleep
- Request แรกหลัง sleep จะใช้เวลา ~30 วินาที wake up
- Request ถัดไปจะเร็วปกติ

### วิธีแก้:
1. **ยอมรับ** - ใช้งานฟรีแบบนี้
2. **Ping service** - ใช้ cron job ping ทุก 10 นาที (เช่น cron-job.org)
3. **Upgrade** - จ่าย $7/month สำหรับ no sleep

### Resource Limits:
- ✅ 512MB RAM
- ✅ 0.1 CPU
- ✅ 750 hours/month (พอใช้งาน)
- ✅ Bandwidth: ไม่จำกัด

---

## 🔄 การ Update Code

### ถ้าใช้ GitHub:
```bash
git add .
git commit -m "Update backend"
git push
# Auto-deploy!
```

### ถ้า Upload โดยตรง:
1. สร้าง ZIP ใหม่
2. Render Dashboard > **Manual Deploy** > **Upload new version**

---

## 📊 หลังจาก Deploy สำเร็จ

### 1. คัดลอก Backend URL
```
https://oracle-voting-backend.onrender.com
```

### 2. อัพเดท Frontend Environment Variable

ไปที่ Cloudflare Dashboard:
1. **Pages** > **voting-oracle-blockchain-table**
2. **Settings** > **Environment variables**
3. แก้ไข `VITE_API_URL`:
   ```
   https://oracle-voting-backend.onrender.com/api
   ```
4. **Save**

### 3. Redeploy Frontend

```bash
cd frontend
npm run build
npx wrangler pages deploy dist
```

---

## 🐛 แก้ไขปัญหาที่พบบ่อย

### ปัญหา: Build ล้มเหลว

**ตรวจสอบ:**
1. `package.json` มี dependencies ครบหรือไม่
2. มี `"start": "node server.js"` ใน scripts หรือไม่

### ปัญหา: ไม่สามารถเชื่อมต่อ Database

**ตรวจสอบ:**
1. Environment Variables ครบ 36 ตัวหรือไม่
2. Wallet Base64 ถูกต้องหรือไม่
3. DB credentials ถูกต้องหรือไม่

### ปัญหา: Wallet decode ไม่สำเร็จ

**ดู Logs:**
```
⚠️  Warning: Failed to decode wallet files
```

**แก้ไข:**
- ตรวจสอบว่า Base64 strings ถูกต้อง
- ไม่มี line breaks หรือช่องว่างใน Base64
- Environment variable names ต้องตรงกับที่ decode-wallet.js ต้องการ

### ปัญหา: CORS Error

**แก้ไข:**
- ตรวจสอบ `CORS_ORIGIN` ว่าตรงกับ Frontend URL หรือไม่
- ไม่มี trailing slash (/)

---

## 💰 ค่าใช้จ่าย

### Free Plan:
- ✅ **ฟรี 100%**
- ⚠️ Sleep after 15 min inactive
- ✅ 512MB RAM
- ✅ 750 hours/month
- ✅ Unlimited bandwidth

### Paid Plan ($7/month):
- ✅ No sleep
- ✅ 512MB RAM (เพิ่มได้)
- ✅ Unlimited hours
- ✅ Faster builds

---

## 📞 ต้องการความช่วยเหลือ

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Support: support@render.com

---

## ✨ สรุป

### ข้อดี:
✅ Deploy ฟรีไม่ยาก
✅ ไม่ต้องใช้ GitHub ก็ได้
✅ Support Node.js + Oracle
✅ SSL/TLS ฟรี
✅ Custom domain ได้

### ข้อเสีย:
⚠️ Sleep หลัง 15 นาที (Free plan)
⚠️ Wake up ใช้เวลา ~30 วินาที

---

## 🎯 Next Steps:

1. ✅ Deploy Backend บน Render
2. ✅ ได้ Backend URL
3. ✅ อัพเดท Frontend ENV
4. ✅ Redeploy Frontend
5. 🚀 ระบบพร้อมใช้งาน!

---

**Happy Deploying! 🎉**
