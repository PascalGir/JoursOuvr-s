import { CANTONS, computeRange, workingDays } from './holidays.js?v=1.1.1';
import { VERSION } from './version.js?v=1.1.1';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
  'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];
const MAX_CAL = 36;
const $ = (id) => document.getElementById(id);
const nf = new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 1 });

const store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
};

const now = new Date();
const thisYear = now.getFullYear();

function fillSelect(el, items) {
  el.innerHTML = items.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
}

fillSelect($('m1'), MOIS.map((t, i) => [i + 1, t]));
fillSelect($('m2'), MOIS.map((t, i) => [i + 1, t]));
const years = [];
for (let y = thisYear - 10; y <= thisYear + 15; y++) years.push([y, y]);
fillSelect($('y1'), years);
fillSelect($('y2'), years);
fillSelect($('ct'), Object.entries(CANTONS)
  .sort((a, b) => a[1].localeCompare(b[1], 'fr'))
  .map(([code, nom]) => [code, `${nom} (${code})`]));

// État initial : paramètres d'URL, puis préférences enregistrées, puis valeurs par défaut.
function parseYm(s) {
  const m = /^(\d{4})-(\d{1,2})$/.exec(s || '');
  return m ? { y: +m[1], m: +m[2] } : null;
}
const params = new URLSearchParams(location.search);
const from = parseYm(params.get('du')) || { y: thisYear, m: 1 };
const to = parseYm(params.get('au')) || { y: thisYear, m: 12 };
const canton = CANTONS[params.get('canton')] ? params.get('canton') : store.get('canton', 'VD');
const taux = +params.get('taux') || store.get('taux', 100);
const conges = Math.max(0, +(params.get('conges') || '0').replace(',', '.') || 0);

$('m1').value = from.m; $('y1').value = from.y;
$('m2').value = to.m; $('y2').value = to.y;
$('ct').value = canton;
$('taux').value = taux;
$('conges').value = conges;
$('version').textContent = VERSION;

const excludedKey = (c) => `exclus-${c}`;
let last = null;

function readState() {
  return {
    from: { y: +$('y1').value, m: +$('m1').value },
    to: { y: +$('y2').value, m: +$('m2').value },
    canton: $('ct').value,
    taux: Math.min(100, Math.max(1, Math.round(+$('taux').value || 100))),
    conges: +String($('conges').value || '0').replace(',', '.'),
  };
}

function updateUrl(s) {
  const p = new URLSearchParams({
    du: `${s.from.y}-${String(s.from.m).padStart(2, '0')}`,
    au: `${s.to.y}-${String(s.to.m).padStart(2, '0')}`,
    canton: s.canton,
  });
  if (s.taux !== 100) p.set('taux', s.taux);
  if (s.conges > 0) p.set('conges', s.conges);
  history.replaceState(null, '', `?${p}`);
}

function render() {
  const s = readState();
  store.set('canton', s.canton);
  store.set('taux', s.taux);
  const excluded = new Set(store.get(excludedKey(s.canton), []));

  let res, net;
  try {
    res = computeRange({ from: s.from, to: s.to, canton: s.canton, excluded });
    net = workingDays({ ouvres: res.totals.ouvres, taux: s.taux, conges: s.conges });
  } catch (e) {
    $('err').textContent = e.message;
    ['kN', 'kO', 'kV', 'kF', 'kW', 'kC'].forEach((id) => { $(id).textContent = '–'; });
    $('kP').textContent = $('kNh').textContent = '';
    $('bars').innerHTML = $('hol').innerHTML = $('cal').innerHTML = '';
    last = null;
    return;
  }
  $('err').textContent = '';
  updateUrl(s);
  last = { s, res, net };

  const t = res.totals;
  $('kN').textContent = nf.format(net.net);
  const parts = [s.taux < 100 ? `${nf.format(net.theoriques)} à ${s.taux} %` : `${t.ouvres} ouvrés`];
  if (s.conges > 0) parts.push(`${nf.format(s.conges)} congés`);
  $('kNh').textContent = parts.length > 1 || s.taux < 100 ? parts.join(' − ') : '';
  $('kV').textContent = nf.format(s.conges);
  $('kO').textContent = t.ouvres;
  $('kP').textContent = '';
  $('kF').textContent = t.feries;
  $('kW').textContent = t.weekend;
  $('kC').textContent = t.jours;

  const periode = `${MOIS[s.from.m - 1]} ${s.from.y} – ${MOIS[s.to.m - 1]} ${s.to.y}`;
  $('printTitle').textContent = `${CANTONS[s.canton]} · ${periode}`;

  // Barres par mois
  const max = Math.max(...res.months.map((r) => r.ouvres), 1);
  $('bars').innerHTML = res.months.map((r) => `
    <div class="bar-row">
      <span class="bar-lbl">${MOIS[r.m - 1].slice(0, 4)}. ${r.y}</span>
      <span class="bar-track"><span class="bar" style="width:${Math.round((r.ouvres / max) * 100)}%"></span></span>
      <span class="bar-val">${r.ouvres}${s.taux < 100 ? `<small> · ${nf.format(r.ouvres * s.taux / 100)}</small>` : ''}</span>
    </div>`).join('');

  // Liste des fériés
  $('hol').innerHTML = res.holidays.length ? res.holidays.map((h) => `
    <li class="${h.compte ? '' : 'off'}">
      <label>
        <input type="checkbox" class="no-print" data-id="${h.id}" ${h.compte ? 'checked' : ''}>
        <span class="h-date">${h.date.toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span class="h-nom">${h.nom}</span>
        ${h.weekend ? '<span class="tag">week-end</span>' : ''}
      </label>
    </li>`).join('') : '<li class="empty">Aucun jour férié sur la période.</li>';

  // Calendrier
  if (res.months.length > MAX_CAL) {
    $('cal').innerHTML = `<p class="note">Le calendrier s'affiche pour ${MAX_CAL} mois au plus. Réduisez la période pour le voir.</p>`;
  } else {
    $('cal').innerHTML = res.months.map((r) => {
      const offset = (r.days[0].wd + 6) % 7;
      const cells = Array(offset).fill('<span></span>').concat(r.days.map((d) =>
        `<span class="d ${d.type}"${d.nom ? ` title="${d.nom}"` : ''}>${d.day}</span>`));
      return `<div class="month">
        <div class="m-head"><strong>${MOIS[r.m - 1]} ${r.y}</strong><span>${r.ouvres} j.</span></div>
        <div class="m-grid">${JOURS.map((j) => `<span class="wd">${j}</span>`).join('')}${cells.join('')}</div>
      </div>`;
    }).join('');
  }
}

