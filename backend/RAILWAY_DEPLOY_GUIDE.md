# 🚀 คู่มือการ Deploy Backend บน Railway (ไม่ใช้ GitHub)

## 📋 ข้อกำหนดเบื้องต้น

1. ✅ มี Railway account (สมัครฟรีที่ https://railway.app)
2. ✅ ติดตั้ง Node.js บนเครื่อง
3. ✅ มี Oracle Database พร้อมใช้งาน

---

## 📦 ขั้นตอนที่ 1: เตรียม Project

### 1.1 ติดตั้ง Railway CLI

```bash
npm install -g @railway/cli
```

### 1.2 ตรวจสอบว่าติดตั้งสำเร็จ

```bash
railway --version
```

---

## 🔐 ขั้นตอนที่ 2: Login Railway

```bash
railway login
```

เบราว์เซอร์จะเปิดขึ้นให้ login ด้วย account ของคุณ

---

## 📁 ขั้นตอนที่ 3: เตรียม Backend Files

### 3.1 ไปที่ backend folder

```bash
cd D:\github\oracleBlockchainTable\backend
```

### 3.2 ลบไฟล์ที่ไม่จำเป็น (Optional แต่แนะนำ)

```bash
# ลบ instant client สำหรับ Windows (Railway จะติดตั้ง Linux version เอง)
rmdir /s instantclient_23_9
del instantclient-basic-windows.x64-23.9.0.25.07.zip

# ไฟล์อื่นๆ ที่ไม่ต้องการจะถูก ignore โดย .railwayignore อัตโนมัติ
```

---

## 🚀 ขั้นตอนที่ 4: Deploy ไปยัง Railway

### 4.1 สร้าง Project ใหม่

```bash
railway init
```

ระบบจะถาม:
- Project name: `oracle-blockchain-backend` (ตั้งชื่อตามต้องการ)
- Start with empty project: เลือก `Yes`

### 4.2 Deploy

```bash
railway up
```

Railway จะ:
- ✅ Upload source code ของคุณ
- ✅ Auto-detect ว่าเป็น Node.js project
- ✅ รัน `npm install` อัตโนมัติ
- ✅ Build project

---

## ⚙️ ขั้นตอนที่ 5: ตั้งค่า Environment Variables

### 5.1 ตั้งค่าผ่าน CLI (วิธีแรก)

```bash
# Database Configuration
railway variables set DB_USER=your_oracle_username
railway variables set DB_PASSWORD=your_oracle_password
railway variables set DB_CONNECTION_STRING=your_connection_string_high

# Wallet Configuration
railway variables set USE_WALLET=true
railway variables set WALLET_LOCATION=/app/wallet
railway variables set WALLET_PASSWORD=your_wallet_password

# Oracle Instant Client (Railway จะติดตั้งให้)
railway variables set ORACLE_INSTANT_CLIENT_PATH=/opt/oracle/instantclient_21_1

# Server Configuration
railway variables set PORT=5000
railway variables set NODE_ENV=production

# CORS (ใส่ URL Frontend ที่จะใช้งาน)
railway variables set CORS_ORIGIN=https://your-frontend.pages.dev
railway variables set CORS_ALLOWED_ORIGINS=https://your-frontend.pages.dev

# Frontend URL
railway variables set FRONTEND_URL=https://your-frontend.pages.dev

# Email Configuration
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=your-email@gmail.com
railway variables set SMTP_PASS=your-app-password

# Table Names
railway variables set BLOCKCHAIN_TABLE=votes_blockchain_v3
railway variables set IMMUTABLE_TABLE=polls_immutable_v2
railway variables set OPTIONS_TABLE=poll_options_v2
railway variables set RECIPIENTS_TABLE=poll_recipients_v2

# Performance
railway variables set DB_POOL_MIN=5
railway variables set DB_POOL_MAX=50
railway variables set DB_POOL_INCREMENT=5
railway variables set DB_QUEUE_TIMEOUT=60000
railway variables set DB_QUEUE_MAX=1000
railway variables set SLOW_QUERY_THRESHOLD=5000
```

### 5.2 ตั้งค่าผ่าน Railway Dashboard (วิธีที่สอง)

1. ไปที่ https://railway.app
2. เลือก Project ของคุณ
3. ไปที่ Tab "Variables"
4. คลิก "+ New Variable"
5. ใส่ค่าตามที่ต้องการ (ดู `.env.example`)

---

## 📦 ขั้นตอนที่ 6: Upload Oracle Wallet (ถ้าใช้ Oracle Cloud)

เนื่องจาก Railway ไม่สามารถ upload folder ได้ โดยตรง มี 2 วิธี:

### วิธีที่ 1: แปลง Wallet เป็น Base64 (แนะนำ)

```bash
# บน Windows PowerShell
$walletFiles = Get-ChildItem -Path "./wallet" -File
foreach ($file in $walletFiles) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $base64 = [System.Convert]::ToBase64String($bytes)
    Write-Host "$($file.Name): $base64"
}
```

แล้วใส่ใน environment variables:
```bash
railway variables set WALLET_CWALLET_BASE64="<base64_content>"
railway variables set WALLET_EWALLET_BASE64="<base64_content>"
railway variables set WALLET_KEYSTORE_BASE64="<base64_content>"
railway variables set WALLET_OJDBC_BASE64="<base64_content>"
railway variables set WALLET_SQLNET_BASE64="<base64_content>"
railway variables set WALLET_TNSNAMES_BASE64="<base64_content>"
```

### วิธีที่ 2: ใช้ Railway Volume (Advanced)

ดูเอกสาร: https://docs.railway.app/reference/volumes

---

## 🌐 ขั้นตอนที่ 7: เปิดใช้งาน Public URL

```bash
railway domain
```

Railway จะสร้าง domain ให้อัตโนมัติ เช่น:
```
https://oracle-blockchain-backend-production.up.railway.app
```

---

## ✅ ขั้นตอนที่ 8: ตรวจสอบการ Deploy

### 8.1 ดู Logs

```bash
railway logs
```

### 8.2 เปิด Dashboard

```bash
railway open
```

### 8.3 ทดสอบ API

```bash
curl https://your-app.up.railway.app/health
```

คำตอบควรเป็น:
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T10:00:00.000Z"
}
```

---

## 🔄 การ Update Code ใหม่

เมื่อมีการแก้ไข code:

```bash
# ไปที่ backend folder
cd D:\github\oracleBlockchainTable\backend

