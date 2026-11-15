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
  assert.equal(holidaysFor(2027, 'AT', 'ALL').filter((h) => !h.optionnel).length, 13);
  assert.equal(holidaysFor(2027, 'BE', 'ALL').length, 10);
  assert.equal(holidaysFor(2027, 'LU', 'ALL').length, 11);
  for (const [code, c] of Object.entries(COUNTRIES)) {
    assert.ok(c.regions[c.defaultRegion], `${code} région par défaut`);
    for (const r of Object.keys(c.regions)) assert.ok(holidaysFor(2027, code, r).length >= 8, `${code}-${r}`);
  }
});

test('Espagne : calendrier officiel 2026 et 2027, estimation sinon', () => {
  // Madrid 2027 : 261 jours de semaine − 10 fériés en semaine (BOE-A-2026-21254)
  const md = computeRange({ from: { y: 2027, m: 1 }, to: { y: 2027, m: 12 }, country: 'ES', region: 'MD' });
  assert.equal(md.totals.feries, 10);
  assert.equal(md.totals.ouvres, 251);
  assert.ok(isoList(2027, 'ES', 'MD').includes('2027-08-16 lunes-asuncion'));
  const ct = isoList(2027, 'ES', 'CT');
  assert.ok(ct.includes('2027-09-11 diada') && ct.includes('2027-03-29 lunes-pascua'));
  assert.ok(!ct.some((x) => x.includes('jueves-santo')));
  assert.ok(isoList(2026, 'ES', 'AN').includes('2026-12-07 lunes-constitucion'));
  assert.ok(holidaysFor(2030, 'ES', 'MD').every((h) => h.estimation));
  assert.ok(holidaysFor(2027, 'ES', 'MD').every((h) => !h.estimation));
  for (const r of Object.keys(COUNTRIES.ES.regions)) assert.equal(holidaysFor(2027, 'ES', r).length >= 11, true, r);
});

test('Liechtenstein : fériés non légaux proposés mais non comptés par défaut', () => {
  const base = computeRange({ from: { y: 2027, m: 1 }, to: { y: 2027, m: 12 }, country: 'LI', region: 'ALL' });
  assert.equal(base.totals.ouvres, 252);
  assert.equal(base.holidays.filter((h) => h.optionnel && !h.compte).length, 5);
  const plus = computeRange({ from: { y: 2027, m: 1 }, to: { y: 2027, m: 12 }, country: 'LI', region: 'ALL', included: new Set(['heiligabend', 'silvester']) });
  assert.equal(plus.totals.ouvres, 250);
});

test('Royaume-Uni : reports des fériés du week-end comme GOV.UK', () => {
  const cnt = (y, r) => holidaysFor(y, 'GB', r).length;
  assert.deepEqual([cnt(2027, 'ENW'), cnt(2027, 'SCT'), cnt(2027, 'NIR')], [8, 9, 10]);
  const enw = isoList(2027, 'GB', 'ENW');
  assert.ok(enw.includes('2027-12-27 christmas') && enw.includes('2027-12-28 boxing-day'));
  assert.ok(isoList(2027, 'GB', 'SCT').includes('2027-01-04 second-january'));
  assert.ok(!isoList(2027, 'GB', 'SCT').some((x) => x.includes('easter-monday')));
  assert.ok(isoList(2026, 'GB', 'NIR').includes('2026-07-13 boyne'));
  assert.ok(isoList(2026, 'GB', 'SCT').includes('2026-08-03 summer-scotland'));
  // Noël un dimanche : Boxing Day le lundi, Noël reporté au mardi
  const e22 = isoList(2022, 'GB', 'ENW');
  assert.ok(e22.includes('2022-12-26 boxing-day') && e22.includes('2022-12-27 christmas'));
  assert.ok(e22.includes('2022-06-02 spring') && e22.includes('2022-06-03 jubilee-2022') && e22.includes('2022-09-19 funeral-2022'));
  assert.ok(isoList(2023, 'GB', 'SCT').includes('2023-05-08 coronation-2023'));
  assert.ok(isoList(2020, 'GB', 'NIR').includes('2020-05-08 early-may'));
  assert.ok(holidaysFor(2027, 'GB', 'ENW').find((h) => h.id === 'christmas').report);
});

