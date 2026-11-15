// Jours fériés par pays et par région (canton, Land, zone) et calcul des jours ouvrés.
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

const RULES_CH = [
  { id: 'nouvel-an', nom: 'Nouvel An', date: (y) => D(y, 1, 1), regions: ALL },
  { id: 'berchtold', nom: 'Saint-Berchtold (2 janvier)', date: (y) => D(y, 1, 2),
    regions: ['AG', 'BE', 'FR', 'GL', 'JU', 'LU', 'OW', 'SH', 'SO', 'TG', 'VD', 'ZG', 'ZH'] },
  { id: 'epiphanie', nom: 'Épiphanie', date: (y) => D(y, 1, 6), regions: ['SZ', 'TI', 'UR'] },
  { id: 'republique-ne', nom: 'Instauration de la République', date: (y) => D(y, 3, 1), regions: ['NE'] },
  { id: 'saint-joseph', nom: 'Saint-Joseph', date: (y) => D(y, 3, 19), regions: ['NW', 'SZ', 'TI', 'UR', 'VS'] },
  { id: 'naefels', nom: 'Näfelser Fahrt', date: naefelserFahrt, regions: ['GL'] },
  { id: 'vendredi-saint', nom: 'Vendredi saint', date: (y) => addDays(easter(y), -2), regions: except('TI', 'VS') },
  { id: 'lundi-paques', nom: 'Lundi de Pâques', date: (y) => addDays(easter(y), 1), regions: except('VS') },
  { id: 'travail', nom: 'Fête du travail', date: (y) => D(y, 5, 1),
    regions: ['BL', 'BS', 'JU', 'NE', 'SH', 'TG', 'TI', 'ZH'] },
  { id: 'ascension', nom: 'Ascension', date: (y) => addDays(easter(y), 39), regions: ALL },
  { id: 'lundi-pentecote', nom: 'Lundi de Pentecôte', date: (y) => addDays(easter(y), 50), regions: except('VS') },
  { id: 'fete-dieu', nom: 'Fête-Dieu', date: (y) => addDays(easter(y), 60), regions: CATHOLIQUES },
  { id: 'plebiscite-ju', nom: 'Commémoration du plébiscite', date: (y) => D(y, 6, 23), regions: ['JU'] },
  { id: 'pierre-paul', nom: 'Saint-Pierre et Saint-Paul', date: (y) => D(y, 6, 29), regions: ['TI'] },
  { id: 'fete-nationale', nom: 'Fête nationale', date: (y) => D(y, 8, 1), regions: ALL },
  { id: 'assomption', nom: 'Assomption', date: (y) => D(y, 8, 15), regions: CATHOLIQUES },
  { id: 'jeune-genevois', nom: 'Jeûne genevois', date: (y) => addDays(nthWeekday(y, 9, 0, 1), 4), regions: ['GE'] },
  { id: 'lundi-jeune', nom: 'Lundi du Jeûne fédéral', date: (y) => addDays(nthWeekday(y, 9, 0, 3), 1), regions: ['NE', 'VD'] },
  { id: 'bruder-klaus', nom: 'Saint-Nicolas de Flüe', date: (y) => D(y, 9, 25), regions: ['OW'] },
  { id: 'toussaint', nom: 'Toussaint', date: (y) => D(y, 11, 1), regions: [...CATHOLIQUES, 'GL', 'SG'] },
  { id: 'immaculee', nom: 'Immaculée Conception', date: (y) => D(y, 12, 8),
    regions: CATHOLIQUES.filter((c) => c !== 'JU') },
  { id: 'noel', nom: 'Noël', date: (y) => D(y, 12, 25), regions: ALL },
  { id: 'saint-etienne', nom: 'Saint-Étienne', date: (y) => D(y, 12, 26), regions: except('GE', 'JU', 'NE', 'VD', 'VS') },
  { id: 'restauration', nom: 'Restauration de la République', date: (y) => D(y, 12, 31), regions: ['GE'] },
];


