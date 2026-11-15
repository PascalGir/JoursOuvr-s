// Lancer avec : npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { easter, isoDate, holidaysFor, computeRange, CANTONS } from '../js/holidays.js';

test('date de Pâques', () => {
  assert.equal(isoDate(easter(2024)), '2024-03-31');
  assert.equal(isoDate(easter(2025)), '2025-04-20');
  assert.equal(isoDate(easter(2026)), '2026-04-05');
  assert.equal(isoDate(easter(2027)), '2027-03-28');
  assert.equal(isoDate(easter(2038)), '2038-04-25');
});

test('fériés mobiles particuliers', () => {
  const ge = holidaysFor(2026, 'GE').map((h) => `${h.id}:${isoDate(h.date)}`);
  assert.ok(ge.includes('jeune-genevois:2026-09-10'));
  const vd = holidaysFor(2026, 'VD').map((h) => `${h.id}:${isoDate(h.date)}`);
  assert.ok(vd.includes('lundi-jeune:2026-09-21'));
  assert.ok(vd.includes('ascension:2026-05-14'));
  assert.ok(vd.includes('lundi-pentecote:2026-05-25'));
});

test('les 26 cantons ont au moins les fériés nationaux', () => {
  assert.equal(Object.keys(CANTONS).length, 26);
  for (const c of Object.keys(CANTONS)) {
    const ids = holidaysFor(2027, c).map((h) => h.id);
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
});
