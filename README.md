# 📈 Sharegenius Swing Trader

**20-Day High/Low GTT System for NSE Blue-Chip Stocks**

A web app implementing the Sharegenius swing trading strategy: scan for stocks at their 20-day low, set GTT orders at the 20-day high, and track positions with automatic target and averaging calculations.

---

## 🚀 Deploy on Render

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sharegenius.git
git push -u origin main
```

### Step 2 — Create a New Web Service on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Configure:

| Setting | Value |
|---|---|
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free (or Starter for persistence) |

### Step 3 — Environment Variables (Optional)

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3000 | Render sets this automatically |
| `DATA_FILE` | `/tmp/sharegenius-data.json` | Data storage path |

> ⚠️ **Note:** On Render's **free tier**, the `/tmp` directory resets on redeploy. To persist watchlist/positions data across deploys, upgrade to a paid plan and use a **Render Disk** mounted at `/data`, then set `DATA_FILE=/data/sharegenius-data.json`.

---

## 🏠 Run Locally

```bash
npm install
npm start
```

Visit: `http://localhost:3000`

---

## 📋 Strategy Rules

| Rule | Description |
|---|---|
| **Signal** | Today's Low = 20-Day Low |
| **Entry** | GTT order at 20-Day High |
| **Target** | 20% above buy price |
| **Timeline** | 2–20 days (70% hit rate) |
| **No Stop-Loss** | Re-enter GTT if stock falls again |
| **Universe** | Nifty 50 / 100 / 200 blue-chips only |

### Averaging Targets

| Average | Target |
|---|---|
| First Buy | 20% |
| After 1st Average | 15% |
| After 2nd Average | 10% |
| After 3rd Average | 5% |

---

## ✨ Features

- **🔍 Scanner** — Live SSE-streamed scan of Nifty 50 / Next 50 / 100
- **👁 Watchlist** — Track GTT setup stocks, mark GTT as set
- **💼 Positions** — Track open positions, P&L, averaging, targets
- **📖 Guide** — Full strategy reference card

---

## ⚙️ Tech Stack

- **Backend:** Node.js + Express
- **Data:** Yahoo Finance (via `yahoo-finance2`)
- **Frontend:** Vanilla JS, single HTML file
- **Deployment:** Render.com

---

## ⚠️ Disclaimer

This app is for informational and personal use only. It does not constitute financial advice. Always verify GTT prices on your broker platform (Zerodha, Dhan, etc.) before placing orders. Past strategy performance does not guarantee future results.
