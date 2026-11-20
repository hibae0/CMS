/**
 * KANRI COMMISSION — server.js
 * 藍新金流 + MongoDB + Google Sheet
 * （已加入：管理員後端驗證、隱私資料保護、伺服器端金額計算、靜態檔案白名單）
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
app.set("trust proxy", 1); // 主機在代理後面時，才能取得正確的訪客 IP
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cors());

// ── 靜態檔案：只開放前端需要的檔案（白名單） ──
// ⚠️ 不要再用 express.static(__dirname)，那樣 server.js 本身也會被任何人下載
// 如果之後網站有新增圖片、字型等檔案，把檔名加進下面這個清單
const PUBLIC_FILES = ["index.html", "app.js", "style.css"];
PUBLIC_FILES.forEach(f => {
  app.get("/" + f, (req, res) => res.sendFile(path.join(__dirname, f)));
});

// ── 管理員驗證 ────────────────────────────────
// 密碼放在主機的環境變數 ADMIN_PASSWORD，不寫在程式碼裡
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) console.warn("⚠️  ADMIN_PASSWORD 未設定，管理員將無法登入");

const adminTokens   = new Map(); // 通行證 -> 到期時間
const loginAttempts = new Map(); // IP -> { count, resetAt }
const queryHits     = new Map(); // IP -> { count, resetAt }

function hit(map, key, windowMs) {
  const now = Date.now();
  let r = map.get(key);
  if (!r || r.resetAt < now) { r = { count: 0, resetAt: now + windowMs }; map.set(key, r); }
  r.count++;
  return r.count;
}
function isBlocked(map, key, max) {
  const r = map.get(key);
  return !!r && r.resetAt > Date.now() && r.count >= max;
}

function getToken(req) {
  return (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
}
function isAdminReq(req) {
  const t = getToken(req);
  if (!t) return false;
  const exp = adminTokens.get(t);
  if (!exp) return false;
  if (exp < Date.now()) { adminTokens.delete(t); return false; }
  return true;
}
function requireAdmin(req, res, next) {
  if (!isAdminReq(req)) return res.status(401).json({ ok: false, error: "未登入" });
  next();
}

app.post("/api/admin-login", (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(500).json({ ok: false, error: "伺服器未設定管理員密碼" });
  const ip = req.ip;
  if (isBlocked(loginAttempts, ip, 5)) {
    return res.status(429).json({ ok: false, error: "嘗試次數過多，請 15 分鐘後再試" });
  }
  const a = Buffer.from(String((req.body || {}).password || ""));
  const b = Buffer.from(ADMIN_PASSWORD);
  const same = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!same) {
    hit(loginAttempts, ip, 15 * 60 * 1000);
    return res.status(401).json({ ok: false });
  }
  loginAttempts.delete(ip);
  const token = crypto.randomBytes(32).toString("hex");
  adminTokens.set(token, Date.now() + 12 * 60 * 60 * 1000); // 12 小時有效
  res.json({ ok: true, token });
});

app.post("/api/admin-logout", (req, res) => {
  adminTokens.delete(getToken(req));
  res.json({ ok: true });
});

// 定時清掉過期的通行證與計數
setInterval(() => {
  const now = Date.now();
  for (const [t, exp] of adminTokens) if (exp < now) adminTokens.delete(t);
  for (const m of [loginAttempts, queryHits]) for (const [k, r] of m) if (r.resetAt < now) m.delete(k);
}, 10 * 60 * 1000).unref();

// ── 網站資料欄位設定 ──────────────────────────
const SITE_KEYS    = ["profile","homeBlocks","noticesHome","noticesComm","noticesPay","atten","commissions","progressList","socials","connectBlocks","connectIntro","todoList","projectList","bookingIntro"];
const PRIVATE_KEYS = ["progressList","todoList","projectList"]; // 只有管理員看得到
const STRING_KEYS  = ["connectIntro","bookingIntro"];

function sanitizeSiteData(body) {
  const out = {};
  if (!body || typeof body !== "object") return out;
  for (const k of SITE_KEYS) {
    if (!(k in body)) continue;
    const v = body[k];
    if (k === "profile") { if (v && typeof v === "object" && !Array.isArray(v)) out[k] = v; }
    else if (STRING_KEYS.includes(k)) { if (typeof v === "string") out[k] = v; }
    else if (Array.isArray(v)) out[k] = v;
  }
  return out;
}

// ── API: 讀取網站資料 ─────────────────────────
// 一般訪客拿不到 progressList（含客人 Email）、todoList、projectList
app.get("/api/site-data", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!mongoReady) return res.status(503).json({ error: "資料庫尚未就緒" });
  const data = await readData();
  const admin = isAdminReq(req);
  const out = {};
  if (data) {
    for (const k of SITE_KEYS) {
      if (data[k] === undefined) continue;
      if (!admin && PRIVATE_KEYS.includes(k)) continue;
      out[k] = data[k];
    }
    // 舊版欄位相容
    if (data.notices)  out.notices  = data.notices;
    if (data.products) out.products = data.products;
  }
  if (admin) out._admin = true;
  res.json(out);
});

// ── API: 儲存網站資料（需要管理員登入） ─────────
app.post("/api/site-data", requireAdmin, async (req, res) => {
  const clean = sanitizeSiteData(req.body);
  if (!Object.keys(clean).length) return res.status(400).json({ ok: false, error: "沒有可儲存的資料" });
  const ok = await writeData(clean);
  if (ok) {
    res.json({ ok: true });
  } else {
    res.status(500).json({ ok: false, error: "儲存失敗" });
  }
});

// ── API: 客人用 Email 查詢進度（只回傳該 Email 的紀錄、且不含 Email/金額） ──
app.post("/api/progress-query", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const ip = req.ip;
  if (hit(queryHits, ip, 60 * 1000) > 20) {
    return res.status(429).json({ error: "查詢太頻繁，請稍後再試" });
  }
  const email = String((req.body || {}).email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "請輸入 Email" });
  if (!mongoReady) return res.status(503).json({ error: "資料庫尚未就緒" });
  const data = await readData();
  const list = Array.isArray(data?.progressList) ? data.progressList : [];
  const matches = list
    .filter(p => (p.email || "").trim().toLowerCase() === email)
    .map(p => ({
      name: p.name || "", service: p.service || "",
      payment: p.payment || "", status: p.status || "",
      eta: p.eta || "", note: p.note || "",
    }));
  res.json({ matches });
});

// ── 藍新金流設定 ──────────────────────────────
// 建議把 HASH_KEY / HASH_IV 設在主機環境變數（有設就優先使用）
// 下面的預設值是舊的，重新產生金鑰並設定環境變數後就會失效，屆時可以刪掉
const MERCHANT_ID = process.env.MERCHANT_ID || "MS1833659005";
const HASH_KEY    = process.env.HASH_KEY    || "JrbUntegBSyPCnUuZUOdMBs8vwmZtJRL";
const HASH_IV     = process.env.HASH_IV     || "PSDQfFKgOuHSulVC";
const GATEWAY     = "https://core.newebpay.com/MPG/mpg_gateway";
if (!process.env.HASH_KEY || !process.env.HASH_IV) {
  console.warn("⚠️  HASH_KEY / HASH_IV 尚未設定在環境變數，目前使用程式碼內的舊值，請盡快更換");
}

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
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL || "https://script.google.com/macros/s/AKfycbyGGX8P3YWnOOlWU7YGndhBKf9VFKlHPPFwYHTevzfXlvYtuBBRg4SMmEkE6d-kd34AKw/exec";

/**
 * 共用送出函式。payload 一定要帶 type：
 *   type:"order"   → Apps Script 寫入付款回報分頁
 *   type:"booking" → Apps Script 寫入委託預約分頁
 */
