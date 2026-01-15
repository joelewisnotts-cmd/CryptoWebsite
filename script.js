// Joe's Crypto - client-side logic
const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin' }
];

const SELECT = document.getElementById('coin-select');
const AMOUNT_INPUT = document.getElementById('amount-input');
const ADD_BUTTON = document.getElementById('add-button');
const REFRESH_BUTTON = document.getElementById('refresh-button');
const PORTFOLIO_BODY = document.getElementById('portfolio-body');
const TOTAL_VALUE = document.getElementById('total-value');
const LAST_UPDATED = document.getElementById('last-updated');

let portfolio = {}; // { coinId: amount }
let prices = {}; // { coinId: { usd: number } }

function init() {
  populateCoinSelect();
  loadPortfolio();
  renderPortfolio();
  ADD_BUTTON.addEventListener('click', handleAdd);
  REFRESH_BUTTON.addEventListener('click', loadPrices);
  // Load prices on start
  loadPrices();
}

function populateCoinSelect() {
  SELECT.innerHTML = '';
  COINS.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.symbol})`;
    SELECT.appendChild(opt);
  });
}

function loadPortfolio() {
  try {
    const raw = localStorage.getItem('joesCryptoPortfolio');
    if (raw) portfolio = JSON.parse(raw);
    else portfolio = {};
  } catch (e) {
    console.error('Failed to load portfolio', e);
    portfolio = {};
  }
}

function savePortfolio() {
  localStorage.setItem('joesCryptoPortfolio', JSON.stringify(portfolio));
}

function handleAdd() {
  const coinId = SELECT.value;
  const amt = parseFloat(AMOUNT_INPUT.value);
  if (!coinId || isNaN(amt) || amt < 0) {
    alert('Please choose a coin and enter a valid non-negative amount.');
    return;
  }
  if (amt === 0) {
    // treat as removal
    delete portfolio[coinId];
  } else {
    portfolio[coinId] = amt;
  }
  savePortfolio();
  renderPortfolio();
  loadPrices(); // update values
  AMOUNT_INPUT.value = '';
}

async function loadPrices() {
  const ids = Object.keys(portfolio);
  if (ids.length === 0) {
    LAST_UPDATED.textContent = 'Prices: no holdings';
    prices = {};
    renderPortfolio();
    return;
  }
  try {
    LAST_UPDATED.textContent = 'Prices: loading...';
    const resp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=usd`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    prices = json;
    LAST_UPDATED.textContent = `Prices: updated ${new Date().toLocaleTimeString()}`;
    renderPortfolio();
  } catch (e) {
    console.error('Failed to load prices', e);
    LAST_UPDATED.textContent = 'Prices: failed to load (see console)';
    alert('Failed to fetch prices. CoinGecko may be down or rate-limited. Try again in a moment.');
  }
}

function renderPortfolio() {
  PORTFOLIO_BODY.innerHTML = '';
  let total = 0;
  const entries = Object.entries(portfolio);
  if (entries.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5" style="color:var(--muted);padding:12px">No holdings yet — add a coin and amount above.</td>';
    PORTFOLIO_BODY.appendChild(tr);
    TOTAL_VALUE.textContent = '$0.00';
    return;
  }

  entries.forEach(([coinId, amount]) => {
    const coin = COINS.find(c => c.id === coinId) || { name: coinId, symbol: '' };
    const priceObj = prices[coinId] || {};
    const priceUsd = typeof priceObj.usd === 'number' ? priceObj.usd : null;
    const value = priceUsd !== null ? priceUsd * amount : null;
    if (value) total += value;

    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.textContent = `${coin.name} (${coin.symbol})`;

    const amtTd = document.createElement('td');
    amtTd.textContent = amount;

    const priceTd = document.createElement('td');
    priceTd.textContent = priceUsd !== null ? formatUsd(priceUsd) : '—';

    const valueTd = document.createElement('td');
    valueTd.textContent = value !== null ? formatUsd(value) : '—';

    const actionsTd = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      delete portfolio[coinId];
      savePortfolio();
      renderPortfolio();
    });
    actionsTd.appendChild(removeBtn);

    tr.appendChild(nameTd);
    tr.appendChild(amtTd);
    tr.appendChild(priceTd);
    tr.appendChild(valueTd);
    tr.appendChild(actionsTd);

    PORTFOLIO_BODY.appendChild(tr);
  });

  TOTAL_VALUE.textContent = formatUsd(total);
}

function formatUsd(n) {
  if (typeof n !== 'number' || !isFinite(n)) return '—';
  return n >= 1 ? `$${n.toLocaleString(undefined, {maximumFractionDigits:2})}` : `$${n.toFixed(6)}`;
}

init();
