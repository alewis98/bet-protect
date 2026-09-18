const $ = id => document.getElementById(id);
let hedgeChart;
let lastChartData;
let lastChartResult;
const shareFieldIds = ['position-stake', 'position-payout', 'cashout-value', 'hedge-odds', 'hedge-format', 'max-hedge-stake'];
const dollars = value => `$${value.toFixed(2)}`;
const signedMoney = value => `${value < 0 ? '-' : '+'}$${Math.abs(value).toFixed(2)}`;
const readNumber = id => { const value = parseFloat($(id).value); return Number.isFinite(value) ? value : null; };

function decimalOdds(value, format) { return format === 'decimal' ? value : value >= 100 ? 1 + value / 100 : 1 + 100 / Math.abs(value); }
function hedgeProfit(odds, format, stake) { return stake * (decimalOdds(odds, format) - 1); }

function optimize(data) {
  const targetProfit = data.cashout - data.stake, valid = [], points = [], maxCents = Math.round(data.maxHedgeStake * 100);
  for (let cents = 0; cents <= maxCents; cents += 1) {
    const hedgeStake = cents / 100, currentProfit = data.payout - data.stake - hedgeStake, opposingProfit = hedgeProfit(data.odds, data.format, hedgeStake) - data.stake;
    if (cents % Math.max(1, Math.ceil(maxCents / 120)) === 0 || cents === maxCents) points.push({ x: hedgeStake, currentProfit, opposingProfit });
    if (currentProfit >= targetProfit && opposingProfit >= targetProfit) valid.push({ hedgeStake, currentProfit, opposingProfit });
  }
  const balanced = valid.reduce((best, row) => !best || Math.abs(row.currentProfit - row.opposingProfit) < Math.abs(best.currentProfit - best.opposingProfit) ? row : best, null);
  return { targetProfit, points, strategies: { current: valid[0] || null, balanced, opposing: valid[valid.length - 1] || null } };
}