# Deploy version ใหม่
railway up
```

---

## 🛠️ คำสั่งที่ใช้บ่อย

```bash
# ดู environment variables
railway variables

# ลบ variable
railway variables delete VARIABLE_NAME

# ดู logs แบบ real-time
railway logs -f

# เปิด Railway Dashboard
railway open

# ดูข้อมูล project
railway status

# Link กับ project ที่มีอยู่แล้ว
railway link

# Unlink project
railway unlink
```

---

## ⚠️ ข้อควรระวัง

### 1. Oracle Instant Client
- Railway จะติดตั้ง Linux version ให้อัตโนมัติ
- ไม่ต้อง upload Windows instant client

### 2. Wallet Files
- ต้อง upload หรือ encode เป็น Base64
- ห้าม commit wallet files ลง git

### 3. Environment Variables
- ตรวจสอบให้แน่ใจว่าใส่ครบทุกตัว
- Database password ต้องถูกต้อง
- CORS_ORIGIN ต้องตรงกับ Frontend URL

### 4. Free Tier Limitations
- $5 credit/month
- ประมาณ 500 execution hours/month
- ถ้าใช้เกินต้องเติมเงิน

### 5. Database Connection
- ตรวจสอบว่า Oracle DB อนุญาต IP ของ Railway
- Connection string ต้องถูกต้อง

---

## 🐛 แก้ไขปัญหาที่พบบ่อย

### ปัญหา: Deploy ไม่สำเร็จ

```bash
# ดู logs เพื่อหาสาเหตุ
railway logs

# ตรวจสอบว่า package.json มี start script
# ควรมี: "start": "node server.js"
```

### ปัญหา: ไม่สามารถเชื่อมต่อ Database

1. ตรวจสอบ environment variables
2. ดูว่า Oracle DB อนุญาต IP ของ Railway หรือไม่
3. ทดสอบ connection string บนเครื่อง local ก่อน

### ปัญหา: CORS Error

```bash
# เพิ่ม Frontend URL ใน CORS_ALLOWED_ORIGINS
railway variables set CORS_ALLOWED_ORIGINS=https://your-frontend.pages.dev,https://www.your-domain.com
```

### ปัญหา: Build Error

1. ตรวจสอบว่า `package.json` มี dependencies ครบ
2. ลอง build บนเครื่อง local ก่อน
3. ดู logs ว่า error ตรงไหน

---

## 📞 ต้องการความช่วยเหลือ

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Support: support@railway.app

---

## ✨ เสร็จสิ้น!

Backend ของคุณพร้อมใช้งานบน Railway แล้ว 🎉

URL: `https://your-app.up.railway.app`

ขั้นตอนถัดไป:
1. Deploy Frontend บน Cloudflare Pages
2. อัพเดท `CORS_ORIGIN` ให้ตรงกับ Frontend URL
3. ทดสอบการทำงานของระบบทั้งหมด
