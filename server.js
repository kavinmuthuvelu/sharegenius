const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// On Render, use /tmp for ephemeral storage
const DATA_FILE = process.env.DATA_FILE || '/tmp/sharegenius-data.json';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
let yahooFinance;
async function getYF() {
  if (!yahooFinance) {
    const mod = await import('yahoo-finance2');
    yahooFinance = mod.default;
    // Suppress validation notices
    yahooFinance.setGlobalConfig({ validation: { logErrors: false } });
  }
  return yahooFinance;
}

async function get20DayData(symbol) {
  const yf = await getYF();
  const ticker = symbol.includes('.') ? symbol : `${symbol}.NS`;

  // Fetch ~35 calendar days to ensure 20 trading days
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 40);

  const [history, quote] = await Promise.all([
    yf.historical(ticker, {
      period1: start.toISOString().split('T')[0],
      period2: end.toISOString().split('T')[0],
      interval: '1d'
    }),
    yf.quote(ticker, {}, { validateResult: false })
  ]);

  if (!history || history.length < 5) {
    throw new Error(`Insufficient history for ${symbol}`);
  }

  // Sort descending (most recent first), take 20 trading days
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
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
    name: quote.longName || quote.shortName || symbol,
    currentPrice: quote.regularMarketPrice ?? todayEntry.close,
    dayOpen:  quote.regularMarketOpen ?? todayEntry.open,
    dayHigh:  quote.regularMarketDayHigh ?? todayEntry.high,
    dayLow:   quote.regularMarketDayLow  ?? todayEntry.low,
    prevClose: quote.regularMarketPreviousClose,
    change:    quote.regularMarketChange ?? 0,
    changePct: quote.regularMarketChangePercent ?? 0,
    volume:    quote.regularMarketVolume,
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

// Fallback to index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

app.listen(PORT, () => {
  console.log(`🚀 Sharegenius Swing Trader running on port ${PORT}`);
  console.log(`📁 Data file: ${DATA_FILE}`);
});
