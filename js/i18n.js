// Traductions de l'interface (français / anglais) et des données (fériés, régions, notes).
// Le moteur (holidays.js) reste en français : ce module fournit l'anglais.

export const LANGS = ['fr', 'en'];

/** Langue choisie : paramètre d'URL, puis préférence enregistrée, puis langue du navigateur (anglais par défaut). */
export function detectLang({ param, stored, navigatorLanguages = [] } = {}) {
  if (LANGS.includes(param)) return param;
  if (LANGS.includes(stored)) return stored;
  return navigatorLanguages.some((l) => String(l).toLowerCase().startsWith('fr')) ? 'fr' : 'en';
}

const UI = {
  fr: {
    docTitle: 'Calculateur de jours ouvrés – Suisse, France et pays voisins',
    title: 'Calculateur de jours ouvrés',
    subtitle: 'Suisse, France et pays voisins · jours fériés inclus',
    language: 'Langue',
    share: 'Partager',
    print: 'Imprimer / PDF',
    from: 'Du',
    to: 'Au (inclus)',
    quickPeriod: 'Période rapide',
    'preset.custom': 'Période personnalisée',
    'preset.mois': 'Ce mois',
    'preset.moisSuivant': 'Le mois prochain',
    'preset.trimestre': 'Ce trimestre',
    'preset.reste': "D'aujourd'hui à fin d'année",
    'preset.annee': 'Cette année',
    'preset.suivante': "L'an prochain",
    'preset.douze': '12 prochains mois',
    country: 'Pays',
    rate: "Taux d'activité",
    leave: 'Congés à déduire',
    days: 'jours',
    reset: 'Réinitialiser',
    help: 'Aide',
    'help.rate': "Part de votre temps de travail : 100 % = plein temps. Les jours ouvrés sont multipliés par ce taux (par exemple 80 % de 250 jours = 200 jours).",
    'help.leave': 'Nombre de jours de congés pris sur la période, par demi-journée (0,5). Ils sont retirés des jours à travailler.',
    'help.workdays': 'Jours ouvrés = du lundi au vendredi, hors jours fériés comptés.',
    'help.optional': "Un jour « d'usage » ou « non légal » est souvent chômé sans être un férié officiel : il n'est compté que si vous le cochez.",
    'kpi.net': 'Jours à travailler',
    'kpi.workdays': 'Jours ouvrés',
    'kpi.leave': 'Congés déduits',
    'kpi.holidays': 'Fériés en semaine',
    'kpi.weekend': 'Week-end',
    'kpi.calendar': 'Jours calendaires',
    'hint.workdays': '{n} ouvrés',
    'hint.rate': '{n} à {p} %',
    'hint.leave': '{n} congés',
    monthly: 'Détail par mois',
    exportCsv: 'Exporter CSV',
    'bar.detail': '{o} ouvrés · {f} fériés · {w} week-end · {j} jours',
    'part.range': 'du {a} au {b}',
    'part.single': 'le {a}',
    holidaysTitle: 'Jours fériés de la période',
    holidaysNote: "Décochez un férié s'il n'est pas chômé chez vous ; cochez un jour d'usage s'il l'est.",
    holidaysEmpty: 'Aucun jour férié sur la période.',
    holidaysRestore: 'Rétablir la liste par défaut',
    'tag.weekend': 'week-end',
    'tag.optional': "jour d'usage",
    'tag.estimation': 'estimation',
    'tag.report': 'report',
    calendar: 'Calendrier',
    'legend.workday': 'Ouvré',
    'legend.holiday': 'Férié',
    'legend.weekend': 'Week-end',
    'legend.outside': 'Hors période',
    calendarTooLong: "Le calendrier s'affiche pour {n} mois au plus. Réduisez la période pour le voir.",
    'cal.count': '{n} j.',
    adjust: 'Vous pouvez ajuster la liste des fériés si besoin.',
    officialSource: 'Source officielle :',
    officialSources: 'Sources officielles :',
    version: 'Version',
    changelog: 'Historique des versions',
    testReport: 'Rapport de tests',
    linkCopied: 'Lien copié',
    linkCopyFailed: 'Copiez ce lien : {url}',
    shareText: 'Calcul de jours ouvrés',
    'err.RANGE_INVERTED': 'La date de fin doit être postérieure ou égale à la date de début.',
    'err.LEAVE_NEGATIVE': 'Le nombre de jours de congés doit être positif.',
    'err.LEAVE_HALF': 'Les congés se saisissent par demi-journée (0,5).',
    'err.LEAVE_TOO_MANY': 'Les congés ({conges}) dépassent les jours ouvrés de la période ({theoriques}).',
    'err.DATE_MISSING': 'Indiquez une date de début et une date de fin.',
    'print.summary': 'Récapitulatif',
    'print.printed': 'Édité le {d}',
    'col.month': 'Mois',
    'col.workdays': 'Ouvrés',
    'col.holidays': 'Fériés',
    'col.weekend': 'Week-end',
    'col.days': 'Jours',
    'col.date': 'Date',
    'col.holiday': 'Jour férié',
    'col.counted': 'Compté',
    'col.atRate': 'Jours à {p} %',
    yes: 'oui',
    no: 'non',
    total: 'Total',
    'csv.place': 'Lieu',
    'csv.period': 'Période',
    'csv.atRate': 'Jours ouvrés à {p} %',
    'csv.file': 'jours-ouvres',
    periodText: 'du {a} au {b}',
    wholeCountry: 'Tout le pays',
  },
  en: {
    docTitle: 'Working days calculator – Switzerland, France and nearby countries',
    title: 'Working days calculator',
    subtitle: 'Switzerland, France and nearby countries · public holidays included',
    language: 'Language',
    share: 'Share',
    print: 'Print / PDF',
    from: 'From',
    to: 'To (inclusive)',
    quickPeriod: 'Quick period',
    'preset.custom': 'Custom period',
    'preset.mois': 'This month',
    'preset.moisSuivant': 'Next month',
    'preset.trimestre': 'This quarter',
    'preset.reste': 'From today to year end',
    'preset.annee': 'This year',
    'preset.suivante': 'Next year',
    'preset.douze': 'Next 12 months',
    country: 'Country',
    rate: 'Work rate',
    leave: 'Leave to deduct',
    days: 'days',
    reset: 'Reset',
    help: 'Help',
    'help.rate': 'Share of your working time: 100% = full time. Working days are multiplied by this rate (for example 80% of 250 days = 200 days).',
    'help.leave': 'Number of days of leave taken in the period, in half days (0.5). They are subtracted from the days to work.',
    'help.workdays': 'Working days = Monday to Friday, excluding counted public holidays.',
    'help.optional': 'A "customary" or "non-statutory" day is often a day off without being an official holiday: it only counts if you tick it.',
    'kpi.net': 'Days to work',
    'kpi.workdays': 'Working days',
    'kpi.leave': 'Leave deducted',
    'kpi.holidays': 'Weekday holidays',
    'kpi.weekend': 'Weekend days',
    'kpi.calendar': 'Calendar days',
    'hint.workdays': '{n} working days',
    'hint.rate': '{n} at {p}%',
    'hint.leave': '{n} days of leave',
    monthly: 'Monthly breakdown',
    exportCsv: 'Export CSV',
    'bar.detail': '{o} working · {f} holidays · {w} weekend · {j} days',
    'part.range': '{a}–{b}',
    'part.single': 'the {a}',
    holidaysTitle: 'Public holidays in the period',
    holidaysNote: 'Untick a holiday if it is not a day off for you; tick a customary day if it is.',
    holidaysEmpty: 'No public holiday in this period.',
    holidaysRestore: 'Restore the default list',
    'tag.weekend': 'weekend',
    'tag.optional': 'customary',
    'tag.estimation': 'estimate',
    'tag.report': 'substitute day',
    calendar: 'Calendar',
    'legend.workday': 'Working day',
    'legend.holiday': 'Holiday',
    'legend.weekend': 'Weekend',
    'legend.outside': 'Outside period',
    calendarTooLong: 'The calendar is shown for {n} months at most. Shorten the period to see it.',
    'cal.count': '{n} d.',
    adjust: 'You can adjust the list of holidays if needed.',
    officialSource: 'Official source:',
    officialSources: 'Official sources:',
    version: 'Version',
    changelog: 'Release history',
    testReport: 'Test report',
    linkCopied: 'Link copied',
    linkCopyFailed: 'Copy this link: {url}',
    shareText: 'Working days calculation',
    'err.RANGE_INVERTED': 'The end date must be on or after the start date.',
    'err.LEAVE_NEGATIVE': 'The number of days of leave must be positive.',
    'err.LEAVE_HALF': 'Leave is entered in half days (0.5).',
    'err.LEAVE_TOO_MANY': 'Leave ({conges}) exceeds the working days in the period ({theoriques}).',
    'err.DATE_MISSING': 'Enter a start date and an end date.',
    'print.summary': 'Summary',
    'print.printed': 'Printed on {d}',
    'col.month': 'Month',
    'col.workdays': 'Working',
    'col.holidays': 'Holidays',
    'col.weekend': 'Weekend',
    'col.days': 'Days',
    'col.date': 'Date',
    'col.holiday': 'Public holiday',
    'col.counted': 'Counted',
    'col.atRate': 'Days at {p}%',
    yes: 'yes',
    no: 'no',
    total: 'Total',
    'csv.place': 'Place',
    'csv.period': 'Period',
    'csv.atRate': 'Working days at {p}%',
    'csv.file': 'working-days',
    periodText: '{a} to {b}',
    wholeCountry: 'Whole country',
  },
};

