import { COUNTRIES, computeRange, workingDays, daysInMonth } from './holidays.js?v=1.3.0';
import { VERSION } from './version.js?v=1.3.0';

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
fillSelect($('pays'), Object.entries(COUNTRIES).map(([code, c]) => [code, c.nom]));

// Liste des régions (canton, zone, Land) du pays choisi ; masquée s'il n'y en a qu'une.
function fillRegions(country, wanted) {
  const c = COUNTRIES[country];
  let entries = Object.entries(c.regions);
  if (c.sortRegions) entries = entries.sort((a, b) => a[1].localeCompare(b[1], 'fr'));
  fillSelect($('ct'), entries.map(([code, nom]) => [code, c.sortRegions ? `${nom} (${code})` : nom]));
  $('ct').value = c.regions[wanted] ? wanted : c.defaultRegion;
  $('regionLabel').textContent = c.regionLabel || 'Région';
  $('regionField').hidden = entries.length < 2;
  $('logo').textContent = country;
  $('note').textContent = c.note;
}
const storedRegion = (country) => store.get(`region-${country}`, country === 'CH' ? store.get('canton', null) : null);

// Liste des jours selon le mois et l'année choisis (28 à 31), en gardant le jour sélectionné si possible.
function syncDays(n, wanted) {
  const el = $(`d${n}`);
  const max = daysInMonth(+$(`y${n}`).value, +$(`m${n}`).value);
  const cur = wanted ?? +el.value;
  if (el.options.length !== max) fillSelect(el, Array.from({ length: max }, (_, i) => [i + 1, i + 1]));
  el.value = Math.min(Math.max(cur || 1, 1), max);
}

// État initial : paramètres d'URL, puis préférences enregistrées, puis valeurs par défaut.
// Formats acceptés : AAAA-MM-JJ ou AAAA-MM (début = 1er du mois, fin = dernier jour).
function parseDate(s, fin) {
  const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(s || '');
  if (!m) return null;
  const y = +m[1], mo = +m[2];
  if (mo < 1 || mo > 12) return null;
  return { y, m: mo, d: m[3] ? +m[3] : (fin ? daysInMonth(y, mo) : 1) };
}
const params = new URLSearchParams(location.search);
const from = parseDate(params.get('du'), false) || { y: thisYear, m: 1, d: 1 };
const to = parseDate(params.get('au'), true) || { y: thisYear, m: 12, d: 31 };
const legacyCanton = COUNTRIES.CH.regions[params.get('canton')] ? params.get('canton') : null;
const savedPays = COUNTRIES[store.get('pays', 'CH')] ? store.get('pays', 'CH') : 'CH';
const pays = legacyCanton ? 'CH' : (COUNTRIES[params.get('pays')] ? params.get('pays') : savedPays);
const region = legacyCanton || params.get('region') || storedRegion(pays);
const taux = +params.get('taux') || store.get('taux', 100);
const conges = Math.max(0, +(params.get('conges') || '0').replace(',', '.') || 0);

$('m1').value = from.m; $('y1').value = from.y; syncDays(1, from.d);
$('m2').value = to.m; $('y2').value = to.y; syncDays(2, to.d);
$('pays').value = pays;
fillRegions(pays, region);
$('taux').value = taux;
$('conges').value = conges;
$('version').textContent = VERSION;

const excludedKey = (country, reg) => `exclus-${country}-${reg}`;
function getExcluded(country, reg) {
  // Compatibilité : avant la v1.3.0, les fériés décochés suisses étaient enregistrés sous « exclus-<canton> ».
  return store.get(excludedKey(country, reg), country === 'CH' ? store.get(`exclus-${reg}`, []) : []);
}
let last = null;

function readState() {
  return {
    from: { y: +$('y1').value, m: +$('m1').value, d: +$('d1').value },
    to: { y: +$('y2').value, m: +$('m2').value, d: +$('d2').value },
    pays: $('pays').value,
    region: $('ct').value,
    taux: Math.min(100, Math.max(1, Math.round(+$('taux').value || 100))),
    conges: +String($('conges').value || '0').replace(',', '.'),
  };
}

const pad2 = (n) => String(n).padStart(2, '0');
const ymd = (x) => `${x.y}-${pad2(x.m)}-${pad2(x.d)}`;
const placeLabel = (s) => {
  const c = COUNTRIES[s.pays];
  return Object.keys(c.regions).length > 1 ? `${c.nom} – ${c.regions[s.region]}` : c.nom;
};
const dateFr = (x) => `${x.d} ${MOIS[x.m - 1]} ${x.y}`;
const monthLabel = (r) => {
  const base = `${MOIS[r.m - 1].slice(0, 4)}. ${r.y}`;
  if (!r.partiel) return { base, part: '' };
  const inside = r.days.filter((d) => d.type !== 'hors');
  const a = inside[0].day, b = inside[inside.length - 1].day;
  return { base, part: a === b ? `le ${a}` : `du ${a} au ${b}` };
};