async function postToGoogleSheet(payload) {
  if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.includes("貼上")) return;
  try {
    console.log(`📤 傳送 ${payload.type} 到 Google Sheet:`, payload.orderNo);
    const res = await fetch(GOOGLE_SHEET_URL, {
      method:"POST",
      headers:{"Content-Type":"text/plain"},
      body: JSON.stringify(payload),
      redirect:"follow",
    });
    const text = await res.text();
    console.log("📥 Google Sheet 回應:", text);
  } catch(e) {
    console.error("❌ Google Sheet 同步失敗:", e.message);
  }
}

// 訂單（付款）用
async function sendToGoogleSheet(data) {
  return postToGoogleSheet({ type: "order", ...data });
}

// ── API：送出預約 ─────────────────────────────
app.post("/api/submit-booking", async (req, res) => {
  const d = req.body || {};
  if (!d.nickname || !d.email || !d.item) {
    return res.status(400).json({ ok:false, error:"缺少必要欄位" });
  }

  try {
    // 每個欄位獨立送出，由 Apps Script 對應到各自的欄
    await postToGoogleSheet({
      type:         "booking",
      orderNo:      "BK" + Date.now(),
      date:         d.date || new Date().toLocaleString("zh-TW", { timeZone:"Asia/Taipei" }),
      item:         d.item         || "",
      nickname:     d.nickname     || "",
      email:        d.email        || "",
      sns:          d.sns          || "",
      payment:      d.payment      || "",
      deadline:     d.deadline     || "",
      publish:      d.publish      || "",
      agreeNonComm: d.agreeNonComm || "",
      printPlan:    d.printPlan    || "",
      buyout:       d.buyout       || "",
      addon:        d.addon        || "",
      wip:          d.wip          || "",
      legalAge:     d.legalAge     || "",
      agreeTerms:   d.agreeTerms   || "",
      format:       d.format       || "",
      character:    d.character    || "",
      note:         d.note         || "",
    });
    res.json({ ok:true });
  } catch(e) {
    console.error("❌ 預約處理失敗:", e);
    res.status(500).json({ ok:false, error:"伺服器處理失敗" });
  }
});

