/* ══════════════════════════════════════════
   KANRI COMMISSION v2 · app.js
   ══════════════════════════════════════════ */

const NEWEBPAY_CONFIG = {
  MerchantID: "MS1833659005",
  gateway: "https://core.newebpay.com/MPG/mpg_gateway",
};

// ── DEFAULT DATA ──────────────────────────
const DEFAULT_PROFILE = {
  avatar: "https://i.imgur.com/lUbBaAW.png",
  name: "KANRI",
  subtitle: "插畫委託 / Illustration Commission",
};

const DEFAULT_HOME_BLOCKS = [
  {
    id:"b1", icon:"📄", title:"非商委託使用規範",
    content:"視同同意繪師收錄作品集，繪者保有作品權利\n確認委託視同委託者允許相關規範細節\n委託人公開顯示需標注繪師\n非委託作品不得作為個人收藏使用，禁止黃牛行為\n可自行授權衍生使用，禁止二次加工、塗改頭像\n滴中有紅線，但持不要將裸/成品擅自傳播散佈\n驚喜包有一定程度OOC難度可能，介意請謹慎進一步委託"
  },
  {
    id:"b2", icon:"🚫", title:"婉拒項目與狀況",
    content:"部分作品與不整客的內容繪師無承接\n官方禁止委託二創作品：楓丹人物、爭議性作品\n繪師禁止委託投入黑心繪師（單人或成員fan藝）：ATEEZ 全員、SKZ Felix\n因各種情勢考量後拒絕接單（視信況及風頭調整方向）：稍有發現後主動聯繫次人因個人因素拒絕收取訂單"
  },
  {
    id:"b3", icon:"💰", title:"付款期限與相關",
    content:"繳費金流（可匯款、超商代碼）、PAYPAL（含6%手續費）\n一般委託於基礎確認收到的當天起超過30日內完成付款\n驚喜包含訂款限期公告內14天內完成付款\n但還是會給付款方便的機會進行一至兩通知\n若總預備超過NT.3,000，可先付金（50%）預先，於完稿後繳清費用（50%）\n若無法按期間內付款，注意本動告知可付款期限"
  },
  {
    id:"b4", icon:"⏱", title:"工期與修改相關",
    content:"工期為確認後一至兩個月，請提前預排\n過程若需生活說明與稿況更新，若有因突然狀況延誤\n接延期，會盡量第一時間因此不能遇這樣以大方案！！\n##修改期限規定\n設定遇到問題，就直接拒絕\n原則上不預先取稿，修改前一階段以確認沒問題的內容\n通常手邊不只一份工作在進行\n任何修改調整圖時，可能會一至三天左右\n須不要於繪製過程中更換設定、整型整貌"
  },
  {
    id:"b5", icon:"🤖", title:"NFT&AI與商用素材",
    content:"禁止將委託成品投入NFT與AI訓練學習\n繪製使用可用平面圖像3D素材等（皆有付費購買授權）"
  },
  {
    id:"b6", icon:"📋", title:"委託問與進度事宜",
    content:"如有任何問題，委託更新取消或者是否有不符預期，我\n方先接受部份，都歡迎回到第一時間與我進行溝通！！\n但是很抱歉於第一時間因此不遇這樣以大方案！！\n##繪師代撤取消委託收取費用\n已完成委託討論（含確認至同意章程）總稿 10%\n已完成底稿：底色插畫 總稿25～50%\n已完成底色但尚未完稿 總稿60～85%\n完稿後突然取消委託或更變求退，一律不接受退款\n接稿需要包含簽名或收費，比照相同程序作業律師\n加稿若因個人因素被要求者：這項一天退補值簡介5%"
  },
];

const DEFAULT_NOTICES_HOME = [
  { id:"n1", date:"啟用藍新金流", bullets:["付款網站","已迴測試適用電腦打開"] },
  { id:"n2", date:"2026/10月與2027", bullets:["插畫委託調整成預先排單","過往委託人優先預排","每個月排 1 單","買斷委託人保留每月 1 單"] },
  { id:"n3", date:"2026/10月與2027", bullets:["模板/驚喜包委託調整","模板不定期開放（預計減少開）","過往封存版本可詢問","驚喜包可洽談","組合頁驚喜包不定期掉落","可能視排程當月份再加開"] },
  { id:"n4", date:"秋季模板製作中", bullets:[] },
];
const DEFAULT_NOTICES_COMM = [
  { id:"nc1", date:"2026/10月與2027", bullets:["插畫委託調整成預先排單","過往委託人優先預排","每個月排 1 單"] },
];
const DEFAULT_NOTICES_PAY = [
  { id:"np1", date:"付款注意事項", bullets:["付款後請保留收據","如有問題請來信洽詢"] },
];