test('Pays-Bas : fête du Roi et fériés non obligatoires', () => {
  assert.ok(isoList(2027, 'NL', 'ALL').includes('2027-04-27 koningsdag'));
  assert.ok(isoList(2025, 'NL', 'ALL').includes('2025-04-26 koningsdag')); // 27 avril 2025 = dimanche
  assert.ok(isoList(2013, 'NL', 'ALL').includes('2013-04-30 koningsdag'));
  const opt = holidaysFor(2027, 'NL', 'ALL').filter((h) => h.optionnel).map((h) => h.id);
  assert.deepEqual(opt.sort(), ['bevrijdingsdag', 'goede-vrijdag']);
  // 2027 : 261 jours de semaine − 5 fériés en semaine comptés
  assert.equal(computeRange({ from: { y: 2027, m: 1 }, to: { y: 2027, m: 12 }, country: 'NL', region: 'ALL' }).totals.ouvres, 256);
});

test('Portugal : fériés nationaux et régionaux', () => {
  const cont = holidaysFor(2027, 'PT', 'CONT').filter((h) => !h.optionnel);
  assert.equal(cont.length, 13);
  assert.ok(isoList(2027, 'PT', 'AC').includes('2027-05-17 dia-acores'));
  const ma = isoList(2027, 'PT', 'MA');
  assert.ok(ma.includes('2027-07-01 dia-madeira') && ma.includes('2027-12-26 primeira-oitava'));
  assert.ok(!isoList(2014, 'PT', 'CONT').some((x) => /corpo-deus|republica|todos-santos|restauracao/.test(x)));
  assert.ok(isoList(2016, 'PT', 'CONT').some((x) => x.includes('restauracao')));
  assert.ok(isoList(2027, 'PT', 'CONT').includes('2027-02-09 carnaval'));
});

test('Suisse : fériés partiels et demi-jours en optionnel', () => {
  const zh = holidaysFor(2027, 'CH', 'ZH');
  assert.equal(zh.find((h) => h.id === 'sechselaeuten').optionnel, true);
  assert.equal(isoDate(zh.find((h) => h.id === 'sechselaeuten').date), '2027-04-19');
  assert.equal(isoDate(zh.find((h) => h.id === 'knabenschiessen').date), '2027-09-13');
  // 2022 : le 3e lundi d'avril est le lundi de Pâques, le Sechseläuten est décalé d'une semaine
  assert.equal(isoDate(holidaysFor(2022, 'CH', 'ZH').find((h) => h.id === 'sechselaeuten').date), '2022-04-25');
  const ag = holidaysFor(2027, 'CH', 'AG');
  assert.ok(ag.find((h) => h.id === 'fete-dieu').optionnel);
  assert.ok(!holidaysFor(2027, 'CH', 'LU').find((h) => h.id === 'fete-dieu').optionnel);
  assert.ok(!holidaysFor(2027, 'CH', 'GE').some((h) => h.id === 'saint-sylvestre'));
  // Les optionnels ne changent pas le total par défaut (Vaud 2026 : 253)
  assert.equal(computeRange({ from: { y: 2026, m: 1 }, to: { y: 2026, m: 12 }, country: 'CH', region: 'VD' }).totals.ouvres, 253);
  const avec = computeRange({ from: { y: 2026, m: 12 }, to: { y: 2026, m: 12 }, country: 'CH', region: 'VD', included: new Set(['veille-noel', 'saint-sylvestre']) });
  assert.equal(avec.totals.ouvres, 20);
});

test('Allemagne et Autriche : jours d\'usage optionnels', () => {
  assert.ok(holidaysFor(2027, 'DE', 'SN').find((h) => h.id === 'fronleichnam').optionnel);
  assert.ok(!holidaysFor(2027, 'DE', 'BW').find((h) => h.id === 'fronleichnam').optionnel);
  assert.ok(holidaysFor(2027, 'DE', 'BY').find((h) => h.id === 'friedensfest').optionnel);
  assert.ok(holidaysFor(2027, 'AT', 'ALL').find((h) => h.id === 'silvester').optionnel);
});

test('erreurs avec un code stable', () => {
  const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
  assert.equal(code(() => workingDays({ ouvres: 10, conges: -1 })), 'LEAVE_NEGATIVE');
  assert.equal(code(() => workingDays({ ouvres: 10, conges: 0.3 })), 'LEAVE_HALF');
  assert.equal(code(() => workingDays({ ouvres: 10, conges: 11 })), 'LEAVE_TOO_MANY');
  assert.equal(code(() => computeRange({ from: { y: 2027, m: 5 }, to: { y: 2027, m: 4 }, region: 'VD' })), 'RANGE_INVERTED');
  assert.equal(code(() => holidaysFor(2027, 'XX', 'ALL')), 'UNKNOWN_COUNTRY');
});

test('chaque pays a une source officielle et une note', () => {
  for (const [code, c] of Object.entries(COUNTRIES)) {
    assert.ok(c.sources && c.sources.length > 0 && c.sources.every((x) => /^https:\/\//.test(x.url)), code);
    assert.ok(c.note && c.note.length > 20, code);
  }
});