const COUNTRY_EN = {
  CH: 'Switzerland', FR: 'France', DE: 'Germany', AT: 'Austria', BE: 'Belgium', IT: 'Italy', LU: 'Luxembourg',
  ES: 'Spain', LI: 'Liechtenstein', GB: 'United Kingdom', NL: 'Netherlands', PT: 'Portugal',
};

const REGION_LABEL_EN = { Canton: 'Canton', Zone: 'Area', Land: 'State', Région: 'Region', Communauté: 'Community', Nation: 'Nation' };

const REGION_EN = {
  'Alsace-Moselle': 'Alsace-Moselle', Andalousie: 'Andalusia', 'Angleterre et pays de Galles': 'England and Wales',
  'Appenzell Rhodes-Extérieures': 'Appenzell Ausserrhoden', 'Appenzell Rhodes-Intérieures': 'Appenzell Innerrhoden',
  Aragon: 'Aragon', Argovie: 'Aargau', Asturies: 'Asturias', Açores: 'Azores', 'Bade-Wurtemberg': 'Baden-Württemberg',
  'Basse-Saxe': 'Lower Saxony', Bavière: 'Bavaria', Berlin: 'Berlin', Berne: 'Bern', Brandebourg: 'Brandenburg',
  Brême: 'Bremen', 'Bâle-Campagne': 'Basel-Landschaft', 'Bâle-Ville': 'Basel-Stadt', Canaries: 'Canary Islands',
  Cantabrie: 'Cantabria', 'Castille-La Manche': 'Castilla-La Mancha', 'Castille-et-León': 'Castile and León',
  Catalogne: 'Catalonia', Ceuta: 'Ceuta', 'Communauté valencienne': 'Valencian Community', Estrémadure: 'Extremadura',
  Fribourg: 'Fribourg', Galice: 'Galicia', Genève: 'Geneva', Glaris: 'Glarus', Grisons: 'Graubünden',
  Guadeloupe: 'Guadeloupe', Guyane: 'French Guiana', Hambourg: 'Hamburg', Hesse: 'Hesse', 'Irlande du Nord': 'Northern Ireland',
  Jura: 'Jura', 'La Rioja': 'La Rioja', 'La Réunion': 'Réunion', Lucerne: 'Lucerne', Madrid: 'Madrid', Madère: 'Madeira',
  Martinique: 'Martinique', Mayotte: 'Mayotte', 'Mecklembourg-Poméranie-Occidentale': 'Mecklenburg-Western Pomerania',
  Melilla: 'Melilla', Murcie: 'Murcia', Métropole: 'Mainland France', Navarre: 'Navarre', Neuchâtel: 'Neuchâtel',
  Nidwald: 'Nidwalden', Obwald: 'Obwalden', 'Pays basque': 'Basque Country', 'Portugal continental': 'Mainland Portugal',
  'Rhénanie-Palatinat': 'Rhineland-Palatinate', 'Rhénanie-du-Nord-Westphalie': 'North Rhine-Westphalia',
  'Saint-Gall': 'St. Gallen', Sarre: 'Saarland', Saxe: 'Saxony', 'Saxe-Anhalt': 'Saxony-Anhalt', Schaffhouse: 'Schaffhausen',
  'Schleswig-Holstein': 'Schleswig-Holstein', Schwytz: 'Schwyz', Soleure: 'Solothurn', Tessin: 'Ticino', Thurgovie: 'Thurgau',
  Thuringe: 'Thuringia', 'Tout le pays': 'Whole country', Uri: 'Uri', Valais: 'Valais', Vaud: 'Vaud', Zoug: 'Zug',
  Zurich: 'Zurich', Écosse: 'Scotland', 'Îles Baléares': 'Balearic Islands',
};

