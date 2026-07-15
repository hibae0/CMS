/* ══════════════════════════════════════════
   KANRI COMMISSION v2 · app.js
   ══════════════════════════════════════════ */

const NEWEBPAY_CONFIG = {
  MerchantID: "MS1833659005",
  gateway: "https://core.newebpay.com/MPG/mpg_gateway",
};

// ── DEFAULT DATA ──────────────────────────
const DEFAULT_PROFILE = {
  avatar: "https://i.meee.com.tw/0H4DfiU.png",
  name: "KANRI",
  subtitle: "插畫委託 / Illustration Commission",
};

const DEFAULT_HOME_BLOCKS = [
  { id:"b1", icon:"", title:"非商委託使用規範", content:"視同同意繪師收錄作品集，繪者保有作品權利\n確認委託視同委託者允許相關規範細節\n委託人公開顯示需標注繪師\n非委託作品不得作為個人收藏使用，禁止黃牛行為\n可自行授權衍生使用，禁止二次加工、塗改頭像\n驚喜包有一定程度OOC難度可能，介意請謹慎進一步委託" },
  { id:"b2", icon:"", title:"婉拒項目與狀況", content:"部分作品與不整客的內容繪師無承接" },
  { id:"b3", icon:"", title:"付款期限與相關", content:"繳費金流（可匯款、超商代碼）、PAYPAL（含6%手續費）" },
];

const DEFAULT_NOTICES_HOME = [{ id:"n1", date:"NOTICE", bullets:["請進入管理模式編輯公告"] }];
const DEFAULT_NOTICES_COMM = [{ id:"nc1", date:"NOTICE", bullets:["請進入管理模式編輯公告"] }];
const DEFAULT_NOTICES_PAY  = [{ id:"np1", date:"付款注意事項", bullets:["付款後請保留收據"] }];
const DEFAULT_ATTEN        = [{ id:"a1", date:"注意事項", bullets:["請進入管理模式編輯"] }];
const DEFAULT_COMMISSIONS  = [{ id:"c1", name:"插畫委託", tags:["插畫","委託"], summary:"請進入管理模式新增商品", detail:"", imgs:[], priceType:"fixed", price:0, status:"available" }];
const DEFAULT_PROGRESS     = [];
const DEFAULT_SOCIALS      = [{ id:"s1", label:"Email", url:"mailto:", icon:"@" }];
const DEFAULT_CONNECT_BLOCKS = [{ id:"cb1", title:"委託來信規格", content:"請進入管理模式編輯內容" }];
const DEFAULT_CONNECT_INTRO  = "請進入管理模式編輯說明文字";

// ── STATE ─────────────────────────────────
let isAdmin = false;
const ADMIN_PASSWORD = "toshine10171108";

let profile       = { ...DEFAULT_PROFILE };
let homeBlocks    = DEFAULT_HOME_BLOCKS;
let noticesHome   = DEFAULT_NOTICES_HOME;
let noticesComm   = DEFAULT_NOTICES_COMM;
let noticesPay    = DEFAULT_NOTICES_PAY;
let atten         = DEFAULT_ATTEN;
let commissions   = DEFAULT_COMMISSIONS;
let progressList  = DEFAULT_PROGRESS;
let socials       = DEFAULT_SOCIALS;
let connectBlocks = DEFAULT_CONNECT_BLOCKS;
let connectIntro  = DEFAULT_CONNECT_INTRO;
let cart          = JSON.parse(localStorage.getItem("kc_cart")) || [];

let editingHomeBlockId  = null;
let editingCommissionId = null;
let editingProgressId   = null;
let editingNoticeType   = "home";
let editingConnectId    = null;
let editingConnectIsIntro = false;

// ── INIT ──────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadFromServer();
  renderAll();
  updateCartCount();
});

async function loadFromServer() {
  try {
    const res  = await fetch("/api/site-data");
    const data = await res.json();

    // 只有伺服器有值才覆蓋，絕對不用預設值覆蓋伺服器資料
    if (data.profile)                         profile       = data.profile;
    if (data.homeBlocks?.length)              homeBlocks    = data.homeBlocks;
    if (data.noticesHome?.length)             noticesHome   = data.noticesHome;
    else if (data.notices?.length)            noticesHome   = data.notices; // 相容舊欄位
    if (data.noticesComm?.length)             noticesComm   = data.noticesComm;
    if (data.noticesPay?.length)              noticesPay    = data.noticesPay;
    if (data.atten?.length)                   atten         = data.atten;
    if (data.commissions?.length)             commissions   = data.commissions;
    else if (data.products?.length) {         // 相容舊欄位
      commissions = data.products.map(p => ({
        id: p.id, name: p.name, tags: p.tags||[],
        summary: p.desc||"", detail: p.desc||"",
        imgs: p.img ? [p.img] : [],
        priceType: p.priceType||"fixed",
        price: p.price||0, status: p.status||"available"
      }));
    }
    if (Array.isArray(data.progressList))     progressList  = data.progressList;
    if (data.socials?.length)                 socials       = data.socials;
    if (data.connectBlocks?.length)           connectBlocks = data.connectBlocks;
    if (data.connectIntro)                    connectIntro  = data.connectIntro;

    console.log("✅ 資料載入成功");
  } catch(e) {
    console.warn("⚠️ 無法從伺服器載入資料，使用預設值:", e.message);
  }
}

