// Tests de l'interface dans un vrai navigateur (Chromium), sur ordinateur et téléphone simulés.
// La couverture du code exécuté dans la page est enregistrée dans reports/ui-coverage.json.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS = path.join(ROOT, 'reports');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const YEAR = new Date().getFullYear();

let server, base, browser;
const coverage = [];

before(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const file = path.join(ROOT, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});

after(async () => {
  await browser.close();
  server.close();
  fs.mkdirSync(REPORTS, { recursive: true });
  fs.writeFileSync(path.join(REPORTS, 'ui-coverage.json'), JSON.stringify(coverage));
});

/** Ouvre la page dans un contexte neuf ; renvoie la page et la liste des erreurs JavaScript. */
async function open(query = '', { locale = 'fr-CH', mobile = false, init } = {}) {
  const ctx = await browser.newContext({
    ...(mobile ? devices['Pixel 7'] : { viewport: { width: 1200, height: 900 } }),
    locale, acceptDownloads: true,
  });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  await page.goto(base + query);
  await page.waitForSelector('#kN');
  page.closeAll = async () => {
    const entries = await page.coverage.stopJSCoverage();
    for (const e of entries) {
      const p = new URL(e.url).pathname;
      if (p.startsWith('/js/')) coverage.push({ file: p.slice(1), source: e.source, functions: e.functions });
    }
    await ctx.close();
  };
  return { page, errors };
}
const text = (page, sel) => page.locator(sel).innerText();
const val = (page, sel) => page.locator(sel).inputValue();
async function setDates(page, du, au) {
  await page.fill('#du', du);
  await page.locator('#du').dispatchEvent('change');
  await page.fill('#au', au);
  await page.locator('#au').dispatchEvent('change');
}

