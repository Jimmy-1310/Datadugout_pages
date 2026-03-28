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

function fmtInt(val) {
  if (val === undefined || val === null || val === '') return '-';
  return String(Math.round(parseFloat(val)));
}

function fmtStat(val, format) {
  if (format === '.avg') return fmtAvg(val);
  if (format === 'pct') return fmtPct(val);
  if (format === 'dec1') return fmtDec1(val);
  return fmtInt(val);
}

// ── Stat column definitions ──
const BATTING_COLS = [
  { key: 'PA', label: 'PA', fmt: fmtInt },
  { key: 'AB', label: 'AB', fmt: fmtInt },
  { key: 'H', label: 'H', fmt: fmtInt },
  { key: '2B', label: '2B', fmt: fmtInt },
  { key: '3B', label: '3B', fmt: fmtInt },
  { key: 'HR', label: 'HR', fmt: fmtInt },
  { key: 'RBI', label: 'RBI', fmt: fmtInt },
  { key: 'BB', label: 'BB', fmt: fmtInt },
  { key: 'SO', label: 'SO', fmt: fmtInt },
  { key: 'BA', label: 'BA', fmt: fmtAvg },
  { key: 'OBP', label: 'OBP', fmt: fmtAvg },
  { key: 'SLG', label: 'SLG', fmt: fmtAvg },
  { key: 'OPS', label: 'OPS', fmt: fmtAvg },
];

const ADVANCED_COLS = [
  { key: 'PA', label: 'PA', fmt: fmtInt },
  { key: 'wOBA', label: 'wOBA', fmt: fmtAvg },
  { key: 'ISO', label: 'ISO', fmt: fmtAvg },
  { key: 'BABIP', label: 'BABIP', fmt: fmtAvg },
  { key: 'BB%', label: 'BB%', fmt: fmtPct },
  { key: 'K%', label: 'K%', fmt: fmtPct },
  { key: 'P/PA', label: 'P/PA', fmt: (v) => v !== undefined ? parseFloat(v).toFixed(2) : '-' },
  { key: 'RAA', label: 'RAA', fmt: fmtDec1 },
];

// ── Table rendering ──
function renderStatTable(containerId, data, cols, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { showRank = false, showTeam = true, nameLink = true, sortable = true } = options;

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
        html += `<td class="col-name"><a href="player.html?id=${p.id}">${p.name}</a></td>`;
      } else {
        html += `<td class="col-name">${p.name || ''}</td>`;
      }
      if (showTeam) html += `<td class="col-team">${p.teamAbbr || p.abbr || ''}</td>`;
      for (const col of cols) {
        const val = p[col.key];
        html += `<td>${col.fmt(val)}</td>`;
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
