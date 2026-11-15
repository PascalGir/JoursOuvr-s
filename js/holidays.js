// Jours fériés suisses par canton et calcul des jours ouvrés.
// Module ES utilisable dans le navigateur et dans Node (tests).

export const CANTONS = {
  AG: 'Argovie', AI: 'Appenzell Rhodes-Intérieures', AR: 'Appenzell Rhodes-Extérieures',
  BE: 'Berne', BL: 'Bâle-Campagne', BS: 'Bâle-Ville', FR: 'Fribourg', GE: 'Genève',
  GL: 'Glaris', GR: 'Grisons', JU: 'Jura', LU: 'Lucerne', NE: 'Neuchâtel',
  NW: 'Nidwald', OW: 'Obwald', SG: 'Saint-Gall', SH: 'Schaffhouse', SO: 'Soleure',
  SZ: 'Schwytz', TG: 'Thurgovie', TI: 'Tessin', UR: 'Uri', VD: 'Vaud', VS: 'Valais',
  ZG: 'Zoug', ZH: 'Zurich',
};

const ALL = Object.keys(CANTONS);
const except = (...excl) => ALL.filter((c) => !excl.includes(c));
const CATHOLIQUES = ['AI', 'FR', 'JU', 'LU', 'NW', 'OW', 'SZ', 'TI', 'UR', 'VS', 'ZG'];

const D = (y, m, d) => new Date(y, m - 1, d);
const addDays = (date, n) => { const r = new Date(date); r.setDate(r.getDate() + n); return r; };

/** Dimanche de Pâques (calendrier grégorien, algorithme de Meeus/Jones/Butcher). */
export function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return D(y, month, day);
}

function nthWeekday(y, month, weekday, n) {
  const d = D(y, month, 1);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + 7 * (n - 1));
  return d;
}

function naefelserFahrt(y) {
  // Premier jeudi d'avril ; s'il tombe pendant la Semaine sainte, reporté au jeudi suivant Pâques.
  const d = nthWeekday(y, 4, 4, 1);
  const e = easter(y);
  const diff = Math.round((d - e) / 86400000);
  return diff >= -7 && diff < 0 ? addDays(e, 4) : d;
}

export const RULES = [
  { id: 'nouvel-an', nom: 'Nouvel An', date: (y) => D(y, 1, 1), cantons: ALL },
  { id: 'berchtold', nom: 'Saint-Berchtold (2 janvier)', date: (y) => D(y, 1, 2),
    cantons: ['AG', 'BE', 'FR', 'GL', 'JU', 'LU', 'OW', 'SH', 'SO', 'TG', 'VD', 'ZG', 'ZH'] },
  { id: 'epiphanie', nom: 'Épiphanie', date: (y) => D(y, 1, 6), cantons: ['SZ', 'TI', 'UR'] },
  { id: 'republique-ne', nom: 'Instauration de la République', date: (y) => D(y, 3, 1), cantons: ['NE'] },
  { id: 'saint-joseph', nom: 'Saint-Joseph', date: (y) => D(y, 3, 19), cantons: ['NW', 'SZ', 'TI', 'UR', 'VS'] },
  { id: 'naefels', nom: 'Näfelser Fahrt', date: naefelserFahrt, cantons: ['GL'] },
  { id: 'vendredi-saint', nom: 'Vendredi saint', date: (y) => addDays(easter(y), -2), cantons: except('TI', 'VS') },
  { id: 'lundi-paques', nom: 'Lundi de Pâques', date: (y) => addDays(easter(y), 1), cantons: except('VS') },
  { id: 'travail', nom: 'Fête du travail', date: (y) => D(y, 5, 1),
    cantons: ['BL', 'BS', 'JU', 'NE', 'SH', 'TG', 'TI', 'ZH'] },
  { id: 'ascension', nom: 'Ascension', date: (y) => addDays(easter(y), 39), cantons: ALL },
  { id: 'lundi-pentecote', nom: 'Lundi de Pentecôte', date: (y) => addDays(easter(y), 50), cantons: except('VS') },
  { id: 'fete-dieu', nom: 'Fête-Dieu', date: (y) => addDays(easter(y), 60), cantons: CATHOLIQUES },
  { id: 'plebiscite-ju', nom: 'Commémoration du plébiscite', date: (y) => D(y, 6, 23), cantons: ['JU'] },
  { id: 'pierre-paul', nom: 'Saint-Pierre et Saint-Paul', date: (y) => D(y, 6, 29), cantons: ['TI'] },
  { id: 'fete-nationale', nom: 'Fête nationale', date: (y) => D(y, 8, 1), cantons: ALL },
  { id: 'assomption', nom: 'Assomption', date: (y) => D(y, 8, 15), cantons: CATHOLIQUES },
  { id: 'jeune-genevois', nom: 'Jeûne genevois', date: (y) => addDays(nthWeekday(y, 9, 0, 1), 4), cantons: ['GE'] },
  { id: 'lundi-jeune', nom: 'Lundi du Jeûne fédéral', date: (y) => addDays(nthWeekday(y, 9, 0, 3), 1), cantons: ['NE', 'VD'] },
  { id: 'bruder-klaus', nom: 'Saint-Nicolas de Flüe', date: (y) => D(y, 9, 25), cantons: ['OW'] },
  { id: 'toussaint', nom: 'Toussaint', date: (y) => D(y, 11, 1), cantons: [...CATHOLIQUES, 'GL', 'SG'] },
  { id: 'immaculee', nom: 'Immaculée Conception', date: (y) => D(y, 12, 8),
    cantons: CATHOLIQUES.filter((c) => c !== 'JU') },
  { id: 'noel', nom: 'Noël', date: (y) => D(y, 12, 25), cantons: ALL },
  { id: 'saint-etienne', nom: 'Saint-Étienne', date: (y) => D(y, 12, 26), cantons: except('GE', 'JU', 'NE', 'VD', 'VS') },
  { id: 'restauration', nom: 'Restauration de la République', date: (y) => D(y, 12, 31), cantons: ['GE'] },
];

