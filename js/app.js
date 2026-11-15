import { COUNTRIES, computeRange, workingDays, daysInMonth, ES_ANNEES_OFFICIELLES } from './holidays.js?v=1.5.1';
import { VERSION } from './version.js?v=1.5.1';
import {
  detectLang, setLang, getLang, locale, t, holidayName, regionName, regionLabel, countryName, countryNote, sourceLabel,
} from './i18n.js?v=1.5.1';

const MAX_CAL = 36;
const $ = (id) => document.getElementById(id);

// Préférences du navigateur ; si le stockage local est bloqué, elles sont gardées en mémoire pour la session.
const memory = new Map();
const store = {
  get(k, def) {
    let v;
    try { v = localStorage.getItem(k); } catch { v = memory.has(k) ? memory.get(k) : null; }
    return v === null ? def : JSON.parse(v);
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { memory.set(k, JSON.stringify(v)); } },
  del(k) { try { localStorage.removeItem(k); } catch { memory.delete(k); } },
};

const now = new Date();
const thisYear = now.getFullYear();
const pad2 = (n) => String(n).padStart(2, '0');
const ymd = (x) => `${x.y}-${pad2(x.m)}-${pad2(x.d)}`;
const toDate = (x) => new Date(x.y, x.m - 1, x.d);
const fromDate = (d) => ({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() });
const nf = () => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 });
const fmtDate = (x, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => toDate(x).toLocaleDateString(locale(), opts);
const monthName = (y, m, style = 'long') => new Date(y, m - 1, 1).toLocaleDateString(locale(), { month: style });
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const regionCount = (p) => Object.keys(COUNTRIES[p].regions).length;

function fillSelect(el, items) {
  el.innerHTML = items.map(([v, txt]) => `<option value="${v}">${escapeHtml(txt)}</option>`).join('');
}

/** Date AAAA-MM-JJ (ou AAAA-MM : 1er ou dernier jour du mois selon `fin`). */
function parseDate(s, fin) {
  const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(s || '');
  if (!m) return null;
  const y = +m[1], mo = +m[2];
  if (mo < 1 || mo > 12) return null;
  const d = m[3] ? Math.min(Math.max(+m[3], 1), daysInMonth(y, mo)) : (fin ? daysInMonth(y, mo) : 1);
  return { y, m: mo, d };
}

// ---------- Langue et textes fixes ----------
const params = new URLSearchParams(location.search);
setLang(detectLang({ param: params.get('lang'), stored: store.get('lang', null), navigatorLanguages: navigator.languages || [navigator.language] }));

function applyStaticTexts() {
  document.documentElement.lang = getLang();
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  $('lang').value = getLang();
  // Suisse et France en tête, puis les autres pays par ordre alphabétique.
  const prio = (k) => (k === 'CH' ? 0 : k === 'FR' ? 1 : 9);
  const pays = Object.keys(COUNTRIES).map((code) => [code, countryName(code, COUNTRIES[code].nom)])
    .sort(([a, na], [b, nb]) => prio(a) - prio(b) || na.localeCompare(nb, locale()));
  const cur = $('pays').value;
  fillSelect($('pays'), pays);
  if (cur) $('pays').value = cur;
}

// ---------- Pays et région ----------
function fillRegions(country, wanted) {
  const c = COUNTRIES[country];
  let entries = Object.entries(c.regions).map(([code, nom]) => [code, regionName(nom)]);
  if (c.sortRegions) entries = entries.sort((a, b) => a[1].localeCompare(b[1], locale()));
  fillSelect($('ct'), entries.map(([code, nom]) => [code, c.sortRegions && code.length <= 3 ? `${nom} (${code})` : nom]));
  $('ct').value = c.regions[wanted] ? wanted : c.defaultRegion;
  $('regionLabel').textContent = regionLabel(c.regionLabel);
  $('regionField').hidden = entries.length < 2;
  $('logo').textContent = country;
}
const storedRegion = (country) => store.get(`region-${country}`, country === 'CH' ? store.get('canton', null) : null);

applyStaticTexts();

// ---------- État initial : URL, puis préférences enregistrées, puis valeurs par défaut ----------
const legacyCanton = COUNTRIES.CH.regions[params.get('canton')] ? params.get('canton') : null;
const savedPays = COUNTRIES[store.get('pays', 'CH')] ? store.get('pays', 'CH') : 'CH';
const pays0 = legacyCanton ? 'CH' : (COUNTRIES[params.get('pays')] ? params.get('pays') : savedPays);
$('pays').value = pays0;
fillRegions(pays0, legacyCanton || params.get('region') || storedRegion(pays0));
$('du').value = ymd(parseDate(params.get('du'), false) || { y: thisYear, m: 1, d: 1 });
$('au').value = ymd(parseDate(params.get('au'), true) || { y: thisYear, m: 12, d: 31 });
$('taux').value = +params.get('taux') || store.get('taux', 100);
$('conges').value = Math.max(0, +(params.get('conges') || '0').replace(',', '.') || 0);
$('version').textContent = VERSION;

// ---------- Fériés personnalisés (mémorisés par pays et région) ----------
const excludedKey = (p, r) => `exclus-${p}-${r}`;
const includedKey = (p, r) => `inclus-${p}-${r}`;
const getIncluded = (p, r) => store.get(includedKey(p, r), []);
function getExcluded(p, r) {
  // Avant la v1.3.0, les fériés décochés suisses étaient enregistrés sous « exclus-<canton> ».
  return store.get(excludedKey(p, r), p === 'CH' ? store.get(`exclus-${r}`, []) : []);
}

function readState() {
  return {
    from: parseDate($('du').value, false),
    to: parseDate($('au').value, true),
    pays: $('pays').value,
    region: $('ct').value,
    taux: Math.min(100, Math.max(1, Math.round(+$('taux').value || 100))),
    conges: +String($('conges').value || '0').replace(',', '.'),
  };
}

function updateUrl(s) {
  const p = new URLSearchParams({ du: ymd(s.from), au: ymd(s.to), pays: s.pays });
  if (regionCount(s.pays) > 1) p.set('region', s.region);
  if (s.taux !== 100) p.set('taux', s.taux);
  if (s.conges > 0) p.set('conges', s.conges);
  if (params.get('lang')) p.set('lang', getLang());
  history.replaceState(null, '', `?${p}`);
}

const placeLabel = (s) => {
  const c = COUNTRIES[s.pays];
  const nom = countryName(s.pays, c.nom);
  return regionCount(s.pays) > 1 ? `${nom} – ${regionName(c.regions[s.region])}` : nom;
};
const periodLabel = (s) => t('periodText', { a: fmtDate(s.from), b: fmtDate(s.to) });
function monthPart(r) {
  if (!r.partiel) return '';
  const inside = r.days.filter((d) => d.type !== 'hors');
  const a = inside[0].day, b = inside[inside.length - 1].day;
  return a === b ? t('part.single', { a }) : t('part.range', { a, b });
}
const holidayLabel = (h) => holidayName(h.nom);

let last = null;

function showError(e) {
  $('err').textContent = e.code ? t(`err.${e.code}`, {
    conges: nf().format(e.params?.conges ?? 0), theoriques: nf().format(e.params?.theoriques ?? 0),
  }) : e.message;
  ['kN', 'kO', 'kV', 'kF', 'kW', 'kC'].forEach((id) => { $(id).textContent = '–'; });
  $('kNh').textContent = '';
  $('bars').innerHTML = $('hol').innerHTML = $('cal').innerHTML = $('printDoc').innerHTML = '';
  last = null;
}

function render() {
  const s = readState();
  store.set('pays', s.pays);
  store.set(`region-${s.pays}`, s.region);
  store.set('taux', s.taux);
  renderFooter(s);
  if (!s.from || !s.to) { showError({ code: 'DATE_MISSING' }); return; }
  let res, net;
  try {
    res = computeRange({
      from: s.from, to: s.to, country: s.pays, region: s.region,
      excluded: new Set(getExcluded(s.pays, s.region)), included: new Set(getIncluded(s.pays, s.region)),
    });
    net = workingDays({ ouvres: res.totals.ouvres, taux: s.taux, conges: s.conges });
  } catch (e) {
    showError(e);
    return;
  }
  $('err').textContent = '';
  updateUrl(s);
  last = { s, res, net };

  const f = nf();
  const tot = res.totals;
  $('kN').textContent = f.format(net.net);
  const parts = [s.taux < 100 ? t('hint.rate', { n: f.format(net.theoriques), p: s.taux }) : t('hint.workdays', { n: tot.ouvres })];
  if (s.conges > 0) parts.push(t('hint.leave', { n: f.format(s.conges) }));
  $('kNh').textContent = parts.length > 1 || s.taux < 100 ? parts.join(' − ') : '';
  $('kO').textContent = tot.ouvres;
  $('kV').textContent = f.format(s.conges);
  $('kF').textContent = tot.feries;
  $('kW').textContent = tot.weekend;
  $('kC').textContent = tot.jours;

  renderBars(s, res);
  renderHolidays(res);
  renderCalendar(res);
  renderPrint(s, res, net);
}

// ---------- Détail par mois (graphique interactif) ----------
function renderBars(s, res) {
  const f = nf();
  const max = Math.max(...res.months.map((r) => r.ouvres), 1);
  $('bars').innerHTML = res.months.map((r, i) => {
    const part = monthPart(r);
    const detail = t('bar.detail', { o: r.ouvres, f: r.feries, w: r.weekend, j: r.jours });
    return `<button type="button" class="bar-row" data-i="${i}" aria-expanded="false" aria-describedby="tip-${i}">
      <span class="bar-lbl">${escapeHtml(monthName(r.y, r.m, 'short'))} ${r.y}${part ? `<small>${escapeHtml(part)}</small>` : ''}</span>
      <span class="bar-track"><span class="bar" style="width:${Math.round((r.ouvres / max) * 100)}%"></span></span>
      <span class="bar-val">${r.ouvres}${s.taux < 100 ? `<small> · ${f.format(r.ouvres * s.taux / 100)}</small>` : ''}</span>
      <span class="tip" id="tip-${i}" role="tooltip">${escapeHtml(detail)}</span>
    </button>`;
  }).join('');
}

// ---------- Liste des fériés ----------
function renderHolidays(res) {
  $('hol').innerHTML = res.holidays.length ? res.holidays.map((h) => {
    const tags = [];
    if (h.weekend) tags.push(t('tag.weekend'));
    if (h.optionnel) tags.push(t('tag.optional'));
    if (h.estimation) tags.push(t('tag.estimation'));
    if (h.report) tags.push(t('tag.report'));
    return `<li class="${h.compte ? '' : 'off'}">
      <label>
        <input type="checkbox" data-id="${h.id}"${h.optionnel ? ' data-opt="1"' : ''} ${h.compte ? 'checked' : ''}>
        <span class="h-date">${escapeHtml(h.date.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))}</span>
        <span class="h-nom">${escapeHtml(holidayLabel(h))}</span>
        ${tags.map((x) => `<span class="tag">${escapeHtml(x)}</span>`).join('')}
      </label>
    </li>`;
  }).join('') : `<li class="empty">${escapeHtml(t('holidaysEmpty'))}</li>`;
}

// ---------- Calendrier ----------
function renderCalendar(res) {
  if (res.months.length > MAX_CAL) {
    $('cal').innerHTML = `<p class="note">${escapeHtml(t('calendarTooLong', { n: MAX_CAL }))}</p>`;
    return;
  }
  const wd = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale(), { weekday: 'short' }).replace('.', '').slice(0, 2));
  $('cal').innerHTML = res.months.map((r) => {
    const offset = (r.days[0].wd + 6) % 7;
    const cells = Array(offset).fill('<span></span>').concat(r.days.map((d) =>
      `<span class="d ${d.type}"${d.nom ? ` title="${escapeHtml(holidayName(d.nom))}"` : ''}>${d.day}</span>`));
    return `<div class="month">
      <div class="m-head"><strong>${escapeHtml(monthName(r.y, r.m))} ${r.y}</strong><span>${escapeHtml(t('cal.count', { n: r.ouvres }))}</span></div>
      <div class="m-grid">${wd.map((j) => `<span class="wd">${escapeHtml(j)}</span>`).join('')}${cells.join('')}</div>
    </div>`;
  }).join('');
}