test('ouverture en français : résultats, version, source officielle', async () => {
  const { page, errors } = await open('?du=2026-01-01&au=2026-12-31&pays=CH&region=VD');
  assert.equal(await text(page, '#kO'), '253');
  assert.equal(await text(page, '#kN'), '253');
  assert.equal(await text(page, '#kC'), '365');
  assert.equal(await text(page, '#version'), JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'))).version);
  assert.match(await text(page, '#sources'), /Office fédéral de la justice/);
  assert.equal(await page.getAttribute('html', 'lang'), 'fr');
  assert.equal(await page.locator('#cal .month').count(), 12);
  assert.deepEqual(errors, []);
  await page.closeAll();
});

test('anglais par défaut hors navigateur francophone, puis passage en français mémorisé', async () => {
  const { page, errors } = await open('?du=2027-01-01&au=2027-12-31&pays=CH&region=GE', { locale: 'de-CH' });
  assert.equal(await text(page, 'h1'), 'Working days calculator');
  assert.equal(await page.getAttribute('html', 'lang'), 'en');
  assert.match(await text(page, '#hol'), /New Year's Day/);
  assert.match(await page.locator('#ct option:checked').innerText(), /Geneva/);
  await page.selectOption('#lang', 'fr');
  assert.equal(await text(page, 'h1'), 'Calculateur de jours ouvrés');
  assert.match(await text(page, '#hol'), /Nouvel An/);
  await page.reload();
  assert.equal(await text(page, 'h1'), 'Calculateur de jours ouvrés');
  assert.deepEqual(errors, []);
  await page.closeAll();
});

test('langue imposée par le lien (?lang=en) et conservée dans l\'URL', async () => {
  const { page } = await open('?lang=en&pays=ES&region=MD&du=2027-01-01&au=2027-12-31');
  assert.equal(await text(page, '#kO'), '251');
  assert.match(page.url(), /lang=en/);
  assert.match(await text(page, '#sources'), /Official sources:.*BOE – 2026 holidays/s);
  assert.match(await text(page, '#note'), /2026 and 2027/);
  await page.closeAll();
});

test('anciens liens : canton= et dates au mois', async () => {
  const { page } = await open('?du=2027-01&au=2027-06&canton=GE');
  assert.equal(await val(page, '#pays'), 'CH');
  assert.equal(await val(page, '#ct'), 'GE');
  assert.equal(await val(page, '#du'), '2027-01-01');
  assert.equal(await val(page, '#au'), '2027-06-30');
  assert.match(page.url(), /pays=CH&region=GE/);
  await page.closeAll();
});

test('dates du téléphone : saisie d\'une période au jour près', async () => {
  const { page } = await open('?pays=CH&region=VD');
  await page.selectOption('#preset', 'annee');
  await setDates(page, '2026-09-14', '2026-09-25');
  assert.equal(await text(page, '#kO'), '9');
  assert.equal(await val(page, '#preset'), '');
  assert.match(await text(page, '#bars'), /du 14 au 25/);
  await setDates(page, '2026-09-22', '2026-09-22');
  assert.equal(await text(page, '#kO'), '1');
  assert.match(await text(page, '#bars'), /le 22/);
  await page.closeAll();
});

test('messages d\'erreur de saisie', async () => {
  const { page } = await open('?pays=CH&region=VD&du=2027-01-01&au=2027-12-31');
  await setDates(page, '2027-05-20', '2027-05-19');
  assert.match(await text(page, '#err'), /postérieure ou égale/);
  assert.equal(await text(page, '#kN'), '–');
  await page.fill('#au', '');
  await page.locator('#au').dispatchEvent('change');
  assert.match(await text(page, '#err'), /date de début et une date de fin/);
  await setDates(page, '2027-01-01', '2027-01-31');
  await page.fill('#conges', '-1');
  assert.match(await text(page, '#err'), /positif/);
  await page.fill('#conges', '1.3');
  assert.match(await text(page, '#err'), /demi-journée/);
  await page.fill('#conges', '40');
  assert.match(await text(page, '#err'), /Les congés \(40\) dépassent les jours ouvrés de la période \(20\)/);
  await page.fill('#conges', '2.5');
  assert.equal(await text(page, '#err'), '');
  assert.equal(await text(page, '#kN'), '17,5');
  await page.closeAll();
});

test('période rapide : chaque choix remplit les dates', async () => {
  const { page } = await open('?pays=CH&region=VD');
  const now = new Date();
  const m = now.getMonth() + 1;
  const p2 = (n) => String(n).padStart(2, '0');
  const last = (y, mo) => new Date(y, mo, 0).getDate();
  const iso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const cases = {
    mois: [`${YEAR}-${p2(m)}-01`, `${YEAR}-${p2(m)}-${last(YEAR, m)}`],
    trimestre: [`${YEAR}-${p2(Math.floor((m - 1) / 3) * 3 + 1)}-01`, null],
    reste: [iso(now), `${YEAR}-12-31`],
    annee: [`${YEAR}-01-01`, `${YEAR}-12-31`],
    suivante: [`${YEAR + 1}-01-01`, `${YEAR + 1}-12-31`],
    douze: [iso(now), iso(new Date(YEAR + 1, m - 1, now.getDate() - 1))],
  };
  const nxt = new Date(YEAR, m, 1);
  cases.moisSuivant = [iso(nxt), `${nxt.getFullYear()}-${p2(nxt.getMonth() + 1)}-${last(nxt.getFullYear(), nxt.getMonth() + 1)}`];
  for (const [k, [du, au]] of Object.entries(cases)) {
    await page.selectOption('#preset', k);
    assert.equal(await val(page, '#du'), du, k);
    if (au) assert.equal(await val(page, '#au'), au, k);
  }
  await page.selectOption('#preset', '');
  assert.equal(await val(page, '#du'), cases.moisSuivant[0]);
  await page.closeAll();
});

test('pays : région masquée si inutile, libellés adaptés, région mémorisée par pays', async () => {
  const { page } = await open('?pays=CH&region=ZH&du=2027-01-01&au=2027-12-31');
  await page.selectOption('#pays', 'IT');
  assert.equal(await page.locator('#regionField').isHidden(), true);
  assert.equal(await text(page, '#logo'), 'IT');
  assert.ok(!page.url().includes('region='));
  await page.selectOption('#pays', 'GB');
  assert.equal(await text(page, '#regionLabel'), 'Nation');
  await page.selectOption('#ct', 'SCT');
  assert.equal(await text(page, '#kO'), '252');
  await page.selectOption('#pays', 'CH');
  assert.equal(await val(page, '#ct'), 'ZH');
  await page.selectOption('#pays', 'GB');
  assert.equal(await val(page, '#ct'), 'SCT');
  const options = await page.locator('#pays option').allInnerTexts();
  assert.deepEqual(options.slice(0, 2), ['Suisse', 'France']);
  assert.equal(options.length, 12);
  await page.closeAll();
});

test('taux d\'activité et congés : détail du calcul', async () => {
  const { page } = await open('?pays=CH&region=VD&du=2026-01-01&au=2026-12-31&taux=80&conges=20');
  assert.equal(await text(page, '#kN'), '182,4');
  assert.equal(await text(page, '#kNh'), '202,4 à 80 % − 20 congés');
  assert.match(await text(page, '#bars'), /· 16/);
  await page.fill('#taux', '100');
  assert.equal(await text(page, '#kNh'), '253 ouvrés − 20 congés');
  await page.fill('#conges', '0');
  assert.equal(await text(page, '#kNh'), '');
  await page.closeAll();
});

test('fériés : décocher, cocher un jour d\'usage, rétablir la liste', async () => {
  const { page } = await open('?pays=CH&region=ZH&du=2027-01-01&au=2027-12-31');
  assert.equal(await text(page, '#kO'), '256');
  await page.uncheck('input[data-id="ascension"]');
  assert.equal(await text(page, '#kO'), '257');
  await page.check('input[data-id="veille-noel"]');
  await page.check('input[data-id="saint-sylvestre"]');
  assert.equal(await text(page, '#kO'), '255');
  await page.uncheck('input[data-id="saint-sylvestre"]');
  assert.equal(await text(page, '#kO'), '256');
  await page.check('input[data-id="ascension"]');
  assert.equal(await text(page, '#kO'), '255');
  await page.uncheck('input[data-id="ascension"]');
  await page.reload();
  assert.equal(await text(page, '#kO'), '256');
  await page.click('#btnRestore');
  assert.equal(await text(page, '#kO'), '256');
  assert.equal(await page.isChecked('input[data-id="ascension"]'), true);
  assert.match(await text(page, '#hol'), /jour d'usage/);
  await page.closeAll();
});

test('étiquettes : estimation (Espagne) et report (Royaume-Uni)', async () => {
  const { page } = await open('?pays=ES&region=MD&du=2030-01-01&au=2030-01-31');
  assert.match(await text(page, '#hol'), /estimation/);
  await page.selectOption('#pays', 'GB');
  await setDates(page, '2027-12-01', '2027-12-31');
  assert.match(await text(page, '#hol'), /report/);
  await setDates(page, '2027-02-01', '2027-02-28');
  assert.match(await text(page, '#hol'), /Aucun jour férié/);
  await page.closeAll();
});

test('réinitialiser remet les réglages par défaut', async () => {
  const { page } = await open('?pays=FR&region=AM&du=2027-03-01&au=2027-03-31&taux=50&conges=2');
  await page.click('#btnReset');
  assert.equal(await val(page, '#pays'), 'CH');
  assert.equal(await val(page, '#ct'), 'VD');
  assert.equal(await val(page, '#taux'), '100');
  assert.equal(await val(page, '#conges'), '0');
  assert.equal(await val(page, '#du'), `${YEAR}-01-01`);
  assert.equal(await val(page, '#preset'), 'annee');
  await page.closeAll();
});

test('bulles d\'aide : ouverture et fermeture', async () => {
  const { page } = await open('?pays=CH&region=VD');
  const btn = page.locator('button[aria-controls="help-rate"]');
  assert.equal(await page.locator('#help-rate').isHidden(), true);
  await btn.click();
  assert.equal(await page.locator('#help-rate').isVisible(), true);
  assert.equal(await btn.getAttribute('aria-expanded'), 'true');
  await btn.click();
  assert.equal(await page.locator('#help-rate').isHidden(), true);
  await page.click('button[aria-controls="help-optional"]');
  assert.match(await text(page, '#help-optional'), /jour « d'usage »/);
  await page.closeAll();
});

test('graphique mensuel : détail d\'un mois au clic', async () => {
  const { page } = await open('?pays=CH&region=VD&du=2027-01-01&au=2027-12-31');
  const bars = page.locator('.bar-row');
  await bars.nth(2).click();
  assert.equal(await bars.nth(2).getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#tip-2').isVisible(), true);
  assert.match(await text(page, '#tip-2'), /21 ouvrés · 2 fériés · 8 week-end · 31 jours/);
  await bars.nth(5).click();
  assert.equal(await bars.nth(2).getAttribute('aria-expanded'), 'false');
  await bars.nth(5).click();
  assert.equal(await bars.nth(5).getAttribute('aria-expanded'), 'false');
  await page.closeAll();
});

test('partager : fenêtre de partage du téléphone', async () => {
  const { page } = await open('?pays=CH&region=VD', {
    mobile: true,
    init: () => { navigator.share = (d) => { window.__shared = d; return Promise.resolve(); }; },
  });
  await page.click('#btnShare');
  const shared = await page.evaluate(() => window.__shared);
  assert.match(shared.url, /pays=CH/);
  assert.equal(shared.title, 'Calculateur de jours ouvrés');
  await page.closeAll();
});

test('partager : partage annulé ou impossible, puis copie du lien', async () => {
  const { page } = await open('?pays=CH&region=VD', {
    init: () => {
      let n = 0;
      navigator.share = () => { n += 1; const e = new Error('x'); e.name = n === 1 ? 'AbortError' : 'NotAllowedError'; return Promise.reject(e); };
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: (u) => { window.__copied = u; return Promise.resolve(); } } });
    },
  });
  await page.click('#btnShare');
  assert.equal(await page.evaluate(() => window.__copied), undefined);
  await page.click('#btnShare');
  await page.waitForSelector('#toast:not([hidden])');
  assert.equal(await text(page, '#toast'), 'Lien copié');
  assert.match(await page.evaluate(() => window.__copied), /pays=CH/);
  await page.closeAll();
});

test('partager sans presse-papiers : le lien est affiché', async () => {
  const { page } = await open('?pays=CH&region=VD', {
    init: () => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('refusé')) } }); },
  });
  await page.click('#btnShare');
  await page.waitForSelector('#toast:not([hidden])');
  assert.match(await text(page, '#toast'), /Copiez ce lien : http/);
  await page.closeAll();
});

