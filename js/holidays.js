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

// ---------- Liechtenstein ----------
// Art. 18 de la loi sur le travail : 13 fériés légaux. Les autres jours usuels ne sont pas légaux
// (à compenser par des heures ou des congés) : ils sont proposés mais non comptés par défaut.
const RULES_LI = [
  { id: 'neujahr', nom: 'Nouvel An', date: (y) => D(y, 1, 1), regions: NATION },
  { id: 'drei-koenige', nom: 'Épiphanie', date: (y) => D(y, 1, 6), regions: NATION },
  { id: 'lichtmess', nom: 'Chandeleur (non légal)', date: (y) => D(y, 2, 2), regions: NATION, optionnel: true },
  { id: 'josef', nom: 'Saint-Joseph (non légal)', date: (y) => D(y, 3, 19), regions: NATION, optionnel: true },
  { id: 'karfreitag', nom: 'Vendredi saint (non légal)', date: (y) => addDays(easter(y), -2), regions: NATION, optionnel: true },
  { id: 'ostermontag', nom: 'Lundi de Pâques', date: (y) => addDays(easter(y), 1), regions: NATION },
  { id: 'arbeit', nom: 'Fête du travail', date: (y) => D(y, 5, 1), regions: NATION },
  { id: 'auffahrt', nom: 'Ascension', date: (y) => addDays(easter(y), 39), regions: NATION },
  { id: 'pfingstmontag', nom: 'Lundi de Pentecôte', date: (y) => addDays(easter(y), 50), regions: NATION },
  { id: 'fronleichnam', nom: 'Fête-Dieu', date: (y) => addDays(easter(y), 60), regions: NATION },
  { id: 'staatsfeiertag', nom: 'Fête nationale (Assomption)', date: (y) => D(y, 8, 15), regions: NATION },
  { id: 'maria-geburt', nom: 'Nativité de Marie', date: (y) => D(y, 9, 8), regions: NATION },
  { id: 'allerheiligen', nom: 'Toussaint', date: (y) => D(y, 11, 1), regions: NATION },
  { id: 'empfaengnis', nom: 'Immaculée Conception', date: (y) => D(y, 12, 8), regions: NATION },
  { id: 'heiligabend', nom: 'Veille de Noël (non légal)', date: (y) => D(y, 12, 24), regions: NATION, optionnel: true },
  { id: 'weihnacht', nom: 'Noël', date: (y) => D(y, 12, 25), regions: NATION },
  { id: 'stefanstag', nom: 'Saint-Étienne', date: (y) => D(y, 12, 26), regions: NATION },
  { id: 'silvester', nom: 'Saint-Sylvestre (non légal)', date: (y) => D(y, 12, 31), regions: NATION, optionnel: true },
];

