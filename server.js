/**
 * KANRI COMMISSION — 後端付款伺服器
 * 藍新金流 (Newebpay) 安全加密
 * Node.js + Express
 *
 * 使用方式：
 *   npm install
 *   node server.js
 *
 * 部署建議：Render.com / Railway / Fly.io 免費方案皆可
 */

const express = require("express");
const crypto  = require("crypto");
const cors    = require("cors");
const path    = require("path");
const { MongoClient } = require("mongodb");

// ─── MongoDB 連線 ──────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
let db = null;

async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("kanri");
    console.log("✅ MongoDB 連線成功");
  } catch(e) {
    console.error("❌ MongoDB 連線失敗:", e.message);
  }
}

async function readData() {
  try {
    if (!db) return null;
    const doc = await db.collection("sitedata").findOne({ _id: "main" });
    return doc || null;
  } catch(e) {
    console.error("讀取資料失敗:", e.message);
    return null;
  }
}

async function writeData(data) {
  try {
    if (!db) return false;
    await db.collection("sitedata").updateOne(
      { _id: "main" },
      { $set: { ...data, _id: "main" } },
      { upsert: true }
    );
    return true;
  } catch(e) {
    console.error("寫入資料失敗:", e.message);
    return false;
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname)));

// ─── API：讀取網站資料 ────────────────────────
app.get("/api/site-data", (req, res) => {
  const data = readData();
  if (data) {
    res.json(data);
  } else {
    res.json({ profile: null, notices: null, products: null });
  }
});

// ─── API：儲存網站資料 ────────────────────────
app.post("/api/site-data", (req, res) => {
  const current = readData() || {};
  const updated = { ...current, ...req.body };
  const ok = writeData(updated);
  res.json({ ok });
});

// ─── 藍新金流設定 ─────────────────────────────
const MERCHANT_ID = "MS1833659005";
const HASH_KEY    = "JrbUntegBSyPCnUuZUOdMBs8vwmZtJRL";
const HASH_IV     = "PSDQfFKgOuHSulVC";
// 測試: https://ccore.newebpay.com/MPG/mpg_gateway
// 正式: https://core.newebpay.com/MPG/mpg_gateway
const GATEWAY     = "https://core.newebpay.com/MPG/mpg_gateway";

// ─── 工具函式 ──────────────────────────────────

/** AES-256-CBC 加密 (PKCS7) */
function aesEncrypt(str) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(HASH_KEY, "utf8"),
    Buffer.from(HASH_IV,  "utf8")
  );
  let encrypted = cipher.update(str, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

/** SHA256 簽章 */
function sha256Sign(tradeInfo) {
  const str = `HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`;
  return crypto.createHash("sha256").update(str).digest("hex").toUpperCase();
}

/** AES-256-CBC 解密（用於接收藍新回傳） */
function aesDecrypt(encrypted) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(HASH_KEY, "utf8"),
    Buffer.from(HASH_IV,  "utf8")
  );
  decipher.setAutoPadding(false);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  // 移除 PKCS7 padding
  const pad = decrypted.charCodeAt(decrypted.length - 1);
  return decrypted.slice(0, decrypted.length - pad);
}

// ─── Google 試算表網址（貼上你的 Apps Script 部署網址）──
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbykxdcgcc4fdVazVSnDPBA64v2bMVHIvHvFOw6uqdU8fiuAnjrHbCm6Yk6K_GwOa2Ytcw/exec";

// ─── 傳送訂單到 Google 試算表 ──────────────────
async function sendToGoogleSheet(data) {
  if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.includes("貼上")) return;
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      redirect: "follow",
    });
  } catch(e) {
    console.error("Google Sheet 同步失敗:", e.message);
  }
}

