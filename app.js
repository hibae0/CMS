/* ══════════════════════════════════════════
   KANRI COMMISSION · app.js
   藍新金流 (Newebpay) MPG 付款整合
   ══════════════════════════════════════════ */

// ─── 藍新金流設定 ────────────────────────────
const NEWEBPAY_CONFIG = {
  MerchantID: "MS1833659005",
  HashKey: "JrbUntegBSyPCnUuZUOdMBs8vwmZtJRL",
  HashIV: "PSDQfFKgOuHSulVC",
  // 正式環境: https://core.newebpay.com/MPG/mpg_gateway
  // 測試環境: https://ccore.newebpay.com/MPG/mpg_gateway
  gateway: "https://core.newebpay.com/MPG/mpg_gateway",
};

// ─── 預設資料 ────────────────────────────────
const DEFAULT_PROFILE = {
  avatar: "https://i.imgur.com/lUbBaAW.png",
  name: "KANRI",
  subtitle: "插畫委託 / Illustration Commission",
};

const DEFAULT_NOTICES = [
  {
    date: "2026/10月 與 2027",
    bullets: ["插畫委託調整成預先排單", "過往委託人優先預排", "每個月排 1 單", "買斷委託人保留每月 1 單"],
  },
  {
    date: "2026/10月 與 2027",
    bullets: ["模板/驚喜包委託調整", "模板不定期開放（預計減少開）", "過往封存版本可詢問", "驚喜包可洽談"],
  },
];

const DEFAULT_PRODUCTS = [
  {
    id: "p1",
    name: "插畫委託",
    tags: ["插畫", "委託"],
    desc: "全彩單人插畫，含背景，可指定角色設定。交稿約 3～4 週。",
    img: "https://i.imgur.com/KBfbGxm.jpg",
    price: 4500,
    status: "available",
  },
  {
    id: "p2",
    name: "滿版組合 · 驚喜包",
    tags: ["滿版", "驚喜包"],
    desc: "由作者自由發揮主題與構圖的驚喜包組合，含滿版背景。",
    img: "https://i.imgur.com/placeholder2.jpg",
    price: 6000,
    status: "waitlist",
  },
  {
    id: "p3",
    name: "插畫 · 驚喜包",
    tags: ["插畫", "驚喜包"],
    desc: "作者自訂主題驚喜包，半身至全身插畫。",
    img: "",
    price: 3200,
    status: "available",
  },
  {
    id: "p4",
    name: "商業委託",
    tags: ["商業", "委託"],
    desc: "商業用途插畫，含授權書。詳情請來信洽談。",
    img: "",
    price: 0,
    status: "closed",
  },
];

// ─── 狀態 ────────────────────────────────────
let isAdmin = false;
const ADMIN_PASSWORD = "toshine10171108";

let profile  = JSON.parse(localStorage.getItem("kc_profile"))  || { ...DEFAULT_PROFILE };
let notices  = JSON.parse(localStorage.getItem("kc_notices"))  || DEFAULT_NOTICES;
let products = JSON.parse(localStorage.getItem("kc_products")) || DEFAULT_PRODUCTS;
let cart     = JSON.parse(localStorage.getItem("kc_cart"))     || [];

// ─── 初始化 ──────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderProfile();
  renderNotices();
  renderProducts();
  updateCartCount();
});

// ─── 儲存到 localStorage ─────────────────────
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ─── PROFILE ────────────────────────────────
function renderProfile() {
  document.getElementById("avatarImg").src   = profile.avatar || DEFAULT_PROFILE.avatar;
  document.getElementById("profileName").textContent     = profile.name;
  document.getElementById("profileSubtitle").textContent = profile.subtitle;
}

function loadProfileForm() {
  document.getElementById("editAvatar").value   = profile.avatar;
  document.getElementById("editName").value     = profile.name;
  document.getElementById("editSubtitle").value = profile.subtitle;
}

function saveProfile() {
  profile.avatar   = document.getElementById("editAvatar").value.trim();
  profile.name     = document.getElementById("editName").value.trim();
  profile.subtitle = document.getElementById("editSubtitle").value.trim();
  save("kc_profile", profile);
  renderProfile();
  closeModal("profileModal");
  toast("個人資訊已儲存");
}

// ─── NOTICES ─────────────────────────────────
function renderNotices() {
  const list = document.getElementById("noticeList");
  list.innerHTML = notices.map((n, i) => `
    <div class="notice-item">
      <div class="notice-date">${n.date}</div>
      <ul class="notice-bullets">
        ${n.bullets.map(b => `<li>${b}</li>`).join("")}
      </ul>
    </div>
  `).join("");
}