// ---------- Espagne ----------
// Les communautés autonomes fixent leurs fériés chaque année (résolution publiée au BOE).
// Années officielles intégrées ci-dessous ; pour les autres années, estimation à partir des fêtes habituelles.
const ES_REGIONS = {
  AN: 'Andalousie', AR: 'Aragon', AS: 'Asturies', IB: 'Îles Baléares', CN: 'Canaries', CB: 'Cantabrie',
  CM: 'Castille-La Manche', CL: 'Castille-et-León', CT: 'Catalogne', VC: 'Communauté valencienne',
  EX: 'Estrémadure', GA: 'Galice', MD: 'Madrid', MC: 'Murcie', NA: 'Navarre', PV: 'Pays basque',
  RI: 'La Rioja', CE: 'Ceuta', ML: 'Melilla',
};
const ES_ALL = Object.keys(ES_REGIONS);
const ES_SAUF = (...x) => ES_ALL.filter((r) => !x.includes(r));
// [mois, jour, id, nom, régions]
const ES_OFFICIEL = {
  // BOE-A-2025-21667 (fêtes 2026), jours en semaine d'après le calendrier des jours non ouvrables BOE-A-2025-23702,
  // complétés des fêtes nationales tombant un week-end.
  2026: [
    [1, 1, 'ano-nuevo', 'Nouvel An', ES_ALL], [1, 6, 'epifania', 'Épiphanie', ES_ALL],
    [3, 2, 'dia-baleares', 'Jour des Îles Baléares (reporté)', ['IB']],
    [3, 19, 'san-jose', 'Saint-Joseph', ['GA', 'MC', 'PV', 'VC', 'NA']],
    [3, 20, 'eid-fitr', 'Aïd el-Fitr', ['ML']],
    [4, 2, 'jueves-santo', 'Jeudi saint', ES_SAUF('CT', 'VC')],
    [4, 3, 'viernes-santo', 'Vendredi saint', ES_ALL],
    [4, 6, 'lunes-pascua', 'Lundi de Pâques', ['IB', 'CM', 'CT', 'PV', 'RI', 'NA', 'VC']],
    [4, 23, 'dia-comunidad-abril', 'Fête de la communauté (23 avril)', ['AR', 'CL']],
    [5, 1, 'trabajo', 'Fête du travail', ES_ALL],
    [5, 27, 'eid-adha', 'Aïd el-Kébir', ['CE', 'ML']],
    [6, 4, 'corpus', 'Fête-Dieu', ['CM']],
    [6, 9, 'dia-region-junio', 'Fête de la communauté (9 juin)', ['RI', 'MC']],
    [6, 24, 'san-juan', 'Saint-Jean', ['CT', 'GA', 'VC']],
    [7, 28, 'instituciones', 'Jour des institutions', ['CB']],
    [8, 5, 'senora-africa', 'Notre-Dame d\'Afrique', ['CE']],
    [8, 15, 'asuncion', 'Assomption', ES_ALL],
    [9, 2, 'dia-ceuta', 'Jour de Ceuta', ['CE']],
    [9, 8, 'dia-comunidad-septiembre', 'Fête de la communauté (8 septembre)', ['AS', 'EX']],
    [9, 11, 'diada', 'Diada (fête nationale de Catalogne)', ['CT']],
    [9, 15, 'bien-aparecida', 'La Bien Aparecida', ['CB']],
    [10, 9, 'dia-valencia', 'Jour de la Communauté valencienne', ['VC']],
    [10, 12, 'fiesta-nacional', 'Fête nationale', ES_ALL],
    [11, 1, 'todos-santos', 'Toussaint', ES_ALL],
    [11, 2, 'lunes-todos-santos', 'Lendemain de la Toussaint', ['AN', 'AR', 'AS', 'CN', 'CM', 'EX', 'CL', 'MD', 'NA']],
    [12, 6, 'constitucion', 'Jour de la Constitution', ES_ALL],
    [12, 7, 'lunes-constitucion', 'Lendemain du jour de la Constitution', ['AN', 'AR', 'AS', 'CB', 'EX', 'MC', 'RI', 'CL', 'MD', 'ML']],
    [12, 8, 'inmaculada', 'Immaculée Conception', ES_ALL],
    [12, 25, 'navidad', 'Noël', ES_ALL],
    [12, 26, 'san-esteban', 'Saint-Étienne', ['CT', 'IB']],
  ],
  // BOE-A-2026-21254 (fêtes 2027)
  2027: [
    [1, 1, 'ano-nuevo', 'Nouvel An', ES_ALL], [1, 6, 'epifania', 'Épiphanie', ES_ALL],
    [3, 1, 'dia-comunidad-marzo', 'Fête de la communauté (1er mars)', ['AN', 'IB']],
    [3, 10, 'eid-fitr', 'Aïd el-Fitr', ['ML']],
    [3, 19, 'san-jose', 'Saint-Joseph', ['GA', 'MD', 'MC', 'NA', 'VC']],
    [3, 25, 'jueves-santo', 'Jeudi saint', ES_SAUF('CT', 'VC')],
    [3, 26, 'viernes-santo', 'Vendredi saint', ES_ALL],
    [3, 29, 'lunes-pascua', 'Lundi de Pâques', ['IB', 'CT', 'NA', 'PV', 'RI', 'VC']],
    [4, 23, 'dia-comunidad-abril', 'Fête de la communauté (23 avril)', ['AR', 'CL']],
    [5, 1, 'trabajo', 'Fête du travail', ES_ALL],
    [5, 17, 'letras-galegas', 'Jour des lettres galiciennes', ['GA']],
    [5, 17, 'eid-adha', 'Aïd el-Kébir', ['CE', 'ML']],
    [5, 27, 'corpus', 'Fête-Dieu', ['CM']],
    [5, 31, 'dia-castilla-mancha', 'Jour de Castille-La Manche', ['CM']],
    [6, 9, 'dia-region-junio', 'Fête de la communauté (9 juin)', ['MC', 'RI']],
    [6, 24, 'san-juan', 'Saint-Jean', ['CT']],
    [7, 28, 'instituciones', 'Jour des institutions', ['CB']],
    [8, 5, 'senora-africa', 'Notre-Dame d\'Afrique', ['CE']],
    [8, 16, 'lunes-asuncion', 'Lendemain de l\'Assomption', ['AN', 'AR', 'AS', 'CN', 'CL', 'MD']],
    [9, 8, 'dia-comunidad-septiembre', 'Fête de la communauté (8 septembre)', ['AS', 'EX']],
    [9, 11, 'diada', 'Diada (fête nationale de Catalogne)', ['CT']],
    [9, 15, 'bien-aparecida', 'La Bien Aparecida', ['CB']],
    [10, 7, 'dia-euskadi', 'Anniversaire du premier gouvernement basque', ['PV']],
    [10, 9, 'dia-valencia', 'Jour de la Communauté valencienne', ['VC']],
    [10, 11, 'sustitucion-asuncion', 'Report de l\'Assomption', ['EX']],
    [10, 12, 'fiesta-nacional', 'Fête nationale', ES_ALL],
    [11, 1, 'todos-santos', 'Toussaint', ES_ALL],
    [12, 6, 'constitucion', 'Jour de la Constitution', ES_ALL],
    [12, 8, 'inmaculada', 'Immaculée Conception', ES_ALL],
    [12, 25, 'navidad', 'Noël', ES_ALL],
  ],
};
// Estimation pour les années sans calendrier officiel intégré (fêtes habituelles, sans les reports du dimanche).
const RULES_ES_ESTIMATION = [
  { id: 'ano-nuevo', nom: 'Nouvel An', date: (y) => D(y, 1, 1), regions: ES_ALL },
  { id: 'epifania', nom: 'Épiphanie', date: (y) => D(y, 1, 6), regions: ES_ALL },
  { id: 'dia-andalucia', nom: 'Jour de l\'Andalousie', date: (y) => D(y, 2, 28), regions: ['AN'] },
  { id: 'dia-baleares', nom: 'Jour des Îles Baléares', date: (y) => D(y, 3, 1), regions: ['IB'] },
  { id: 'san-jose', nom: 'Saint-Joseph', date: (y) => D(y, 3, 19), regions: ['MC', 'VC'] },
  { id: 'jueves-santo', nom: 'Jeudi saint', date: (y) => addDays(easter(y), -3), regions: ES_SAUF('CT', 'VC') },
  { id: 'viernes-santo', nom: 'Vendredi saint', date: (y) => addDays(easter(y), -2), regions: ES_ALL },
  { id: 'lunes-pascua', nom: 'Lundi de Pâques', date: (y) => addDays(easter(y), 1), regions: ['IB', 'CT', 'NA', 'PV', 'RI', 'VC'] },
  { id: 'dia-comunidad-abril', nom: 'Fête de la communauté (23 avril)', date: (y) => D(y, 4, 23), regions: ['AR', 'CL'] },
  { id: 'trabajo', nom: 'Fête du travail', date: (y) => D(y, 5, 1), regions: ES_ALL },
  { id: 'dia-madrid', nom: 'Fête de la Communauté de Madrid', date: (y) => D(y, 5, 2), regions: ['MD'] },
  { id: 'letras-galegas', nom: 'Jour des lettres galiciennes', date: (y) => D(y, 5, 17), regions: ['GA'] },
  { id: 'dia-canarias', nom: 'Jour des Canaries', date: (y) => D(y, 5, 30), regions: ['CN'] },
  { id: 'dia-castilla-mancha', nom: 'Jour de Castille-La Manche', date: (y) => D(y, 5, 31), regions: ['CM'] },
  { id: 'dia-region-junio', nom: 'Fête de la communauté (9 juin)', date: (y) => D(y, 6, 9), regions: ['MC', 'RI'] },
  { id: 'san-juan', nom: 'Saint-Jean', date: (y) => D(y, 6, 24), regions: ['CT'] },
  { id: 'santiago', nom: 'Saint-Jacques', date: (y) => D(y, 7, 25), regions: ['GA', 'PV'] },
  { id: 'instituciones', nom: 'Jour des institutions', date: (y) => D(y, 7, 28), regions: ['CB'] },
  { id: 'asuncion', nom: 'Assomption', date: (y) => D(y, 8, 15), regions: ES_ALL },
  { id: 'dia-ceuta', nom: 'Jour de Ceuta', date: (y) => D(y, 9, 2), regions: ['CE'] },
  { id: 'dia-comunidad-septiembre', nom: 'Fête de la communauté (8 septembre)', date: (y) => D(y, 9, 8), regions: ['AS', 'EX'] },
  { id: 'diada', nom: 'Diada (fête nationale de Catalogne)', date: (y) => D(y, 9, 11), regions: ['CT'] },
  { id: 'bien-aparecida', nom: 'La Bien Aparecida', date: (y) => D(y, 9, 15), regions: ['CB'] },
  { id: 'dia-melilla', nom: 'Jour de Melilla', date: (y) => D(y, 9, 17), regions: ['ML'] },
  { id: 'dia-valencia', nom: 'Jour de la Communauté valencienne', date: (y) => D(y, 10, 9), regions: ['VC'] },
  { id: 'fiesta-nacional', nom: 'Fête nationale', date: (y) => D(y, 10, 12), regions: ES_ALL },
  { id: 'todos-santos', nom: 'Toussaint', date: (y) => D(y, 11, 1), regions: ES_ALL },
  { id: 'dia-navarra', nom: 'Jour de la Navarre', date: (y) => D(y, 12, 3), regions: ['NA'] },
  { id: 'constitucion', nom: 'Jour de la Constitution', date: (y) => D(y, 12, 6), regions: ES_ALL },
  { id: 'inmaculada', nom: 'Immaculée Conception', date: (y) => D(y, 12, 8), regions: ES_ALL },
  { id: 'navidad', nom: 'Noël', date: (y) => D(y, 12, 25), regions: ES_ALL },
  { id: 'san-esteban', nom: 'Saint-Étienne', date: (y) => D(y, 12, 26), regions: ['CT', 'IB'] },
];
export const ES_ANNEES_OFFICIELLES = Object.keys(ES_OFFICIEL).map(Number);
function yearRulesES(y) {
  if (ES_OFFICIEL[y]) {
    return ES_OFFICIEL[y].map(([m, d, id, nom, regions]) => ({ id, nom, date: D(y, m, d), regions }));
  }
  return RULES_ES_ESTIMATION.map((r) => ({ id: r.id, nom: `${r.nom} (estimation)`, date: r.date(y), regions: r.regions }));
}

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
  ES: {
    nom: 'Espagne', regionLabel: 'Communauté', regions: ES_REGIONS, defaultRegion: 'MD', sortRegions: true, yearRules: yearRulesES,
    note: `Fériés nationaux et de la communauté autonome d'après le calendrier officiel du BOE pour ${ES_ANNEES_OFFICIELLES.join(' et ')} ; pour les autres années, estimation à partir des fêtes habituelles (marquée « estimation »). Les 2 fêtes locales de chaque commune et les fêtes propres à chaque île des Canaries ne sont pas comptées.`,
  },
  LI: {
    nom: 'Liechtenstein', regions: { ALL: 'Tout le pays' }, defaultRegion: 'ALL', rules: RULES_LI,
    note: 'Les 13 fériés légaux (loi sur le travail, art. 18). La Chandeleur, la Saint-Joseph, le Vendredi saint, le 24 et le 31 décembre ne sont pas légaux : ils sont listés mais non comptés, cochez-les s\'ils sont chômés chez vous.',
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
  const list = c.yearRules
    ? c.yearRules(year)
    : c.rules.map((r) => ({ id: r.id, nom: r.nom, date: r.date(year), regions: regionsOf(r, year), optionnel: !!r.optionnel }));
  return list.filter((h) => h.regions.includes(region))
    .map((h) => ({ id: h.id, nom: h.nom, date: h.date, optionnel: !!h.optionnel }))
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
 *   excluded : identifiants de fériés à ne PAS compter ; included : fériés optionnels (non légaux) à compter.
 */
export function computeRange({ from, to, country = 'CH', region, canton, excluded = new Set(), included = new Set() }) {
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
      const compte = h.optionnel ? included.has(h.id) : !excluded.has(h.id);
      const item = { ...h, iso: isoDate(h.date), weekend: wd === 0 || wd === 6, compte };
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