function renderAll() {
  renderProfile();
  renderHomeBlocks();
  renderNotices();
  renderAtten();
  renderCommissions();
  renderProgressAdmin();
  renderProducts();
  renderSocials();
  renderConnectSection();
}

async function saveToServer() {
  try {
    const res = await fetch("/api/site-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, homeBlocks, noticesHome, noticesComm, noticesPay, atten, commissions, progressList, socials, connectBlocks, connectIntro }),
    });
    const data = await res.json();
    if (!data.ok) console.warn("儲存回應異常:", data);
  } catch(e) {
    console.error("❌ 儲存失敗:", e.message);
  }
}

// 每 90 秒靜默同步（只讀，不寫，且只在非管理模式下同步以免覆蓋正在編輯的內容）
setInterval(async () => {
  if (isAdmin) return; // 管理員正在編輯時不自動重載
  await loadFromServer();
  renderAll();
}, 90000);

function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ── PAGE NAVIGATION ───────────────────────
function showPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.page === name);
  });
  window.scrollTo(0, 0);
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
  if (!grid) return;
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
    const iconHtml = b.icon ? `<span class="home-block-icon">${b.icon}</span>` : "";
    return `<div class="home-block">
      ${adminBtns}
      <div class="home-block-title">${iconHtml}${b.title}</div>
      <div class="home-block-content"><ul>${html}</ul></div>
    </div>`;
  }).join("");
}
function openAddHomeBlock() {
  editingHomeBlockId = null;
  document.getElementById("homeBlockModalTitle").textContent = "新增區塊";
  document.getElementById("editBlockIcon").value    = "";
  document.getElementById("editBlockTitle").value   = "";
  document.getElementById("editBlockContent").value = "";
  openModal("homeBlockModal");
}
function openEditHomeBlock(id) {
  const b = homeBlocks.find(x => x.id === id); if (!b) return;
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
    const i = homeBlocks.findIndex(x => x.id === editingHomeBlockId);
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
  el.innerHTML = (data||[]).map(n => `
    <div class="notice-item">
      ${n.date ? `<div class="notice-date">${n.date}</div>` : ""}
      ${n.bullets&&n.bullets.length ? `<ul>${n.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>` : ""}
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
function updateNoticeDraft(i,f,v)  { getEditingNotice()[i][f]=v; }
function updateNoticeBullet(i,j,v) { getEditingNotice()[i].bullets[j]=v; }
function removeNoticeItem(i) { const d=getEditingNotice(); d.splice(i,1); openNoticeModal(editingNoticeType); }
function removeBullet(i,j)   { const d=getEditingNotice(); d[i].bullets.splice(j,1); openNoticeModal(editingNoticeType); }
function addBullet(i)        { const d=getEditingNotice(); d[i].bullets.push(""); openNoticeModal(editingNoticeType); }
function addNoticeItem()     { getEditingNotice().push({id:"ni"+Date.now(), date:"新公告", bullets:[""]}); openNoticeModal(editingNoticeType); }
function saveNotices() {
  if (editingNoticeType==="atten") renderAtten(); else renderNotices();
  saveToServer(); closeModal("noticeEditModal"); toast("已儲存");
}

// ── COMMISSIONS ───────────────────────────
function renderCommissions() {
  const list = document.getElementById("commissionList");
  if (!list) return;
  list.innerHTML = commissions.map(c => {
    const imgs = c.imgs&&c.imgs.length ? c.imgs : (c.img ? [c.img] : []);
    const coverImg = imgs[0];
    const imgHtml = coverImg
      ? `<img class="comm-item-img" src="${coverImg}" alt="${c.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
         <div class="comm-item-img-placeholder" style="display:none">🎨</div>`
      : `<div class="comm-item-img-placeholder">🎨</div>`;
    const tags = (c.tags||[]).map(t=>`<span class="comm-tag">${t}</span>`).join("");
    const priceLabel = c.priceType==="negotiate"?"洽談":c.priceType==="custom"?"顧客自填":c.price>0?`TWD ${c.price.toLocaleString()}`:"洽談";
    const statusMap = {available:["status-available","開放中"],waitlist:["status-waitlist","預約候補"],closed:["status-closed","暫停接單"]};
    const [sc,sl] = statusMap[c.status]||statusMap.available;
    const adminBtns = isAdmin ? `<div class="comm-admin-btns admin-only">
      <button class="edit-btn" onclick="event.stopPropagation();openEditCommission('${c.id}')">✏</button>
      <button class="del-btn" onclick="event.stopPropagation();deleteCommission('${c.id}')">✕</button>
    </div>` : "";
    return `<div class="comm-item" onclick="openLightbox('${c.id}')">
      <div class="comm-item-header">
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
          <span class="comm-view-hint">點擊查看詳細 ›</span>
        </div>
      </div>
    </div>`;
  }).join("");
}
function openAddCommission() {
  editingCommissionId = null;
  document.getElementById("commissionModalTitle").textContent = "新增委託項目";
  ["editCommName","editCommTags","editCommSummary","editCommDetail","editCommImg0","editCommImg1","editCommImg2","editCommImg3","editCommPrice"].forEach(id=>document.getElementById(id).value="");
  [0,1,2,3].forEach(i=>{ document.getElementById("variantName"+i).value=""; document.getElementById("variantPrice"+i).value=""; });
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
  const imgs = c.imgs&&c.imgs.length ? c.imgs : (c.img ? [c.img] : []);
  [0,1,2,3].forEach(i => { document.getElementById("editCommImg"+i).value = imgs[i]||""; });
  document.getElementById("editCommStatus").value = c.status;
  // Load variants
  const vars = c.variants||[];
  [0,1,2,3].forEach(i=>{
    document.getElementById("variantName"+i).value  = vars[i]?.name||"";
    document.getElementById("variantPrice"+i).value = vars[i]?.price||"";
  });
  const pt = c.priceType||"fixed";
  document.getElementById("cpFixed").checked     = pt==="fixed";
  document.getElementById("cpNegotiate").checked = pt==="negotiate";
  document.getElementById("cpCustom").checked    = pt==="custom";
  document.getElementById("editCommPrice").value = pt==="fixed"?c.price:"";
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
  const imgs    = [0,1,2,3].map(i=>document.getElementById("editCommImg"+i).value.trim()).filter(Boolean);
  const img     = imgs[0]||"";
  const variants = [0,1,2,3].map(i=>({
    name:  document.getElementById("variantName"+i).value.trim(),
    price: parseInt(document.getElementById("variantPrice"+i).value)||0
  })).filter(v=>v.name && v.price>0);
  const status  = document.getElementById("editCommStatus").value;
  const pt      = document.querySelector('input[name="commPriceType"]:checked')?.value||"fixed";
  const price   = pt==="fixed"?(parseInt(document.getElementById("editCommPrice").value)||0):0;
  if (!name) { toast("請填寫項目名稱"); return; }
  if (editingCommissionId) {
    const i = commissions.findIndex(x=>x.id===editingCommissionId);
    if (i!==-1) commissions[i]={ ...commissions[i], name, tags, summary, detail, img, imgs, priceType:pt, price, variants, status };
  } else {
    commissions.push({ id:"c"+Date.now(), name, tags, summary, detail, img, imgs, priceType:pt, price, variants, status });
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
  if (!progressList.length) { el.innerHTML=`<p style="font-size:.8rem;color:var(--muted)">尚無進度資料</p>`; return; }

  const payBadge  = v=>({paid:"prog-paid",deposit:"prog-deposit",outstanding:"prog-outstanding"}[v]||"prog-outstanding");
  const statBadge = v=>({not_started:"prog-not-started",in_progress:"prog-in-progress",completed:"prog-completed",paused:"prog-paused"}[v]||"prog-not-started");
  const payLabel  = v=>({paid:"已付款",deposit:"已付訂金",outstanding:"待付款"}[v]||v);
  const statLabel = v=>({not_started:"未開始",in_progress:"進行中",completed:"已完成",paused:"暫停/取消"}[v]||v);

  // 依 ETA 排序（無日期排最後）
  const sortByETA = list => [...list].sort((a,b)=>{
    if (!a.eta && !b.eta) return 0;
    if (!a.eta) return 1;
    if (!b.eta) return -1;
    return new Date(a.eta) - new Date(b.eta);
  });

  // 分成進行中 / 已完成暫停
  const active    = sortByETA(progressList.filter(p => p.status !== "completed" && p.status !== "paused"));
  const finished  = sortByETA(progressList.filter(p => p.status === "completed" || p.status === "paused"));

  const buildRows = list => list.map(p=>`<tr>
    <td>${p.name}</td>
    <td style="font-size:.75rem;color:var(--muted)">${p.email}</td>
    <td>${p.service||""}</td>
    <td><span class="prog-badge ${payBadge(p.payment)}">${payLabel(p.payment)}</span></td>
    <td><span class="prog-badge ${statBadge(p.status)}">${statLabel(p.status)}</span></td>
    <td style="font-size:.78rem">${p.eta||""}</td>
    <td style="font-size:.78rem;color:var(--muted)">${p.acd||""}</td>
    <td style="font-size:.75rem;color:var(--muted)">${p.note||""}</td>
    <td><div class="prog-row-actions">
      <button class="edit-btn" onclick="openEditProgress('${p.id}')">✏</button>
      <button class="del-btn" onclick="deleteProgress('${p.id}')">✕</button>
    </div></td>
  </tr>`).join("");

  const thead = `<thead><tr>
    <th>委託人</th><th>Email</th><th>項目</th><th>付款</th><th>進度</th>
    <th>ETA</th><th>ACD </th><th>備註</th><th></th>
  </tr></thead>`;

  el.innerHTML = `
    <div style="overflow-x:auto">
      <table class="prog-table">
        ${thead}
        <tbody>${buildRows(active)}</tbody>
      </table>
    </div>
    ${finished.length ? `
    <div style="margin-top:28px">
      <div style="font-size:.75rem;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)">
        已完成 / 暫停取消
      </div>
      <div style="overflow-x:auto;opacity:.7">
        <table class="prog-table">
          ${thead}
          <tbody>${buildRows(finished)}</tbody>
        </table>
      </div>
    </div>` : ""}
  `;
}
function queryProgress() {
  const email  = document.getElementById("progressQueryEmail").value.trim().toLowerCase();
  const result = document.getElementById("progressQueryResult");
  if (!email) { result.innerHTML=`<p class="progress-empty">請輸入 Email</p>`; return; }
  fetch("/api/site-data").then(r=>r.json()).then(data=>{
    if (Array.isArray(data.progressList)) progressList = data.progressList;
    _doQueryProgress(email, result);
  }).catch(()=>_doQueryProgress(email, result));
}
function _doQueryProgress(email, result) {
  const matches = progressList.filter(p=>(p.email||"").trim().toLowerCase()===email);
  if (!matches.length) { result.innerHTML=`<p class="progress-empty">找不到符合的委託記錄，請確認 Email 是否正確</p>`; return; }
  const payLabel  = v=>({paid:"已付款",deposit:"已付訂金",outstanding:"待付款"}[v]||v);
  const statLabel = v=>({not_started:"未開始",in_progress:"進行中",completed:"已完成",paused:"暫停/取消"}[v]||v);
  const payBadge  = v=>({paid:"prog-paid",deposit:"prog-deposit",outstanding:"prog-outstanding"}[v]||"prog-outstanding");
  const statBadge = v=>({not_started:"prog-not-started",in_progress:"prog-in-progress",completed:"prog-completed",paused:"prog-paused"}[v]||"prog-not-started");
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
  document.getElementById("editProgACD").value     = p.acd||"";
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
  const acd     = document.getElementById("editProgACD").value.trim();
  const note    = document.getElementById("editProgNote").value.trim();
  if (!name||!email) { toast("請填寫姓名與 Email"); return; }
  if (editingProgressId) {
    const i = progressList.findIndex(x=>x.id===editingProgressId);
    if (i!==-1) progressList[i]={ ...progressList[i], name, email, service, payment, status, eta, acd, note };
  } else {
    progressList.push({ id:"p"+Date.now(), name, email, service, payment, status, eta, acd, note });
  }
  renderProgressAdmin(); saveToServer(); closeModal("progressModal"); toast("已儲存");
}
function deleteProgress(id) {
  if (!confirm("確定刪除？")) return;
  progressList = progressList.filter(x=>x.id!==id);
  renderProgressAdmin(); saveToServer(); toast("已刪除");
}

// ── PAYMENT PAGE ──────────────────────────
function renderProducts() {
  const grid = document.getElementById("productGrid"); if (!grid) return;
  grid.innerHTML = commissions.map(c => {
    const imgs = c.imgs&&c.imgs.length ? c.imgs : (c.img ? [c.img] : []);
    const imgHtml = imgs[0]
      ? `<img class="product-img" src="${imgs[0]}" alt="${c.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="product-img-placeholder" style="display:none">🎨</div>`
      : `<div class="product-img-placeholder">🎨</div>`;
    const tags = (c.tags||[]).map(t=>`<span class="product-tag">${t}</span>`).join("");
    const priceLabel = c.priceType==="negotiate"?"洽談":c.priceType==="custom"?"顧客自填":c.price>0?`TWD ${c.price.toLocaleString()}`:"洽談";
    const statusMap = {available:["status-available","開放中"],waitlist:["status-waitlist","預約候補"],closed:["status-closed","暫停接單"]};
    const [sc,sl] = statusMap[c.status]||statusMap.available;
    const addBtn = c.status!=="closed"
      ? `<button class="add-to-cart-btn" onclick="event.stopPropagation();${c.variants&&c.variants.length?`openLightbox('${c.id}')`:`addToCart('${c.id}')`}" title="${c.variants&&c.variants.length?'選擇方案':'加入購物車'}">＋</button>`:"";
    return `<div class="product-card ${c.status==="closed"?"closed":""}" onclick="openLightbox('${c.id}')">
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

// ── CART ──────────────────────────────────
function addToCart(id) {
  const c = commissions.find(x=>x.id===id);
  if (!c||c.status==="closed") return;
  if (c.stock!=null&&c.stock!==undefined) {
    const inCart = cart.find(x=>x.id===id)?.qty||0;
    if (inCart>=c.stock) { toast(`「${c.name}」庫存已達上限`); return; }
  }
  const existing = cart.find(x=>x.id===id);
  if (existing) existing.qty++;
  else cart.push({ id, qty:1, customPrice:0 });
  save("kc_cart",cart); updateCartCount();
  toast(`「${c.name}」已加入購物車`);
}
function updateCartCount() {
  document.getElementById("cartCount").textContent = cart.reduce((s,c)=>s+c.qty,0);
}

function addToCartWithVariant(id, variantName, variantPrice) {
  const c = commissions.find(x=>x.id===id);
  if (!c||c.status==="closed") return;
  // Each variant is a separate cart entry keyed by id+variantName
  const cartKey = id + "__" + variantName;
  const existing = cart.find(x=>x.cartKey===cartKey);
  if (existing) existing.qty++;
  else cart.push({ id, cartKey, variantName, variantPrice: Number(variantPrice), qty:1, customPrice:0 });
  save("kc_cart",cart); updateCartCount();
  toast(`「${c.name}（${variantName}）」已加入購物車`);
}
function openCart() { renderCartModal(); openModal("cartModal"); }

function saveCustomPrice(id, val) {
  const c = cart.find(x=>x.id===id);
  if (c) { c.customPrice=parseInt(val)||0; save("kc_cart",cart); updateCartTotal(); }
}

function renderCartModal() {
  const container  = document.getElementById("cartItems");
  const customArea = document.getElementById("customPriceInputs");
  if (!cart.length) {
    container.innerHTML=`<div class="cart-empty">購物車是空的</div>`;
    customArea.innerHTML="";
    document.getElementById("cartTotal").textContent="";
    return;
  }
  container.innerHTML = cart.map(ci => {
    const p = commissions.find(x=>x.id===ci.id); if (!p) return "";
    const pt = p.priceType||"fixed";
    const rowKey = ci.cartKey||ci.id; // use cartKey for variants
    const displayName = ci.variantName ? `${p.name}（${ci.variantName}）` : p.name;
    let disp;
    if (ci.variantPrice) {
      disp = "TWD " + (ci.variantPrice*ci.qty).toLocaleString();
    } else if (pt==="negotiate") { disp="洽談"; }
    else if (pt==="custom") {
      disp = ci.customPrice>0
        ? `TWD ${(ci.customPrice*ci.qty).toLocaleString()}`
        : `<span style="color:#c44;font-size:.78rem">請填寫金額</span>`;
    } else {
      const sub = p.price*ci.qty;
      disp = sub>0?"TWD "+sub.toLocaleString():"洽談";
    }
    const safeKey = rowKey.replace(/[^a-zA-Z0-9_]/g,"_");
    return `<div class="cart-row">
      <span class="cart-row-name">${displayName}</span>
      <div class="cart-row-qty">
        <button onclick="changeQty('${rowKey}',-1)">－</button>
        <span>${ci.qty}</span>
        <button onclick="changeQty('${rowKey}',1)">＋</button>
      </div>
      <span class="cart-row-price" id="price_${safeKey}">${disp}</span>
    </div>`;
  }).join("");
  const customItems = cart.filter(ci=>{ const p=commissions.find(x=>x.id===ci.id); return p&&p.priceType==="custom"; });
  if (customItems.length) {
    customArea.innerHTML = `<div style="margin-top:14px;padding:12px;background:var(--off);border-radius:9px;border:1px solid var(--border)">
      <p style="font-size:.78rem;color:var(--muted);margin-bottom:10px">請填寫以下商品的委託金額（報價議定金額）：</p>
      ${customItems.map(ci=>{ const p=commissions.find(x=>x.id===ci.id); const saved=ci.customPrice>0?ci.customPrice:"";
        return `<div style="margin-bottom:8px">
          <label style="font-size:.78rem;color:var(--muted);display:block;margin-bottom:3px">${p.name} × ${ci.qty}</label>
          <input type="number" placeholder="請輸入金額 (TWD)" value="${saved}"
            style="width:100%;border:1px solid var(--border2);border-radius:7px;padding:7px 10px;font-size:.86rem;outline:none"
            oninput="saveCustomPrice('${ci.id}',this.value)"/>
        </div>`;}).join("")}
    </div>`;
  } else { customArea.innerHTML=""; }
  updateCartTotal();
}

function updateCartTotal() {
  let total=0, hasUnfilled=false;
  cart.forEach(ci => {
    const p=commissions.find(x=>x.id===ci.id); if (!p) return;
    const rowKey = ci.cartKey||ci.id;
    const safeKey = rowKey.replace(/[^a-zA-Z0-9_]/g,"_");
    if (ci.variantPrice>0) {
      total+=ci.variantPrice*ci.qty;
    } else {
      const pt=p.priceType||"fixed";
      if (pt==="fixed"&&p.price>0) { total+=p.price*ci.qty; }
      else if (pt==="custom") {
        if (ci.customPrice>0) {
          total+=ci.customPrice*ci.qty;
          const el=document.getElementById("price_"+safeKey);
          if (el) el.innerHTML=`TWD ${(ci.customPrice*ci.qty).toLocaleString()}`;
        } else {
          hasUnfilled=true;
          const el=document.getElementById("price_"+safeKey);
          if (el) el.innerHTML=`<span style="color:#c44;font-size:.78rem">請填寫金額</span>`;
        }
      }
    }
  });
  const totalEl=document.getElementById("cartTotal");
  if (total>0) {
    totalEl.textContent = hasUnfilled
      ? `已填金額小計：TWD ${total.toLocaleString()}（尚有商品待填金額）`
      : `合計：TWD ${total.toLocaleString()}`;
  } else { totalEl.textContent=""; }
}

function changeQty(key, delta) {
  // key may be id or cartKey
  const ci = cart.find(x=>(x.cartKey||x.id)===key); if (!ci) return;
  ci.qty+=delta;
  if (ci.qty<=0) cart=cart.filter(x=>(x.cartKey||x.id)!==key);
  save("kc_cart",cart); updateCartCount(); renderCartModal();
}

// ── CHECKOUT ──────────────────────────────
function checkout() {
  const name  = document.getElementById("buyerName").value.trim();
  const email = document.getElementById("buyerEmail").value.trim();
  const note  = document.getElementById("buyerNote").value.trim();
  if (!name)  { toast("請填寫登記暱稱"); return; }
  if (!email) { toast("請填寫登記Email"); return; }
  if (!cart.length) { toast("購物車是空的"); return; }
   // 清除無效的舊版 cart item（沒有對應商品的）
  cart = cart.filter(ci => commissions.find(x => x.id === ci.id));
  save("kc_cart", cart);
  updateCartCount();
  if (!cart.length) { toast("購物車是空的，請重新加入商品"); return; }
   
  if (cart.some(ci=>{ const p=commissions.find(x=>x.id===ci.id); return p&&p.priceType==="negotiate"; })) {
    toast("含有「洽談」商品，請先來信確認"); return;
  }
  let customTotal=0;
  for (const ci of cart) {
    if (ci.variantPrice>0) continue; // variant 已在 fixedTotal 計算
    const p = commissions.find(x=>x.id===ci.id);
    if (!p||p.priceType!=="custom") continue;
    const val=ci.customPrice||0;
    if (val<1) { toast(`請填寫「${p.name}」的委託金額`); return; }
    customTotal+=val*ci.qty;
  }
  const fixedTotal=cart.reduce((s,ci)=>{
    if (ci.variantPrice>0) return s+ci.variantPrice*ci.qty;
    const p=commissions.find(x=>x.id===ci.id);
    if (!p) return s;
    if (p.priceType==="custom") return s; // 自填另外算
    return s+(p.price>0?p.price*ci.qty:0);
  },0);
  const amt=fixedTotal+customTotal;
  if (amt<1) { toast("訂單金額不得為 0"); return; }
  // 提醒顧客不要在頁面停留太久
  toast("正在建立付款，請勿重複點擊...");
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
  const val=document.getElementById("adminPasswordInput").value;
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
  if (e.key==="Enter"&&!document.getElementById("adminModal").classList.contains("hidden")) checkAdminPassword();
});

// ── TOAST ─────────────────────────────────
function toast(msg) {
  const el=document.createElement("div"); el.className="toast"; el.textContent=msg;
  document.body.appendChild(el); setTimeout(()=>el.remove(),2600);
}

// ── LIGHTBOX ──────────────────────────────
let lightboxCommId=null, lightboxImgIndex=0;

function openLightbox(id) {
  const c=commissions.find(x=>x.id===id); if (!c) return;
  lightboxCommId=id; lightboxImgIndex=0;
  const imgs=c.imgs&&c.imgs.length?c.imgs:(c.img?[c.img]:[]);
  const priceLabel=c.priceType==="negotiate"?"洽談":c.priceType==="custom"?"顧客自填":c.price>0?`TWD ${c.price.toLocaleString()}`:"洽談";
  const statusMap={available:["status-available","開放中"],waitlist:["status-waitlist","預約候補"],closed:["status-closed","暫停接單"]};
  const [sc,sl]=statusMap[c.status]||statusMap.available;
  document.getElementById("lightboxTags").innerHTML=(c.tags||[]).map(t=>`<span class="comm-tag">${t}</span>`).join("");
  document.getElementById("lightboxName").textContent=c.name;
  document.getElementById("lightboxStatus").innerHTML=`<span class="comm-status ${sc}">${sl}</span>`;
  document.getElementById("lightboxPrice").textContent=priceLabel;
  document.getElementById("lightboxDetail").innerHTML=`<ul>${(c.detail||"").split("\n").filter(Boolean).map(l=>`<li>${l}</li>`).join("")}</ul>`;
  const cartBtn=document.getElementById("lightboxCartBtn");
  cartBtn.style.display=c.status==="closed"?"none":"block";

  // Variant selector
  const variantsEl = document.getElementById("lightboxVariants");
  const vars = c.variants&&c.variants.length ? c.variants : [];
  if (vars.length > 0) {
    variantsEl.innerHTML = `
      <label style="font-size:.78rem;color:var(--muted);display:block;margin-bottom:6px">選擇方案</label>
      <select id="lightboxVariantSelect" style="width:100%;border:1px solid var(--border2);border-radius:7px;padding:8px 10px;font-size:.88rem;outline:none;background:var(--off);cursor:pointer">
        ${vars.map((v,i)=>`<option value="${i}">　${v.name}　—　TWD ${v.price.toLocaleString()}</option>`).join("")}
      </select>`;
    // Update price display when variant changes
    variantsEl.querySelector("select").onchange = function() {
      const v = vars[parseInt(this.value)];
      document.getElementById("lightboxPrice").textContent = `TWD ${v.price.toLocaleString()}`;
    };
    // Set initial price to first variant
    document.getElementById("lightboxPrice").textContent = `TWD ${vars[0].price.toLocaleString()}`;
  } else {
    variantsEl.innerHTML = "";
  }

  renderLightboxImgs(imgs);
  openModal("commLightbox");
}
function renderLightboxImgs(imgs) {
  const mainImg=document.getElementById("lightboxMainImg");
  const thumbs=document.getElementById("lightboxThumbs");
  const leftArr=document.querySelector(".lightbox-arrow.left");
  const rightArr=document.querySelector(".lightbox-arrow.right");
  if (!imgs.length) {
    mainImg.src=""; mainImg.style.display="none"; thumbs.innerHTML="";
    if (leftArr)  leftArr.style.display="none";
    if (rightArr) rightArr.style.display="none";
    return;
  }
  mainImg.style.display="block"; mainImg.src=imgs[lightboxImgIndex];
  if (leftArr)  leftArr.style.display=imgs.length>1?"flex":"none";
  if (rightArr) rightArr.style.display=imgs.length>1?"flex":"none";
  thumbs.innerHTML=imgs.map((src,i)=>`<img src="${src}" class="lightbox-thumb ${i===lightboxImgIndex?"active":""}" onclick="lightboxGoto(${i})" alt="圖片${i+1}" onerror="this.style.display='none'"/>`).join("");
}
function lightboxGoto(i) {
  const c=commissions.find(x=>x.id===lightboxCommId); if (!c) return;
  const imgs=c.imgs&&c.imgs.length?c.imgs:(c.img?[c.img]:[]);
  lightboxImgIndex=(i+imgs.length)%imgs.length;
  renderLightboxImgs(imgs);
}
function lightboxPrev() { lightboxGoto(lightboxImgIndex-1); }
function lightboxNext() { lightboxGoto(lightboxImgIndex+1); }
function lightboxAddToCart() {
  if (!lightboxCommId) return;
  const c = commissions.find(x=>x.id===lightboxCommId); if (!c) return;
  const vars = c.variants&&c.variants.length ? c.variants : [];
  if (vars.length > 0) {
    const sel = document.getElementById("lightboxVariantSelect");
    const v   = vars[parseInt(sel?.value||0)];
    addToCartWithVariant(lightboxCommId, v.name, v.price);
  } else {
    addToCart(lightboxCommId);
  }
  closeModal("commLightbox");
}

// ── SOCIAL LINKS ──────────────────────────
function renderSocials() {
  const el=document.getElementById("socialLinks"); if (!el) return;
  if (!socials.length) { el.innerHTML=`<p style="font-size:.75rem;color:var(--light)">尚未設定連結</p>`; return; }
  el.innerHTML=socials.map(s=>`<a href="${s.url}" target="_blank" rel="noopener" class="social-btn" title="${s.label}">
    <span class="social-icon">${s.icon}</span><span class="social-label">${s.label}</span></a>`).join("");
}
function openSocialModal() {
  document.getElementById("socialEditList").innerHTML=socials.map((s,i)=>`
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
      <input type="text" value="${s.icon}" placeholder="圖示" style="width:52px;flex-shrink:0" oninput="socials[${i}].icon=this.value"/>
      <input type="text" value="${s.label}" placeholder="名稱" style="width:90px;flex-shrink:0" oninput="socials[${i}].label=this.value"/>
      <input type="text" value="${s.url}" placeholder="網址" style="flex:1" oninput="socials[${i}].url=this.value"/>
      <button style="background:none;border:none;color:#c44;cursor:pointer" onclick="removeSocial(${i})">✕</button>
    </div>`).join("");
  openModal("socialModal");
}
function addSocialItem() { socials.push({id:"s"+Date.now(),label:"連結",url:"https://",icon:"★"}); openSocialModal(); }
function removeSocial(i) { socials.splice(i,1); openSocialModal(); }
function saveSocials() { renderSocials(); saveToServer(); closeModal("socialModal"); toast("已儲存"); }

// ── CONNECT SECTION ────────────────────────
function renderConnectSection() {
  const introEl=document.getElementById("connectIntro");
  const blocksEl=document.getElementById("connectBlocks");
  if (!introEl||!blocksEl) return;
  if (connectIntro) {
    introEl.innerHTML=connectIntro.split("\n").map(line=>{
      if (!line.trim()) return "";
      const cls=line.startsWith("！")?"connect-intro-warn":"connect-intro-line";
      return `<p class="${cls}">${line}</p>`;
    }).join("");
  }
  blocksEl.innerHTML=connectBlocks.map(b=>{
    const lines=(b.content||"").split("\n");
    let html="";
    lines.forEach(line=>{
      if (line==="---") html+=`<hr class="connect-hr"/>`;
      else if (line.startsWith("##")) html+=`<div class="connect-sub-heading">${line.slice(2).trim()}</div>`;
      else if (line.trim()) html+=`<div class="connect-line">・${line.trim()}</div>`;
    });
    const adminBtns=isAdmin?`<div class="home-block-admin admin-only">
      <button class="edit-btn" onclick="openEditConnectBlock('${b.id}')">✏</button>
      <button class="del-btn" onclick="deleteConnectBlock('${b.id}')">✕</button>
    </div>`:"";
    return `<div class="connect-block">${adminBtns}
      <div class="connect-block-title">${b.title}</div>
      <div class="connect-block-content">${html}</div>
    </div>`;
  }).join("");
}
function openAddConnectBlock() {
  editingConnectId=null; editingConnectIsIntro=false;
  document.getElementById("connectModalTitle").textContent="新增 CONNECT 區塊";
  document.getElementById("editConnectTitle").value="";
  document.getElementById("editConnectContent").value="";
  openModal("connectModal");
}
function openEditConnectIntro() {
  editingConnectId=null; editingConnectIsIntro=true;
  document.getElementById("connectModalTitle").textContent="編輯前言說明";
  document.getElementById("editConnectTitle").value="";
  document.getElementById("editConnectContent").value=connectIntro;
  openModal("connectModal");
}
function openEditConnectBlock(id) {
  const b=connectBlocks.find(x=>x.id===id); if (!b) return;
  editingConnectId=id; editingConnectIsIntro=false;
  document.getElementById("connectModalTitle").textContent="編輯 CONNECT 區塊";
  document.getElementById("editConnectTitle").value=b.title;
  document.getElementById("editConnectContent").value=b.content;
  openModal("connectModal");
}
function saveConnectBlock() {
  const title=document.getElementById("editConnectTitle").value.trim();
  const content=document.getElementById("editConnectContent").value;
  if (editingConnectIsIntro) {
    connectIntro=content;
  } else {
    if (!title) { toast("請填寫標題"); return; }
    if (editingConnectId) {
      const i=connectBlocks.findIndex(x=>x.id===editingConnectId);
      if (i!==-1) connectBlocks[i]={...connectBlocks[i],title,content};
    } else {
      connectBlocks.push({id:"cb"+Date.now(),title,content});
    }
  }
  renderConnectSection(); saveToServer(); closeModal("connectModal"); toast("已儲存");
}
function deleteConnectBlock(id) {
  if (!confirm("確定刪除？")) return;
  connectBlocks=connectBlocks.filter(x=>x.id!==id);
  renderConnectSection(); saveToServer(); toast("已刪除");
}
