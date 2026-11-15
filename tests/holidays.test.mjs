// Lancer avec : npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { easter, isoDate, holidaysFor, computeRange, workingDays, CANTONS, COUNTRIES } from '../js/holidays.js';

test('date de Pâques', () => {
  assert.equal(isoDate(easter(2024)), '2024-03-31');
  assert.equal(isoDate(easter(2025)), '2025-04-20');
  assert.equal(isoDate(easter(2026)), '2026-04-05');
  assert.equal(isoDate(easter(2027)), '2027-03-28');
  assert.equal(isoDate(easter(2038)), '2038-04-25');
});

test('fériés mobiles particuliers', () => {
  const ge = holidaysFor(2026, 'CH', 'GE').map((h) => `${h.id}:${isoDate(h.date)}`);
  assert.ok(ge.includes('jeune-genevois:2026-09-10'));
  const vd = holidaysFor(2026, 'CH', 'VD').map((h) => `${h.id}:${isoDate(h.date)}`);
  assert.ok(vd.includes('lundi-jeune:2026-09-21'));
  assert.ok(vd.includes('ascension:2026-05-14'));
  assert.ok(vd.includes('lundi-pentecote:2026-05-25'));
});

test('les 26 cantons ont au moins les fériés nationaux', () => {
  assert.equal(Object.keys(CANTONS).length, 26);
  for (const c of Object.keys(CANTONS)) {
    const ids = holidaysFor(2027, 'CH', c).map((h) => h.id);
    for (const id of ['nouvel-an', 'ascension', 'fete-nationale', 'noel']) assert.ok(ids.includes(id), `${c} ${id}`);
  }
});

test('comptage Vaud 2026', () => {
  // 261 jours de semaine en 2026 ; fériés VD en semaine : 1.1, 2.1, 3.4, 6.4, 14.5, 25.5, 21.9, 25.12 (1.8 = samedi)
  const r = computeRange({ from: { y: 2026, m: 1 }, to: { y: 2026, m: 12 }, canton: 'VD' });
  assert.equal(r.totals.jours, 365);
  assert.equal(r.totals.weekend, 104);
  assert.equal(r.totals.feries, 8);
  assert.equal(r.totals.ouvres, 253);
});

test('férié exclu par l\'utilisateur', () => {
  const base = computeRange({ from: { y: 2026, m: 9 }, to: { y: 2026, m: 9 }, canton: 'VD' });
  const sans = computeRange({ from: { y: 2026, m: 9 }, to: { y: 2026, m: 9 }, canton: 'VD', excluded: new Set(['lundi-jeune']) });
  assert.equal(sans.totals.ouvres, base.totals.ouvres + 1);
});

test('intervalle inversé refusé', () => {
  assert.throws(() => computeRange({ from: { y: 2027, m: 5 }, to: { y: 2027, m: 4 }, canton: 'ZH' }), RangeError);
  assert.throws(() => computeRange({ from: { y: 2027, m: 5, d: 20 }, to: { y: 2027, m: 5, d: 19 }, canton: 'ZH' }), RangeError);
});

test('période au jour près', () => {
  // VD, du lundi 14 au vendredi 25 septembre 2026 : 10 jours de semaine, dont le Lundi du Jeûne (21.9)
  const r = computeRange({ from: { y: 2026, m: 9, d: 14 }, to: { y: 2026, m: 9, d: 25 }, canton: 'VD' });
  assert.equal(r.totals.jours, 12);
  assert.equal(r.totals.ouvres, 9);
  assert.equal(r.totals.feries, 1);
  assert.equal(r.holidays.length, 1);
  // Un seul jour
  assert.equal(computeRange({ from: { y: 2026, m: 9, d: 21 }, to: { y: 2026, m: 9, d: 21 }, canton: 'VD' }).totals.ouvres, 0);
  assert.equal(computeRange({ from: { y: 2026, m: 9, d: 22 }, to: { y: 2026, m: 9, d: 22 }, canton: 'VD' }).totals.ouvres, 1);
  // Sur deux mois : 28.12.2026 → 8.1.2027 (Saint-Berchtold 2.1 = samedi)
  const r2 = computeRange({ from: { y: 2026, m: 12, d: 28 }, to: { y: 2027, m: 1, d: 8 }, canton: 'VD' });
  assert.equal(r2.totals.ouvres, 9); // 28–31.12 (4) + 4–8.1 (5) ; 1.1 férié
  assert.equal(r2.months.length, 2);
  assert.ok(r2.months[0].partiel && r2.months[1].partiel);
});