function setRange(f, t) {
  $('m1').value = f.m; $('y1').value = f.y;
  $('m2').value = t.m; $('y2').value = t.y;
  render();
}

document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
  const m = now.getMonth() + 1;
  switch (b.dataset.preset) {
    case 'mois': setRange({ y: thisYear, m }, { y: thisYear, m }); break;
    case 'trimestre': { const q = Math.floor((m - 1) / 3) * 3 + 1; setRange({ y: thisYear, m: q }, { y: thisYear, m: q + 2 }); break; }
    case 'annee': setRange({ y: thisYear, m: 1 }, { y: thisYear, m: 12 }); break;
    case 'suivante': setRange({ y: thisYear + 1, m: 1 }, { y: thisYear + 1, m: 12 }); break;
    default: break;
  }
}));

['m1', 'y1', 'm2', 'y2', 'ct'].forEach((id) => $(id).addEventListener('change', render));
$('taux').addEventListener('input', render);
$('conges').addEventListener('input', render);

$('hol').addEventListener('change', (e) => {
  const id = e.target.dataset && e.target.dataset.id;
  if (!id) return;
  const key = excludedKey($('ct').value);
  const set = new Set(store.get(key, []));
  if (e.target.checked) set.delete(id); else set.add(id);
  store.set(key, [...set]);
  render();
});

$('btnPrint').addEventListener('click', () => window.print());

$('btnCsv').addEventListener('click', () => {
  if (!last) return;
  const { s, res, net } = last;
  const head = ['Mois', 'Jours ouvrés', 'Fériés en semaine', 'Week-end', 'Jours calendaires'];
  if (s.taux < 100) head.push(`Jours à ${s.taux} %`);
  const rows = res.months.map((r) => {
    const row = [`${MOIS[r.m - 1]} ${r.y}`, r.ouvres, r.feries, r.weekend, r.jours];
    if (s.taux < 100) row.push((r.ouvres * s.taux / 100).toFixed(1).replace('.', ','));
    return row;
  });
  const t = res.totals;
  const total = ['Total', t.ouvres, t.feries, t.weekend, t.jours];
  if (s.taux < 100) total.push((t.ouvres * s.taux / 100).toFixed(1).replace('.', ','));
  const fmt = (n) => String(n).replace('.', ',');
  const pad = Array(head.length - 2).fill('');
  const extra = [[], ['Canton', CANTONS[s.canton], ...pad]];
  if (s.taux < 100) extra.push([`Jours ouvrés à ${s.taux} %`, fmt(net.theoriques), ...pad]);
  extra.push(['Congés déduits', fmt(s.conges), ...pad], ['Jours à travailler', fmt(net.net), ...pad]);
  const csv = '\ufeff' + [head, ...rows, total, ...extra].map((r) => r.join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `jours-ouvres-${s.canton}-${s.from.y}-${String(s.from.m).padStart(2, '0')}_${s.to.y}-${String(s.to.m).padStart(2, '0')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

render();
