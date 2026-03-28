const express = require('express');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// On Render, use /tmp for ephemeral storage
const DATA_FILE = process.env.DATA_FILE || '/tmp/sharegenius-data.json';

app.use(express.json());
// HTML inlined — no public/ folder needed
const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sharegenius — Swing Trader</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    /* ── ROOT TOKENS ─────────────────────────────────── */
    :root {
      --bg:        #080c14;
      --bg2:       #0d1220;
      --bg3:       #111827;
      --bg4:       #1a2235;
      --border:    #1e2d45;
      --border2:   #263650;
      --text:      #c8d8f0;
      --text2:     #7a94b8;
      --text3:     #3d5270;
      --gold:      #f5a623;
      --gold2:     #e8952a;
      --gold-glow: rgba(245,166,35,0.15);
      --green:     #22d97a;
      --green2:    #16a34a;
      --green-bg:  rgba(34,217,122,0.08);
      --red:       #f05252;
      --red2:      #dc2626;
      --red-bg:    rgba(240,82,82,0.08);
      --blue:      #60a5fa;
      --cyan:      #22d3ee;
      --radius:    6px;
      --radius2:   10px;
      --mono:      'Space Mono', monospace;
      --sans:      'Syne', sans-serif;
    }

    /* ── RESET ───────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      min-height: 100vh;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    button { cursor: pointer; font-family: var(--sans); }
    input, select { font-family: var(--sans); }

    /* ── SCROLLBAR ───────────────────────────────────── */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg2); }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

    /* ── LAYOUT ──────────────────────────────────────── */
    #app { display: flex; flex-direction: column; min-height: 100vh; }

    /* ── HEADER ──────────────────────────────────────── */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 58px;
      background: var(--bg2);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      width: 32px; height: 32px;
      background: var(--gold);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }
    .logo-text {
      font-family: var(--sans);
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -0.5px;
      color: #fff;
    }
    .logo-text span { color: var(--gold); }
    .logo-tag {
      font-size: 10px;
      color: var(--text3);
      font-family: var(--mono);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-left: 2px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .market-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text2);
    }
    .market-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 6px var(--green);
      animation: pulse-dot 2s ease-in-out infinite;
    }
    .market-dot.closed { background: var(--red); box-shadow: 0 0 6px var(--red); animation: none; }
    @keyframes pulse-dot {
      0%,100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    #header-time {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--text3);
    }

    /* ── NAV TABS ────────────────────────────────────── */
    .tabs {
      display: flex;
      padding: 0 24px;
      background: var(--bg2);
      border-bottom: 1px solid var(--border);
      gap: 2px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 20px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text2);
      font-family: var(--sans);
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.3px;
      transition: all 0.2s;
      cursor: pointer;
      position: relative;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active {
      color: var(--gold);
      border-bottom-color: var(--gold);
    }
    .tab-badge {
      background: var(--gold);
      color: var(--bg);
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 10px;
      font-weight: 700;
      font-family: var(--mono);
      min-width: 18px;
      text-align: center;
    }
    .tab-badge.green { background: var(--green); }
    .tab-icon { font-size: 15px; }

    /* ── MAIN CONTENT ────────────────────────────────── */
    main { flex: 1; padding: 24px; max-width: 1400px; width: 100%; margin: 0 auto; }

    /* ── PANEL ───────────────────────────────────────── */
    .panel { display: none; }
    .panel.active { display: block; }

    /* ── SECTION HEADER ──────────────────────────────── */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
    }
    .section-subtitle {
      font-size: 12px;
      color: var(--text2);
      font-family: var(--mono);
      margin-top: 2px;
    }
    .section-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

    /* ── BUTTONS ─────────────────────────────────────── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 16px;
      border-radius: var(--radius);
      border: 1px solid var(--border2);
      background: var(--bg3);
      color: var(--text);
      font-size: 13px;
      font-weight: 600;
      transition: all 0.15s;
    }
    .btn:hover { border-color: var(--border2); background: var(--bg4); }
    .btn-primary {
      background: var(--gold);
      border-color: var(--gold);
      color: var(--bg);
    }
    .btn-primary:hover { background: var(--gold2); border-color: var(--gold2); }
    .btn-green {
      background: var(--green-bg);
      border-color: var(--green);
      color: var(--green);
    }
    .btn-green:hover { background: rgba(34,217,122,0.15); }
    .btn-red {
      background: var(--red-bg);
      border-color: var(--red);
      color: var(--red);
    }
    .btn-red:hover { background: rgba(240,82,82,0.15); }
    .btn-sm { padding: 5px 10px; font-size: 12px; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── SCAN CONTROLS ───────────────────────────────── */
    .scan-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .index-selector {
      display: flex;
      gap: 4px;
    }
    .idx-btn {
      padding: 8px 14px;
      border-radius: var(--radius);
      border: 1px solid var(--border2);
      background: var(--bg3);
      color: var(--text2);
      font-size: 12px;
      font-weight: 600;
      font-family: var(--mono);
      transition: all 0.15s;
      cursor: pointer;
    }
    .idx-btn:hover { border-color: var(--gold); color: var(--gold); }
    .idx-btn.active {
      background: var(--gold-glow);
      border-color: var(--gold);
      color: var(--gold);
    }

    /* ── PROGRESS BAR ────────────────────────────────── */
    .progress-wrap {
      margin: 16px 0;
      display: none;
    }
    .progress-wrap.visible { display: block; }
    .progress-meta {
      display: flex;
      justify-content: space-between;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text2);
      margin-bottom: 6px;
    }
    .progress-bar-bg {
      height: 4px;
      background: var(--bg4);
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--gold) 0%, var(--cyan) 100%);
      border-radius: 2px;
      transition: width 0.3s ease;
      width: 0%;
    }
    .scan-status {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text3);
      margin-top: 6px;
    }

    /* ── TABLE ───────────────────────────────────────── */
    .table-wrap {
      border: 1px solid var(--border);
      border-radius: var(--radius2);
      overflow: hidden;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead { background: var(--bg3); }
    thead th {
      padding: 12px 14px;
      text-align: left;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text3);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    thead th.num { text-align: right; }
    tbody tr {
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: var(--bg3); }
    tbody tr.alert-row { background: rgba(245,166,35,0.04); }
    tbody tr.alert-row:hover { background: rgba(245,166,35,0.08); }
    td {
      padding: 11px 14px;
      font-family: var(--mono);
      font-size: 12px;
      color: var(--text);
      white-space: nowrap;
    }
    td.num { text-align: right; }
    td.actions { text-align: right; }
    .empty-row td {
      text-align: center;
      padding: 40px 14px;
      color: var(--text3);
      font-family: var(--sans);
      font-size: 13px;
    }

    /* ── BADGES ──────────────────────────────────────── */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      font-family: var(--mono);
    }
    .badge-alert  { background: rgba(245,166,35,0.15); color: var(--gold);  border: 1px solid rgba(245,166,35,0.3); }
    .badge-watch  { background: rgba(96,165,250,0.1);  color: var(--blue);  border: 1px solid rgba(96,165,250,0.25); }
    .badge-gtt    { background: rgba(34,217,122,0.1);  color: var(--green); border: 1px solid rgba(34,217,122,0.25); }
    .badge-open   { background: rgba(34,211,238,0.1);  color: var(--cyan);  border: 1px solid rgba(34,211,238,0.25); }
    .badge-closed { background: var(--bg4);            color: var(--text3); border: 1px solid var(--border); }
    .badge-hit    { background: rgba(34,217,122,0.12); color: var(--green); border: 1px solid rgba(34,217,122,0.3); }

    /* ── P&L COLORS ──────────────────────────────────── */
    .up   { color: var(--green); }
    .down { color: var(--red); }
    .flat { color: var(--text2); }

    /* ── SYMBOL CELL ─────────────────────────────────── */
    .symbol-cell { display: flex; flex-direction: column; gap: 2px; }
    .sym-name { font-family: var(--sans); font-weight: 700; font-size: 13px; color: #fff; }
    .sym-sub  { font-family: var(--mono); font-size: 10px; color: var(--text3); }

    /* ── STATS ROW ───────────────────────────────────── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius2);
      padding: 16px;
    }
    .stat-label {
      font-size: 11px;
      font-family: var(--mono);
      color: var(--text3);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      font-family: var(--mono);
    }
    .stat-value.gold  { color: var(--gold); }
    .stat-value.green { color: var(--green); }
    .stat-value.red   { color: var(--red); }
    .stat-sub {
      font-size: 11px;
      color: var(--text3);
      font-family: var(--mono);
      margin-top: 3px;
    }

    /* ── MODAL ───────────────────────────────────────── */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(5,8,18,0.85);
      backdrop-filter: blur(4px);
      z-index: 200;
      align-items: center;
      justify-content: center;
    }
    .modal-overlay.open { display: flex; }
    .modal {
      background: var(--bg2);
      border: 1px solid var(--border2);
      border-radius: 12px;
      padding: 28px;
      width: 420px;
      max-width: 95vw;
      animation: slide-up 0.2s ease;
    }
    @keyframes slide-up {
      from { transform: translateY(20px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-close {
      width: 28px; height: 28px;
      border: 1px solid var(--border2);
      border-radius: 6px;
      background: var(--bg4);
      color: var(--text2);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 16px;
    }
    .modal-close:hover { color: #fff; border-color: var(--text2); }

    /* ── FORM ────────────────────────────────────────── */
    .form-group { margin-bottom: 14px; }
    .form-label {
      display: block;
      font-size: 11px;
      font-family: var(--mono);
      color: var(--text3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 9px 12px;
      background: var(--bg3);
      border: 1px solid var(--border2);
      border-radius: var(--radius);
      color: var(--text);
      font-family: var(--mono);
      font-size: 13px;
      transition: border-color 0.15s;
      outline: none;
    }
    .form-input:focus { border-color: var(--gold); }
    .form-input::placeholder { color: var(--text3); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-hint { font-size: 11px; color: var(--text3); font-family: var(--mono); margin-top: 4px; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

    /* ── POSITION DETAIL ─────────────────────────────── */
    .pos-avg-history {
      margin-top: 8px;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .pos-avg-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      font-family: var(--mono);
      font-size: 11px;
    }
    .pos-avg-row:last-child { border-bottom: none; }
    .pos-avg-label { color: var(--text2); }
    .pos-avg-price { color: var(--text); }
    .pos-avg-date  { color: var(--text3); }

    /* ── TARGET INDICATOR ────────────────────────────── */
    .target-bar {
      height: 3px;
      background: var(--bg4);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 4px;
    }
    .target-bar-fill {
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, var(--red) 0%, var(--gold) 60%, var(--green) 100%);
      transition: width 0.4s ease;
    }

    /* ── INFOBOX ─────────────────────────────────────── */
    .infobox {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius2);
      padding: 20px 24px;
      margin-bottom: 20px;
      display: flex;
      gap: 20px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .infobox-icon { font-size: 24px; flex-shrink: 0; }
    .infobox-text { flex: 1; min-width: 200px; }
    .infobox-title { font-weight: 700; color: #fff; margin-bottom: 4px; font-size: 14px; }
    .infobox-desc { font-size: 12px; color: var(--text2); line-height: 1.6; font-family: var(--mono); }

    /* ── RULE CHIPS ──────────────────────────────────── */
    .rules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .rule-card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius2);
      padding: 16px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .rule-num {
      width: 24px; height: 24px;
      flex-shrink: 0;
      background: var(--gold-glow);
      border: 1px solid rgba(245,166,35,0.3);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 700;
      color: var(--gold);
    }
    .rule-text { font-size: 12px; color: var(--text2); line-height: 1.5; font-family: var(--mono); }

    /* ── TOAST ───────────────────────────────────────── */
    #toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .toast {
      background: var(--bg2);
      border: 1px solid var(--border2);
      border-radius: var(--radius);
      padding: 12px 16px;
      font-size: 13px;
      color: var(--text);
      max-width: 320px;
      animation: toast-in 0.25s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .toast.success { border-color: var(--green); }
    .toast.error   { border-color: var(--red); }
    .toast.info    { border-color: var(--blue); }
    @keyframes toast-in {
      from { transform: translateX(20px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }

    /* ── EMPTY STATE ─────────────────────────────────── */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text3);
    }
    .empty-state-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.5; }
    .empty-state-title { font-size: 16px; font-weight: 700; color: var(--text2); margin-bottom: 6px; }
    .empty-state-desc { font-size: 13px; font-family: var(--mono); line-height: 1.6; }

    /* ── LOADING SPINNER ─────────────────────────────── */
    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(245,166,35,0.3);
      border-top-color: var(--gold);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── RESPONSIVE ──────────────────────────────────── */
    @media (max-width: 640px) {
      header { padding: 0 14px; }
      main { padding: 14px; }
      .tabs { padding: 0 14px; }
      .tab-btn { padding: 12px 12px; font-size: 12px; }
    }
  </style>
</head>
<body>
<div id="app">

  <!-- ═══════ HEADER ════════════════════════════════════ -->
  <header>
    <div class="logo">
      <div class="logo-icon">📈</div>
      <div>
        <div class="logo-text">Share<span>Genius</span></div>
        <div class="logo-tag">Swing Trader · GTT System</div>
      </div>
    </div>
    <div class="header-right">
      <div class="market-badge">
        <div class="market-dot" id="market-dot"></div>
        <span id="market-status">—</span>
      </div>
      <div id="header-time">—</div>
    </div>
  </header>

  <!-- ═══════ TABS ══════════════════════════════════════ -->
  <nav class="tabs">
    <button class="tab-btn active" onclick="switchTab('scanner')" id="tab-scanner">
      <span class="tab-icon">🔍</span> Scanner
    </button>
    <button class="tab-btn" onclick="switchTab('watchlist')" id="tab-watchlist">
      <span class="tab-icon">👁</span> Watchlist
      <span class="tab-badge" id="badge-watchlist">0</span>
    </button>
    <button class="tab-btn" onclick="switchTab('positions')" id="tab-positions">
      <span class="tab-icon">💼</span> Positions
      <span class="tab-badge green" id="badge-positions">0</span>
    </button>
    <button class="tab-btn" onclick="switchTab('guide')" id="tab-guide">
      <span class="tab-icon">📖</span> Strategy Guide
    </button>
  </nav>

  <!-- ═══════ MAIN CONTENT ══════════════════════════════ -->
  <main>

    <!-- ─── SCANNER PANEL ─────────────────────────────── -->
    <div class="panel active" id="panel-scanner">
      <div class="section-header">
        <div>
          <div class="section-title">20-Day Low Scanner</div>
          <div class="section-subtitle">SCAN NSE STOCKS WHERE TODAY'S LOW = 20-DAY LOW</div>
        </div>
        <div class="scan-controls">
          <div class="index-selector" id="index-selector">
            <button class="idx-btn active" data-index="NIFTY50">NIFTY 50</button>
            <button class="idx-btn" data-index="NIFTYNEXT50">NIFTY NEXT 50</button>
            <button class="idx-btn" data-index="NIFTY100">NIFTY 100</button>
          </div>
          <button class="btn btn-primary" id="scan-btn" onclick="startScan()">
            <span>▶</span> Start Scan
          </button>
        </div>
      </div>

      <!-- Progress -->
      <div class="progress-wrap" id="progress-wrap">
        <div class="progress-meta">
          <span id="progress-label">Scanning...</span>
          <span id="progress-pct">0%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="progress-fill"></div>
        </div>
        <div class="scan-status" id="scan-status">—</div>
      </div>

      <!-- Scanner Stats -->
      <div class="stats-row" id="scan-stats" style="display:none">
        <div class="stat-card">
          <div class="stat-label">Scanned</div>
          <div class="stat-value" id="stat-scanned">0</div>
          <div class="stat-sub">stocks checked</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🔔 Alerts Found</div>
          <div class="stat-value gold" id="stat-alerts">0</div>
          <div class="stat-sub">at 20-day low</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">GTT Trigger</div>
          <div class="stat-value" id="stat-gtt">Set 20D High</div>
          <div class="stat-sub">as GTT price</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Last Scan</div>
          <div class="stat-value" id="stat-time" style="font-size:14px">—</div>
          <div class="stat-sub">IST</div>
        </div>
      </div>

      <!-- Results Table -->
      <div class="table-wrap">
        <table id="scan-table">
          <thead>
            <tr>
              <th>Symbol / Name</th>
              <th class="num">Current ₹</th>
              <th class="num">Today Low</th>
              <th class="num">20D Low</th>
              <th class="num">20D High (GTT)</th>
              <th class="num">Chg %</th>
              <th>Status</th>
              <th class="actions">Action</th>
            </tr>
          </thead>
          <tbody id="scan-tbody">
            <tr class="empty-row">
              <td colspan="8">Select an index and click <strong>Start Scan</strong> to find stocks at 20-day low</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── WATCHLIST PANEL ───────────────────────────── -->
    <div class="panel" id="panel-watchlist">
      <div class="section-header">
        <div>
          <div class="section-title">Watchlist</div>
          <div class="section-subtitle">MONITOR STOCKS — UPDATE GTT TRIGGER WITH 20D HIGH</div>
        </div>
        <div class="section-actions">
          <button class="btn" onclick="refreshWatchlist()">
            <span>🔄</span> Refresh All
          </button>
          <button class="btn btn-primary" onclick="openAddWatchModal()">
            <span>+</span> Add Stock
          </button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Symbol / Name</th>
              <th class="num">Current ₹</th>
              <th class="num">Day Low</th>
              <th class="num">20D Low</th>
              <th class="num">20D High (GTT Trigger)</th>
              <th class="num">Chg %</th>
              <th>GTT Status</th>
              <th class="actions">Actions</th>
            </tr>
          </thead>
          <tbody id="watchlist-tbody">
            <tr class="empty-row">
              <td colspan="8">
                <div class="empty-state">
                  <div class="empty-state-icon">👁</div>
                  <div class="empty-state-title">Watchlist is empty</div>
                  <div class="empty-state-desc">Add stocks from the Scanner or manually using the button above</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── POSITIONS PANEL ───────────────────────────── -->
    <div class="panel" id="panel-positions">
      <div class="section-header">
        <div>
          <div class="section-title">Open Positions</div>
          <div class="section-subtitle">TRACK BUYS, P&L, TARGETS & AVERAGING</div>
        </div>
        <div class="section-actions">
          <button class="btn" onclick="refreshPositions()">
            <span>🔄</span> Refresh P&L
          </button>
          <button class="btn btn-primary" onclick="openAddPositionModal()">
            <span>+</span> Add Position
          </button>
        </div>
      </div>

      <!-- Portfolio Stats -->
      <div class="stats-row" id="portfolio-stats">
        <div class="stat-card">
          <div class="stat-label">Open Positions</div>
          <div class="stat-value" id="pstat-count">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Invested</div>
          <div class="stat-value gold" id="pstat-invested">₹0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Current Value</div>
          <div class="stat-value" id="pstat-current">₹0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Unrealised P&L</div>
          <div class="stat-value" id="pstat-pnl">₹0</div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th class="num">Avg Price</th>
              <th class="num">Qty</th>
              <th class="num">Invested</th>
              <th class="num">CMP ₹</th>
              <th class="num">P&L</th>
              <th class="num">P&L %</th>
              <th class="num">Target ₹</th>
              <th class="num">Target %</th>
              <th>Progress</th>
              <th>Avg #</th>
              <th class="actions">Actions</th>
            </tr>
          </thead>
          <tbody id="positions-tbody">
            <tr class="empty-row">
              <td colspan="12">
                <div class="empty-state">
                  <div class="empty-state-icon">💼</div>
                  <div class="empty-state-title">No open positions</div>
                  <div class="empty-state-desc">Add a position when your GTT order triggers</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── GUIDE PANEL ───────────────────────────────── -->
    <div class="panel" id="panel-guide">
      <div class="section-header">
        <div>
          <div class="section-title">Strategy Guide</div>
          <div class="section-subtitle">SHAREGENIUS SWING TRADING METHOD — 20D GTT SYSTEM</div>
        </div>
      </div>

      <div class="infobox">
        <div class="infobox-icon">⚡</div>
        <div class="infobox-text">
          <div class="infobox-title">Sharegenius 20-Day GTT Swing Method</div>
          <div class="infobox-desc">
            Buy stocks at their 20-day low using a GTT trigger at the 20-day high. Target 20% gains in 2–20 days.
            Apply only to blue-chip stocks (Nifty 50 / 100 / 200). Average down up to 3 times if stock falls further.
          </div>
        </div>
      </div>

      <div class="rules-grid">
        <div class="rule-card">
          <div class="rule-num">1</div>
          <div class="rule-text">Plan to buy a stock when it trades at its <strong>20-day low</strong>. Wait — do not buy immediately.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">2</div>
          <div class="rule-text">When today's low = 20-day low, set a <strong>GTT order</strong> with trigger price = 20-day high.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">3</div>
          <div class="rule-text">Update GTT trigger <strong>daily</strong> with the latest 20-day high. The scanner shows current GTT price automatically.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">4</div>
          <div class="rule-text">When the stock makes a <strong>fresh 20-day high</strong>, your GTT triggers and you buy at the best price.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">5</div>
          <div class="rule-text"><strong>Target: 20%</strong> above your buy price. In 70% of cases this is achieved within 2–20 days.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">6</div>
          <div class="rule-text">If stock falls again — <strong>no stop-loss</strong>. When it reaches 20-day low again, restart the GTT system.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">7</div>
          <div class="rule-text">Apply <strong>only to Nifty 50, Nifty 100, Nifty 200</strong> blue-chip stocks. No small caps or penny stocks.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">8</div>
          <div class="rule-text">Maximum <strong>3 averages</strong> allowed. Each average reduces the target by 5%.</div>
        </div>
      </div>

      <div class="section-title" style="font-size:16px; margin-bottom:14px; margin-top:8px">Averaging Target Reduction</div>
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">First Buy</div>
          <div class="stat-value green">20%</div>
          <div class="stat-sub">Initial target</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">After 1st Average</div>
          <div class="stat-value gold">15%</div>
          <div class="stat-sub">Reduced target</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">After 2nd Average</div>
          <div class="stat-value" style="color:var(--cyan)">10%</div>
          <div class="stat-sub">Reduced target</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">After 3rd Average</div>
          <div class="stat-value red">5%</div>
          <div class="stat-sub">Minimum target</div>
        </div>
      </div>
    </div>

  </main>
</div>

<!-- ═══════ MODALS ═════════════════════════════════════ -->

<!-- Add to Watchlist -->
<div class="modal-overlay" id="modal-addwatch">
  <div class="modal">
    <div class="modal-title">
      Add to Watchlist
      <button class="modal-close" onclick="closeModal('modal-addwatch')">✕</button>
    </div>
    <div class="form-group">
      <label class="form-label">NSE Symbol</label>
      <input class="form-input" id="aw-symbol" placeholder="e.g. RELIANCE, INFY, TCS" />
      <div class="form-hint">Enter NSE ticker without .NS suffix</div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes (optional)</label>
      <input class="form-input" id="aw-notes" placeholder="e.g. At 52W low, strong support" />
    </div>
    <div class="form-actions">
      <button class="btn" onclick="closeModal('modal-addwatch')">Cancel</button>
      <button class="btn btn-primary" onclick="addToWatchlist()">Add Stock</button>
    </div>
  </div>
</div>

<!-- Add Position -->
<div class="modal-overlay" id="modal-addpos">
  <div class="modal">
    <div class="modal-title">
      Add Position
      <button class="modal-close" onclick="closeModal('modal-addpos')">✕</button>
    </div>
    <div class="form-group">
      <label class="form-label">NSE Symbol</label>
      <input class="form-input" id="ap-symbol" placeholder="e.g. RELIANCE" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Buy Price ₹</label>
        <input class="form-input" id="ap-price" type="number" step="0.05" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input class="form-input" id="ap-qty" type="number" step="1" placeholder="0" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes (optional)</label>
      <input class="form-input" id="ap-notes" placeholder="GTT triggered, date, etc." />
    </div>
    <div class="form-hint" style="margin-bottom:4px">Initial target will be set at <strong>20%</strong> above buy price.</div>
    <div class="form-actions">
      <button class="btn" onclick="closeModal('modal-addpos')">Cancel</button>
      <button class="btn btn-primary" onclick="addPosition()">Add Position</button>
    </div>
  </div>
</div>

<!-- Average Down -->
<div class="modal-overlay" id="modal-average">
  <div class="modal">
    <div class="modal-title">
      Average Down
      <button class="modal-close" onclick="closeModal('modal-average')">✕</button>
    </div>
    <div id="avg-info" style="margin-bottom:14px;"></div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Buy Price ₹</label>
        <input class="form-input" id="avg-price" type="number" step="0.05" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input class="form-input" id="avg-qty" type="number" step="1" placeholder="0" />
      </div>
    </div>
    <div class="form-hint" id="avg-hint">Target will reduce after averaging.</div>
    <div class="form-actions">
      <button class="btn" onclick="closeModal('modal-average')">Cancel</button>
      <button class="btn btn-green" onclick="submitAverage()">Average Down</button>
    </div>
  </div>
</div>

<!-- Close Position -->
<div class="modal-overlay" id="modal-close-pos">
  <div class="modal">
    <div class="modal-title">
      Close / Book Position
      <button class="modal-close" onclick="closeModal('modal-close-pos')">✕</button>
    </div>
    <div id="close-pos-info" style="margin-bottom:14px;"></div>
    <div class="form-group">
      <label class="form-label">Exit Price ₹</label>
      <input class="form-input" id="close-price" type="number" step="0.05" placeholder="0.00" />
    </div>
    <div class="form-actions">
      <button class="btn" onclick="closeModal('modal-close-pos')">Cancel</button>
      <button class="btn btn-red" onclick="submitClosePosition()">Book & Close</button>
    </div>
  </div>
</div>

<!-- Toast Container -->
<div id="toast-container"></div>

<script>
// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
const state = {
  currentTab: 'scanner',
  selectedIndex: 'NIFTY50',
  scanResults: [],
  watchlist: [],
  positions: [],
  scanning: false,
  avgTargetId: null,
  closePosId: null,
};

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
const fmt = (n, d=2) => n == null ? '—' : Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtCurr = (n, d=2) => n == null ? '—' : '₹' + fmt(n, d);
const pct = n => n == null ? '—' : (n >= 0 ? '+' : '') + fmt(n, 2) + '%';
const clsChg = n => n > 0 ? 'up' : n < 0 ? 'down' : 'flat';

function toast(msg, type='info', dur=4000) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = \`toast \${type}\`;
  el.innerHTML = \`<span>\${icons[type]||'ℹ️'}</span><span>\${msg}</span>\`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), dur);
}

async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
}

function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
  if (tab === 'watchlist') loadWatchlist();
  if (tab === 'positions') loadPositions();
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ═══════════════════════════════════════════════════════
//  CLOCK & MARKET STATUS
// ═══════════════════════════════════════════════════════
function updateClock() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hh = ist.getHours(), mm = ist.getMinutes();
  const timeStr = ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' });
  const day = ist.getDay();

  document.getElementById('header-time').textContent = \`IST \${timeStr}\`;

  const isWeekend = day === 0 || day === 6;
  const isMarketHours = hh > 9 || (hh === 9 && mm >= 15);
  const isMarketClose = hh > 15 || (hh === 15 && mm >= 30);
  const isOpen = !isWeekend && isMarketHours && !isMarketClose;

  const dot = document.getElementById('market-dot');
  const status = document.getElementById('market-status');
  dot.className = 'market-dot' + (isOpen ? '' : ' closed');
  status.textContent = isOpen ? 'NSE OPEN' : 'NSE CLOSED';
}
setInterval(updateClock, 1000);
updateClock();

// ═══════════════════════════════════════════════════════
//  INDEX SELECTOR
// ═══════════════════════════════════════════════════════
document.querySelectorAll('.idx-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.idx-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedIndex = btn.dataset.index;
  });
});

// ═══════════════════════════════════════════════════════
//  SCANNER
// ═══════════════════════════════════════════════════════
function startScan() {
  if (state.scanning) return;
  state.scanning = true;
  state.scanResults = [];

  const btn = document.getElementById('scan-btn');
  btn.innerHTML = '<span class="spinner"></span> Scanning...';
  btn.disabled = true;

  const wrap = document.getElementById('progress-wrap');
  wrap.classList.add('visible');
  document.getElementById('scan-stats').style.display = 'none';
  document.getElementById('scan-tbody').innerHTML = '';

  const es = new EventSource(\`/api/scan/\${state.selectedIndex}\`);
  let total = 0, current = 0, alerts = 0;

  es.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if (msg.type === 'start') {
      total = msg.total;
      document.getElementById('progress-label').textContent = \`Scanning \${msg.index}...\`;
    }

    if (msg.type === 'progress') {
      current = msg.current;
      const p = Math.round((current / total) * 100);
      document.getElementById('progress-fill').style.width = p + '%';
      document.getElementById('progress-pct').textContent = p + '%';
      document.getElementById('scan-status').textContent =
        \`\${msg.symbol}\${msg.error ? ' ⚠️ ' + msg.error : ''}\`;

      if (msg.data) {
        state.scanResults.push(msg.data);
        if (msg.data.isAt20DayLow) {
          alerts++;
          document.getElementById('stat-alerts').textContent = alerts;
          appendScanRow(msg.data, true);
        } else {
          appendScanRow(msg.data, false);
        }
      }
    }

    if (msg.type === 'complete') {
      es.close();
      state.scanning = false;
      btn.innerHTML = '<span>▶</span> Start Scan';
      btn.disabled = false;
      wrap.classList.remove('visible');

      const stats = document.getElementById('scan-stats');
      stats.style.display = 'grid';
      document.getElementById('stat-scanned').textContent = msg.total;
      document.getElementById('stat-alerts').textContent = msg.found;
      document.getElementById('stat-time').textContent = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Move alert rows to top
      reorderScanTable();
      toast(\`Scan complete — \${msg.found} stocks at 20-day low\`, 'success');
    }
  };

  es.onerror = () => {
    es.close();
    state.scanning = false;
    btn.innerHTML = '<span>▶</span> Start Scan';
    btn.disabled = false;
    document.getElementById('progress-wrap').classList.remove('visible');
    toast('Scan error. Check server connection.', 'error');
  };
}

function appendScanRow(d, isAlert) {
  const tbody = document.getElementById('scan-tbody');
  const chgPct = d.changePct ?? 0;
  const row = document.createElement('tr');
  if (isAlert) row.className = 'alert-row';
  row.dataset.symbol = d.symbol;
  row.dataset.alert = isAlert ? '1' : '0';
  row.innerHTML = \`
    <td>
      <div class="symbol-cell">
        <span class="sym-name">\${d.symbol}</span>
        <span class="sym-sub">\${(d.name||'').slice(0,28)}</span>
      </div>
    </td>
    <td class="num">\${fmtCurr(d.currentPrice)}</td>
    <td class="num">\${fmtCurr(d.todayLow)}</td>
    <td class="num \${isAlert ? 'up' : ''}">\${fmtCurr(d.low20)}</td>
    <td class="num" style="color:var(--gold)">\${fmtCurr(d.high20)}</td>
    <td class="num \${clsChg(chgPct)}">\${pct(chgPct)}</td>
    <td>
      \${isAlert
        ? '<span class="badge badge-alert">🔔 20D LOW MATCH</span>'
        : '<span class="badge badge-closed">Monitoring</span>'
      }
    </td>
    <td class="actions">
      <button class="btn btn-sm" onclick='addToWatchlistFromScan(\${JSON.stringify(d)})'>+ Watch</button>
      \${isAlert ? \`<button class="btn btn-sm btn-green" onclick='addToWatchlistFromScan(\${JSON.stringify(d)}, true)'>+ GTT</button>\` : ''}
    </td>
  \`;
  tbody.appendChild(row);
}

function reorderScanTable() {
  const tbody = document.getElementById('scan-tbody');
  const rows = Array.from(tbody.querySelectorAll('tr[data-symbol]'));
  const alerts = rows.filter(r => r.dataset.alert === '1');
  const others = rows.filter(r => r.dataset.alert === '0');
  [...alerts, ...others].forEach(r => tbody.appendChild(r));
}

async function addToWatchlistFromScan(data, gttSet = false) {
  const r = await api('POST', '/api/watchlist', {
    symbol: data.symbol,
    notes: gttSet ? \`GTT: \${fmtCurr(data.high20)}\` : ''
  });
  if (r.success) {
    if (gttSet) await api('PUT', \`/api/watchlist/\${data.symbol}\`, { gttSet: true });
    toast(\`\${data.symbol} added to watchlist\`, 'success');
    updateWatchlistBadge();
  } else {
    toast(r.error || 'Failed to add', 'error');
  }
}

// ═══════════════════════════════════════════════════════
//  WATCHLIST
// ═══════════════════════════════════════════════════════
async function loadWatchlist() {
  const r = await api('GET', '/api/watchlist');
  if (!r.success) return;
  state.watchlist = r.data;
  renderWatchlist();
  updateWatchlistBadge();
}

async function refreshWatchlist() {
  if (!state.watchlist.length) return;
  toast('Refreshing watchlist prices...', 'info', 2000);

  const symbols = state.watchlist.map(w => w.symbol);
  const r = await api('POST', '/api/stocks/batch', { symbols });
  if (!r.success) return toast('Refresh failed', 'error');

  const map = {};
  r.results.forEach(row => { if (row.success) map[row.symbol] = row.data; });

  state.watchlist.forEach(w => {
    if (map[w.symbol]) w._live = map[w.symbol];
  });
  renderWatchlist();
  toast('Prices updated', 'success');
}

function renderWatchlist() {
  const tbody = document.getElementById('watchlist-tbody');
  if (!state.watchlist.length) {
    tbody.innerHTML = \`<tr class="empty-row"><td colspan="8">
      <div class="empty-state">
        <div class="empty-state-icon">👁</div>
        <div class="empty-state-title">Watchlist is empty</div>
        <div class="empty-state-desc">Add stocks from the Scanner or use the + Add Stock button</div>
      </div></td></tr>\`;
    return;
  }

  tbody.innerHTML = state.watchlist.map(w => {
    const d = w._live || {};
    const chgPct = d.changePct ?? null;
    return \`
    <tr>
      <td>
        <div class="symbol-cell">
          <span class="sym-name">\${w.symbol}</span>
          <span class="sym-sub">\${(d.name||w.notes||'').slice(0,28)}</span>
        </div>
      </td>
      <td class="num">\${fmtCurr(d.currentPrice)}</td>
      <td class="num">\${fmtCurr(d.dayLow)}</td>
      <td class="num">\${fmtCurr(d.low20)}</td>
      <td class="num" style="color:var(--gold);font-weight:700">\${fmtCurr(d.high20)}</td>
      <td class="num \${clsChg(chgPct)}">\${chgPct != null ? pct(chgPct) : '—'}</td>
      <td>
        \${w.gttSet
          ? '<span class="badge badge-gtt">✅ GTT Set</span>'
          : '<span class="badge badge-watch">⏳ Watching</span>'
        }
      </td>
      <td class="actions" style="display:flex;gap:6px;justify-content:flex-end">
        <button class="btn btn-sm" onclick="refreshSingleWatch('\${w.symbol}')">🔄</button>
        <button class="btn btn-sm \${w.gttSet ? '' : 'btn-green'}" onclick="toggleGTT('\${w.symbol}', \${!w.gttSet})">
          \${w.gttSet ? 'GTT ✓' : 'Set GTT'}
        </button>
        <button class="btn btn-sm btn-primary" onclick="watchToPosition('\${w.symbol}', \${d.currentPrice||0})">Buy</button>
        <button class="btn btn-sm btn-red" onclick="removeFromWatchlist('\${w.symbol}')">✕</button>
      </td>
    </tr>\`;
  }).join('');
}

async function refreshSingleWatch(symbol) {
  const r = await api('GET', \`/api/stock/\${symbol}\`);
  if (!r.success) return toast(\`Failed to refresh \${symbol}\`, 'error');
  const w = state.watchlist.find(x => x.symbol === symbol);
  if (w) { w._live = r.data; renderWatchlist(); }
  toast(\`\${symbol} refreshed\`, 'success', 2000);
}

async function toggleGTT(symbol, gttSet) {
  await api('PUT', \`/api/watchlist/\${symbol}\`, { gttSet });
  const w = state.watchlist.find(x => x.symbol === symbol);
  if (w) { w.gttSet = gttSet; renderWatchlist(); }
}

async function removeFromWatchlist(symbol) {
  if (!confirm(\`Remove \${symbol} from watchlist?\`)) return;
  await api('DELETE', \`/api/watchlist/\${symbol}\`);
  state.watchlist = state.watchlist.filter(w => w.symbol !== symbol);
  renderWatchlist();
  updateWatchlistBadge();
  toast(\`\${symbol} removed\`, 'info');
}

function openAddWatchModal() {
  document.getElementById('aw-symbol').value = '';
  document.getElementById('aw-notes').value = '';
  openModal('modal-addwatch');
}

async function addToWatchlist() {
  const sym = document.getElementById('aw-symbol').value.trim().toUpperCase();
  const notes = document.getElementById('aw-notes').value.trim();
  if (!sym) return toast('Enter a symbol', 'error');
  const r = await api('POST', '/api/watchlist', { symbol: sym, notes });
  if (r.success) {
    toast(\`\${sym} added to watchlist\`, 'success');
    closeModal('modal-addwatch');
    loadWatchlist();
  } else {
    toast(r.error || 'Failed', 'error');
  }
}

function watchToPosition(symbol, price) {
  document.getElementById('ap-symbol').value = symbol;
  document.getElementById('ap-price').value = price || '';
  document.getElementById('ap-qty').value = '';
  document.getElementById('ap-notes').value = 'GTT triggered';
  openModal('modal-addpos');
  switchTab('positions');
}

function updateWatchlistBadge() {
  document.getElementById('badge-watchlist').textContent = state.watchlist.length;
}

// ═══════════════════════════════════════════════════════
//  POSITIONS
// ═══════════════════════════════════════════════════════
const TARGET_PCT = [20, 15, 10, 5];

async function loadPositions() {
  const r = await api('GET', '/api/positions');
  if (!r.success) return;
  state.positions = r.data.filter(p => p.status !== 'closed');
  renderPositions();
  updatePositionsBadge();
}

async function refreshPositions() {
  if (!state.positions.length) return;
  toast('Fetching current prices...', 'info', 2000);
  const symbols = [...new Set(state.positions.map(p => p.symbol))];
  const r = await api('POST', '/api/stocks/batch', { symbols });
  if (!r.success) return toast('Refresh failed', 'error');
  const map = {};
  r.results.forEach(row => { if (row.success) map[row.symbol] = row.data; });
  state.positions.forEach(pos => {
    if (map[pos.symbol]) pos._cmp = map[pos.symbol].currentPrice;
  });
  renderPositions();
  toast('Prices refreshed', 'success');
}

function renderPositions() {
  const tbody = document.getElementById('positions-tbody');

  const open = state.positions.filter(p => p.status !== 'closed');
  if (!open.length) {
    tbody.innerHTML = \`<tr class="empty-row"><td colspan="12">
      <div class="empty-state">
        <div class="empty-state-icon">💼</div>
        <div class="empty-state-title">No open positions</div>
        <div class="empty-state-desc">Add a position when your GTT order triggers</div>
      </div></td></tr>\`;
    updatePortfolioStats(0, 0, 0);
    return;
  }

  let totalInvested = 0, totalCurrent = 0;

  tbody.innerHTML = open.map(pos => {
    const cmp = pos._cmp ?? null;
    const invested = pos.avgPrice * pos.qty;
    const currentVal = cmp != null ? cmp * pos.qty : null;
    const pnl = currentVal != null ? currentVal - invested : null;
    const pnlPct = pnl != null ? (pnl / invested) * 100 : null;
    const targetPct = TARGET_PCT[Math.min(pos.averageCount || 0, 3)];
    const targetPrice = pos.avgPrice * (1 + targetPct / 100);
    const avgCount = pos.averageCount || 0;
    const maxAvgs = 3;

    // Progress toward target
    let progressPct = 0;
    if (cmp != null && cmp > pos.avgPrice) {
      progressPct = Math.min(((cmp - pos.avgPrice) / (targetPrice - pos.avgPrice)) * 100, 100);
    }

    totalInvested += invested;
    if (currentVal != null) totalCurrent += currentVal;

    const targetHit = pnlPct != null && pnlPct >= targetPct;

    return \`
    <tr \${targetHit ? 'class="alert-row"' : ''}>
      <td>
        <div class="symbol-cell">
          <span class="sym-name">\${pos.symbol}</span>
          <span class="sym-sub">\${pos.notes ? pos.notes.slice(0,20) : ''}</span>
        </div>
      </td>
      <td class="num">\${fmtCurr(pos.avgPrice)}</td>
      <td class="num">\${fmt(pos.qty, 0)}</td>
      <td class="num">\${fmtCurr(invested, 0)}</td>
      <td class="num">\${cmp != null ? fmtCurr(cmp) : '<span style="color:var(--text3)">Click 🔄</span>'}</td>
      <td class="num \${clsChg(pnl)}">\${pnl != null ? fmtCurr(pnl, 0) : '—'}</td>
      <td class="num \${clsChg(pnlPct)}">\${pnlPct != null ? pct(pnlPct) : '—'}</td>
      <td class="num" style="color:var(--gold)">\${fmtCurr(targetPrice)}</td>
      <td class="num" style="color:var(--gold)">\${targetPct}%</td>
      <td>
        <div class="target-bar"><div class="target-bar-fill" style="width:\${progressPct}%"></div></div>
        <div style="font-size:10px;color:var(--text3);font-family:var(--mono);margin-top:3px">\${Math.round(progressPct)}%</div>
      </td>
      <td style="text-align:center">
        \${avgCount > 0 ? \`<span class="badge badge-open">\${avgCount}×avg</span>\` : '<span class="badge badge-closed">—</span>'}
        \${targetHit ? '<span class="badge badge-hit" style="margin-top:2px">🎯 TARGET HIT</span>' : ''}
      </td>
      <td class="actions" style="display:flex;gap:4px;justify-content:flex-end;flex-wrap:wrap">
        \${avgCount < maxAvgs
          ? \`<button class="btn btn-sm btn-green" onclick="openAverageModal('\${pos.id}')">Avg↓</button>\`
          : '<span style="font-size:10px;color:var(--text3);font-family:var(--mono);align-self:center">Max avg</span>'
        }
        <button class="btn btn-sm btn-primary" onclick="openClosePosModal('\${pos.id}')">Close</button>
        <button class="btn btn-sm btn-red" onclick="deletePosition('\${pos.id}')">✕</button>
      </td>
    </tr>\`;
  }).join('');

  const pnlTotal = totalCurrent > 0 ? totalCurrent - totalInvested : null;
  updatePortfolioStats(open.length, totalInvested, totalCurrent, pnlTotal);
}

function updatePortfolioStats(count, invested, current, pnl) {
  document.getElementById('pstat-count').textContent = count;
  document.getElementById('pstat-invested').textContent = fmtCurr(invested, 0);
  document.getElementById('pstat-current').textContent = current ? fmtCurr(current, 0) : '—';
  const pnlEl = document.getElementById('pstat-pnl');
  pnlEl.textContent = pnl != null ? fmtCurr(pnl, 0) : '—';
  pnlEl.className = 'stat-value ' + (pnl > 0 ? 'green' : pnl < 0 ? 'red' : '');
  document.getElementById('badge-positions').textContent = count;
}

function openAddPositionModal() {
  ['ap-symbol','ap-price','ap-qty','ap-notes'].forEach(id => document.getElementById(id).value = '');
  openModal('modal-addpos');
}

async function addPosition() {
  const symbol    = document.getElementById('ap-symbol').value.trim().toUpperCase();
  const buyPrice  = parseFloat(document.getElementById('ap-price').value);
  const qty       = parseFloat(document.getElementById('ap-qty').value);
  const notes     = document.getElementById('ap-notes').value.trim();
  if (!symbol || !buyPrice || !qty) return toast('Fill all required fields', 'error');
  const r = await api('POST', '/api/positions', { symbol, buyPrice, qty, notes });
  if (r.success) {
    toast(\`\${symbol} position added — target ₹\${fmtCurr(r.data.targetPrice)}\`, 'success');
    closeModal('modal-addpos');
    loadPositions();
  } else {
    toast(r.error || 'Failed', 'error');
  }
}

function openAverageModal(posId) {
  const pos = state.positions.find(p => p.id === posId);
  if (!pos) return;
  state.avgTargetId = posId;
  const nextAvg = (pos.averageCount || 0) + 1;
  const newTargetPct = TARGET_PCT[Math.min(nextAvg, 3)];
  document.getElementById('avg-info').innerHTML = \`
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px">
      <div style="font-family:var(--mono);font-size:12px;color:var(--text2)">
        <strong>\${pos.symbol}</strong> · Current avg: ₹\${fmt(pos.avgPrice)} · Avg #\${pos.averageCount||0}/\${3}
      </div>
      <div style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-top:4px">
        After averaging: target reduces to <strong style="color:var(--gold)">\${newTargetPct}%</strong>
      </div>
    </div>\`;
  document.getElementById('avg-hint').textContent =
    \`This will be Average #\${nextAvg}. New target: \${newTargetPct}%\`;
  document.getElementById('avg-price').value = '';
  document.getElementById('avg-qty').value = '';
  openModal('modal-average');
}

async function submitAverage() {
  const price = parseFloat(document.getElementById('avg-price').value);
  const qty   = parseFloat(document.getElementById('avg-qty').value);
  if (!price || !qty) return toast('Enter price and qty', 'error');
  const r = await api('POST', \`/api/positions/\${state.avgTargetId}/average\`, { price, qty });
  if (r.success) {
    toast(\`Averaged down — new avg ₹\${fmt(r.data.avgPrice)}, target \${r.data.targetPct}%\`, 'success');
    closeModal('modal-average');
    loadPositions();
  } else {
    toast(r.error || 'Failed', 'error');
  }
}

function openClosePosModal(posId) {
  const pos = state.positions.find(p => p.id === posId);
  if (!pos) return;
  state.closePosId = posId;
  document.getElementById('close-pos-info').innerHTML = \`
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-family:var(--mono);font-size:12px">
      <div><strong>\${pos.symbol}</strong> · Avg buy: ₹\${fmt(pos.avgPrice)} · Qty: \${fmt(pos.qty,0)}</div>
      <div style="color:var(--gold);margin-top:4px">Target: ₹\${fmt(pos.targetPrice)} (+\${pos.targetPct}%)</div>
    </div>\`;
  document.getElementById('close-price').value = pos._cmp || '';
  openModal('modal-close-pos');
}

async function submitClosePosition() {
  const exitPrice = parseFloat(document.getElementById('close-price').value);
  if (!exitPrice) return toast('Enter exit price', 'error');
  const r = await api('PUT', \`/api/positions/\${state.closePosId}\`, { status: 'closed', exitPrice, closedAt: new Date().toISOString() });
  if (r.success) {
    const pos = state.positions.find(p => p.id === state.closePosId);
    const pnl = pos ? (exitPrice - pos.avgPrice) * pos.qty : 0;
    toast(\`Position closed · P&L: \${fmtCurr(pnl, 0)}\`, pnl >= 0 ? 'success' : 'error');
    closeModal('modal-close-pos');
    loadPositions();
  } else {
    toast(r.error || 'Failed', 'error');
  }
}

async function deletePosition(posId) {
  const pos = state.positions.find(p => p.id === posId);
  if (!confirm(\`Delete \${pos?.symbol} position?\`)) return;
  await api('DELETE', \`/api/positions/\${posId}\`);
  toast('Position deleted', 'info');
  loadPositions();
}

function updatePositionsBadge() {
  document.getElementById('badge-positions').textContent = state.positions.length;
}

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
(async function init() {
  await Promise.all([loadWatchlist(), loadPositions()]);
})();
</script>
</body>
</html>
`;

// ─────────────────────────────────────────────
//  STOCK UNIVERSE
// ─────────────────────────────────────────────
const NIFTY50 = [
  'ADANIENT','ADANIPORTS','APOLLOHOSP','ASIANPAINT','AXISBANK',
  'BAJAJ-AUTO','BAJAJFINSV','BAJFINANCE','BHARTIARTL','BPCL',
  'BRITANNIA','CIPLA','COALINDIA','DIVISLAB','DRREDDY',
  'EICHERMOT','GRASIM','HCLTECH','HDFCBANK','HDFCLIFE',
  'HEROMOTOCO','HINDALCO','HINDUNILVR','ICICIBANK','INDUSINDBK',
  'INFY','ITC','JSWSTEEL','KOTAKBANK','LT',
  'M&M','MARUTI','NESTLEIND','NTPC','ONGC',
  'POWERGRID','RELIANCE','SBILIFE','SBIN','SHRIRAMFIN',
  'SUNPHARMA','TATACONSUM','TATAMOTORS','TATASTEEL','TCS',
  'TECHM','TITAN','TRENT','ULTRACEMCO','WIPRO'
];

const NIFTY_NEXT50 = [
  'ABB','ADANIGREEN','ADANIPOWER','AMBUJACEM','BAJAJHLDNG',
  'BANKBARODA','BEL','BERGEPAINT','BOSCHLTD','CANBK',
  'CHOLAFIN','COLPAL','DLF','GAIL','HAVELLS',
  'INDHOTEL','IRCTC','JINDALSTEL','LTIM','LUPIN',
  'MCDOWELL-N','NHPC','NYKAA','OBEROIRLTY','OFSS',
  'PAGEIND','PIIND','PIDILITIND','PNB','RECLTD',
  'SAIL','SIEMENS','SRF','TATACOMM','TATAPOWER',
  'TORNTPHARM','TORNTPOWER','TVSMOTOR','UBL','UNIONBANK',
  'VBL','VEDL','VOLTAS','ZOMATO','ZYDUSLIFE',
  'GODREJCP','GODREJPROP','MFSL','OFSS','PERSISTENT'
];

const STOCK_UNIVERSE = {
  'NIFTY50': NIFTY50,
  'NIFTYNEXT50': NIFTY_NEXT50,
  'NIFTY100': [...new Set([...NIFTY50, ...NIFTY_NEXT50])]
};

// ─────────────────────────────────────────────
//  DATA PERSISTENCE
// ─────────────────────────────────────────────
async function loadData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { positions: [], watchlist: [], settings: {} };
  }
}

async function saveData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Save error:', err.message);
  }
}

// ─────────────────────────────────────────────
//  YAHOO FINANCE HELPERS
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  YAHOO FINANCE — DIRECT HTTP (no library)
//  Uses Yahoo's v8 chart API. No dependency on
//  yahoo-finance2 so it never breaks on updates.
// ─────────────────────────────────────────────
const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function yfFetch(url) {
  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${url}`);
  return res.json();
}

// OHLCV history via v8/finance/chart
async function getHistory(ticker, period1Unix, period2Unix) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?period1=${period1Unix}&period2=${period2Unix}&interval=1d&includePrePost=false`;
  const data = await yfFetch(url);
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No chart result for ${ticker}`);

  const timestamps = result.timestamp || [];
  const ohlcv = result.indicators?.quote?.[0] || {};

  return timestamps.map((ts, i) => ({
    date:   new Date(ts * 1000),
    open:   ohlcv.open?.[i],
    high:   ohlcv.high?.[i],
    low:    ohlcv.low?.[i],
    close:  ohlcv.close?.[i],
    volume: ohlcv.volume?.[i],
  })).filter(d => d.high != null && d.low != null);
}

// Real-time quote via v7/finance/quote
async function getQuote(ticker) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}&fields=regularMarketPrice,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketVolume,longName,shortName`;
  const data = await yfFetch(url);
  return data?.quoteResponse?.result?.[0] || {};
}

async function get20DayData(symbol) {
  const ticker = symbol.includes('.') ? symbol : `${symbol}.NS`;

  // 40 calendar days → guaranteed 20 trading days
  const now   = Math.floor(Date.now() / 1000);
  const past  = now - 40 * 24 * 60 * 60;

  const [history, quote] = await Promise.all([
    getHistory(ticker, past, now),
    getQuote(ticker)
  ]);

  if (!history || history.length < 5) {
    throw new Error(`Insufficient history for ${symbol} (got ${history?.length ?? 0} days)`);
  }

  // Most recent first, take last 20 trading days
  const sorted = [...history].sort((a, b) => b.date - a.date);
  const last20 = sorted.slice(0, 20);

  const high20 = Math.max(...last20.map(d => d.high));
  const low20  = Math.min(...last20.map(d => d.low));
  const todayEntry = sorted[0];

  // Match: today's low within 0.15% of 20-day low
  const tolerance = 0.0015;
  const isAt20DayLow = Math.abs(todayEntry.low - low20) / low20 <= tolerance;

  return {
    symbol,
    ticker,
    name:       quote.longName || quote.shortName || symbol,
    currentPrice: quote.regularMarketPrice       ?? todayEntry.close,
    dayOpen:      quote.regularMarketOpen        ?? todayEntry.open,
    dayHigh:      quote.regularMarketDayHigh     ?? todayEntry.high,
    dayLow:       quote.regularMarketDayLow      ?? todayEntry.low,
    prevClose:    quote.regularMarketPreviousClose,
    change:       quote.regularMarketChange      ?? 0,
    changePct:    quote.regularMarketChangePercent ?? 0,
    volume:       quote.regularMarketVolume,
    high20,
    low20,
    todayLow: todayEntry.low,
    isAt20DayLow,
    dataPoints: last20.length,
    lastUpdated: new Date().toISOString()
  };
}

// ─────────────────────────────────────────────
//  ROUTES — STOCK DATA
// ─────────────────────────────────────────────
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const data = await get20DayData(req.params.symbol.toUpperCase());
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Multi-stock fetch
app.post('/api/stocks/batch', async (req, res) => {
  const { symbols } = req.body;
  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({ success: false, error: 'symbols array required' });
  }
  const results = [];
  for (const sym of symbols.slice(0, 50)) {
    try {
      const d = await get20DayData(sym);
      results.push({ symbol: sym, success: true, data: d });
    } catch (err) {
      results.push({ symbol: sym, success: false, error: err.message });
    }
    await delay(250);
  }
  res.json({ success: true, results });
});