// ---------- Document A4 pour l'impression ----------
function renderPrint(s, res, net) {
  const f = nf();
  const tot = res.totals;
  const kpis = [
    [t('kpi.net'), f.format(net.net)], [t('kpi.workdays'), tot.ouvres], [t('kpi.leave'), f.format(s.conges)],
    [t('kpi.holidays'), tot.feries], [t('kpi.weekend'), tot.weekend], [t('kpi.calendar'), tot.jours],
  ];
  const rateCol = s.taux < 100;
  const rows = res.months.map((r) => `<tr><td>${escapeHtml(monthName(r.y, r.m))} ${r.y}${r.partiel ? ` <small>(${escapeHtml(monthPart(r))})</small>` : ''}</td>
    <td>${r.ouvres}</td>${rateCol ? `<td>${f.format(r.ouvres * s.taux / 100)}</td>` : ''}<td>${r.feries}</td><td>${r.weekend}</td><td>${r.jours}</td></tr>`).join('');
  const hol = res.holidays.map((h) => `<tr class="${h.compte ? '' : 'off'}"><td>${escapeHtml(h.date.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }))}</td>
    <td>${escapeHtml(holidayLabel(h))}</td><td>${h.compte ? t('yes') : t('no')}</td></tr>`).join('');
  const c = COUNTRIES[s.pays];
  $('printDoc').innerHTML = `
    <div class="p-head">
      <h2>${escapeHtml(t('print.summary'))} · ${escapeHtml(placeLabel(s))}</h2>
      <p>${escapeHtml(periodLabel(s))}${s.taux < 100 ? ` · ${escapeHtml(t('rate'))} ${s.taux} %` : ''} · ${escapeHtml(t('print.printed', { d: now.toLocaleDateString(locale()) }))}</p>
    </div>
    <div class="p-kpis">${kpis.map(([l, v], i) => `<div class="p-kpi${i === 0 ? ' main' : ''}"><span>${escapeHtml(l)}</span><strong>${v}</strong></div>`).join('')}</div>
    <div class="p-cols">
      <table class="p-table"><thead><tr><th>${escapeHtml(t('col.month'))}</th><th>${escapeHtml(t('col.workdays'))}</th>${rateCol ? `<th>${escapeHtml(t('col.atRate', { p: s.taux }))}</th>` : ''}
        <th>${escapeHtml(t('col.holidays'))}</th><th>${escapeHtml(t('col.weekend'))}</th><th>${escapeHtml(t('col.days'))}</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td>${escapeHtml(t('total'))}</td><td>${tot.ouvres}</td>${rateCol ? `<td>${f.format(net.theoriques)}</td>` : ''}<td>${tot.feries}</td><td>${tot.weekend}</td><td>${tot.jours}</td></tr></tfoot></table>
      <table class="p-table p-hol"><thead><tr><th>${escapeHtml(t('col.date'))}</th><th>${escapeHtml(t('col.holiday'))}</th><th>${escapeHtml(t('col.counted'))}</th></tr></thead>
        <tbody>${hol || `<tr><td colspan="3">${escapeHtml(t('holidaysEmpty'))}</td></tr>`}</tbody></table>
    </div>
    <p class="p-note">${escapeHtml(noteFor(s.pays))} ${escapeHtml(c.sources.map((x) => `${sourceLabel(x.label)} : ${x.url}`).join(' · '))}</p>
    <p class="p-note">${escapeHtml(t('title'))} · ${escapeHtml(t('version'))} ${VERSION} · ${escapeHtml(location.href)}</p>`;
}