test('impression : document A4 récapitulatif', async () => {
  const { page } = await open('?pays=CH&region=ZH&du=2027-01-01&au=2027-12-31&taux=80', {
    init: () => { window.print = () => { window.__printed = true; }; },
  });
  await page.click('#btnPrint');
  assert.equal(await page.evaluate(() => window.__printed), true);
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('#printDoc').isVisible(), true);
  assert.equal(await page.locator('.kpis').isHidden(), true);
  const doc = await text(page, '#printDoc');
  assert.match(doc, /Récapitulatif · Suisse – Zurich/);
  assert.match(doc, /Jours à 80 %/);
  assert.match(doc, /Total\s+256\s+204,8/);
  assert.match(doc, /Sechseläuten.*non/s);
  await page.emulateMedia({ media: 'screen' });
  await setDates(page, '2027-02-01', '2027-02-28');
  assert.match(await text(page, '#printDoc'), /Aucun jour férié/);
  await page.closeAll();
});

test('export CSV en français et en anglais', async () => {
  const { page } = await open('?pays=CH&region=VD&du=2026-09-14&au=2026-10-31&taux=80&conges=1');
  let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnCsv')]);
  assert.equal(dl.suggestedFilename(), 'jours-ouvres-CH-VD-2026-09-14_2026-10-31.csv');
  let csv = fs.readFileSync(await dl.path(), 'utf8');
  assert.match(csv, /^﻿Mois;Jours ouvrés;Fériés en semaine;Week-end;Jours calendaires;Jours à 80 %/);
  assert.match(csv, /septembre 2026 \(du 14 au 30\);12;1;4;17;9,6/);
  assert.match(csv, /Jours à travailler;26,2/);
  await page.selectOption('#lang', 'en');
  await page.selectOption('#pays', 'IT');
  await page.fill('#taux', '100');
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnCsv')]);
  assert.equal(dl.suggestedFilename(), 'working-days-IT-2026-09-14_2026-10-31.csv');
  csv = fs.readFileSync(await dl.path(), 'utf8');
  assert.match(csv, /Month;Working days;Weekday holidays/);
  assert.match(csv, /Place;Italy/);
  assert.match(csv, /Days to work;3[0-9]/);
  await page.closeAll();
});