function openNoticeModal() {
  const container = document.getElementById("noticeEditList");
  container.innerHTML = notices.map((n, i) => `
    <div class="notice-edit-item" data-i="${i}">
      <div class="notice-edit-row">
        <input type="text" placeholder="日期/標題" value="${n.date}" oninput="updateNoticeDraft(${i},'date',this.value)"/>
        <button onclick="removeNotice(${i})">✕</button>
      </div>
      <div id="noticebullets_${i}">
        ${n.bullets.map((b, j) => `
          <div class="notice-edit-row" style="margin-top:4px">
            <input type="text" value="${b}" oninput="updateNoticeBullet(${i},${j},this.value)"/>
            <button onclick="removeBullet(${i},${j})">✕</button>
          </div>
        `).join("")}
      </div>
      <button class="add-btn" onclick="addBullet(${i})" style="margin-top:6px">＋ 新增項目</button>
    </div>
  `).join("");
  openModal("noticeModal");
}

function updateNoticeDraft(i, field, val) { notices[i][field] = val; }
function updateNoticeBullet(i, j, val) { notices[i].bullets[j] = val; }
function removeNotice(i) { notices.splice(i, 1); openNoticeModal(); }
function removeBullet(i, j) { notices[i].bullets.splice(j, 1); openNoticeModal(); }
function addBullet(i) { notices[i].bullets.push(""); openNoticeModal(); }
function addNoticeItem() {
  notices.push({ date: "新公告", bullets: [""] });
  openNoticeModal();
}
function saveNotices() {
  save("kc_notices", notices);
  renderNotices();
  closeModal("noticeModal");
  toast("公告已儲存");
}

// ─── PRODUCTS ────────────────────────────────
function renderProducts() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = products.map(p => productCard(p)).join("");
}

function productCard(p) {
  const imgHtml = p.img
    ? `<img class="product-img" src="${p.img}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"  /><div class="product-img-placeholder" style="display:none">🎨</div>`
    : `<div class="product-img-placeholder">🎨</div>`;

  const statusMap = { available: ["status-available","開放中"], waitlist: ["status-waitlist","預約候補"], closed: ["status-closed","暫停接單"] };
  const [statusClass, statusLabel] = statusMap[p.status] || statusMap.available;

  const priceLabel = p.priceType === "negotiate" ? "洽談" : p.priceType === "custom" ? "顧客自填" : p.price > 0 ? `TWD ${p.price.toLocaleString()}` : "洽談";

  const adminBtns = isAdmin ? `
    <div class="product-admin-actions admin-only">
      <button class="product-edit-btn" onclick="event.stopPropagation();openEditProduct('${p.id}')">✏</button>
      <button class="product-del-btn" onclick="event.stopPropagation();deleteProduct('${p.id}')">✕</button>
    </div>` : "";

  const addBtn = p.status !== "closed"
    ? `<button class="add-to-cart-btn" onclick="event.stopPropagation();addToCart('${p.id}')" title="加入購物車">＋</button>`
    : "";

  return `
    <div class="product-card ${p.status === 'closed' ? 'closed' : ''}" onclick="showProductDetail('${p.id}')">
      ${imgHtml}
      ${adminBtns}
      <div class="product-body">
        <div class="product-tags">${p.tags.map(t => `<span class="product-tag">${t}</span>`).join("")}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
      </div>
      ${addBtn}
      <div class="product-footer">
        <span class="product-price">${priceLabel}</span>
        <span class="product-status ${statusClass}">${statusLabel}</span>
      </div>
    </div>
  `;
}

function togglePriceType(val) {
  const priceInput = document.getElementById("editProductPrice");
  priceInput.disabled = (val !== "fixed");
  priceInput.style.opacity = (val !== "fixed") ? ".4" : "1";
  if (val !== "fixed") priceInput.value = "";
}

let editingProductId = null;

function openAddProduct() {
  editingProductId = null;
  document.getElementById("productModalTitle").textContent = "新增商品";
  document.getElementById("editProductName").value = "";
  document.getElementById("editProductTags").value = "";
  document.getElementById("editProductDesc").value = "";
  document.getElementById("editProductImg").value  = "";
  document.getElementById("editProductPrice").value = "";
  document.getElementById("editProductStatus").value = "available";
  document.getElementById("priceFixed").checked = true;
  togglePriceType("fixed");
  openModal("productModal");
}

function openEditProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingProductId = id;
  document.getElementById("productModalTitle").textContent = "編輯商品";
  document.getElementById("editProductName").value  = p.name;
  document.getElementById("editProductTags").value  = p.tags.join(", ");
  document.getElementById("editProductDesc").value  = p.desc;
  document.getElementById("editProductImg").value   = p.img;
  document.getElementById("editProductStatus").value = p.status;

  const pt = p.priceType || "fixed";
  document.getElementById("priceFixed").checked      = pt === "fixed";
  document.getElementById("priceNegotiate").checked  = pt === "negotiate";
  document.getElementById("priceCustom").checked     = pt === "custom";
  document.getElementById("editProductPrice").value  = pt === "fixed" ? p.price : "";
  togglePriceType(pt);
  openModal("productModal");
}

function saveProduct() {
  const name   = document.getElementById("editProductName").value.trim();
  const tags   = document.getElementById("editProductTags").value.split(",").map(t => t.trim()).filter(Boolean);
  const desc   = document.getElementById("editProductDesc").value.trim();
  const img    = document.getElementById("editProductImg").value.trim();
  const status = document.getElementById("editProductStatus").value;
  const priceType = document.querySelector('input[name="priceType"]:checked')?.value || "fixed";
  const price  = priceType === "fixed" ? (parseInt(document.getElementById("editProductPrice").value) || 0) : 0;

  if (!name) { toast("請填寫商品名稱"); return; }

  if (editingProductId) {
    const idx = products.findIndex(x => x.id === editingProductId);
    if (idx !== -1) products[idx] = { ...products[idx], name, tags, desc, img, price, priceType, status };
  } else {
    products.push({ id: "p" + Date.now(), name, tags, desc, img, price, priceType, status });
  }
  save("kc_products", products);
  renderProducts();
  closeModal("productModal");
  toast(editingProductId ? "商品已更新" : "商品已新增");
}

function deleteProduct(id) {
  if (!confirm("確定要刪除此商品？")) return;
  products = products.filter(p => p.id !== id);
  save("kc_products", products);
  renderProducts();
  toast("商品已刪除");
}

function showProductDetail(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  // simple inline detail — open cart flow directly
  if (p.status !== "closed") addToCart(id);
}

// ─── CART ─────────────────────────────────────
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p || p.status === "closed") return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty++;
  else cart.push({ id, qty: 1 });
  save("kc_cart", cart);
  updateCartCount();
  toast(`「${p.name}」已加入購物車`);
}

function updateCartCount() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById("cartCount").textContent = total;
}

function openCart() {
  renderCartModal();
  openModal("cartModal");
}

function renderCartModal() {
  const container = document.getElementById("cartItems");
  const customArea = document.getElementById("customPriceInputs");
  if (cart.length === 0) {
    container.innerHTML = `<div class="cart-empty">購物車是空的</div>`;
    customArea.innerHTML = "";
    document.getElementById("cartTotal").textContent = "";
    return;
  }
   function saveCustomPrice(id, val) {
  const c = cart.find(x => x.id === id);
  if (c) {
    c.customPrice = parseInt(val) || 0;
    save("kc_cart", cart);
  }
}
  container.innerHTML = cart.map(c => {
    const p = products.find(x => x.id === c.id);
    if (!p) return "";
    const pt = p.priceType || "fixed";
    const subtotal = pt === "fixed" ? p.price * c.qty : null;
    const priceDisplay = pt === "negotiate" ? "洽談" : pt === "custom" ? "自填金額" : subtotal > 0 ? "TWD " + subtotal.toLocaleString() : "洽談";
    return `
      <div class="cart-row">
        <span class="cart-row-name">${p.name}</span>
        <div class="cart-row-qty">
          <button onclick="changeQty('${c.id}',-1)">－</button>
          <span>${c.qty}</span>
          <button onclick="changeQty('${c.id}',1)">＋</button>
        </div>
        <span class="cart-row-price">${priceDisplay}</span>
      </div>`;
  }).join("");

  // Custom price inputs
  const customItems = cart.filter(c => {
    const p = products.find(x => x.id === c.id);
    return p && p.priceType === "custom";
  });
  if (customItems.length > 0) {
    customArea.innerHTML = `<div style="margin-top:14px;padding:12px;background:#f8f5ff;border-radius:10px;border:1px solid #ddd4f5">
      <p style="font-size:.8rem;color:#7c5cbf;margin-bottom:10px;font-weight:500">請填寫以下商品的委託金額（與委託人議定後填入）：</p>
      ${customItems.map(c => {
        const p = products.find(x => x.id === c.id);
        const saved = c.customPrice || "";
        return `<div style="margin-bottom:8px">
          <label style="font-size:.8rem;color:#555;display:block;margin-bottom:3px">${p.name} × ${c.qty}</label>
          <input type="number" id="customPrice_${c.id}" placeholder="請輸入金額 (TWD)" value="${saved}"
            style="width:100%;border:1px solid #ddd4f5;border-radius:7px;padding:7px 10px;font-size:.88rem;outline:none"
            oninput="saveCustomPrice('${c.id}', this.value)"/>
        </div>`;
      }).join("")}
    </div>`;
  } else {
    customArea.innerHTML = "";
  }

  const total = cart.reduce((s, c) => {
    const p = products.find(x => x.id === c.id);
    if (!p) return s;
    const pt = p.priceType || "fixed";
    if (pt === "fixed" && p.price > 0) return s + p.price * c.qty;
    return s;
  }, 0);
  document.getElementById("cartTotal").textContent = total > 0 ? `固定金額小計：TWD ${total.toLocaleString()}` : "";
}

