/**
 * KANRI COMMISSION — Google Sheet 接收端
 *
 * 依照送進來的 type 分流：
 *   type = "order"   → 寫入付款回報分頁
 *   type = "booking" → 寫入委託預約分頁
 *
 * 使用方式：
 * 1. 打開你現有的試算表 → 擴充功能 → Apps Script
 * 2. 把原本的 doPost 全部換成這份程式碼
 * 3. 把下面 SHEET_ORDER 改成你「付款回報」分頁的實際名稱
 * 4. 部署 → 管理部署作業 → 編輯(鉛筆) → 版本選「新版本」 → 部署
 *    ※ 一定要出新版本，否則改動不會生效，網址維持不變
 */

// ── 分頁名稱設定 ────────────────────────────
const SHEET_ORDER   = "付款回報";   // ← 改成你目前那個分頁的名稱
const SHEET_BOOKING = "委託預約";   // 不存在會自動建立

// 若這支 Apps Script 不是綁在試算表內（獨立指令碼），
// 把下面填上試算表 ID，並改用 openById。
const SPREADSHEET_ID = "";

// ── 欄位定義：[JSON 欄位名, 試算表標題] ───────
const ORDER_FIELDS = [
  ["date",       "時間"],
  ["orderNo",    "訂單編號"],
  ["buyerName",  "暱稱"],
  ["buyerEmail", "Email"],
  ["itemDesc",   "項目"],
  ["amt",        "金額"],
  ["buyerNote",  "備註 / 委託說明"],
];

const BOOKING_FIELDS = [
  ["date",         "送出時間"],
  ["orderNo",      "預約編號"],
  ["item",         "委託項目"],
  ["nickname",     "暱稱"],
  ["email",        "Email"],
  ["sns",          "備用 SNS"],
  ["payment",      "付款方式"],
  ["deadline",     "截稿日期希望"],
  ["publish",      "公開日期"],
  ["agreeNonComm", "同意非商用範圍"],
  ["printPlan",    "印製規劃"],
  ["buyout",       "買斷不公開"],
  ["addon",        "加購"],
  ["wip",          "同意張貼未完成稿"],
  ["legalAge",     "完全行為能力人"],
  ["agreeTerms",   "瞭解交易權益"],
  ["format",       "委託格式要求"],
  ["character",    "委託角色設定＋詳細需求"],
  ["note",         "補充"],
];

// ── 主要進入點 ──────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === "booking") {
      appendRow(SHEET_BOOKING, BOOKING_FIELDS, data);
    } else {
      appendRow(SHEET_ORDER, ORDER_FIELDS, data);
    }

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

// ── 寫入一列（必要時自動建分頁與標題列）───────
function appendRow(sheetName, fields, data) {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  let sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);

  // 空白分頁先補上標題列
  if (sh.getLastRow() === 0) {
    sh.appendRow(fields.map(function (f) { return f[1]; }));
    sh.getRange(1, 1, 1, fields.length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }

  const row = fields.map(function (f) {
    const v = data[f[0]];
    return (v === undefined || v === null) ? "" : v;
  });

  sh.appendRow(row);
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
