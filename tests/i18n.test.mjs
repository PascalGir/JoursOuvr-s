// Traductions : tout ce que le moteur peut afficher existe en anglais.
import test from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, holidaysFor } from '../js/holidays.js';
import {
  detectLang, setLang, getLang, locale, t, holidayName, regionName, regionLabel, countryName, countryNote,
  sourceLabel, missingTranslations, SOURCE_LABELS_EN,
} from '../js/i18n.js';

test('aucune traduction anglaise ne manque', () => {
  const holidayNames = new Set();
  const regionNames = new Set();
  const labels = new Set();
  for (const [code, c] of Object.entries(COUNTRIES)) {
    labels.add(c.regionLabel || 'Région');
    for (const [r, nom] of Object.entries(c.regions)) {
      regionNames.add(nom);
      for (let y = 2010; y <= 2035; y++) for (const h of holidaysFor(y, code, r)) holidayNames.add(h.nom);
    }
    for (const s of c.sources) assert.ok(SOURCE_LABELS_EN[s.label], `source ${s.label}`);
  }
  const miss = missingTranslations({
    holidayNames: [...holidayNames], regionNames: [...regionNames], countryCodes: Object.keys(COUNTRIES), labels: [...labels],
  });
  assert.deepEqual(miss, []);
});

test('détection de la langue', () => {
  assert.equal(detectLang({ param: 'en', stored: 'fr', navigatorLanguages: ['fr-CH'] }), 'en');
  assert.equal(detectLang({ param: 'xx', stored: 'fr', navigatorLanguages: ['en-US'] }), 'fr');
  assert.equal(detectLang({ navigatorLanguages: ['de-CH', 'fr-CH'] }), 'fr');
  assert.equal(detectLang({ navigatorLanguages: ['de-CH'] }), 'en');
  assert.equal(detectLang(), 'en');
});

test('textes et paramètres dans les deux langues', () => {
  setLang('fr');
  assert.equal(getLang(), 'fr');
  assert.equal(locale(), 'fr-CH');
  assert.equal(t('hint.rate', { n: '202,4', p: 80 }), '202,4 à 80 %');
  assert.equal(t('cle.inconnue'), 'cle.inconnue');
  assert.equal(t('hint.rate', {}), '{n} à {p} %');
  assert.equal(holidayName('Noël'), 'Noël');
  assert.equal(regionName('Genève'), 'Genève');
  assert.equal(countryName('CH', 'Suisse'), 'Suisse');
  assert.equal(regionLabel(undefined), 'Région');
  assert.equal(countryNote('CH', 'note fr'), 'note fr');
  assert.equal(sourceLabel('BOE – fêtes 2027'), 'BOE – fêtes 2027');

  setLang('en');
  assert.equal(locale(), 'en-GB');
  assert.equal(t('kpi.net'), 'Days to work');
  assert.equal(holidayName('Noël'), 'Christmas Day');
  assert.equal(holidayName('Nom inconnu'), 'Nom inconnu');
  assert.equal(regionName('Genève'), 'Geneva');
  assert.equal(regionLabel('Land'), 'State');
  assert.equal(countryName('GB', 'Royaume-Uni'), 'United Kingdom');
  assert.equal(countryName('XX', 'Inconnu'), 'Inconnu');
  assert.ok(countryNote('ES', 'fr', { years: '2026 and 2027' }).includes('2026 and 2027'));
  assert.ok(countryNote('ES', 'fr').includes('{years}'));
  assert.equal(countryNote('XX', 'note fr'), 'note fr');
  assert.equal(sourceLabel('BOE – fêtes 2027'), 'BOE – 2027 holidays');

  setLang('de');
  assert.equal(getLang(), 'fr');
});
