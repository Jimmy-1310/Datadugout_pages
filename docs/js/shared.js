// ── Data loading ──
const DATA_BASE = 'data';

async function loadJSON(file) {
  const resp = await fetch(`${DATA_BASE}/${file}`);
  if (!resp.ok) throw new Error(`Failed to load ${file}`);
  return resp.json();
}

// ── Formatting ──
function fmtAvg(val) {
  if (val === undefined || val === null || val === '') return '-';
  const n = parseFloat(val);
  if (isNaN(n)) return '-';
  return n >= 1 ? n.toFixed(3) : n.toFixed(3).replace(/^0/, '');
}

function fmtPct(val) {
  if (val === undefined || val === null || val === '') return '-';
  return parseFloat(val).toFixed(1) + '%';
}

function fmtDec1(val) {
  if (val === undefined || val === null || val === '') return '-';
  return parseFloat(val).toFixed(1);
}

function fmtDec2(val) {
  if (val === undefined || val === null || val === '') return '-';
  return parseFloat(val).toFixed(2);
}

function fmtInt(val) {
  if (val === undefined || val === null || val === '') return '-';
  return String(Math.round(parseFloat(val)));
}

// IP display: stored as e.g. 6.2 (6 innings 2 outs). Display as-is with 1 decimal.
function fmtIP(val) {
  if (val === undefined || val === null || val === '') return '-';
  const n = parseFloat(val);
  if (isNaN(n)) return '-';
  return n.toFixed(1);
}

// wRC+ is an integer (100 = league average)
function fmtWRCPlus(val) {
  if (val === undefined || val === null || val === '') return '-';
  return String(Math.round(parseFloat(val)));
}

function fmtStat(val, format) {
  if (format === '.avg') return fmtAvg(val);
  if (format === 'pct')  return fmtPct(val);
  if (format === 'dec1') return fmtDec1(val);
  if (format === 'dec2') return fmtDec2(val);
  if (format === 'int')  return fmtInt(val);
  return fmtInt(val);
}

// ── Color coding for rate stats (FanGraphs-style) ──
// Returns a CSS class based on stat value relative to thresholds
const STAT_COLOR_RANGES = {
  'wRC+': [
    { min: 160, cls: 'stat-elite' },
    { min: 140, cls: 'stat-great' },
    { min: 115, cls: 'stat-above' },
    { min:  85, cls: 'stat-avg'   },
    { min:  70, cls: 'stat-below' },
    { min:   0, cls: 'stat-poor'  },
  ],
  'OPS': [
    { min: 1.000, cls: 'stat-elite' },
    { min: 0.900, cls: 'stat-great' },
    { min: 0.800, cls: 'stat-above' },
    { min: 0.700, cls: 'stat-avg'   },
    { min: 0.600, cls: 'stat-below' },
    { min: 0,     cls: 'stat-poor'  },
  ],
  'wOBA': [
    { min: 0.400, cls: 'stat-elite' },
    { min: 0.370, cls: 'stat-great' },
    { min: 0.340, cls: 'stat-above' },
    { min: 0.310, cls: 'stat-avg'   },
    { min: 0.280, cls: 'stat-below' },
    { min: 0,     cls: 'stat-poor'  },
  ],
  'ERA': [
    { min: 0,    cls: 'stat-elite', max: 2.50 },
    { min: 0,    cls: 'stat-great', max: 3.20 },
    { min: 0,    cls: 'stat-above', max: 4.00 },
    { min: 0,    cls: 'stat-avg',   max: 4.80 },
    { min: 0,    cls: 'stat-below', max: 5.50 },
    { min: 0,    cls: 'stat-poor',  max: 999  },
  ],
  'FIP': [
    { min: 0, cls: 'stat-elite', max: 2.50 },
    { min: 0, cls: 'stat-great', max: 3.20 },
    { min: 0, cls: 'stat-above', max: 4.00 },
    { min: 0, cls: 'stat-avg',   max: 4.80 },
    { min: 0, cls: 'stat-below', max: 5.50 },
    { min: 0, cls: 'stat-poor',  max: 999  },
  ],
  'WHIP': [
    { min: 0, cls: 'stat-elite', max: 0.90 },
    { min: 0, cls: 'stat-great', max: 1.10 },
    { min: 0, cls: 'stat-above', max: 1.25 },
    { min: 0, cls: 'stat-avg',   max: 1.40 },
    { min: 0, cls: 'stat-below', max: 1.60 },
    { min: 0, cls: 'stat-poor',  max: 999  },
  ],
};

function getStatColorClass(key, val) {
  if (val === undefined || val === null || val === '') return '';
  const ranges = STAT_COLOR_RANGES[key];
  if (!ranges) return '';
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  // ERA/FIP/WHIP use max (lower is better)
  if (['ERA', 'FIP', 'WHIP'].includes(key)) {
    for (const r of ranges) {
      if (n < r.max) return r.cls;
    }
    return '';
  }
  // Others use min (higher is better)
  for (const r of ranges) {
    if (n >= r.min) return r.cls;
  }
  return '';
}

// ── Batting stat column definitions ──
const BATTING_COLS = [
  { key: 'PA',  label: 'PA',  fmt: fmtInt },
  { key: 'AB',  label: 'AB',  fmt: fmtInt },
  { key: 'H',   label: 'H',   fmt: fmtInt },
  { key: '2B',  label: '2B',  fmt: fmtInt },
  { key: '3B',  label: '3B',  fmt: fmtInt },
  { key: 'HR',  label: 'HR',  fmt: fmtInt },
  { key: 'RBI', label: 'RBI', fmt: fmtInt },
  { key: 'BB',  label: 'BB',  fmt: fmtInt },
  { key: 'SO',  label: 'SO',  fmt: fmtInt },
  { key: 'BA',  label: 'BA',  fmt: fmtAvg, colorKey: 'BA'  },
  { key: 'OBP', label: 'OBP', fmt: fmtAvg },
  { key: 'SLG', label: 'SLG', fmt: fmtAvg },
  { key: 'OPS', label: 'OPS', fmt: fmtAvg, colorKey: 'OPS' },
];