const DEFAULT_ATTEN = [
  { id:"a1", date:"角色買斷規則", bullets:["買斷時間最短一年","繪者期間內不接該角色的任何委託","單張報價*2","一年內最少委託六件","驚喜包到插圖均可不限制（不包含模板品項），或可告知想要什麼內容這邊報價","續約延期原則上優先給現有買斷委託人","（暫無開放固定委名額）"] },
  { id:"a2", date:"咒術迴戰 五條悟 角色買斷 2025.9.1-2026.9.1", bullets:[] },
];

const DEFAULT_COMMISSIONS = [
  { id:"c1", name:"插畫委託", tags:["插畫","委託"], summary:"全彩單人插畫含背景", detail:"全彩單人插畫\n含背景\n可指定角色設定\n交稿約 3～4 週", img:"https://i.imgur.com/KBfbGxm.jpg", priceType:"fixed", price:4500, status:"available" },
  { id:"c2", name:"滿版組合 · 驚喜包", tags:["滿版","驚喜包"], summary:"作者自由發揮含滿版背景", detail:"由作者自由發揮主題與構圖\n含滿版背景\n組合驚喜包", img:"", priceType:"fixed", price:6000, status:"waitlist" },
  { id:"c3", name:"插畫 · 驚喜包", tags:["插畫","驚喜包"], summary:"作者自訂主題驚喜包", detail:"作者自訂主題驚喜包\n半身至全身插畫", img:"", priceType:"fixed", price:3200, status:"available" },
  { id:"c4", name:"商業委託", tags:["商業","委託"], summary:"商業用途插畫含授權書", detail:"商業用途插畫\n含授權書\n詳情請來信洽談", img:"", priceType:"negotiate", price:0, status:"closed" },
];

const DEFAULT_PROGRESS = [];

// ── STATE ─────────────────────────────────
let isAdmin = false;
const ADMIN_PASSWORD = "toshine10171108";

let profile     = { ...DEFAULT_PROFILE };
let homeBlocks  = DEFAULT_HOME_BLOCKS;
let noticesHome = DEFAULT_NOTICES_HOME;
let noticesComm = DEFAULT_NOTICES_COMM;
let noticesPay  = DEFAULT_NOTICES_PAY;
let atten       = DEFAULT_ATTEN;
let commissions = DEFAULT_COMMISSIONS;
let progressList = DEFAULT_PROGRESS;
let cart        = JSON.parse(localStorage.getItem("kc_cart")) || [];

let editingHomeBlockId   = null;
let editingCommissionId  = null;
let editingProgressId    = null;
let editingNoticeType    = "notice";

// ── INIT ──────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res  = await fetch("/api/site-data");
    const data = await res.json();
    if (data.profile)      profile      = data.profile;
    if (data.homeBlocks)   homeBlocks   = data.homeBlocks;
    if (data.noticesHome) noticesHome = data.noticesHome;
    if (data.noticesComm) noticesComm = data.noticesComm;
    if (data.noticesPay)  noticesPay  = data.noticesPay;
    if (data.atten)        atten        = data.atten;
    if (data.commissions)  commissions  = data.commissions;
    if (data.progressList) progressList = data.progressList;
    if (!data.profile && !data.homeBlocks) {
      // first load: rescue from localStorage
      const ls = k => { try { return JSON.parse(localStorage.getItem(k)) } catch(e){ return null } };
      if (ls("kc_profile"))  profile  = ls("kc_profile");
      if (ls("kc_products")) commissions = ls("kc_products");
      // migrate old single notices if present
      if (ls("kc_noticesHome")) noticesHome = ls("kc_noticesHome");
      if (ls("kc_noticesComm")) noticesComm = ls("kc_noticesComm");
      if (ls("kc_noticesPay"))  noticesPay  = ls("kc_noticesPay");
      if (ls("kc_notices") && !ls("kc_noticesHome")) noticesHome = ls("kc_notices");
      await saveToServer();
    }
  } catch(e) { console.warn("Server fetch failed, using defaults"); }
  renderAll();
  updateCartCount();
});

function renderAll() {
  renderProfile();
  renderHomeBlocks();
  renderNotices();
  renderAtten();
  renderCommissions();
  renderProgressAdmin();
  renderProducts();
  syncPaymentPage();
}

async function saveToServer() {
  try {
    const res = await fetch("/api/site-data", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ profile, homeBlocks, noticesHome, noticesComm, noticesPay, atten, commissions, progressList }),
    });
    const data = await res.json();
    if (!data.ok) console.warn("Server save returned not-ok");
  } catch(e) { console.error("Save failed:", e.message); }
}