// SSE Scan — streams progress to client
app.get('/api/scan/:index', async (req, res) => {
  const indexKey = req.params.index.toUpperCase();
  const stocks = STOCK_UNIVERSE[indexKey] || NIFTY50;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
    if (res.flush) res.flush();
  };

  send({ type: 'start', total: stocks.length, index: indexKey });

  const alerts = [];

  for (let i = 0; i < stocks.length; i++) {
    const symbol = stocks[i];
    try {
      const data = await get20DayData(symbol);
      if (data.isAt20DayLow) alerts.push(data);
      send({ type: 'progress', current: i + 1, total: stocks.length, symbol, data });
    } catch (err) {
      send({ type: 'progress', current: i + 1, total: stocks.length, symbol, error: err.message });
    }
    await delay(300);
  }

  send({ type: 'complete', alerts, total: stocks.length, found: alerts.length });
  res.end();
});

// Available indexes
app.get('/api/indexes', (req, res) => {
  res.json({
    success: true,
    indexes: Object.entries(STOCK_UNIVERSE).map(([key, stocks]) => ({
      key, label: key.replace('NIFTY', 'NIFTY ').replace('NEXT', 'NEXT '), count: stocks.length
    }))
  });
});

// ─────────────────────────────────────────────
//  ROUTES — WATCHLIST
// ─────────────────────────────────────────────
app.get('/api/watchlist', async (req, res) => {
  const data = await loadData();
  res.json({ success: true, data: data.watchlist || [] });
});

