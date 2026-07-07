/**
 * KANRI COMMISSION — server.js
 * 藍新金流 + MongoDB + Google Sheet
 */

const express = require("express");
const crypto  = require("crypto");
const cors    = require("cors");
const path    = require("path");
const { MongoClient } = require("mongodb");

// ── MongoDB ─────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
let db = null;
let mongoReady = false;

async function connectDB() {
  if (!MONGODB_URI) { console.warn("⚠️  MONGODB_URI 未設定"); return; }
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("kanri");
    mongoReady = true;
    console.log("✅ MongoDB 連線成功");
  } catch(e) {
    console.error("❌ MongoDB 連線失敗:", e.message);
    // retry after 10s
    setTimeout(connectDB, 10000);
  }
}

async function readData() {
  if (!mongoReady || !db) return null;
  try {
    const doc = await db.collection("sitedata").findOne({ _id: "main" });
    return doc || null;
  } catch(e) {
    console.error("讀取失敗:", e.message);
    return null;
  }
}

async function writeData(data) {
  if (!mongoReady || !db) return false;
  try {
    // Remove _id from data to avoid conflict
    const { _id, ...clean } = data;
    await db.collection("sitedata").updateOne(
      { _id: "main" },
      { $set: clean },
      { upsert: true }
    );
    return true;
  } catch(e) {
    console.error("寫入失敗:", e.message);
    return false;
  }
}

connectDB();

// ── Express ──────────────────────────────────
const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cors());
app.use(express.static(path.join(__dirname)));

// ── API: 讀取網站資料 ─────────────────────────
app.get("/api/site-data", async (req, res) => {
  const data = await readData();
  if (data) {
    res.json(data);
  } else {
    res.json({ profile: null, homeBlocks: null, noticesHome: null, noticesComm: null, noticesPay: null, atten: null, commissions: null, progressList: null });
  }
});

// ── API: 儲存網站資料 ─────────────────────────
app.post("/api/site-data", async (req, res) => {
  const current = await readData() || {};
  const updated = { ...current, ...req.body };
  const ok = await writeData(updated);
  if (ok) {
    res.json({ ok: true });
  } else {
    res.status(500).json({ ok: false, error: "儲存失敗" });
  }
});

// ── 藍新金流設定 ──────────────────────────────
const MERCHANT_ID = "MS1833659005";
const HASH_KEY    = "JrbUntegBSyPCnUuZUOdMBs8vwmZtJRL";
const HASH_IV     = "PSDQfFKgOuHSulVC";
const GATEWAY     = "https://core.newebpay.com/MPG/mpg_gateway";

function aesEncrypt(str) {
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(HASH_KEY,"utf8"), Buffer.from(HASH_IV,"utf8"));
  return cipher.update(str,"utf8","hex") + cipher.final("hex");
}
function sha256Sign(tradeInfo) {
  return crypto.createHash("sha256").update(`HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`).digest("hex").toUpperCase();
}
function aesDecrypt(encrypted) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(HASH_KEY,"utf8"), Buffer.from(HASH_IV,"utf8"));
  decipher.setAutoPadding(false);
  let d = decipher.update(encrypted,"hex","utf8") + decipher.final("utf8");
  return d.slice(0, d.length - d.charCodeAt(d.length-1));
}

// ── Google Sheet ──────────────────────────────
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbykxdcgcc4fdVazVSnDPBA64v2bMVHIvHvFOw6uqdU8fiuAnjrHbCm6Yk6K_GwOa2Ytcw/exec";

async function sendToGoogleSheet(data) {
  if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.includes("貼上")) return;
  try {
    console.log("📤 傳送訂單到 Google Sheet:", data.orderNo);
    const res = await fetch(GOOGLE_SHEET_URL, {
      method:"POST",
      headers:{"Content-Type":"text/plain"},
      body: JSON.stringify(data),
      redirect:"follow",
    });
    const text = await res.text();
    console.log("📥 Google Sheet 回應:", text);
  } catch(e) {
    console.error("❌ Google Sheet 同步失敗:", e.message);
  }
}

