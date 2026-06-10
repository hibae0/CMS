# KANRI COMMISSION 網站

白底簡潔風格的委託接案網站，整合藍新金流 (Newebpay) MPG 付款。

---

## 快速開始

```bash
npm install
npm start
# 開啟 http://localhost:3000
```

---

## 管理員登入

點擊右上角「管理」按鈕，輸入密碼（預設：`kanri2026`）。

**請務必在 `app.js` 第 30 行更改密碼：**
```js
const ADMIN_PASSWORD = "你的新密碼";
```

---

## 藍新金流設定

已設定：
- 商店代號：MS1833659005
- 目前使用**測試環境**：`https://ccore.newebpay.com/MPG/mpg_gateway`

**上線前請改為正式環境：**
在 `server.js` 修改：
```js
const GATEWAY = "https://core.newebpay.com/MPG/mpg_gateway";
```

---

## 部署（免費方案）

### Render.com（推薦）
1. 上傳至 GitHub
2. 在 Render 建立 Web Service
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. 部署後更新 `server.js` 中的 ReturnURL / NotifyURL

### Railway / Fly.io
步驟類似，設定 PORT 環境變數即可。

---

## 安全提醒

- `server.js` 中已實作後端 AES+SHA256 加密（正式環境請使用此方式）
- 前端 `app.js` 中也有備用的 WebCrypto 加密（僅用於測試）
- 正式上線後，前端應呼叫 `/api/create-payment` 而非直接加密

---

## 檔案結構

```
commission-site/
├── index.html    # 主頁面
├── style.css     # 樣式
├── app.js        # 前端邏輯
├── server.js     # Node.js 後端（藍新加密 + Express）
├── package.json
└── README.md
```