test('export CSV inactif quand la saisie est en erreur', async () => {
  const { page } = await open('?pays=CH&region=VD&du=2027-02-01&au=2027-01-01');
  let downloaded = false;
  page.on('download', () => { downloaded = true; });
  await page.click('#btnCsv');
  await page.waitForTimeout(300);
  assert.equal(downloaded, false);
  await page.closeAll();
});

test('longue période : calendrier limité à 36 mois', async () => {
  const { page } = await open('?pays=CH&region=VD&du=2026-01-01&au=2029-12-31');
  assert.match(await text(page, '#cal'), /36 mois au plus/);
  assert.equal(await page.locator('.bar-row').count(), 48);
  await page.closeAll();
});

test('téléphone : pas de défilement horizontal, aucun message d\'erreur', async () => {
  const { page, errors } = await open('?pays=PT&region=MA&du=2027-01-01&au=2027-12-31&conges=25', { mobile: true, locale: 'en-GB' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert.equal(overflow, false);
  assert.equal(await text(page, '#kN'), '227');
  assert.match(await page.locator('#ct option:checked').innerText(), /Madeira/);
  assert.deepEqual(errors, []);
  await page.closeAll();
});

test('fonctionne même sans stockage local (navigation privée stricte)', async () => {
  const { page, errors } = await open('?pays=FR&region=METRO&du=2027-01-01&au=2027-12-31', {
    init: () => {
      const fail = () => { throw new Error('stockage bloqué'); };
      Storage.prototype.getItem = fail;
      Storage.prototype.setItem = fail;
      Storage.prototype.removeItem = fail;
    },
  });
  assert.equal(await text(page, '#kO'), '254');
  await page.uncheck('input[data-id="ascension"]');
  assert.equal(await text(page, '#kO'), '255');
  await page.click('#btnRestore');
  assert.equal(await text(page, '#kO'), '254');
  await page.click('#btnReset');
  assert.equal(await val(page, '#pays'), 'CH');
  assert.deepEqual(errors, []);
  await page.closeAll();
});

test('anciens réglages enregistrés : canton et fériés décochés repris', async () => {
  const { page } = await open('?du=2027-01-01&au=2027-12-31', {
    init: () => {
      if (!localStorage.getItem('__init')) {
        localStorage.setItem('__init', '1');
        localStorage.setItem('canton', '"GE"');
        localStorage.setItem('exclus-GE', '["ascension"]');
      }
    },
  });
  assert.equal(await val(page, '#ct'), 'GE');
  assert.equal(await page.isChecked('input[data-id="ascension"]'), false);
  await page.click('#btnRestore');
  assert.equal(await page.isChecked('input[data-id="ascension"]'), true);
  await page.closeAll();
});