// ── API: 建立付款 ─────────────────────────────
app.post("/api/create-payment", async (req, res) => {
  const { cart, buyerName, buyerEmail, buyerNote, products } = req.body;
  if (!cart?.length || !buyerName || !buyerEmail) {
    return res.status(400).json({ error: "缺少必要欄位" });
  }
  const amt = cart.reduce((sum, c) => {
    const p = products.find(x => x.id === c.id);
    if (!p) return sum;
    if (p.priceType === "custom") return sum + (c.customPrice||0) * c.qty;
    return sum + (p.price > 0 ? p.price * c.qty : 0);
  }, 0);
  if (amt < 1) return res.status(400).json({ error: "訂單金額不得為 0" });

  const itemDesc = cart.map(c => {
    const p = products.find(x => x.id === c.id);
    return p ? `${p.name}x${c.qty}` : "";
  }).filter(Boolean).join(", ");

  const MerchantOrderNo = "KC" + Date.now();
  const TimeStamp = Math.floor(Date.now()/1000);
console.log("🕐 TimeStamp:", TimeStamp, new Date().toISOString());
  const host = `${req.protocol}://${req.get("host")}`;

  const tradeParams = [
    `MerchantID=${MERCHANT_ID}`,
    `RespondType=JSON`,
    `TimeStamp=${TimeStamp}`,
    `Version=2.0`,
    `MerchantOrderNo=${MerchantOrderNo}`,
    `Amt=${amt}`,
    `ItemDesc=${encodeURIComponent(itemDesc.slice(0,50))}`,
    `Email=${encodeURIComponent(buyerEmail)}`,
    `LoginType=0`,
    `WEBATM=1`,
    `VACC=1`,
    `CVS=1`,
    `BARCODE=1`,
    `ReturnURL=${encodeURIComponent(host+"/payment/return")}`,
    `NotifyURL=${encodeURIComponent(host+"/payment/notify")}`,
  ].join("&");

  const TradeInfo = aesEncrypt(tradeParams);
  const TradeSha  = sha256Sign(TradeInfo);

  await sendToGoogleSheet({
    orderNo: MerchantOrderNo,
    date: new Date().toLocaleString("zh-TW",{timeZone:"Asia/Taipei"}),
    buyerName, buyerEmail,
    buyerNote: buyerNote||"",
    itemDesc, amt,
  });

  res.json({ gateway:GATEWAY, MerchantID:MERCHANT_ID, TradeInfo, TradeSha, Version:"2.0", orderNo:MerchantOrderNo });
});

// ── 藍新回傳（前景）──────────────────────────
app.post("/payment/return", (req, res) => {
  try {
    const result  = JSON.parse(aesDecrypt(req.body.TradeInfo));
    const status  = result?.Result?.RtnCode;
    const orderNo = result?.Result?.MerchantOrderNo;
    if (status === "1") {
      res.send(`<html><head><meta charset="UTF-8"><title>付款成功</title>
        <style>body{font-family:sans-serif;text-align:center;padding:60px;color:#333}h2{color:#333}a{color:#b8973a}</style></head>
        <body><h2>✓ 付款成功</h2><p>訂單編號：${orderNo}</p><p>感謝您的委託！我們將盡快與您聯繫。</p><a href="/">返回首頁</a></body></html>`);
    } else {
      res.send(`<html><body><h2>付款失敗</h2><p>${result?.Result?.Message||""}</p><a href="/">返回首頁</a></body></html>`);
    }
  } catch(e) {
    res.send("<html><body><h2>處理付款時發生錯誤</h2><a href='/'>返回首頁</a></body></html>");
  }
});

// ─── 藍新通知（背景） ──────────────────────────
app.post("/payment/notify", (req, res) => {
  // 先立刻回 200，避免藍新重試
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send("OK");
  // 再非同步處理通知內容
  try {
    const tradeInfo = req.body.TradeInfo;
    if (!tradeInfo) return;
    const result = JSON.parse(aesDecrypt(tradeInfo));
    console.log("📦 Newebpay Notify:", JSON.stringify(result));
  } catch(e) {
    console.error("Notify parse error:", e.message);
  }
});

// ─── 靜態首頁 ─────────────────────────────────
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/payment/")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "index.html"));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🎨 KANRI COMMISSION Server`);
  console.log(`   http://0.0.0.0:${PORT}\n`);
});