function changeQty(id, delta) {
  const c = cart.find(x => x.id === id);
  if (!c) return;
  c.qty += delta;
  if (c.qty <= 0) cart = cart.filter(x => x.id !== id);
  save("kc_cart", cart);
  updateCartCount();
  renderCartModal();
}

// ─── 結帳 / 藍新金流 ──────────────────────────
function checkout() {
  const name  = document.getElementById("buyerName").value.trim();
  const email = document.getElementById("buyerEmail").value.trim();
  const note  = document.getElementById("buyerNote").value.trim();

  if (!name)  { toast("請填寫姓名");  return; }
  if (!email) { toast("請填寫 Email"); return; }
  if (!cart.length) { toast("購物車是空的"); return; }

  const hasNegotiate = cart.some(c => {
    const p = products.find(x => x.id === c.id);
    return p && p.priceType === "negotiate";
  });
  if (hasNegotiate) {
    toast("含有「洽談」商品，請先來信確認金額再付款");
    return;
  }

  // Collect custom prices
  let customTotal = 0;
  for (const c of cart) {
    const p = products.find(x => x.id === c.id);
    if (!p || p.priceType !== "custom") continue;
    // 購物車 modal 裡的 input
    const inputInModal = document.getElementById(`customPrice_${c.id}`);
    // 直接從 cart 物件讀取（若已存過）
    const savedVal = c.customPrice || 0;
    const val = parseInt(inputInModal?.value) || savedVal;
    if (val < 1) { toast(`請填寫「${p.name}」的委託金額`); return; }
    c.customPrice = val; // 存回 cart 物件
    customTotal += val * c.qty;
  }

  const fixedTotal = cart.reduce((s, c) => {
    const p = products.find(x => x.id === c.id);
    return s + (p && (p.priceType === "fixed" || !p.priceType) && p.price > 0 ? p.price * c.qty : 0);
  }, 0);

  const amt = fixedTotal + customTotal;
  if (amt < 1) { toast("訂單金額不得為 0"); return; }

  const itemDesc = cart.map(c => {
    const p = products.find(x => x.id === c.id);
    return p ? `${p.name}x${c.qty}` : "";
  }).filter(Boolean).join(", ");

  const MerchantOrderNo = "KC" + Date.now();
  const TimeStamp = Math.floor(Date.now() / 1000);

  const tradeParams = [
    `MerchantID=${NEWEBPAY_CONFIG.MerchantID}`,
    `RespondType=JSON`,
    `TimeStamp=${TimeStamp}`,
    `Version=2.0`,
    `MerchantOrderNo=${MerchantOrderNo}`,
    `Amt=${amt}`,
    `ItemDesc=${encodeURIComponent(itemDesc.slice(0, 50))}`,
    `Email=${encodeURIComponent(email)}`,
    `LoginType=0`,
    `CREDIT=1`,
  ].join("&");

  // 呼叫後端 API 加密
  fetch("/api/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart, buyerName: name, buyerEmail: email, buyerNote: note, products })
  })
  .then(r => r.json())
  .then(data => {
    if (data.error) { toast(data.error); return; }
    document.getElementById("fMerchantID").value = data.MerchantID;
    document.getElementById("fTradeInfo").value  = data.TradeInfo;
    document.getElementById("fTradeSha").value   = data.TradeSha;
    document.getElementById("paymentForm").action = data.gateway;
    document.getElementById("paymentForm").submit();
    cart = [];
    save("kc_cart", cart);
    updateCartCount();
    closeModal("cartModal");
  })
  .catch(() => toast("付款初始化失敗，請稍後再試"));;
}