export const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Liste des fériés d'un canton pour une année, triés par date. */
export function holidaysFor(year, canton) {
  return RULES.filter((r) => r.cantons.includes(canton))
    .map((r) => ({ id: r.id, nom: r.nom, date: r.date(year) }))
    .sort((a, b) => a.date - b.date);
}

/**
 * Jours à travailler = jours ouvrés × taux d'activité − jours de congés.
 * @returns {{theoriques:number, conges:number, net:number}}
 */
export function workingDays({ ouvres, taux = 100, conges = 0 }) {
  if (!Number.isFinite(conges) || conges < 0) throw new RangeError('Le nombre de jours de congés doit être positif.');
  if (Math.round(conges * 2) !== conges * 2) throw new RangeError('Les congés se saisissent par demi-journée (0,5).');
  const theoriques = Math.round(ouvres * taux * 10 / 100) / 10;
  if (conges > theoriques) {
    const f = (n) => String(n).replace('.', ',');
    throw new RangeError(`Les congés (${f(conges)}) dépassent les jours ouvrés de la période (${f(theoriques)}).`);
  }
  return { theoriques, conges, net: Math.round((theoriques - conges) * 10) / 10 };
}

/**
 * Compte les jours ouvrés (lundi–vendredi hors fériés) entre deux mois inclus.
 * @param {{from:{y:number,m:number}, to:{y:number,m:number}, canton:string, excluded?:Set<string>}} opts
 *   m est 1–12 ; excluded contient les identifiants de fériés à ne PAS compter comme fériés.
 */
export function computeRange({ from, to, canton, excluded = new Set() }) {
  const start = from.y * 12 + (from.m - 1);
  const end = to.y * 12 + (to.m - 1);
  if (end < start) throw new RangeError('La fin doit être postérieure ou égale au début.');

  const map = new Map();
  const holidays = [];
  for (let y = from.y; y <= to.y; y++) {
    for (const h of holidaysFor(y, canton)) {
      const t = h.date.getFullYear() * 12 + h.date.getMonth();
      if (t < start || t > end) continue;
      const wd = h.date.getDay();
      const item = { ...h, iso: isoDate(h.date), weekend: wd === 0 || wd === 6, compte: !excluded.has(h.id) };
      holidays.push(item);
      if (item.compte) map.set(item.iso, item);
    }
  }

  const months = [];
  const totals = { ouvres: 0, feries: 0, weekend: 0, jours: 0 };
  for (let t = start; t <= end; t++) {
    const y = Math.floor(t / 12), m = t % 12;
    const row = { y, m: m + 1, ouvres: 0, feries: 0, weekend: 0, jours: 0, days: [] };
    const d = new Date(y, m, 1);
    while (d.getMonth() === m) {
      const wd = d.getDay();
      const iso = isoDate(d);
      const hol = map.get(iso);
      let type = 'ouvre';
      if (wd === 0 || wd === 6) type = 'weekend';
      else if (hol) type = 'ferie';
      row.jours++;
      if (type === 'ouvre') row.ouvres++;
      else if (type === 'weekend') row.weekend++;
      else row.feries++;
      row.days.push({ day: d.getDate(), wd, type, nom: hol ? hol.nom : null });
      d.setDate(d.getDate() + 1);
    }
    for (const k of Object.keys(totals)) totals[k] += row[k];
    months.push(row);
  }
  return { months, totals, holidays };
}