// 每60秒從伺服器重新讀取，確保資料同步
setInterval(async () => {
  try {
    const res  = await fetch("/api/site-data");
    const data = await res.json();
    if (data.profile)      profile      = data.profile;
    if (data.homeBlocks)   homeBlocks   = data.homeBlocks;
    if (data.noticesHome)  noticesHome  = data.noticesHome;
    if (data.noticesComm)  noticesComm  = data.noticesComm;
    if (data.noticesPay)   noticesPay   = data.noticesPay;
    if (data.atten)        atten        = data.atten;
    if (data.commissions)  commissions  = data.commissions;
    if (data.progressList) progressList = data.progressList;
    renderAll();
  } catch(e) { /* silent */ }
}, 60000);

function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ── PAGE NAVIGATION ───────────────────────
function showPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.page === name);
  });
  window.scrollTo(0,0);
}

// ── PROFILE ───────────────────────────────
function renderProfile() {
  ["","2"].forEach(s => {
    const img = document.getElementById("avatarImg"+s);
    const nm  = document.getElementById("profileName"+s);
    const sub = document.getElementById("profileSubtitle"+s);
    if (img) img.src = profile.avatar || DEFAULT_PROFILE.avatar;
    if (nm)  nm.textContent  = profile.name;
    if (sub) sub.textContent = profile.subtitle;
  });
}
function openProfileModal() {
  document.getElementById("editAvatar").value   = profile.avatar;
  document.getElementById("editName").value     = profile.name;
  document.getElementById("editSubtitle").value = profile.subtitle;
  openModal("profileModal");
}
function saveProfile() {
  profile.avatar   = document.getElementById("editAvatar").value.trim();
  profile.name     = document.getElementById("editName").value.trim();
  profile.subtitle = document.getElementById("editSubtitle").value.trim();
  renderProfile(); saveToServer(); closeModal("profileModal"); toast("已儲存");
}

// ── HOME BLOCKS ───────────────────────────
function renderHomeBlocks() {
  const grid = document.getElementById("homeBlocks");
  grid.innerHTML = homeBlocks.map(b => {
    const lines = (b.content || "").split("\n");
    const html = lines.map(l => {
      if (l.startsWith("##")) return `<div class="sub-heading">${l.slice(2).trim()}</div>`;
      if (l.trim()) return `<li>${l.trim()}</li>`;
      return "";
    }).join("");
    const adminBtns = isAdmin ? `<div class="home-block-admin admin-only">
      <button class="edit-btn" onclick="openEditHomeBlock('${b.id}')">✏</button>
      <button class="del-btn" onclick="deleteHomeBlock('${b.id}')">✕</button>
    </div>` : "";
    return `<div class="home-block">
      ${adminBtns}
      <div class="home-block-title"><span class="home-block-icon">${b.icon||"📌"}</span>${b.title}</div>
      <div class="home-block-content"><ul>${html}</ul></div>
    </div>`;
  }).join("");
}
function openAddHomeBlock() {
  editingHomeBlockId = null;
  document.getElementById("homeBlockModalTitle").textContent = "新增區塊";
  document.getElementById("editBlockIcon").value = "";
  document.getElementById("editBlockTitle").value = "";
  document.getElementById("editBlockContent").value = "";
  openModal("homeBlockModal");
}
function openEditHomeBlock(id) {
  const b = homeBlocks.find(x => x.id===id); if (!b) return;
  editingHomeBlockId = id;
  document.getElementById("homeBlockModalTitle").textContent = "編輯區塊";
  document.getElementById("editBlockIcon").value    = b.icon||"";
  document.getElementById("editBlockTitle").value   = b.title;
  document.getElementById("editBlockContent").value = b.content;
  openModal("homeBlockModal");
}
function saveHomeBlock() {
  const icon    = document.getElementById("editBlockIcon").value.trim();
  const title   = document.getElementById("editBlockTitle").value.trim();
  const content = document.getElementById("editBlockContent").value;
  if (!title) { toast("請填寫標題"); return; }
  if (editingHomeBlockId) {
    const i = homeBlocks.findIndex(x => x.id===editingHomeBlockId);
    if (i !== -1) homeBlocks[i] = { ...homeBlocks[i], icon, title, content };
  } else {
    homeBlocks.push({ id:"b"+Date.now(), icon, title, content });
  }
  renderHomeBlocks(); saveToServer(); closeModal("homeBlockModal"); toast("已儲存");
}
function deleteHomeBlock(id) {
  if (!confirm("確定刪除？")) return;
  homeBlocks = homeBlocks.filter(x => x.id !== id);
  renderHomeBlocks(); saveToServer(); toast("已刪除");
}