function renderChart(data, result) {
  if (hedgeChart) hedgeChart.destroy();
  const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const chartInk = dark ? '#edf5ef' : '#17211d', chartMuted = dark ? '#a9bdb1' : '#687870', chartGrid = dark ? '#30483d' : '#dfe6e0', hedgeMarker = dark ? '#ffffff' : '#263c35';
  const allValues = result.points.flatMap(point => [point.currentProfit, point.opposingProfit, result.targetProfit]);
  const min = Math.min(...allValues), max = Math.max(...allValues), padding = Math.max((max - min) * 0.12, 1);
  const marker = (row, color, label, strategyKey) => row ? { label, strategyKey, data: [{ x: row.hedgeStake, y: min - padding }, { x: row.hedgeStake, y: max + padding }], borderColor: color, borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, parsing: false } : null;
  const points = result.points;
  const showCustomStake = event => { const x = hedgeChart.scales.x.getValueForPixel(event.x); const stake = Math.min(data.maxHedgeStake, Math.max(0, x)); const currentProfit = data.payout - data.stake - stake; const opposingProfit = hedgeProfit(data.odds, data.format, stake) - data.stake; const guaranteed = Math.min(currentProfit, opposingProfit); const lean = Math.abs(currentProfit - opposingProfit) < .005 ? 'Neutral' : currentProfit > opposingProfit ? 'Leans Position' : 'Leans Hedge'; const warning = guaranteed < result.targetProfit ? `<small class="custom-stake-warning">⚠ Below current cashout by ${dollars(result.targetProfit - guaranteed)}</small>` : ''; const customLine = hedgeChart.data.datasets.find(item => item.strategyKey === 'custom'); if (customLine) customLine.data = [{ x: stake, y: min - padding }, { x: stake, y: max + padding }]; else hedgeChart.data.datasets.push({ label: 'Custom stake', strategyKey: 'custom', data: [{ x: stake, y: min - padding }, { x: stake, y: max + padding }], borderColor: '#17211d', borderWidth: 1.5, pointRadius: 0, parsing: false }); $('custom-stake-card').hidden = false; $('custom-stake-card').innerHTML = `<div><span>Custom hedge stake</span><strong>${dollars(stake)}</strong><em>${lean}</em></div><div><span>Position wins</span><b class="${currentProfit < 0 ? 'negative' : ''}">${signedMoney(currentProfit)}</b></div><div><span>Hedge wins</span><b class="${opposingProfit < 0 ? 'negative' : ''}">${signedMoney(opposingProfit)}</b></div><div><span>Guaranteed net profit</span><b class="${guaranteed < 0 ? 'negative' : ''}">${signedMoney(guaranteed)}</b>${warning}</div>`; hedgeChart.update('none'); };
  const profitRegionPlugin = { id: 'profitRegion', beforeDatasetsDraw(chart) { const leftStake = result.strategies.current?.hedgeStake, rightStake = result.strategies.opposing?.hedgeStake; if (!Number.isFinite(leftStake) || !Number.isFinite(rightStake)) return; const x1 = chart.scales.x.getPixelForValue(Math.min(leftStake, rightStake)), x2 = chart.scales.x.getPixelForValue(Math.max(leftStake, rightStake)); const { ctx, chartArea } = chart; ctx.save(); ctx.fillStyle = 'rgba(188,233,212,.28)'; ctx.fillRect(x1, chartArea.top, x2 - x1, chartArea.bottom - chartArea.top); ctx.restore(); } };
  hedgeChart = new Chart($('hedge-chart'), { type: 'line', plugins: [profitRegionPlugin], data: { datasets: [
    { label: 'Position wins', data: points.map(p => ({ x: p.x, y: p.currentProfit })), borderColor: '#ef765e', backgroundColor: '#ef765e', borderWidth: 3, pointRadius: 0, pointHitRadius: 12, tension: .2 },
    { label: 'Hedge wins', data: points.map(p => ({ x: p.x, y: p.opposingProfit })), borderColor: '#08734f', backgroundColor: '#08734f', borderWidth: 3, pointRadius: 0, pointHitRadius: 12, tension: .2 },
    { label: 'Cashout-equivalent target', data: [{ x: 0, y: result.targetProfit }, { x: data.maxHedgeStake, y: result.targetProfit }], borderColor: '#7c8983', borderDash: [7, 6], borderWidth: 1.5, pointRadius: 0, parsing: false },
    marker(result.strategies.current, '#ef765e', 'Position-favored Stake', 'current'), marker(result.strategies.balanced, '#69c99a', 'Neutral Stake', 'balanced'), marker(result.strategies.opposing, hedgeMarker, 'Hedge-favored Stake', 'opposing')
  ].filter(Boolean) }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, onClick: (event, elements, chart) => { if (event.x >= chart.chartArea.left && event.x <= chart.chartArea.right && event.y >= chart.chartArea.top && event.y <= chart.chartArea.bottom) showCustomStake(event); }, onHover: (event, elements, chart) => { if (event.native && event.native.buttons === 1 && event.x >= chart.chartArea.left && event.x <= chart.chartArea.right && event.y >= chart.chartArea.top && event.y <= chart.chartArea.bottom) showCustomStake(event); }, plugins: { legend: { labels: { color: chartInk, usePointStyle: false, boxWidth: 30, boxHeight: 3, padding: 16, filter: item => item.text !== 'Custom stake' } }, tooltip: { filter: item => !['Position-favored Stake', 'Neutral Stake', 'Hedge-favored Stake', 'Custom stake'].includes(item.dataset.label), callbacks: { title: items => `Hedge stake: ${dollars(items[0].parsed.x)}`, label: item => `${item.dataset.label}: ${signedMoney(item.parsed.y)}` } } }, scales: { x: { type: 'linear', min: 0, max: data.maxHedgeStake, title: { display: true, text: 'Hedge stake ($)', color: chartInk }, ticks: { color: chartMuted, callback: value => dollars(value) }, grid: { color: chartGrid } }, y: { min: min - padding, max: max + padding, title: { display: true, text: 'Net profit ($)', color: chartInk }, ticks: { color: chartMuted, callback: value => signedMoney(value) }, grid: { color: chartGrid } } } } });
}

