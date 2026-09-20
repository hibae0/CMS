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

// ── API：送出預約 ─────────────────────────
app.post("/api/submit-booking", async (req, res) => {
  const data = req.body;
  if (!data.nickname || !data.email || !data.item) {
    return res.status(400).json({ ok:false, error:"缺少必要欄位" });
  }
  // 同步到 Google 試算表
  await sendToGoogleSheet({
    orderNo:   "BK" + Date.now(),
    date:      data.date,
    buyerName: data.nickname,
    buyerEmail:data.email,
    buyerNote: `【預約】${data.item}｜付款：${data.payment}｜截稿：${data.deadline}｜公開：${data.publish}｜格式：${data.format}｜角色：${data.character}｜內容：${data.detail}｜服裝：${data.costume}｜背景：${data.bg}｜補充：${data.note}｜加購：${data.addon}｜買斷：${data.buyout}｜印製：${data.printPlan}｜WIP：${data.wip}｜SNS：${data.sns}`,
    itemDesc:  `委託預約：${data.item}`,
    amt:       0,
  });
  res.json({ ok:true });
});


// ── API: 建立付款 ─────────────────────────────
app.post("/api/create-payment", async (req, res) => {
  const { cart, buyerName, buyerEmail, buyerNote, products } = req.body;
  if (!cart?.length || !buyerName || !buyerEmail) {
    return res.status(400).json({ error: "缺少必要欄位" });
  }
  const amt = cart.reduce((sum, c) => {
    // 有方案價格（variant）優先使用
    if (Number(c.variantPrice) > 0) return sum + Number(c.variantPrice) * c.qty;
    const p = products.find(x => x.id === c.id);
    if (!p) return sum;
    if (p.priceType === "custom") return sum + (c.customPrice||0) * c.qty;
    return sum + (p.price > 0 ? p.price * c.qty : 0);
  }, 0);
  if (amt < 1) return res.status(400).json({ error: "訂單金額不得為 0" });

  const itemDesc = cart.map(c => {
    const p = products.find(x => x.id === c.id);
    if (!p) return "";
    const name = c.variantName ? `${p.name}(${c.variantName})` : p.name;
    return `${name}x${c.qty}`;
  }).filter(Boolean).join(", ");

  const MerchantOrderNo = "KC" + Date.now();
  const TimeStamp = Math.floor(Date.now()/1000);
console.log("🕐 TimeStamp:", TimeStamp, new Date().toISOString());
  const host = `https://${req.get("host")}`;

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


/* ── BOOKING PAGE ── */
.booking-layout {
  max-width: 860px; margin: 0 auto;
  padding: 36px 36px 60px;
  display: flex; flex-direction: column; gap: 36px;
}
.booking-header { border-bottom: 1px solid var(--border); padding-bottom: 20px; }
.booking-subtitle { font-size: .84rem; color: var(--muted); margin-top: 6px; }
.booking-section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.2rem; font-style: italic; margin-bottom: 16px;
}
.booking-items { display: flex; flex-direction: column; gap: 12px; }
.booking-item-card {
  display: flex; gap: 16px; align-items: center;
  background: var(--off); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px 16px;
  transition: box-shadow .2s;
}
.booking-item-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,.06); }
.booking-item-disabled { opacity: .55; }
.booking-item-img { width: 64px; height: 64px; object-fit: cover; border-radius: 7px; flex-shrink: 0; }
.booking-item-img-placeholder {
  width: 64px; height: 64px; border-radius: 7px;
  background: var(--subtle); display: flex; align-items: center;
  justify-content: center; color: var(--light); font-size: 1.4rem; flex-shrink: 0;
}
.booking-item-info { flex: 1; min-width: 0; }
.booking-item-name { font-size: .92rem; font-weight: 500; margin-bottom: 3px; }
.booking-item-summary { font-size: .78rem; color: var(--muted); margin-bottom: 10px; }
.booking-item-footer { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.booking-slot-badge { font-size: .7rem; padding: 3px 9px; border-radius: 20px; border: 1px solid; }
.slot-open { background: #f0f7f0; color: #2e7d32; border-color: #c8e6c9; }
.slot-full { background: #f5f0f0; color: #8d3030; border-color: #e8c8c8; }
.slot-none { background: var(--subtle); color: var(--muted); border-color: var(--border); }
.booking-select-btn {
  background: var(--text); color: #fff; border: none;
  border-radius: 7px; padding: 6px 14px; cursor: pointer;
  font-size: .8rem; transition: background .2s;
}
.booking-select-btn:hover:not(:disabled) { background: #333; }
.booking-select-btn:disabled { background: var(--border2); cursor: not-allowed; }

/* Admin slots */
.booking-slots-admin {
  background: var(--off); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px 16px;
}
.booking-admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.booking-admin-label { font-size: .78rem; font-weight: 500; letter-spacing: .06em; color: var(--muted); text-transform: uppercase; }
.slot-admin-list { display: flex; flex-direction: column; gap: 6px; }
.slot-admin-row {
  display: flex; align-items: center; gap: 10px;
  font-size: .82rem; padding: 6px 0;
  border-bottom: 1px solid var(--border);
}
.slot-admin-name { flex: 1; }
.slot-admin-stat { font-size: .76rem; color: var(--muted); }

/* Form */
.booking-form-wrap {
  background: var(--off); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 24px 28px;
}
.booking-selected-item { display: flex; align-items: center; margin-bottom: 20px; }
.booking-selected-tag {
  background: var(--text); color: #fff;
  border-radius: 7px; padding: 4px 12px; font-size: .82rem;
}
.booking-form { display: flex; flex-direction: column; gap: 0; }
.form-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-label { font-size: .78rem; color: var(--muted); font-weight: 500; }
.form-label.required::after { content: " *"; color: #c44; }
.form-input {
  border: 1px solid var(--border2); border-radius: 7px;
  padding: 8px 11px; font-size: .86rem;
  font-family: 'Noto Sans TC', sans-serif;
  outline: none; background: #fff; transition: border-color .2s;
}
.form-input:focus { border-color: var(--text); }
.form-textarea { min-height: 80px; resize: vertical; }
.form-radio-group { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: .84rem; }
.form-radio-group label { display: flex; align-items: center; gap: 5px; cursor: pointer; }
.form-divider { border: none; border-top: 1px solid var(--border); margin: 8px 0 16px; }
.form-submit-row { display: flex; gap: 10px; margin-top: 10px; }
.booking-back-btn {
  background: var(--subtle); color: var(--text); border: none;
  border-radius: 8px; padding: 10px 18px; cursor: pointer; font-size: .86rem;
}
.booking-submit-btn {
  flex: 1; background: var(--text); color: #fff; border: none;
  border-radius: 8px; padding: 10px; cursor: pointer;
  font-size: .9rem; font-weight: 500; transition: background .2s;
}
.booking-submit-btn:hover:not(:disabled) { background: #333; }
.booking-submit-btn:disabled { background: var(--border2); cursor: not-allowed; }

/* Success */
.booking-success {
  text-align: center; padding: 60px 20px;
  background: var(--off); border: 1px solid var(--border);
  border-radius: var(--radius);
}
.booking-success-icon {
  font-size: 3rem; color: #2e7d32; margin-bottom: 16px;
}
.booking-success h3 { font-size: 1.3rem; margin-bottom: 8px; }
.booking-success p { font-size: .84rem; color: var(--muted); margin-bottom: 20px; }

@media (max-width: 800px) {
  .booking-layout { padding: 20px 16px 40px; }
  .booking-item-card { flex-direction: column; align-items: flex-start; }
  .form-submit-row { flex-direction: column; }
}