// ---------- Pied de page : note et sources officielles du pays ----------
const noteFor = (p) => countryNote(p, COUNTRIES[p].note, { years: ES_ANNEES_OFFICIELLES.join(getLang() === 'fr' ? ' et ' : ' and ') });
function renderFooter(s) {
  $('note').textContent = noteFor(s.pays);
  const src = COUNTRIES[s.pays].sources;
  $('sources').innerHTML = `${escapeHtml(t(src.length > 1 ? 'officialSources' : 'officialSource'))} ${src.map((x) =>
    `<a href="${escapeHtml(x.url)}" rel="noopener" target="_blank">${escapeHtml(sourceLabel(x.label))}</a>`).join(' · ')}`;
}

// ---------- Période rapide ----------
function presetRange(key) {
  const y = thisYear, m = now.getMonth() + 1;
  const endOf = (yy, mm) => ({ y: yy, m: mm, d: daysInMonth(yy, mm) });
  switch (key) {
    case 'mois': return [{ y, m, d: 1 }, endOf(y, m)];
    case 'moisSuivant': { const n = fromDate(new Date(y, m, 1)); return [n, endOf(n.y, n.m)]; }
    case 'trimestre': { const q = Math.floor((m - 1) / 3) * 3 + 1; return [{ y, m: q, d: 1 }, endOf(y, q + 2)]; }
    case 'reste': return [fromDate(now), { y, m: 12, d: 31 }];
    case 'suivante': return [{ y: y + 1, m: 1, d: 1 }, { y: y + 1, m: 12, d: 31 }];
    case 'douze': return [fromDate(now), fromDate(new Date(y + 1, m - 1, now.getDate() - 1))];
    default: return [{ y, m: 1, d: 1 }, { y, m: 12, d: 31 }];
  }
}
$('preset').addEventListener('change', () => {
  if (!$('preset').value) return;
  const [a, b] = presetRange($('preset').value);
  $('du').value = ymd(a);
  $('au').value = ymd(b);
  render();
});