// ── NOTICES / ATTEN ───────────────────────
function renderNoticeList(data, elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = data.map(n => `
    <div class="notice-item">
      ${n.date ? `<div class="notice-date">${n.date}</div>` : ""}
      ${n.bullets && n.bullets.length ? `<ul>${n.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>` : ""}
    </div>`).join("");
}
function renderNotices() {
  renderNoticeList(noticesHome, "homeNoticeList");
  renderNoticeList(noticesComm, "commNoticeList");
  renderNoticeList(noticesPay,  "payNoticeList");
}
function renderAtten() { renderNoticeList(atten, "attenList"); }

function openNoticeModal(type) {
  editingNoticeType = type || "home";
  const titleMap = { home:"編輯 NOTICE（首頁）", comm:"編輯 NOTICE（委託價目）", pay:"編輯 NOTICE（付款頁）", atten:"編輯 ATTEN" };
  document.getElementById("noticeEditTitle").textContent = titleMap[type]||"編輯 NOTICE";
  const data = getEditingNotice();
  const container = document.getElementById("noticeEditList");
  container.innerHTML = data.map((n,i) => `
    <div class="notice-edit-item">
      <div class="notice-edit-row">
        <input type="text" placeholder="日期/標題" value="${n.date||""}" oninput="updateNoticeDraft(${i},'date',this.value)"/>
        <button onclick="removeNoticeItem(${i})">✕</button>
      </div>
      <div id="nbullets_${i}">
        ${(n.bullets||[]).map((b,j)=>`
          <div class="notice-edit-row" style="margin-top:4px">
            <input type="text" value="${b}" oninput="updateNoticeBullet(${i},${j},this.value)"/>
            <button onclick="removeBullet(${i},${j})">✕</button>
          </div>`).join("")}
      </div>
      <button class="add-btn" onclick="addBullet(${i})" style="margin-top:5px">＋ 新增項目</button>
    </div>`).join("");
  openModal("noticeEditModal");
}
function getEditingNotice() {
  if (editingNoticeType==="atten") return atten;
  if (editingNoticeType==="comm")  return noticesComm;
  if (editingNoticeType==="pay")   return noticesPay;
  return noticesHome;
}
function updateNoticeDraft(i,f,v) { getEditingNotice()[i][f]=v; }
function updateNoticeBullet(i,j,v) { getEditingNotice()[i].bullets[j]=v; }
function removeNoticeItem(i) { const d=getEditingNotice(); d.splice(i,1); openNoticeModal(editingNoticeType); }
function removeBullet(i,j) { const d=getEditingNotice(); d[i].bullets.splice(j,1); openNoticeModal(editingNoticeType); }
function addBullet(i) { const d=getEditingNotice(); d[i].bullets.push(""); openNoticeModal(editingNoticeType); }
function addNoticeItem() { getEditingNotice().push({id:"ni"+Date.now(), date:"新公告", bullets:[""]}); openNoticeModal(editingNoticeType); }
function saveNotices() {
  if (editingNoticeType==="atten") renderAtten();
  else renderNotices();
  saveToServer(); closeModal("noticeEditModal"); toast("已儲存");
}

// ── COMMISSIONS ───────────────────────────
function renderCommissions() {
  const list = document.getElementById("commissionList");
  list.innerHTML = commissions.map(c => {
    const imgHtml = c.img
      ? `<img class="comm-item-img" src="${c.img}" alt="${c.name}"/>`
      : `<div class="comm-item-img-placeholder">🎨</div>`;
    const tags = (c.tags||[]).map(t=>`<span class="comm-tag">${t}</span>`).join("");
    const priceLabel = c.priceType==="negotiate"?"洽談":c.priceType==="custom"?"顧客自填":c.price>0?`TWD ${c.price.toLocaleString()}`:"洽談";
    const statusMap = {available:["status-available","開放中"],waitlist:["status-waitlist","預約候補"],closed:["status-closed","暫停接單"]};
    const [sc,sl] = statusMap[c.status]||statusMap.available;
    const lines = (c.detail||"").split("\n").filter(Boolean);
    const detailHtml = `<ul class="comm-item-detail">${lines.map(l=>`<li>${l}</li>`).join("")}</ul>`;
    const adminBtns = isAdmin ? `<div class="comm-admin-btns admin-only">
      <button class="edit-btn" onclick="event.stopPropagation();openEditCommission('${c.id}')">✏</button>
      <button class="del-btn" onclick="event.stopPropagation();deleteCommission('${c.id}')">✕</button>
    </div>` : "";
    const addBtn = c.status!=="closed" ? `<button class="add-to-cart-sm" onclick="addToCart('${c.id}')">加入購物車</button>` : "";
    return `<div class="comm-item">
      <div class="comm-item-header" onclick="toggleCommItem('${c.id}')">
        ${imgHtml}
        <div class="comm-item-info">
          <div class="comm-item-tags">${tags}</div>
          <div class="comm-item-name">${c.name}</div>
          <div class="comm-item-summary">${c.summary||""}</div>
        </div>
        <div class="comm-item-right">
          ${adminBtns}
          <span class="comm-item-price">${priceLabel}</span>
          <span class="comm-status ${sc}">${sl}</span>
          <span class="comm-expand-arrow" id="arrow_${c.id}">▼</span>
        </div>
      </div>
      <div class="comm-item-body" id="body_${c.id}">
        ${detailHtml}
        <div class="comm-item-detail-footer">${addBtn}</div>
      </div>
    </div>`;
  }).join("");
}
function toggleCommItem(id) {
  const body  = document.getElementById("body_"+id);
  const arrow = document.getElementById("arrow_"+id);
  if (!body) return;
  body.classList.toggle("open");
  if (arrow) arrow.classList.toggle("open");
}
function openAddCommission() {
  editingCommissionId = null;
  document.getElementById("commissionModalTitle").textContent = "新增委託項目";
  ["editCommName","editCommTags","editCommSummary","editCommDetail","editCommImg","editCommPrice"].forEach(id => document.getElementById(id).value="");
  document.getElementById("editCommStatus").value = "available";
  document.getElementById("cpFixed").checked = true;
  toggleCommPrice("fixed");
  openModal("commissionModal");
}
function openEditCommission(id) {
  const c = commissions.find(x=>x.id===id); if (!c) return;
  editingCommissionId = id;
  document.getElementById("commissionModalTitle").textContent = "編輯委託項目";
  document.getElementById("editCommName").value    = c.name;
  document.getElementById("editCommTags").value    = (c.tags||[]).join(", ");
  document.getElementById("editCommSummary").value = c.summary||"";
  document.getElementById("editCommDetail").value  = c.detail||"";
  document.getElementById("editCommImg").value     = c.img||"";
  document.getElementById("editCommStatus").value  = c.status;
  const pt = c.priceType||"fixed";
  document.getElementById("cpFixed").checked      = pt==="fixed";
  document.getElementById("cpNegotiate").checked  = pt==="negotiate";
  document.getElementById("cpCustom").checked     = pt==="custom";
  document.getElementById("editCommPrice").value  = pt==="fixed"?c.price:"";
  toggleCommPrice(pt);
  openModal("commissionModal");
}
function toggleCommPrice(v) {
  const inp = document.getElementById("editCommPrice");
  inp.disabled = v!=="fixed";
  inp.style.opacity = v!=="fixed"?".4":"1";
  if (v!=="fixed") inp.value="";
}
function saveCommission() {
  const name    = document.getElementById("editCommName").value.trim();
  const tags    = document.getElementById("editCommTags").value.split(",").map(t=>t.trim()).filter(Boolean);
  const summary = document.getElementById("editCommSummary").value.trim();
  const detail  = document.getElementById("editCommDetail").value;
  const img     = document.getElementById("editCommImg").value.trim();
  const status  = document.getElementById("editCommStatus").value;
  const pt      = document.querySelector('input[name="commPriceType"]:checked')?.value||"fixed";
  const price   = pt==="fixed"?(parseInt(document.getElementById("editCommPrice").value)||0):0;
  if (!name) { toast("請填寫項目名稱"); return; }
  if (editingCommissionId) {
    const i = commissions.findIndex(x=>x.id===editingCommissionId);
    if (i!==-1) commissions[i]={ ...commissions[i], name, tags, summary, detail, img, priceType:pt, price, status };
  } else {
    commissions.push({ id:"c"+Date.now(), name, tags, summary, detail, img, priceType:pt, price, status });
  }
  renderCommissions(); renderProducts(); saveToServer(); closeModal("commissionModal"); toast("已儲存");
}
function deleteCommission(id) {
  if (!confirm("確定刪除？")) return;
  commissions = commissions.filter(x=>x.id!==id);
  renderCommissions(); renderProducts(); saveToServer(); toast("已刪除");
}

// ── PROGRESS ──────────────────────────────
function renderProgressAdmin() {
  const el = document.getElementById("progressAdminTable"); if (!el) return;
  if (!progressList.length) { el.innerHTML = `<p style="font-size:.8rem;color:var(--muted)">尚無進度資料</p>`; return; }
  const payBadge = v => ({paid:"prog-paid",deposit:"prog-deposit",outstanding:"prog-outstanding"}[v]||"prog-outstanding");
  const statBadge = v => ({not_started:"prog-not-started",in_progress:"prog-in-progress",completed:"prog-completed",paused:"prog-paused"}[v]||"prog-not-started");
  const payLabel = v => ({paid:"已付款",deposit:"已付訂金",outstanding:"待付款"}[v]||v);
  const statLabel = v => ({not_started:"未開始",in_progress:"進行中",completed:"已完成",paused:"暫停/取消"}[v]||v);
  el.innerHTML = `<div style="overflow-x:auto"><table class="prog-table">
    <thead><tr>
      <th>委託人</th><th>Email</th><th>項目</th><th>付款</th><th>進度</th><th>ETA</th><th>備註</th><th></th>
    </tr></thead>
    <tbody>${progressList.map(p=>`<tr>
      <td>${p.name}</td>
      <td style="font-size:.75rem;color:var(--muted)">${p.email}</td>
      <td>${p.service||""}</td>
      <td><span class="prog-badge ${payBadge(p.payment)}">${payLabel(p.payment)}</span></td>
      <td><span class="prog-badge ${statBadge(p.status)}">${statLabel(p.status)}</span></td>
      <td style="font-size:.78rem">${p.eta||""}</td>
      <td style="font-size:.75rem;color:var(--muted)">${p.note||""}</td>
      <td><div class="prog-row-actions">
        <button class="edit-btn" onclick="openEditProgress('${p.id}')">✏</button>
        <button class="del-btn" onclick="deleteProgress('${p.id}')">✕</button>
      </div></td>
    </tr>`).join("")}
    </tbody>
  </table></div>`;
}

function queryProgress() {
  const email = document.getElementById("progressQueryEmail").value.trim().toLowerCase();
  const result = document.getElementById("progressQueryResult");
  if (!email) { result.innerHTML=`<p class="progress-empty">請輸入 Email</p>`; return; }
  // fetch latest from server before querying
  fetch("/api/site-data").then(r=>r.json()).then(data=>{
    if (data.progressList) progressList = data.progressList;
    _doQueryProgress(email, result);
  }).catch(()=>_doQueryProgress(email, result));
}
function _doQueryProgress(email, result) {
  const matches = progressList.filter(p => (p.email||"").trim().toLowerCase()===email);
  if (!matches.length) { result.innerHTML=`<p class="progress-empty">找不到符合的委託記錄，請確認 Email 是否正確</p>`; return; }
  const payLabel = v => ({paid:"已付款",deposit:"已付訂金",outstanding:"待付款"}[v]||v);
  const statLabel = v => ({not_started:"未開始",in_progress:"進行中",completed:"已完成",paused:"暫停/取消"}[v]||v);
  const payBadge = v => ({paid:"prog-paid",deposit:"prog-deposit",outstanding:"prog-outstanding"}[v]||"prog-outstanding");
  const statBadge = v => ({not_started:"prog-not-started",in_progress:"prog-in-progress",completed:"prog-completed",paused:"prog-paused"}[v]||"prog-not-started");
  result.innerHTML = matches.map(p=>`<div class="progress-result-card">
    <div class="progress-result-name">${p.name} · ${p.service||""}</div>
    <div class="progress-result-row">
      <span class="progress-result-label">付款狀態</span>
      <span class="prog-badge ${payBadge(p.payment)}">${payLabel(p.payment)}</span>
      <span class="progress-result-label" style="margin-left:8px">進度</span>
      <span class="prog-badge ${statBadge(p.status)}">${statLabel(p.status)}</span>
      ${p.eta?`<span class="progress-result-label" style="margin-left:8px">ETA</span><span style="font-size:.78rem">${p.eta}</span>`:""}
    </div>
    ${p.note?`<div style="font-size:.76rem;color:var(--muted);margin-top:6px">${p.note}</div>`:""}
  </div>`).join("");
}

function openAddProgress() {
  editingProgressId = null;
  document.getElementById("progressModalTitle").textContent = "新增委託進度";
  ["editProgName","editProgEmail","editProgService","editProgETA","editProgNote"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("editProgPayment").value = "paid";
  document.getElementById("editProgStatus").value  = "not_started";
  openModal("progressModal");
}
function openEditProgress(id) {
  const p = progressList.find(x=>x.id===id); if (!p) return;
  editingProgressId = id;
  document.getElementById("progressModalTitle").textContent = "編輯委託進度";
  document.getElementById("editProgName").value    = p.name;
  document.getElementById("editProgEmail").value   = p.email;
  document.getElementById("editProgService").value = p.service||"";
  document.getElementById("editProgPayment").value = p.payment;
  document.getElementById("editProgStatus").value  = p.status;
  document.getElementById("editProgETA").value     = p.eta||"";
  document.getElementById("editProgNote").value    = p.note||"";
  openModal("progressModal");
}
function saveProgress() {
  const name    = document.getElementById("editProgName").value.trim();
  const email   = document.getElementById("editProgEmail").value.trim();
  const service = document.getElementById("editProgService").value.trim();
  const payment = document.getElementById("editProgPayment").value;
  const status  = document.getElementById("editProgStatus").value;
  const eta     = document.getElementById("editProgETA").value.trim();
  const note    = document.getElementById("editProgNote").value.trim();
  if (!name||!email) { toast("請填寫姓名與 Email"); return; }
  if (editingProgressId) {
    const i = progressList.findIndex(x=>x.id===editingProgressId);
    if (i!==-1) progressList[i]={ ...progressList[i], name, email, service, payment, status, eta, note };
  } else {
    progressList.push({ id:"p"+Date.now(), name, email, service, payment, status, eta, note });
  }
  renderProgressAdmin(); saveToServer(); closeModal("progressModal"); toast("已儲存");
}
function deleteProgress(id) {
  if (!confirm("確定刪除？")) return;
  progressList = progressList.filter(x=>x.id!==id);
  renderProgressAdmin(); saveToServer(); toast("已刪除");
}

// ── PAYMENT PAGE (product grid mirrors commissions) ────
function renderProducts() {
  const grid = document.getElementById("productGrid"); if (!grid) return;
  grid.innerHTML = commissions.map(c => {
    const imgHtml = c.img
      ? `<img class="product-img" src="${c.img}" alt="${c.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="product-img-placeholder" style="display:none">🎨</div>`
      : `<div class="product-img-placeholder">🎨</div>`;
    const tags = (c.tags||[]).map(t=>`<span class="product-tag">${t}</span>`).join("");
    const priceLabel = c.priceType==="negotiate"?"洽談":c.priceType==="custom"?"顧客自填":c.price>0?`TWD ${c.price.toLocaleString()}`:"洽談";
    const statusMap = {available:["status-available","開放中"],waitlist:["status-waitlist","預約候補"],closed:["status-closed","暫停接單"]};
    const [sc,sl] = statusMap[c.status]||statusMap.available;
    const addBtn = c.status!=="closed"
      ? `<button class="add-to-cart-btn" onclick="event.stopPropagation();addToCart('${c.id}')" title="加入購物車">＋</button>`:"";
    return `<div class="product-card ${c.status==="closed"?"closed":""}">
      ${imgHtml}
      <div class="product-body">
        <div class="product-tags">${tags}</div>
        <div class="product-name">${c.name}</div>
        <div class="product-desc">${c.summary||""}</div>
      </div>
      ${addBtn}
      <div class="product-footer">
        <span class="product-price">${priceLabel}</span>
        <span class="product-status ${sc}">${sl}</span>
      </div>
    </div>`;
  }).join("");
}
function syncPaymentPage() { renderProfile(); renderNotices(); renderProducts(); }

// ── CART ──────────────────────────────────
function addToCart(id) {
  const c = commissions.find(x=>x.id===id);
  if (!c || c.status==="closed") return;
  if (c.stock!=null && c.stock!==undefined) {
    const inCart = cart.find(x=>x.id===id)?.qty||0;
    if (inCart>=c.stock) { toast(`「${c.name}」庫存已達上限`); return; }
  }
  const existing = cart.find(x=>x.id===id);
  if (existing) existing.qty++;
  else cart.push({ id, qty:1, customPrice:0 });
  save("kc_cart", cart);
  updateCartCount();
  toast(`「${c.name}」已加入購物車`);
}
function updateCartCount() {
  const t = cart.reduce((s,c)=>s+c.qty,0);
  document.getElementById("cartCount").textContent = t;
}
function openCart() { renderCartModal(); openModal("cartModal"); }

function saveCustomPrice(id, val) {
  const c = cart.find(x=>x.id===id);
  if (c) { c.customPrice = parseInt(val)||0; save("kc_cart",cart); }
}

function renderCartModal() {
  const container  = document.getElementById("cartItems");
  const customArea = document.getElementById("customPriceInputs");
  if (!cart.length) {
    container.innerHTML  = `<div class="cart-empty">購物車是空的</div>`;
    customArea.innerHTML = "";
    document.getElementById("cartTotal").textContent = "";
    return;
  }
  container.innerHTML = cart.map(ci => {
    const p = commissions.find(x=>x.id===ci.id); if (!p) return "";
    const pt = p.priceType||"fixed";
    const sub = pt==="fixed"?p.price*ci.qty:null;
    const disp = pt==="negotiate"?"洽談":pt==="custom"?"自填金額":sub>0?"TWD "+sub.toLocaleString():"洽談";
    return `<div class="cart-row">
      <span class="cart-row-name">${p.name}</span>
      <div class="cart-row-qty">
        <button onclick="changeQty('${ci.id}',-1)">－</button>
        <span>${ci.qty}</span>
        <button onclick="changeQty('${ci.id}',1)">＋</button>
      </div>
      <span class="cart-row-price">${disp}</span>
    </div>`;
  }).join("");
  const customItems = cart.filter(ci=>{ const p=commissions.find(x=>x.id===ci.id); return p&&p.priceType==="custom"; });
  if (customItems.length) {
    customArea.innerHTML = `<div style="margin-top:14px;padding:12px;background:var(--off);border-radius:9px;border:1px solid var(--border)">
      <p style="font-size:.78rem;color:var(--muted);margin-bottom:10px">請填寫以下商品的委託金額：</p>
      ${customItems.map(ci=>{ const p=commissions.find(x=>x.id===ci.id); const saved=ci.customPrice>0?ci.customPrice:"";
        return `<div style="margin-bottom:8px">
          <label style="font-size:.78rem;color:var(--muted);display:block;margin-bottom:3px">${p.name} × ${ci.qty}</label>
          <input type="number" placeholder="請輸入金額 (TWD)" value="${saved}"
            style="width:100%;border:1px solid var(--border2);border-radius:7px;padding:7px 10px;font-size:.86rem;outline:none"
            oninput="saveCustomPrice('${ci.id}',this.value)"/>
        </div>`;}).join("")}
    </div>`;
  } else { customArea.innerHTML=""; }
  const fixed = cart.reduce((s,ci)=>{ const p=commissions.find(x=>x.id===ci.id); return s+(p&&(p.priceType==="fixed"||!p.priceType)&&p.price>0?p.price*ci.qty:0); },0);
  document.getElementById("cartTotal").textContent = fixed>0?`小計：TWD ${fixed.toLocaleString()}`:"";
}

function changeQty(id, delta) {
  const ci = cart.find(x=>x.id===id); if (!ci) return;
  ci.qty += delta;
  if (ci.qty<=0) cart = cart.filter(x=>x.id!==id);
  save("kc_cart",cart); updateCartCount(); renderCartModal();
}

// ── CHECKOUT ──────────────────────────────
function checkout() {
  const name  = document.getElementById("buyerName").value.trim();
  const email = document.getElementById("buyerEmail").value.trim();
  const note  = document.getElementById("buyerNote").value.trim();
  if (!name)  { toast("請填寫姓名"); return; }
  if (!email) { toast("請填寫 Email"); return; }
  if (!cart.length) { toast("購物車是空的"); return; }
  if (cart.some(ci=>{ const p=commissions.find(x=>x.id===ci.id); return p&&p.priceType==="negotiate"; })) {
    toast("含有「洽談」商品，請先來信確認"); return;
  }
  let customTotal = 0;
  for (const ci of cart) {
    const p = commissions.find(x=>x.id===ci.id);
    if (!p||p.priceType!=="custom") continue;
    const val = ci.customPrice||0;
    if (val<1) { toast(`請填寫「${p.name}」的委託金額`); return; }
    customTotal += val*ci.qty;
  }
  const fixedTotal = cart.reduce((s,ci)=>{ const p=commissions.find(x=>x.id===ci.id); return s+(p&&(p.priceType==="fixed"||!p.priceType)&&p.price>0?p.price*ci.qty:0); },0);
  const amt = fixedTotal+customTotal;
  if (amt<1) { toast("訂單金額不得為 0"); return; }
  fetch("/api/create-payment", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ cart, buyerName:name, buyerEmail:email, buyerNote:note, products:commissions })
  }).then(r=>r.json()).then(data=>{
    if (data.error) { toast(data.error); return; }
    document.getElementById("fMerchantID").value = data.MerchantID;
    document.getElementById("fTradeInfo").value  = data.TradeInfo;
    document.getElementById("fTradeSha").value   = data.TradeSha;
    document.getElementById("paymentForm").action = data.gateway;
    document.getElementById("paymentForm").submit();
    cart=[]; save("kc_cart",cart); updateCartCount(); closeModal("cartModal");
  }).catch(()=>toast("付款初始化失敗，請稍後再試"));
}