const HOLIDAY_EN = {
  '2 janvier': '2 January', "Abolition de l'esclavage": 'Abolition of Slavery Day',
  'Anniversaire du premier gouvernement basque': 'Anniversary of the first Basque Government', 'Armistice 1918': 'Armistice Day',
  Ascension: 'Ascension Day', Assomption: 'Assumption Day', 'Assomption (Ferragosto)': 'Assumption Day (Ferragosto)',
  'Aïd el-Fitr': 'Eid al-Fitr', 'Aïd el-Kébir': 'Eid al-Adha', 'Bataille de la Boyne': 'Battle of the Boyne',
  'Chandeleur (non légal)': 'Candlemas (non-statutory)', 'Commémoration du plébiscite': 'Plebiscite Day',
  'Couronnement du roi Charles III': 'Coronation of King Charles III', 'Diada (fête nationale de Catalogne)': 'Diada (National Day of Catalonia)',
  'Funérailles de la reine Élisabeth II': 'State Funeral of Queen Elizabeth II', "Fête de l'unité allemande": 'German Unity Day',
  'Fête de la Communauté de Madrid': 'Community of Madrid Day', 'Fête de la Libération': 'Liberation Day',
  'Fête de la Réformation': 'Reformation Day', 'Fête de la République': 'Republic Day',
  'Fête de la communauté (1er mars)': 'Community Day (1 March)', 'Fête de la communauté (23 avril)': 'Community Day (23 April)',
  'Fête de la communauté (8 septembre)': 'Community Day (8 September)', 'Fête de la communauté (9 juin)': 'Community Day (9 June)',
  "Fête de la paix (ville d'Augsbourg)": 'Peace Festival (city of Augsburg)', 'Fête du Roi': "King's Day",
  'Fête du travail': 'Labour Day', 'Fête nationale': 'National Day', 'Fête nationale (Assomption)': 'National Day (Assumption)',
  'Fête-Dieu': 'Corpus Christi', 'Immaculée Conception': 'Immaculate Conception',
  'Instauration de la République': 'Republic Day', 'Jeudi saint': 'Maundy Thursday', 'Jeûne genevois': 'Geneva Fast',
  'Jour de Castille-La Manche': 'Castilla-La Mancha Day', 'Jour de Ceuta': 'Ceuta Day', 'Jour de Madère': 'Madeira Day',
  'Jour de Melilla': 'Melilla Day', "Jour de l'Andalousie": 'Andalusia Day', "Jour de l'an": "New Year's Day",
  "Jour de l'autonomie de Madère": 'Madeira Autonomy Day', 'Jour de la Communauté valencienne': 'Valencian Community Day',
  'Jour de la Constitution': 'Constitution Day', 'Jour de la Liberté': 'Freedom Day', 'Jour de la Navarre': 'Navarre Day',
  'Jour de pénitence et de prière': 'Day of Repentance and Prayer', 'Jour des Açores': 'Azores Day',
  'Jour des Canaries': 'Canary Islands Day', 'Jour des institutions': 'Institutions Day',
  'Jour des lettres galiciennes': 'Galician Literature Day', 'Jour des Îles Baléares': 'Balearic Islands Day',
  'Jour des Îles Baléares (reporté)': 'Balearic Islands Day (moved)', 'Jour du Portugal': 'Portugal Day',
  "Jour férié d'été": 'Summer bank holiday', 'Jour férié de début mai': 'Early May bank holiday',
  'Jour férié de printemps': 'Spring bank holiday', "Journée de l'Europe": 'Europe Day',
  'Journée internationale des femmes': "International Women's Day", "Journée mondiale de l'enfance": "World Children's Day",
  'Jubilé de platine': 'Platinum Jubilee', 'Knabenschiessen (ville de Zurich, après-midi)': 'Knabenschiessen (city of Zurich, afternoon)',
  'La Bien Aparecida': 'La Bien Aparecida', 'Lendemain de Noël': "St Stephen's Day", 'Lendemain de Noël (Boxing Day)': 'Boxing Day',
  "Lendemain de l'Assomption": 'Day after Assumption', 'Lendemain de la Toussaint': "Day after All Saints' Day",
  'Lendemain du jour de la Constitution': 'Day after Constitution Day', 'Lundi de Pentecôte': 'Whit Monday',
  'Lundi de Pâques': 'Easter Monday', 'Lundi du Jeûne fédéral': 'Federal Fast Monday', 'Mardi gras (facultatif)': 'Carnival Tuesday (optional)',
  'Nativité de Marie': 'Nativity of Mary', "Notre-Dame d'Afrique": 'Our Lady of Africa', 'Nouvel An': "New Year's Day",
  Noël: 'Christmas Day', 'Näfelser Fahrt': 'Näfels Pilgrimage', 'Proclamation de la République': 'Republic Day',
  Pâques: 'Easter Sunday', "Report de l'Assomption": 'Assumption Day (moved)', "Restauration de l'indépendance": 'Restoration of Independence',
  'Restauration de la République': 'Restoration of the Republic', 'Saint-André': "St Andrew's Day",
  'Saint-Berchtold (2 janvier)': "St Berchtold's Day (2 January)", "Saint-François d'Assise": 'St Francis of Assisi',
  'Saint-Jacques': "St James's Day", 'Saint-Jean': "St John's Day", 'Saint-Joseph': "St Joseph's Day",
  'Saint-Joseph (non légal)': "St Joseph's Day (non-statutory)", 'Saint-Nicolas de Flüe': 'St Nicholas of Flüe',
  'Saint-Patrick': "St Patrick's Day", 'Saint-Pierre et Saint-Paul': 'Saints Peter and Paul',
  'Saint-Sylvestre (non légal)': "New Year's Eve (non-statutory)", 'Saint-Sylvestre (usage)': "New Year's Eve (customary)",
  'Saint-Étienne': "St Stephen's Day", 'Sechseläuten (ville de Zurich, après-midi)': 'Sechseläuten (city of Zurich, afternoon)',
  Toussaint: "All Saints' Day", 'Veille de Noël (non légal)': 'Christmas Eve (non-statutory)',
  'Veille de Noël (usage)': 'Christmas Eve (customary)', 'Vendredi saint': 'Good Friday',
  'Vendredi saint (non légal)': 'Good Friday (non-statutory)', 'Victoire 1945': 'Victory in Europe Day', Épiphanie: 'Epiphany',
};