// ---------- France ----------
const FR_ZONES = {
  METRO: 'Métropole', AM: 'Alsace-Moselle', GP: 'Guadeloupe',
  MQ: 'Martinique', GF: 'Guyane', RE: 'La Réunion', YT: 'Mayotte',
};
const FR_ALL = Object.keys(FR_ZONES);
const RULES_FR = [
  { id: 'nouvel-an', nom: 'Jour de l\'an', date: (y) => D(y, 1, 1), regions: FR_ALL },
  { id: 'vendredi-saint', nom: 'Vendredi saint', date: (y) => addDays(easter(y), -2), regions: ['AM'] },
  { id: 'lundi-paques', nom: 'Lundi de Pâques', date: (y) => addDays(easter(y), 1), regions: FR_ALL },
  { id: 'abolition-yt', nom: 'Abolition de l\'esclavage', date: (y) => D(y, 4, 27), regions: ['YT'] },
  { id: 'travail', nom: 'Fête du travail', date: (y) => D(y, 5, 1), regions: FR_ALL },
  { id: 'victoire-1945', nom: 'Victoire 1945', date: (y) => D(y, 5, 8), regions: FR_ALL },
  { id: 'abolition-mq', nom: 'Abolition de l\'esclavage', date: (y) => D(y, 5, 22), regions: ['MQ'] },
  { id: 'abolition-gp', nom: 'Abolition de l\'esclavage', date: (y) => D(y, 5, 27), regions: ['GP'] },
  { id: 'ascension', nom: 'Ascension', date: (y) => addDays(easter(y), 39), regions: FR_ALL },
  { id: 'lundi-pentecote', nom: 'Lundi de Pentecôte', date: (y) => addDays(easter(y), 50), regions: FR_ALL },
  { id: 'abolition-gf', nom: 'Abolition de l\'esclavage', date: (y) => D(y, 6, 10), regions: ['GF'] },
  { id: 'fete-nationale', nom: 'Fête nationale', date: (y) => D(y, 7, 14), regions: FR_ALL },
  { id: 'assomption', nom: 'Assomption', date: (y) => D(y, 8, 15), regions: FR_ALL },
  { id: 'toussaint', nom: 'Toussaint', date: (y) => D(y, 11, 1), regions: FR_ALL },
  { id: 'armistice', nom: 'Armistice 1918', date: (y) => D(y, 11, 11), regions: FR_ALL },
  { id: 'abolition-re', nom: 'Abolition de l\'esclavage', date: (y) => D(y, 12, 20), regions: ['RE'] },
  { id: 'noel', nom: 'Noël', date: (y) => D(y, 12, 25), regions: FR_ALL },
  { id: 'saint-etienne', nom: 'Saint-Étienne', date: (y) => D(y, 12, 26), regions: ['AM'] },
];

// ---------- Allemagne ----------
const DE_LAENDER = {
  BW: 'Bade-Wurtemberg', BY: 'Bavière', BE: 'Berlin', BB: 'Brandebourg', HB: 'Brême', HH: 'Hambourg',
  HE: 'Hesse', MV: 'Mecklembourg-Poméranie-Occidentale', NI: 'Basse-Saxe', NW: 'Rhénanie-du-Nord-Westphalie',
  RP: 'Rhénanie-Palatinat', SL: 'Sarre', SN: 'Saxe', ST: 'Saxe-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thuringe',
};
const DE_ALL = Object.keys(DE_LAENDER);
function bussUndBettag(y) {
  // Mercredi précédant le 23 novembre (entre le 16 et le 22).
  const d = D(y, 11, 22);
  while (d.getDay() !== 3) d.setDate(d.getDate() - 1);
  return d;
}
const RULES_DE = [
  { id: 'neujahr', nom: 'Nouvel An', date: (y) => D(y, 1, 1), regions: DE_ALL },
  { id: 'drei-koenige', nom: 'Épiphanie', date: (y) => D(y, 1, 6), regions: ['BW', 'BY', 'ST'] },
  { id: 'frauentag', nom: 'Journée internationale des femmes', date: (y) => D(y, 3, 8),
    regions: (y) => [...(y >= 2019 ? ['BE'] : []), ...(y >= 2023 ? ['MV'] : [])] },
  { id: 'karfreitag', nom: 'Vendredi saint', date: (y) => addDays(easter(y), -2), regions: DE_ALL },
  { id: 'ostermontag', nom: 'Lundi de Pâques', date: (y) => addDays(easter(y), 1), regions: DE_ALL },
  { id: 'arbeit', nom: 'Fête du travail', date: (y) => D(y, 5, 1), regions: DE_ALL },
  { id: 'himmelfahrt', nom: 'Ascension', date: (y) => addDays(easter(y), 39), regions: DE_ALL },
  { id: 'pfingstmontag', nom: 'Lundi de Pentecôte', date: (y) => addDays(easter(y), 50), regions: DE_ALL },
  { id: 'fronleichnam', nom: 'Fête-Dieu', date: (y) => addDays(easter(y), 60), regions: ['BW', 'BY', 'HE', 'NW', 'RP', 'SL'] },
  { id: 'himmelfahrt-maria', nom: 'Assomption', date: (y) => D(y, 8, 15), regions: ['BY', 'SL'] },
  { id: 'weltkindertag', nom: 'Journée mondiale de l\'enfance', date: (y) => D(y, 9, 20), regions: (y) => (y >= 2019 ? ['TH'] : []) },
  { id: 'einheit', nom: 'Fête de l\'unité allemande', date: (y) => D(y, 10, 3), regions: DE_ALL },
  { id: 'reformation', nom: 'Fête de la Réformation', date: (y) => D(y, 10, 31),
    regions: (y) => ['BB', 'MV', 'SN', 'ST', 'TH', ...(y >= 2018 ? ['HB', 'HH', 'NI', 'SH'] : [])] },
  { id: 'allerheiligen', nom: 'Toussaint', date: (y) => D(y, 11, 1), regions: ['BW', 'BY', 'NW', 'RP', 'SL'] },
  { id: 'buss-bettag', nom: 'Jour de pénitence et de prière', date: bussUndBettag, regions: ['SN'] },
  { id: 'weihnacht-1', nom: 'Noël', date: (y) => D(y, 12, 25), regions: DE_ALL },
  { id: 'weihnacht-2', nom: 'Saint-Étienne', date: (y) => D(y, 12, 26), regions: DE_ALL },
];