const ADVANCED_BATTING_COLS = [
  { key: 'PA',    label: 'PA',    fmt: fmtInt },
  { key: 'wRC+',  label: 'wRC+',  fmt: fmtWRCPlus, colorKey: 'wRC+' },
  { key: 'wOBA',  label: 'wOBA',  fmt: fmtAvg,     colorKey: 'wOBA' },
  { key: 'ISO',   label: 'ISO',   fmt: fmtAvg },
  { key: 'BABIP', label: 'BABIP', fmt: fmtAvg },
  { key: 'BB%',   label: 'BB%',   fmt: fmtPct },
  { key: 'K%',    label: 'K%',    fmt: fmtPct },
  { key: 'P/PA',  label: 'P/PA',  fmt: fmtDec2 },
  { key: 'RAA',   label: 'RAA',   fmt: fmtDec1 },
];

// Keep backward compat alias
const ADVANCED_COLS = ADVANCED_BATTING_COLS;

// ── Pitching stat column definitions ──
const PITCHING_STD_COLS = [
  { key: 'G',    label: 'G',    fmt: fmtInt },
  { key: 'GS',   label: 'GS',   fmt: fmtInt },
  { key: 'IP',   label: 'IP',   fmt: fmtIP  },
  { key: 'BF',   label: 'BF',   fmt: fmtInt },
  { key: 'H',    label: 'H',    fmt: fmtInt },
  { key: 'HR',   label: 'HR',   fmt: fmtInt },
  { key: 'BB',   label: 'BB',   fmt: fmtInt },
  { key: 'HBP',  label: 'HBP',  fmt: fmtInt },
  { key: 'K',    label: 'K',    fmt: fmtInt },
  { key: 'R',    label: 'R',    fmt: fmtInt },
  { key: 'ERA',  label: 'ERA',  fmt: fmtDec2, colorKey: 'ERA'  },
  { key: 'WHIP', label: 'WHIP', fmt: fmtDec2, colorKey: 'WHIP' },
  { key: 'BAA',  label: 'BAA',  fmt: fmtAvg  },
];

const PITCHING_ADV_COLS = [
  { key: 'G',    label: 'G',    fmt: fmtInt },
  { key: 'IP',   label: 'IP',   fmt: fmtIP  },
  { key: 'FIP',  label: 'FIP',  fmt: fmtDec2, colorKey: 'FIP' },
  { key: 'K/9',  label: 'K/9',  fmt: fmtDec2 },
  { key: 'BB/9', label: 'BB/9', fmt: fmtDec2 },
  { key: 'HR/9', label: 'HR/9', fmt: fmtDec2 },
  { key: 'K/BB', label: 'K/BB', fmt: fmtDec2 },
  { key: 'K%',   label: 'K%',   fmt: fmtPct  },
  { key: 'BB%',  label: 'BB%',  fmt: fmtPct  },
];

// ── Table rendering ──
function renderStatTable(containerId, data, cols, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const {
    showRank = false, showTeam = true, nameLink = true, sortable = true,
    linkBase = 'player.html', idKey = 'id', colorStats = false,
  } = options;

  let sortCol = null;
  let sortDir = 'desc';

  function render(sortedData) {
    let html = '<div class="table-wrapper"><table class="stat-table"><thead><tr>';
    if (showRank) html += '<th class="col-rank">#</th>';
    html += `<th class="col-name">Player</th>`;
    if (showTeam) html += `<th class="col-team">Team</th>`;
    for (const col of cols) {
      const cls = sortCol === col.key ? (sortDir === 'asc' ? 'sort-asc' : 'sort-desc') : '';
      html += `<th data-col="${col.key}" class="${cls}">${col.label}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let i = 0; i < sortedData.length; i++) {
      const p = sortedData[i];
      html += '<tr>';
      if (showRank) html += `<td class="col-rank">${i + 1}</td>`;
      if (nameLink) {
        html += `<td class="col-name"><a href="${linkBase}?id=${p[idKey]}">${p.name}</a></td>`;
      } else {
        html += `<td class="col-name">${p.name || ''}</td>`;
      }
      if (showTeam) html += `<td class="col-team">${p.teamAbbr || p.abbr || ''}</td>`;
      for (const col of cols) {
        const val = p[col.key];
        const colorCls = colorStats && col.colorKey ? getStatColorClass(col.colorKey, val) : '';
        html += `<td class="${colorCls}">${col.fmt(val)}</td>`;
      }
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;

    if (sortable) {
      container.querySelectorAll('th[data-col]').forEach(th => {
        th.addEventListener('click', () => {
          const col = th.dataset.col;
          if (sortCol === col) { sortDir = sortDir === 'desc' ? 'asc' : 'desc'; }
          else { sortCol = col; sortDir = 'desc'; }
          const sorted = [...sortedData].sort((a, b) => {
            const va = parseFloat(a[col]) || 0;
            const vb = parseFloat(b[col]) || 0;
            return sortDir === 'desc' ? vb - va : va - vb;
          });
          render(sorted);
        });
      });
    }
  }

  render(data);
}

// ── Nav highlighting ──
function initNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── URL params ──
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', initNav);