// ── API: 建立付款 ─────────────────────────────
// 金額一律由伺服器依資料庫裡的商品價格計算，不相信前端傳來的價格
app.post("/api/create-payment", async (req, res) => {
  const { cart, buyerName, buyerEmail, buyerNote } = req.body || {};
  if (!Array.isArray(cart) || !cart.length || !buyerName || !buyerEmail) {
    return res.status(400).json({ error: "缺少必要欄位" });
  }
  if (typeof buyerEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim())) {
    return res.status(400).json({ error: "Email 格式不正確" });
  }

  const site = await readData();
  const products = site?.commissions;
  if (!Array.isArray(products) || !products.length) {
    return res.status(503).json({ error: "商品資料暫時無法讀取，請稍後再試" });
  }

  let amt = 0;
  const descParts = [];
  for (const c of cart) {
    const p = products.find(x => x.id === c.id);
    if (!p) return res.status(400).json({ error: "商品不存在或已下架，請重新整理頁面後再試" });
    if (p.status === "closed") return res.status(400).json({ error: `「${p.name}」目前暫停接單` });

    const qty = Number(c.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      return res.status(400).json({ error: "數量不正確" });
    }

    let unit = 0;
    let name = p.name;
    if (c.variantName) {
      const v = (p.variants || []).find(x => x.name === c.variantName);
      if (!v || !(Number(v.price) > 0)) {
        return res.status(400).json({ error: `「${p.name}」的方案已變更，請重新加入購物車` });
      }
      unit = Number(v.price);
      name = `${p.name}(${v.name})`;
    } else if (p.priceType === "negotiate") {
      return res.status(400).json({ error: `「${p.name}」為洽談商品，請先來信確認` });
    } else if (p.priceType === "custom") {
      unit = Math.floor(Number(c.customPrice));
      if (!(unit >= 1) || unit > 1000000) {
        return res.status(400).json({ error: `請填寫「${p.name}」的委託金額` });
      }
    } else {
      unit = Number(p.price);
      if (!(unit > 0)) return res.status(400).json({ error: `「${p.name}」尚未設定金額` });
    }
    amt += unit * qty;
    descParts.push(`${name}x${qty}`);
  }
  if (amt < 1) return res.status(400).json({ error: "訂單金額不得為 0" });

  const itemDesc = descParts.join(", ");

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
    `Email=${encodeURIComponent(buyerEmail.trim())}`,
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

// ─── 全域保護：單一錯誤不要讓整個服務掛掉 ───────
process.on("unhandledRejection", err => console.error("⚠️ unhandledRejection:", err));
process.on("uncaughtException",  err => console.error("⚠️ uncaughtException:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🎨 KANRI COMMISSION Server`);
  console.log(`   http://0.0.0.0:${PORT}\n`);
});