test('jour trop grand ramené à la fin du mois', () => {
  const r = computeRange({ from: { y: 2027, m: 2, d: 31 }, to: { y: 2027, m: 2, d: 31 }, canton: 'ZH' });
  assert.equal(r.totals.jours, 1);
});

test('déduction des congés', () => {
  assert.deepEqual(workingDays({ ouvres: 253, conges: 25 }), { theoriques: 253, conges: 25, net: 228 });
  assert.deepEqual(workingDays({ ouvres: 253, taux: 80, conges: 20 }), { theoriques: 202.4, conges: 20, net: 182.4 });
  assert.equal(workingDays({ ouvres: 20, conges: 2.5 }).net, 17.5);
  assert.equal(workingDays({ ouvres: 20 }).net, 20);
});

test('congés invalides refusés', () => {
  assert.throws(() => workingDays({ ouvres: 20, conges: -1 }), RangeError);
  assert.throws(() => workingDays({ ouvres: 20, conges: 21 }), RangeError);
  assert.throws(() => workingDays({ ouvres: 20, conges: 1.3 }), RangeError);
});

const isoList = (y, c, r) => holidaysFor(y, c, r).map((h) => `${isoDate(h.date)} ${h.id}`);

test('France métropole et Alsace-Moselle', () => {
  const metro = isoList(2027, 'FR', 'METRO');
  assert.equal(metro.length, 11);
  assert.ok(metro.includes('2027-05-08 victoire-1945'));
  assert.ok(metro.includes('2027-11-11 armistice'));
  assert.ok(!metro.some((x) => x.includes('vendredi-saint')));
  const am = isoList(2027, 'FR', 'AM');
  assert.equal(am.length, 13);
  assert.ok(am.includes('2027-03-26 vendredi-saint'));
  assert.ok(am.includes('2027-12-26 saint-etienne'));
  // 2027 : 261 jours de semaine, 7 fériés en semaine en métropole
  const r = computeRange({ from: { y: 2027, m: 1 }, to: { y: 2027, m: 12 }, country: 'FR', region: 'METRO' });
  assert.equal(r.totals.feries, 7);
  assert.equal(r.totals.ouvres, 254);
  assert.ok(isoList(2027, 'FR', 'RE').includes('2027-12-20 abolition-re'));
});

test('Allemagne : fériés selon le Land et l\'année', () => {
  assert.ok(isoList(2026, 'DE', 'SN').includes('2026-11-18 buss-bettag'));
  assert.ok(isoList(2027, 'DE', 'SN').includes('2027-11-17 buss-bettag'));
  assert.ok(isoList(2027, 'DE', 'MV').includes('2027-03-08 frauentag'));
  assert.ok(!isoList(2022, 'DE', 'MV').some((x) => x.includes('frauentag')));
  assert.ok(isoList(2027, 'DE', 'TH').includes('2027-09-20 weltkindertag'));
  assert.ok(!isoList(2017, 'DE', 'HH').some((x) => x.includes('reformation')));
  assert.equal(isoList(2027, 'DE', 'BY').filter((x) => /fronleichnam|allerheiligen|drei-koenige/.test(x)).length, 3);
});

test('Italie : 4 octobre férié à partir de 2026', () => {
  assert.ok(isoList(2027, 'IT', 'ALL').includes('2027-10-04 san-francesco'));
  assert.ok(!isoList(2025, 'IT', 'ALL').some((x) => x.includes('san-francesco')));
});

test('autres pays : nombre de fériés légaux', () => {
  assert.equal(holidaysFor(2027, 'AT', 'ALL').length, 13);
  assert.equal(holidaysFor(2027, 'BE', 'ALL').length, 10);
  assert.equal(holidaysFor(2027, 'LU', 'ALL').length, 11);
  for (const [code, c] of Object.entries(COUNTRIES)) {
    assert.ok(c.regions[c.defaultRegion], `${code} région par défaut`);
    for (const r of Object.keys(c.regions)) assert.ok(holidaysFor(2027, code, r).length >= 8, `${code}-${r}`);
  }
});