// ─── API：建立付款 ─────────────────────────────
app.post("/api/create-payment", async (req, res) => {
  const { cart, buyerName, buyerEmail, buyerNote, products } = req.body;

  if (!cart?.length || !buyerName || !buyerEmail) {
    return res.status(400).json({ error: "缺少必要欄位" });
  }

  // 計算金額（含顧客自填）
  const amt = cart.reduce((sum, c) => {
    const p = products.find(x => x.id === c.id);
    if (!p) return sum;
    if (p.priceType === "custom") return sum + (c.customPrice || 0) * c.qty;
    return sum + (p.price > 0 ? p.price * c.qty : 0);
  }, 0);

  if (amt < 1) {
    return res.status(400).json({ error: "訂單金額不得為 0" });
  }

  const itemDesc = cart.map(c => {
    const p = products.find(x => x.id === c.id);
    return p ? `${p.name}x${c.qty}` : "";
  }).filter(Boolean).join(", ");

  const MerchantOrderNo = "KC" + Date.now();
  const TimeStamp = Math.floor(Date.now() / 1000);

  const ReturnURL = `${req.protocol}://${req.get("host")}/payment/return`;
  const NotifyURL = `${req.protocol}://${req.get("host")}/payment/notify`;

  const tradeParams = [
    `MerchantID=${MERCHANT_ID}`,
    `RespondType=JSON`,
    `TimeStamp=${TimeStamp}`,
    `Version=2.0`,
    `MerchantOrderNo=${MerchantOrderNo}`,
    `Amt=${amt}`,
    `ItemDesc=${encodeURIComponent(itemDesc.slice(0, 50))}`,
    `Email=${encodeURIComponent(buyerEmail)}`,
    `LoginType=0`,
    `WEBATM=1`,
    `VACC=1`,
    `CVS=1`,
    `BARCODE=1`,
    `ReturnURL=${encodeURIComponent(ReturnURL)}`,
    `NotifyURL=${encodeURIComponent(NotifyURL)}`,
  ].join("&");

  const TradeInfo = aesEncrypt(tradeParams);
  const TradeSha  = sha256Sign(TradeInfo);

  // 同步寫入 Google 試算表
  await sendToGoogleSheet({
    orderNo:   MerchantOrderNo,
    date:      new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
    buyerName,
    buyerEmail,
    buyerNote: buyerNote || "",
    itemDesc,
    amt,
  });

  res.json({
    gateway:    GATEWAY,
    MerchantID: MERCHANT_ID,
    TradeInfo,
    TradeSha,
    Version: "2.0",
    orderNo: MerchantOrderNo,
  });
});

// ─── 藍新回傳（前景） ──────────────────────────
app.post("/payment/return", (req, res) => {
  try {
    const tradeInfo = req.body.TradeInfo;
    const result    = JSON.parse(aesDecrypt(tradeInfo));
    const status    = result?.Result?.RtnCode;
    const orderNo   = result?.Result?.MerchantOrderNo;

    if (status === "1") {
      res.send(`
        <html><head><meta charset="UTF-8">
        <title>付款成功</title>
        <style>body{font-family:sans-serif;text-align:center;padding:60px;color:#333}
        h2{color:#7c5cbf}a{color:#7c5cbf}</style></head>
        <body>
          <h2>✓ 付款成功</h2>
          <p>訂單編號：${orderNo}</p>
          <p>感謝您的委託！我們將盡快與您聯繫。</p>
          <a href="/">返回首頁</a>
        </body></html>
      `);
    } else {
      res.send(`<html><body><h2>付款失敗</h2><p>${result?.Result?.Message || ""}</p><a href="/">返回首頁</a></body></html>`);
    }
  } catch(e) {
    res.send("<html><body><h2>處理付款時發生錯誤</h2><a href='/'>返回首頁</a></body></html>");
  }
});

// ─── 藍新通知（背景） ──────────────────────────
app.post("/payment/notify", (req, res) => {
  try {
    const tradeInfo = req.body.TradeInfo;
    const result    = JSON.parse(aesDecrypt(tradeInfo));
    console.log("📦 Newebpay Notify:", result);
    // TODO: 在此更新資料庫訂單狀態
    res.send("OK");
  } catch(e) {
    console.error("Notify error:", e);
    res.send("ERROR");
  }
});

// ─── 靜態首頁 ─────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎨 KANRI COMMISSION Server`);
  console.log(`   http://localhost:${PORT}\n`);
});