const NOTE_EN = {
  CH: 'Holidays observed throughout the canton or most of it. Christmas Eve, New Year\'s Eve, Sechseläuten and Knabenschiessen (customary half days), and the Catholic holidays of Aargau and Solothurn (depending on the municipality) are listed but not counted: tick them if they are days off for you.',
  FR: 'The 11 statutory public holidays, plus Good Friday and St Stephen\'s Day in Alsace-Moselle and Abolition of Slavery Day in the overseas departments. Whit Monday is counted as a holiday: untick it if it is your worked "solidarity day".',
  DE: 'Statutory holidays of each state. In Bavaria, Assumption Day is a holiday only in mainly Catholic municipalities (most of them): untick it if needed. Corpus Christi in Saxony and Thuringia (some municipalities), the Augsburg Peace Festival and 24 and 31 December (customary) are listed but not counted.',
  AT: 'The 13 statutory holidays (Arbeitsruhegesetz). 24 and 31 December, often days off under collective agreements, are listed but not counted. Regional patron saints\' days are not counted.',
  BE: 'The 10 statutory public holidays. Community holidays (27 September, 11 July, 15 November) are not counted.',
  IT: 'National public holidays, including St Francis of Assisi (4 October), restored from 2026. Each city\'s patron saint day is not counted.',
  LU: 'The 11 statutory public holidays, including Europe Day (9 May) since 2019.',
  ES: 'National and autonomous community holidays from the official BOE calendar for {years}; for other years, an estimate based on the usual holidays (marked "estimate"). The 2 local holidays of each municipality and each Canary island\'s own holiday are not counted.',
  LI: 'The 13 statutory holidays (Labour Act, art. 18). Candlemas, St Joseph\'s Day, Good Friday, 24 and 31 December are not statutory: they are listed but not counted, tick them if they are days off for you.',
  GB: 'The bank holidays of each nation. A holiday falling on a weekend moves to the next free weekday ("substitute day"), as set by the UK government. Employers do not have to give them as paid leave: check your contract.',
  NL: 'Official public holidays. None is a mandatory day off: your collective agreement (cao) or contract decides. Good Friday and Liberation Day (5 May, usually a day off once every five years) are listed but not counted.',
  PT: 'The 13 mandatory holidays (Labour Code, art. 234), plus the regional holidays of Madeira and the Azores. Carnival Tuesday and Madeira Autonomy Day are listed but not counted; each municipality\'s holiday (feriado municipal) is not counted.',
};