function renderOptions(data, result) {
  const choices = [{ key: 'current', label: 'Position-favored stake', detail: 'Smallest hedge that still reaches the cashout baseline.', tone: 'quiet' }, { key: 'balanced', label: 'Neutral stake', detail: 'Closest profit between both outcomes above the cashout baseline.', tone: 'recommended' }, { key: 'opposing', label: 'Hedge-favored stake', detail: 'Largest hedge that still reaches the cashout baseline.', tone: 'lean' }];
  $('hedge-options').innerHTML = choices.map(choice => { const row = result.strategies[choice.key]; const guaranteed = row ? Math.min(row.currentProfit, row.opposingProfit) : null; return `<article class="hedge-option ${choice.tone} ${choice.key} ${row ? '' : 'unavailable'}" data-strategy="${choice.key}" tabindex="${row ? '0' : '-1'}" role="button" aria-pressed="true"><div class="hedge-option-head"><div><span class="stake-label">${choice.label}</span><p>${choice.detail}</p></div></div>${row ? `<div class="hedge-stake-result"><span>Stake required</span><strong>${dollars(row.hedgeStake)}</strong></div><div class="hedge-guarantee"><span>Guaranteed net profit</span><strong>${signedMoney(guaranteed)}</strong><small>${guaranteed >= result.targetProfit ? `Exceeds current cashout by ${dollars(guaranteed - result.targetProfit)}` : 'Below current cashout'}</small></div><div class="hedge-outcomes"><span class="${choice.key === 'current' ? 'potential' : ''}">Position wins <b>${signedMoney(row.currentProfit)}</b></span><span class="${choice.key === 'opposing' ? 'potential' : ''}">Hedge wins <b>${signedMoney(row.opposingProfit)}</b></span></div>` : '<p class="muted">No stake in the allowed range satisfies both outcomes.</p>'}</article>`; }).join('');
  const decimal = decimalOdds(data.odds, data.format);
  $('hedge-math').innerHTML = `<div class="hedge-math-grid"><article class="hedge-math-card"><span>Cashout baseline</span><strong>${signedMoney(result.targetProfit)}</strong><p>Cashout value ${dollars(data.cashout)} − position stake ${dollars(data.stake)}</p></article><article class="hedge-math-card"><span>Position wins</span><code>Payout ${dollars(data.payout)} − position stake ${dollars(data.stake)} − hedge stake H</code><p>Original payout after both stakes are accounted for.</p></article><article class="hedge-math-card"><span>Hedge wins</span><code>H × (hedge odds ${decimal.toFixed(3)} − 1) − position stake ${dollars(data.stake)}</code><p>Hedge return after the original position stake.</p></article></div><p class="hedge-math-note">We test each cent from $0 to ${dollars(data.maxHedgeStake)} and keep stakes where both outcomes exceed the cashout baseline.</p>`;
  $('hedge-results').hidden = false; lastChartData = data; lastChartResult = result; renderChart(data, result);
  const setMarkerVisible = (key, visible) => { const dataset = hedgeChart.data.datasets.find(item => item.strategyKey === key); if (dataset) { dataset.hidden = !visible; hedgeChart.update(); } };
  document.querySelectorAll('[data-strategy]').forEach(card => { const key = card.dataset.strategy; if (!result.strategies[key]) return; card.addEventListener('mouseenter', () => setMarkerVisible(key, true)); card.addEventListener('mouseleave', () => setMarkerVisible(key, card.getAttribute('aria-pressed') === 'true')); card.addEventListener('click', () => { const cards = [...document.querySelectorAll('[data-strategy]')], oneSelected = cards.filter(item => item.getAttribute('aria-pressed') === 'true').length === 1 && card.getAttribute('aria-pressed') === 'true'; cards.forEach(other => { const visible = oneSelected || other === card; other.setAttribute('aria-pressed', String(visible)); other.classList.toggle('is-active', !oneSelected && visible); if (result.strategies[other.dataset.strategy]) setMarkerVisible(other.dataset.strategy, visible); }); }); card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); } }); });
}

function readShareState() { return Object.fromEntries(shareFieldIds.map(id => [id, $(id).value])); }
function shareUrl() { return `${window.location.href.split('#')[0]}#share=${encodeURIComponent(JSON.stringify(readShareState()))}`; }
function restoreShareState() {
  const match = window.location.hash.match(/^#share=(.+)$/); if (!match) return;
  try { const state = JSON.parse(decodeURIComponent(match[1])); shareFieldIds.forEach(id => { if (Object.prototype.hasOwnProperty.call(state, id)) $(id).value = state[id]; }); }
  catch { return; }
}

$('hedge-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = { stake: readNumber('position-stake'), payout: readNumber('position-payout'), cashout: readNumber('cashout-value'), odds: readNumber('hedge-odds'), maxHedgeStake: readNumber('max-hedge-stake'), format: $('hedge-format').value };
  const error = !Object.values(data).every(value => value !== null) ? 'Enter all position values, odds, and a max hedge stake.' : data.payout < data.stake ? 'Gross payout must be at least the current stake.' : data.maxHedgeStake <= 0 ? 'Max hedge stake must be greater than $0.' : data.format === 'decimal' && data.odds <= 1 ? 'Decimal odds must be greater than 1.00.' : data.format === 'american' && (data.odds === 0 || Math.abs(data.odds) < 100) ? 'American odds must be at least +100 or -100.' : '';
  $('hedge-error').hidden = !error; $('hedge-error').textContent = error; if (error) return; renderOptions(data, optimize(data)); window.requestAnimationFrame(() => $('hedge-results').scrollIntoView({ behavior: 'smooth', block: 'start' }));
});

$('hedge-share-button').addEventListener('click', async () => {
  const url = shareUrl(), status = $('hedge-share-status');
  try { await navigator.clipboard.writeText(url); status.textContent = 'Share link copied'; }
  catch { status.textContent = `Copy this link: ${url}`; }
  window.history.replaceState(null, '', url); window.setTimeout(() => { status.textContent = ''; }, 5000);
});
restoreShareState();

addEventListener('themechange', () => {
  if (lastChartData && lastChartResult) renderChart(lastChartData, lastChartResult);
});

function syncMaxHedgeStakeToPayout() { const payout = readNumber('position-payout'); if (payout !== null && payout > 0) $('max-hedge-stake').value = (payout * 1.1).toFixed(2); }
['input', 'change'].forEach(eventName => $('position-payout').addEventListener(eventName, syncMaxHedgeStakeToPayout));