// ---------- Pays sans différence régionale ----------
const NATION = ['ALL'];
const RULES_AT = [
  { id: 'neujahr', nom: 'Nouvel An', date: (y) => D(y, 1, 1), regions: NATION },
  { id: 'drei-koenige', nom: 'Épiphanie', date: (y) => D(y, 1, 6), regions: NATION },
  { id: 'ostermontag', nom: 'Lundi de Pâques', date: (y) => addDays(easter(y), 1), regions: NATION },
  { id: 'staatsfeiertag', nom: 'Fête du travail', date: (y) => D(y, 5, 1), regions: NATION },
  { id: 'himmelfahrt', nom: 'Ascension', date: (y) => addDays(easter(y), 39), regions: NATION },
  { id: 'pfingstmontag', nom: 'Lundi de Pentecôte', date: (y) => addDays(easter(y), 50), regions: NATION },
  { id: 'fronleichnam', nom: 'Fête-Dieu', date: (y) => addDays(easter(y), 60), regions: NATION },
  { id: 'himmelfahrt-maria', nom: 'Assomption', date: (y) => D(y, 8, 15), regions: NATION },
  { id: 'nationalfeiertag', nom: 'Fête nationale', date: (y) => D(y, 10, 26), regions: NATION },
  { id: 'allerheiligen', nom: 'Toussaint', date: (y) => D(y, 11, 1), regions: NATION },
  { id: 'empfaengnis', nom: 'Immaculée Conception', date: (y) => D(y, 12, 8), regions: NATION },
  { id: 'christtag', nom: 'Noël', date: (y) => D(y, 12, 25), regions: NATION },
  { id: 'stefanitag', nom: 'Saint-Étienne', date: (y) => D(y, 12, 26), regions: NATION },
];
const RULES_BE = [
  { id: 'nouvel-an', nom: 'Nouvel An', date: (y) => D(y, 1, 1), regions: NATION },
  { id: 'lundi-paques', nom: 'Lundi de Pâques', date: (y) => addDays(easter(y), 1), regions: NATION },
  { id: 'travail', nom: 'Fête du travail', date: (y) => D(y, 5, 1), regions: NATION },
  { id: 'ascension', nom: 'Ascension', date: (y) => addDays(easter(y), 39), regions: NATION },
  { id: 'lundi-pentecote', nom: 'Lundi de Pentecôte', date: (y) => addDays(easter(y), 50), regions: NATION },
  { id: 'fete-nationale', nom: 'Fête nationale', date: (y) => D(y, 7, 21), regions: NATION },
  { id: 'assomption', nom: 'Assomption', date: (y) => D(y, 8, 15), regions: NATION },
  { id: 'toussaint', nom: 'Toussaint', date: (y) => D(y, 11, 1), regions: NATION },
  { id: 'armistice', nom: 'Armistice 1918', date: (y) => D(y, 11, 11), regions: NATION },
  { id: 'noel', nom: 'Noël', date: (y) => D(y, 12, 25), regions: NATION },
];
const RULES_LU = [
  { id: 'nouvel-an', nom: 'Nouvel An', date: (y) => D(y, 1, 1), regions: NATION },
  { id: 'lundi-paques', nom: 'Lundi de Pâques', date: (y) => addDays(easter(y), 1), regions: NATION },
  { id: 'travail', nom: 'Fête du travail', date: (y) => D(y, 5, 1), regions: NATION },
  { id: 'europe', nom: 'Journée de l\'Europe', date: (y) => D(y, 5, 9), regions: (y) => (y >= 2019 ? NATION : []) },
  { id: 'ascension', nom: 'Ascension', date: (y) => addDays(easter(y), 39), regions: NATION },
  { id: 'lundi-pentecote', nom: 'Lundi de Pentecôte', date: (y) => addDays(easter(y), 50), regions: NATION },
  { id: 'fete-nationale', nom: 'Fête nationale', date: (y) => D(y, 6, 23), regions: NATION },
  { id: 'assomption', nom: 'Assomption', date: (y) => D(y, 8, 15), regions: NATION },
  { id: 'toussaint', nom: 'Toussaint', date: (y) => D(y, 11, 1), regions: NATION },
  { id: 'noel', nom: 'Noël', date: (y) => D(y, 12, 25), regions: NATION },
  { id: 'saint-etienne', nom: 'Saint-Étienne', date: (y) => D(y, 12, 26), regions: NATION },
];
const RULES_IT = [
  { id: 'capodanno', nom: 'Nouvel An', date: (y) => D(y, 1, 1), regions: NATION },
  { id: 'epifania', nom: 'Épiphanie', date: (y) => D(y, 1, 6), regions: NATION },
  { id: 'pasquetta', nom: 'Lundi de Pâques', date: (y) => addDays(easter(y), 1), regions: NATION },
  { id: 'liberazione', nom: 'Fête de la Libération', date: (y) => D(y, 4, 25), regions: NATION },
  { id: 'lavoro', nom: 'Fête du travail', date: (y) => D(y, 5, 1), regions: NATION },
  { id: 'repubblica', nom: 'Fête de la République', date: (y) => D(y, 6, 2), regions: NATION },
  { id: 'ferragosto', nom: 'Assomption (Ferragosto)', date: (y) => D(y, 8, 15), regions: NATION },
  { id: 'san-francesco', nom: 'Saint-François d\'Assise', date: (y) => D(y, 10, 4), regions: (y) => (y >= 2026 ? NATION : []) },
  { id: 'ognissanti', nom: 'Toussaint', date: (y) => D(y, 11, 1), regions: NATION },
  { id: 'immacolata', nom: 'Immaculée Conception', date: (y) => D(y, 12, 8), regions: NATION },
  { id: 'natale', nom: 'Noël', date: (y) => D(y, 12, 25), regions: NATION },
  { id: 'santo-stefano', nom: 'Saint-Étienne', date: (y) => D(y, 12, 26), regions: NATION },
];