const SOURCE_EN = {
  'Office fédéral de la justice – jours fériés cantonaux': 'Federal Office of Justice – cantonal holidays',
  'Service-public.fr – jours fériés': 'Service-public.fr – public holidays',
  'Hambourg – tableau des fériés légaux par Land': 'Hamburg – statutory holidays by state',
  'RIS – Arbeitsruhegesetz, § 7': 'RIS – Rest Periods Act (Arbeitsruhegesetz), § 7',
  'GOV.UK – bank holidays': 'GOV.UK – bank holidays',
  'SPF Emploi – jours fériés': 'FPS Employment – public holidays',
  'Normattiva – loi 260/1949': 'Normattiva – Law 260/1949',
  'Guichet.lu – jours fériés légaux': 'Guichet.lu – statutory public holidays',
  'BOE – fêtes 2026': 'BOE – 2026 holidays',
  'BOE – fêtes 2027': 'BOE – 2027 holidays',
  'Gesetze.li – fériés légaux': 'Gesetze.li – statutory holidays',
  'Rijksoverheid – fêtes officielles': 'Rijksoverheid – official public holidays',
  'Diário da República – Code du travail, art. 234': 'Diário da República – Labour Code, art. 234',
};

let current = 'fr';
export const setLang = (l) => { current = LANGS.includes(l) ? l : 'fr'; };
export const getLang = () => current;
export const locale = () => (current === 'fr' ? 'fr-CH' : 'en-GB');