app.post('/api/watchlist', async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ success: false, error: 'symbol required' });
  const data = await loadData();
  if (!data.watchlist) data.watchlist = [];
  if (!data.watchlist.find(w => w.symbol === symbol.toUpperCase())) {
    data.watchlist.push({
      symbol: symbol.toUpperCase(),
      addedAt: new Date().toISOString(),
      gttSet: false,
      notes: req.body.notes || ''
    });
    await saveData(data);
  }
  res.json({ success: true });
});

app.put('/api/watchlist/:symbol', async (req, res) => {
  const data = await loadData();
  const idx = (data.watchlist || []).findIndex(w => w.symbol === req.params.symbol.toUpperCase());
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  Object.assign(data.watchlist[idx], req.body);
  await saveData(data);
  res.json({ success: true, data: data.watchlist[idx] });
});

app.delete('/api/watchlist/:symbol', async (req, res) => {
  const data = await loadData();
  data.watchlist = (data.watchlist || []).filter(w => w.symbol !== req.params.symbol.toUpperCase());
  await saveData(data);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
//  ROUTES — POSITIONS
// ─────────────────────────────────────────────
const TARGET_PCT = [20, 15, 10, 5]; // by average count

function calcTargets(pos) {
  const targetPct = TARGET_PCT[Math.min(pos.averageCount || 0, 3)];
  const targetPrice = pos.avgPrice * (1 + targetPct / 100);
  return { targetPct, targetPrice };
}

app.get('/api/positions', async (req, res) => {
  const data = await loadData();
  res.json({ success: true, data: data.positions || [] });
});

app.post('/api/positions', async (req, res) => {
  const { symbol, buyPrice, qty, notes } = req.body;
  if (!symbol || !buyPrice || !qty) {
    return res.status(400).json({ success: false, error: 'symbol, buyPrice, qty required' });
  }
  const data = await loadData();
  if (!data.positions) data.positions = [];

  const pos = {
    id: Date.now().toString(),
    symbol: symbol.toUpperCase(),
    avgPrice: parseFloat(buyPrice),
    qty: parseFloat(qty),
    averageCount: 0,
    notes: notes || '',
    status: 'open',
    buys: [{
      price: parseFloat(buyPrice),
      qty: parseFloat(qty),
      date: new Date().toISOString(),
      label: 'Initial Buy'
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const { targetPct, targetPrice } = calcTargets(pos);
  pos.targetPct = targetPct;
  pos.targetPrice = targetPrice;

  data.positions.push(pos);
  await saveData(data);
  res.json({ success: true, data: pos });
});

// Average down
app.post('/api/positions/:id/average', async (req, res) => {
  const { price, qty } = req.body;
  if (!price || !qty) return res.status(400).json({ success: false, error: 'price, qty required' });

  const data = await loadData();
  const idx = (data.positions || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Position not found' });

  const pos = data.positions[idx];
  pos.averageCount = (pos.averageCount || 0) + 1;

  if (pos.averageCount > 3) {
    return res.status(400).json({ success: false, error: 'Maximum 3 averages allowed' });
  }

  pos.buys.push({
    price: parseFloat(price),
    qty: parseFloat(qty),
    date: new Date().toISOString(),
    label: `Average #${pos.averageCount}`
  });

  const totalQty  = pos.buys.reduce((s, b) => s + b.qty, 0);
  const totalCost = pos.buys.reduce((s, b) => s + b.price * b.qty, 0);
  pos.qty     = totalQty;
  pos.avgPrice = totalCost / totalQty;

  const { targetPct, targetPrice } = calcTargets(pos);
  pos.targetPct   = targetPct;
  pos.targetPrice = targetPrice;
  pos.updatedAt   = new Date().toISOString();

  data.positions[idx] = pos;
  await saveData(data);
  res.json({ success: true, data: pos });
});

// Close/update position
app.put('/api/positions/:id', async (req, res) => {
  const data = await loadData();
  const idx = (data.positions || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Position not found' });
  Object.assign(data.positions[idx], req.body, { updatedAt: new Date().toISOString() });
  await saveData(data);
  res.json({ success: true, data: data.positions[idx] });
});

app.delete('/api/positions/:id', async (req, res) => {
  const data = await loadData();
  data.positions = (data.positions || []).filter(p => p.id !== req.params.id);
  await saveData(data);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Serve inlined HTML
app.get('/', (req, res) => res.send(HTML_PAGE));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.send(HTML_PAGE);
  else res.status(404).json({ error: 'Not found' });
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

app.listen(PORT, () => {
  console.log(`🚀 Sharegenius Swing Trader running on port ${PORT}`);
  console.log(`📁 Data file: ${DATA_FILE}`);
});