// ---------- Événements ----------
['du', 'au'].forEach((id) => $(id).addEventListener('change', () => { $('preset').value = ''; render(); }));
$('ct').addEventListener('change', render);
$('pays').addEventListener('change', () => { fillRegions($('pays').value, storedRegion($('pays').value)); render(); });
$('taux').addEventListener('input', render);
$('conges').addEventListener('input', render);

$('lang').addEventListener('change', () => {
  setLang($('lang').value);
  store.set('lang', getLang());
  applyStaticTexts();
  fillRegions($('pays').value, $('ct').value);
  render();
});

document.addEventListener('click', (e) => {
  const help = e.target.closest('.help');
  if (help) {
    const box = $(help.getAttribute('aria-controls'));
    box.hidden = !box.hidden;
    help.setAttribute('aria-expanded', String(!box.hidden));
    return;
  }
  const bar = e.target.closest('.bar-row');
  if (bar) {
    const open = !bar.classList.contains('open');
    document.querySelectorAll('.bar-row.open').forEach((b) => { b.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); });
    bar.classList.toggle('open', open);
    bar.setAttribute('aria-expanded', String(open));
  }
});

$('hol').addEventListener('change', (e) => {
  const { id, opt } = e.target.dataset;
  const p = $('pays').value, reg = $('ct').value;
  if (opt) {
    const set = new Set(getIncluded(p, reg));
    if (e.target.checked) set.add(id); else set.delete(id);
    store.set(includedKey(p, reg), [...set]);
  } else {
    const set = new Set(getExcluded(p, reg));
    if (e.target.checked) set.delete(id); else set.add(id);
    store.set(excludedKey(p, reg), [...set]);
  }
  render();
});