/** Texte de l'interface, avec remplacement des paramètres {nom}. */
export function t(key, params = {}) {
  const s = UI[current][key] ?? UI.fr[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
}

const en = (map, fr) => (current === 'en' && map[fr]) || fr;
export const holidayName = (nom) => en(HOLIDAY_EN, nom);
export const regionName = (nom) => en(REGION_EN, nom);
export const regionLabel = (label) => en(REGION_LABEL_EN, label || 'Région');
export const countryName = (code, nom) => (current === 'en' ? COUNTRY_EN[code] || nom : nom);
export const sourceLabel = (label) => en(SOURCE_EN, label);
export function countryNote(code, noteFr, params = {}) {
  if (current !== 'en' || !NOTE_EN[code]) return noteFr;
  return NOTE_EN[code].replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
}

/** Pour les tests : tout ce qui manque à la traduction anglaise. */
export function missingTranslations({ holidayNames = [], regionNames = [], countryCodes = [], labels = [] }) {
  const miss = [];
  for (const k of Object.keys(UI.fr)) if (!(k in UI.en)) miss.push(`ui:${k}`);
  for (const k of Object.keys(UI.en)) if (!(k in UI.fr)) miss.push(`ui-fr:${k}`);
  for (const n of holidayNames) if (!HOLIDAY_EN[n]) miss.push(`holiday:${n}`);
  for (const n of regionNames) if (!REGION_EN[n]) miss.push(`region:${n}`);
  for (const c of countryCodes) { if (!COUNTRY_EN[c]) miss.push(`country:${c}`); if (!NOTE_EN[c]) miss.push(`note:${c}`); }
  for (const l of labels) if (!REGION_LABEL_EN[l]) miss.push(`label:${l}`);
  return miss;
}
export const SOURCE_LABELS_EN = SOURCE_EN;