export const COUNTRIES = {
  CH: {
    nom: 'Suisse', regionLabel: 'Canton', regions: CANTONS, defaultRegion: 'VD', sortRegions: true, rules: RULES_CH,
    note: 'Fériés chômés dans tout le canton ou sa majorité. Certains ne le sont que dans une partie du canton (communes catholiques d\'Argovie, Fribourg ou Soleure, par exemple). Les demi-jours (Sechseläuten, veille de Noël…) ne sont pas comptés.',
  },
  FR: {
    nom: 'France', regionLabel: 'Zone', regions: FR_ZONES, defaultRegion: 'METRO', sortRegions: false, rules: RULES_FR,
    note: 'Les 11 jours fériés légaux, plus le Vendredi saint et la Saint-Étienne en Alsace-Moselle et la commémoration de l\'abolition de l\'esclavage dans les départements d\'outre-mer. Le lundi de Pentecôte est compté comme férié : décochez-le s\'il s\'agit de votre journée de solidarité travaillée.',
  },
  DE: {
    nom: 'Allemagne', regionLabel: 'Land', regions: DE_LAENDER, defaultRegion: 'BW', sortRegions: true, rules: RULES_DE,
    note: 'Fériés légaux de chaque Land. En Bavière, l\'Assomption n\'est fériée que dans les communes à majorité catholique (la plupart) ; l\'Augsburger Friedensfest (ville d\'Augsbourg) n\'est pas compté.',
  },
  AT: {
    nom: 'Autriche', regions: { ALL: 'Tout le pays' }, defaultRegion: 'ALL', rules: RULES_AT,
    note: 'Les 13 fériés légaux (Arbeitsruhegesetz). Les fêtes des saints patrons des Länder ne sont pas comptées.',
  },
  BE: {
    nom: 'Belgique', regions: { ALL: 'Tout le pays' }, defaultRegion: 'ALL', rules: RULES_BE,
    note: 'Les 10 jours fériés légaux. Les fêtes des Communautés (27 septembre, 11 juillet, 15 novembre) ne sont pas comptées.',
  },
  IT: {
    nom: 'Italie', regions: { ALL: 'Tout le pays' }, defaultRegion: 'ALL', rules: RULES_IT,
    note: 'Fériés nationaux, dont la Saint-François d\'Assise (4 octobre) rétablie à partir de 2026. Les fêtes du saint patron de chaque ville ne sont pas comptées.',
  },
  LU: {
    nom: 'Luxembourg', regions: { ALL: 'Tout le pays' }, defaultRegion: 'ALL', rules: RULES_LU,
    note: 'Les 11 jours fériés légaux, dont la Journée de l\'Europe (9 mai) depuis 2019.',
  },
};