// ── ADMIN ─────────────────────────────────
function toggleAdmin() {
  if (isAdmin) {
    isAdmin=false;
    document.getElementById("adminToggleBtn").classList.remove("active");
    document.getElementById("adminToggleBtn").textContent="管理";
    document.querySelectorAll(".admin-only").forEach(el=>el.classList.add("hidden"));
    renderAll(); toast("已退出管理模式");
  } else {
    openModal("adminModal");
    setTimeout(()=>document.getElementById("adminPasswordInput").focus(),50);
  }
}
function checkAdminPassword() {
  const val = document.getElementById("adminPasswordInput").value;
  if (val===ADMIN_PASSWORD) {
    isAdmin=true; closeModal("adminModal");
    document.getElementById("adminPasswordInput").value="";
    document.getElementById("adminToggleBtn").classList.add("active");
    document.getElementById("adminToggleBtn").textContent="退出管理";
    document.querySelectorAll(".admin-only").forEach(el=>el.classList.remove("hidden"));
    renderAll(); toast("歡迎，管理員 👋");
  } else { toast("密碼錯誤"); }
}

// ── MODALS ────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }
document.addEventListener("click", e=>{ if (e.target.classList.contains("modal")) e.target.classList.add("hidden"); });
document.addEventListener("keydown", e=>{
  if (e.key==="Enter" && !document.getElementById("adminModal").classList.contains("hidden")) checkAdminPassword();
});

// ── TOAST ─────────────────────────────────
function toast(msg) {
  const el=document.createElement("div"); el.className="toast"; el.textContent=msg;
  document.body.appendChild(el); setTimeout(()=>el.remove(),2600);
}