/* ─── 藍新金流 AES/SHA256 加密（前端版） ─────────
   ⚠️  正式環境請將此段移至後端 (Node.js/PHP/Python)
   以防止 HashKey/HashIV 外洩。
   此前端版本用於開發測試。
─────────────────────────────────────────────── */
async function encryptAndSubmit(tradeParams, orderNo, buyerName, note) {
  try {
    const enc = new TextEncoder();

    // AES-CBC 加密
    const keyBytes = enc.encode(NEWEBPAY_CONFIG.HashKey);
    const ivBytes  = enc.encode(NEWEBPAY_CONFIG.HashIV);
    const dataBytes = enc.encode(tradeParams);

    // PKCS7 padding
    const blockSize = 16;
    const pad = blockSize - (dataBytes.length % blockSize);
    const padded = new Uint8Array(dataBytes.length + pad);
    padded.set(dataBytes);
    padded.fill(pad, dataBytes.length);

    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt"]
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: ivBytes }, cryptoKey, padded
    );

    // hex encode
    const TradeInfo = Array.from(new Uint8Array(encrypted))
      .map(b => b.toString(16).padStart(2, "0")).join("");

    // SHA256: HashKey + TradeInfo + HashIV
    const shaInput = `HashKey=${NEWEBPAY_CONFIG.HashKey}&${TradeInfo}&HashIV=${NEWEBPAY_CONFIG.HashIV}`;
    const shaBuffer = await crypto.subtle.digest("SHA-256", enc.encode(shaInput));
    const TradeSha = Array.from(new Uint8Array(shaBuffer))
      .map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    // 儲存訂單備註
    const orders = JSON.parse(localStorage.getItem("kc_orders") || "[]");
    orders.push({ orderNo, buyerName, note, cart: [...cart], date: new Date().toISOString() });
    localStorage.setItem("kc_orders", JSON.stringify(orders));

    // 提交表單到藍新
    document.getElementById("fMerchantID").value = NEWEBPAY_CONFIG.MerchantID;
    document.getElementById("fTradeInfo").value  = TradeInfo;
    document.getElementById("fTradeSha").value   = TradeSha;
    document.getElementById("paymentForm").action = NEWEBPAY_CONFIG.gateway;
    document.getElementById("paymentForm").submit();

    cart = [];
    save("kc_cart", cart);
    updateCartCount();

  } catch (err) {
    console.error("加密失敗", err);
    toast("付款初始化失敗，請稍後再試");
  }
}

// ─── 管理員模式 ──────────────────────────────
function toggleAdmin() {
  if (isAdmin) {
    isAdmin = false;
    document.getElementById("adminToggleBtn").classList.remove("active");
    document.getElementById("adminToggleBtn").textContent = "管理";
    document.querySelectorAll(".admin-only").forEach(el => el.classList.add("hidden"));
    renderProducts();
    toast("已退出管理模式");
  } else {
    openModal("adminModal");
    setTimeout(() => document.getElementById("adminPasswordInput").focus(), 50);
  }
}

function checkAdminPassword() {
  const val = document.getElementById("adminPasswordInput").value;
  if (val === ADMIN_PASSWORD) {
    isAdmin = true;
    closeModal("adminModal");
    document.getElementById("adminPasswordInput").value = "";
    document.getElementById("adminToggleBtn").classList.add("active");
    document.getElementById("adminToggleBtn").textContent = "退出管理";
    document.querySelectorAll(".admin-only").forEach(el => el.classList.remove("hidden"));
    renderProducts();
    toast("歡迎，管理員 👋");
  } else {
    toast("密碼錯誤");
  }
}

// ─── MODAL HELPERS ───────────────────────────
function openModal(id)  { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

// close on backdrop click
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.add("hidden");
  }
});

// Enter key in admin password
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && !document.getElementById("adminModal").classList.contains("hidden")) {
    checkAdminPassword();
  }
});

// ─── SCROLL HELPER ───────────────────────────
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ─── TOAST ───────────────────────────────────
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