export const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const RULES = RULES_CH; // compatibilité

const regionsOf = (rule, y) => (typeof rule.regions === 'function' ? rule.regions(y) : rule.regions);

/** Liste des fériés d'un pays et d'une région pour une année, triés par date. */
export function holidaysFor(year, country, region) {
  const c = COUNTRIES[country];
  if (!c) throw new RangeError(`Pays inconnu : ${country}`);
  return c.rules.filter((r) => regionsOf(r, year).includes(region))
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

export const daysInMonth = (y, m) => new Date(y, m, 0).getDate();

/**
 * Compte les jours ouvrés (lundi–vendredi hors fériés) entre deux dates incluses.
 * @param {{from:{y:number,m:number,d?:number}, to:{y:number,m:number,d?:number}, country?:string, region:string, excluded?:Set<string>}} opts
 *   m est 1–12. Sans jour : début = 1er du mois, fin = dernier jour du mois.
 *   excluded contient les identifiants de fériés à ne PAS compter comme fériés.
 */
export function computeRange({ from, to, country = 'CH', region, canton, excluded = new Set() }) {
  region = region || canton;
  const d1 = Math.min(from.d || 1, daysInMonth(from.y, from.m));
  const d2 = Math.min(to.d || daysInMonth(to.y, to.m), daysInMonth(to.y, to.m));
  const startDate = new Date(from.y, from.m - 1, d1);
  const endDate = new Date(to.y, to.m - 1, d2);
  if (endDate < startDate) throw new RangeError('La date de fin doit être postérieure ou égale à la date de début.');

  const map = new Map();
  const holidays = [];
  for (let y = from.y; y <= to.y; y++) {
    for (const h of holidaysFor(y, country, region)) {
      if (h.date < startDate || h.date > endDate) continue;
      const wd = h.date.getDay();
      const item = { ...h, iso: isoDate(h.date), weekend: wd === 0 || wd === 6, compte: !excluded.has(h.id) };
      holidays.push(item);
      if (item.compte) map.set(item.iso, item);
    }
  }

  const months = [];
  const totals = { ouvres: 0, feries: 0, weekend: 0, jours: 0 };
  const start = from.y * 12 + (from.m - 1);
  const end = to.y * 12 + (to.m - 1);
  for (let t = start; t <= end; t++) {
    const y = Math.floor(t / 12), m = t % 12;
    const row = { y, m: m + 1, ouvres: 0, feries: 0, weekend: 0, jours: 0, partiel: false, days: [] };
    const d = new Date(y, m, 1);
    while (d.getMonth() === m) {
      const wd = d.getDay();
      const hol = map.get(isoDate(d));
      let type;
      if (d < startDate || d > endDate) type = 'hors';
      else if (wd === 0 || wd === 6) type = 'weekend';
      else if (hol) type = 'ferie';
      else type = 'ouvre';
      if (type === 'hors') row.partiel = true;
      else {
        row.jours++;
        if (type === 'ouvre') row.ouvres++;
        else if (type === 'weekend') row.weekend++;
        else row.feries++;
      }
      row.days.push({ day: d.getDate(), wd, type, nom: hol ? hol.nom : null });
      d.setDate(d.getDate() + 1);
    }
    for (const k of Object.keys(totals)) totals[k] += row[k];
    months.push(row);
  }
  return { months, totals, holidays, startDate, endDate };
}