function updateUrl(s) {
  const p = new URLSearchParams({
    du: ymd(s.from),
    au: ymd(s.to),
    pays: s.pays,
  });
  if (Object.keys(COUNTRIES[s.pays].regions).length > 1) p.set('region', s.region);
  if (s.taux !== 100) p.set('taux', s.taux);
  if (s.conges > 0) p.set('conges', s.conges);
  history.replaceState(null, '', `?${p}`);
}

function render() {
  const s = readState();
  store.set('pays', s.pays);
  store.set(`region-${s.pays}`, s.region);
  store.set('taux', s.taux);
  const excluded = new Set(getExcluded(s.pays, s.region));

  let res, net;
  try {
    res = computeRange({ from: s.from, to: s.to, country: s.pays, region: s.region, excluded });
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

  const periode = `du ${dateFr(s.from)} au ${dateFr(s.to)}`;
  $('printTitle').textContent = `${placeLabel(s)} · ${periode}`;

  // Barres par mois
  const max = Math.max(...res.months.map((r) => r.ouvres), 1);
  $('bars').innerHTML = res.months.map((r) => `
    <div class="bar-row">
      <span class="bar-lbl">${monthLabel(r).base}${r.partiel ? `<small>${monthLabel(r).part}</small>` : ''}</span>
      <span class="bar-track"><span class="bar" style="width:${Math.round((r.ouvres / max) * 100)}%"></span></span>
      <span class="bar-val">${r.ouvres}${s.taux < 100 ? `<small> · ${nf.format(r.ouvres * s.taux / 100)}</small>` : ''}</span>
    </div>`).join('');

  // Liste des fériés
  $('hol').innerHTML = res.holidays.length ? res.holidays.map((h) => `
    <li class="${h.compte ? '' : 'off'}">
      <label>
        <input type="checkbox" class="no-print" data-id="${h.id}" ${h.compte ? 'checked' : ''}>
        <span class="h-date">${h.date.toLocaleDateString('fr', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
  $('m1').value = f.m; $('y1').value = f.y; syncDays(1, f.d || 1);
  $('m2').value = t.m; $('y2').value = t.y; syncDays(2, t.d || daysInMonth(t.y, t.m));
  render();
}

document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
  const m = now.getMonth() + 1;
  switch (b.dataset.preset) {
    case 'mois': setRange({ y: thisYear, m }, { y: thisYear, m }); break;
    case 'trimestre': { const q = Math.floor((m - 1) / 3) * 3 + 1; setRange({ y: thisYear, m: q }, { y: thisYear, m: q + 2 }); break; }
    case 'reste': setRange({ y: thisYear, m, d: now.getDate() }, { y: thisYear, m: 12 }); break;
    case 'annee': setRange({ y: thisYear, m: 1 }, { y: thisYear, m: 12 }); break;
    case 'suivante': setRange({ y: thisYear + 1, m: 1 }, { y: thisYear + 1, m: 12 }); break;
    default: break;
  }
}));

['m1', 'y1'].forEach((id) => $(id).addEventListener('change', () => { syncDays(1); render(); }));
['m2', 'y2'].forEach((id) => $(id).addEventListener('change', () => { syncDays(2); render(); }));
['d1', 'd2', 'ct'].forEach((id) => $(id).addEventListener('change', render));
$('pays').addEventListener('change', () => { fillRegions($('pays').value, storedRegion($('pays').value)); render(); });
$('taux').addEventListener('input', render);
$('conges').addEventListener('input', render);

$('hol').addEventListener('change', (e) => {
  const id = e.target.dataset && e.target.dataset.id;
  if (!id) return;
  const key = excludedKey($('pays').value, $('ct').value);
  const set = new Set(getExcluded($('pays').value, $('ct').value));
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
    const lbl = monthLabel(r);
    const row = [`${MOIS[r.m - 1]} ${r.y}${lbl.part ? ` (${lbl.part})` : ''}`, r.ouvres, r.feries, r.weekend, r.jours];
    if (s.taux < 100) row.push((r.ouvres * s.taux / 100).toFixed(1).replace('.', ','));
    return row;
  });
  const t = res.totals;
  const total = ['Total', t.ouvres, t.feries, t.weekend, t.jours];
  if (s.taux < 100) total.push((t.ouvres * s.taux / 100).toFixed(1).replace('.', ','));
  const fmt = (n) => String(n).replace('.', ',');
  const pad = Array(head.length - 2).fill('');
  const extra = [[], ['Lieu', placeLabel(s), ...pad], ['Période', `du ${dateFr(s.from)} au ${dateFr(s.to)}`, ...pad]];
  if (s.taux < 100) extra.push([`Jours ouvrés à ${s.taux} %`, fmt(net.theoriques), ...pad]);
  extra.push(['Congés déduits', fmt(s.conges), ...pad], ['Jours à travailler', fmt(net.net), ...pad]);
  const csv = '\ufeff' + [head, ...rows, total, ...extra].map((r) => r.join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const lieu = Object.keys(COUNTRIES[s.pays].regions).length > 1 ? `${s.pays}-${s.region}` : s.pays;
  a.download = `jours-ouvres-${lieu}-${ymd(s.from)}_${ymd(s.to)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

render();