$('btnRestore').addEventListener('click', () => {
  const p = $('pays').value, reg = $('ct').value;
  store.del(excludedKey(p, reg));
  store.del(includedKey(p, reg));
  if (p === 'CH') store.del(`exclus-${reg}`);
  render();
});

$('btnReset').addEventListener('click', () => {
  ['pays', 'taux', 'canton'].forEach((k) => store.del(k));
  Object.keys(COUNTRIES).forEach((k) => store.del(`region-${k}`));
  $('pays').value = 'CH';
  fillRegions('CH', null);
  $('du').value = ymd({ y: thisYear, m: 1, d: 1 });
  $('au').value = ymd({ y: thisYear, m: 12, d: 31 });
  $('preset').value = 'annee';
  $('taux').value = 100;
  $('conges').value = 0;
  render();
});

// ---------- Partager, imprimer, exporter ----------
let toastTimer = null;
function toast(msg) {
  $('toast').textContent = msg;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}

$('btnShare').addEventListener('click', async () => {
  const url = location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: t('title'), text: t('shareText'), url });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast(t('linkCopied'));
  } catch {
    toast(t('linkCopyFailed', { url }));
  }
});

$('btnPrint').addEventListener('click', () => window.print());

$('btnCsv').addEventListener('click', () => {
  if (!last) return;
  const { s, res, net } = last;
  const fmt = (n) => (getLang() === 'fr' ? String(n).replace('.', ',') : String(n));
  const head = [t('col.month'), t('kpi.workdays'), t('kpi.holidays'), t('kpi.weekend'), t('kpi.calendar')];
  if (s.taux < 100) head.push(t('col.atRate', { p: s.taux }));
  const rows = res.months.map((r) => {
    const part = monthPart(r);
    const row = [`${monthName(r.y, r.m)} ${r.y}${part ? ` (${part})` : ''}`, r.ouvres, r.feries, r.weekend, r.jours];
    if (s.taux < 100) row.push(fmt((r.ouvres * s.taux / 100).toFixed(1)));
    return row;
  });
  const tot = res.totals;
  const total = [t('total'), tot.ouvres, tot.feries, tot.weekend, tot.jours];
  if (s.taux < 100) total.push(fmt((tot.ouvres * s.taux / 100).toFixed(1)));
  const pad = Array(head.length - 2).fill('');
  const extra = [[], [t('csv.place'), placeLabel(s), ...pad], [t('csv.period'), periodLabel(s), ...pad]];
  if (s.taux < 100) extra.push([t('csv.atRate', { p: s.taux }), fmt(net.theoriques), ...pad]);
  extra.push([t('kpi.leave'), fmt(s.conges), ...pad], [t('kpi.net'), fmt(net.net), ...pad]);
  const csv = '﻿' + [head, ...rows, total, ...extra].map((r) => r.join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const lieu = regionCount(s.pays) > 1 ? `${s.pays}-${s.region}` : s.pays;
  a.download = `${t('csv.file')}-${lieu}-${ymd(s.from)}_${ymd(s.to)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

render();
