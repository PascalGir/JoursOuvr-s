#!/usr/bin/env node
// Rapport de tests automatisé (QUA-01 / QUA-02).
// Lance les tests du moteur (avec couverture Node) puis ceux de l'interface (couverture mesurée dans Chromium),
// fusionne la couverture par fichier de js/, puis écrit reports/rapport.md, reports/rapport.html et reports/summary.json.
// Échoue (code 1) si la couverture des lignes ou le taux de tests réussis est sous l'objectif (90 % par défaut).
import { spawnSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINES, TESTS, FICHIERS } from './test-catalogue.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS = path.join(ROOT, 'reports');
const COVERAGE_MIN = Number(process.env.COVERAGE_MIN || 90);
const PASS_RATE_MIN = Number(process.env.PASS_RATE_MIN || 90);

const SUITES = [
  { id: 'moteur', label: 'Moteur de calcul et traductions', files: ['tests/holidays.test.mjs', 'tests/i18n.test.mjs'], nodeCoverage: true },
  { id: 'interface', label: 'Interface (Chromium, ordinateur et téléphone)', files: ['tests/ui.test.mjs'], nodeCoverage: false },
];

// ---------- Exécution ----------
fs.rmSync(REPORTS, { recursive: true, force: true });
fs.mkdirSync(REPORTS, { recursive: true });

for (const s of SUITES) {
  const args = ['--test', '--test-concurrency=1'];
  if (s.nodeCoverage) {
    args.push('--experimental-test-coverage', '--test-reporter=lcov', `--test-reporter-destination=${path.join(REPORTS, `${s.id}.lcov`)}`);
  }
  args.push('--test-reporter=junit', `--test-reporter-destination=${path.join(REPORTS, `${s.id}.xml`)}`,
    '--test-reporter=spec', '--test-reporter-destination=stdout', ...s.files);
  console.log(`\n▶ ${s.label}`);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  s.exitCode = r.status;
  s.durationMs = Date.now() - t0;
}

// ---------- Résultats des tests (JUnit) ----------
const decode = (x) => String(x || '').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function parseJunit(file) {
  if (!fs.existsSync(file)) return [];
  const xml = fs.readFileSync(file, 'utf8');
  const cases = [];
  const re = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  let m;
  while ((m = re.exec(xml))) {
    const attrs = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map(([, k, v]) => [k, decode(v)]));
    const body = m[3] || '';
    const failure = /<failure\b([^>]*)/.exec(body);
    const status = failure ? 'échec' : /<skipped\b/.test(body) ? 'ignoré' : 'réussi';
    const message = failure ? decode((/message="([^"]*)"/.exec(failure[1]) || [])[1]) : '';
    cases.push({ name: attrs.name, time: Number(attrs.time || 0), status, message });
  }
  return cases;
}
for (const s of SUITES) {
  s.cases = parseJunit(path.join(REPORTS, `${s.id}.xml`));
  if (s.cases.length === 0 && s.exitCode !== 0) {
    s.cases.push({ name: `${s.label} : la suite n'a pas pu s'exécuter`, time: 0, status: 'échec', message: `code de sortie ${s.exitCode}` });
  }
  s.total = s.cases.length;
  s.passed = s.cases.filter((c) => c.status === 'réussi').length;
  s.failed = s.cases.filter((c) => c.status === 'échec').length;
  s.skipped = s.cases.filter((c) => c.status === 'ignoré').length;
}

// ---------- Couverture ----------
// Lignes exécutables : non vides et pas uniquement un commentaire.
function executableLines(source) {
  const lines = source.split('\n');
  const out = [];
  let offset = 0;
  let inBlockComment = false;
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const firstCol = line.length - line.trimStart().length;
    let isComment = inBlockComment || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    if (trimmed.startsWith('/*') && !trimmed.includes('*/')) inBlockComment = true;
    if (inBlockComment && trimmed.includes('*/')) { inBlockComment = false; isComment = true; }
    if (trimmed && !isComment) out.push({ line: i + 1, firstChar: offset + firstCol });
    offset += line.length + 1;
  });
  return out;
}

// Couverture Node (lcov) : lignes exécutées et fonctions, par fichier.
const nodeLines = new Map();
const nodeFns = new Map();
for (const s of SUITES.filter((x) => x.nodeCoverage)) {
  const file = path.join(REPORTS, `${s.id}.lcov`);
  if (!fs.existsSync(file)) continue;
  let cur = null;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    if (raw.startsWith('SF:')) {
      cur = path.relative(ROOT, raw.slice(3)).split(path.sep).join('/');
      if (!nodeLines.has(cur)) nodeLines.set(cur, new Set());
      if (!nodeFns.has(cur)) nodeFns.set(cur, new Map());
    } else if (raw.startsWith('DA:') && cur) {
      const [ln, cnt] = raw.slice(3).split(',').map(Number);
      if (cnt > 0) nodeLines.get(cur).add(ln);
    } else if (raw.startsWith('FNDA:') && cur) {
      const [cnt, name] = raw.slice(5).split(/,(.*)/s);
      const fns = nodeFns.get(cur);
      fns.set(name, (fns.get(name) || 0) + Number(cnt));
    } else if (raw.startsWith('FN:') && cur) {
      const name = raw.slice(3).split(/,(.*)/s)[1];
      const fns = nodeFns.get(cur);
      if (!fns.has(name)) fns.set(name, 0);
    }
  }
}

// Couverture Chromium (V8, par plages de caractères) : un caractère est couvert s'il a été exécuté dans au moins une page.
const browserChars = new Map();
const browserFns = new Map();
const uiFile = path.join(REPORTS, 'ui-coverage.json');
const uiEntries = fs.existsSync(uiFile) ? JSON.parse(fs.readFileSync(uiFile, 'utf8')) : [];
for (const e of uiEntries) {
  const counts = new Int32Array(e.source.length);
  const ranges = e.functions.flatMap((f) => f.ranges).sort((a, b) => a.startOffset - b.startOffset || b.endOffset - a.endOffset);
  for (const r of ranges) counts.fill(r.count > 0 ? 1 : 0, r.startOffset, Math.min(r.endOffset, e.source.length));
  const acc = browserChars.get(e.file) || new Uint8Array(e.source.length);
  for (let i = 0; i < counts.length; i++) if (counts[i] > 0) acc[i] = 1;
  browserChars.set(e.file, acc);
  const fns = browserFns.get(e.file) || new Map();
  for (const f of e.functions) {
    if (!f.functionName && f.ranges[0].startOffset === 0) continue; // le module lui-même
    const key = `${f.functionName || '(anonyme)'}@${f.ranges[0].startOffset}`;
    fns.set(key, (fns.get(key) || 0) + (f.ranges[0].count > 0 ? 1 : 0));
  }
  browserFns.set(e.file, fns);
}

const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`).sort();
const files = jsFiles.map((file) => {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const lines = executableLines(source);
  const fromNode = nodeLines.get(file) || new Set();
  const fromBrowser = browserChars.get(file);
  const uncovered = [];
  let covered = 0;
  for (const { line, firstChar } of lines) {
    const ok = fromNode.has(line) || (fromBrowser && fromBrowser[firstChar] === 1);
    if (ok) covered++; else uncovered.push(line);
  }
  // Fonctions : exécutées dans Node ou dans le navigateur.
  const nf = nodeFns.get(file);
  const bf = browserFns.get(file);
  const fnTotal = Math.max(nf ? nf.size : 0, bf ? bf.size : 0);
  const fnHit = Math.max(nf ? [...nf.values()].filter((c) => c > 0).length : 0, bf ? [...bf.values()].filter((c) => c > 0).length : 0);
  return {
    file, lines: lines.length, covered, pct: lines.length ? (covered / lines.length) * 100 : 100,
    functions: fnTotal, functionsHit: fnHit, uncovered,
  };
});

// ---------- Synthèse ----------
const sum = (k) => SUITES.reduce((a, s) => a + s[k], 0);
const total = sum('total'), passed = sum('passed'), failed = sum('failed'), skipped = sum('skipped');
const passRate = total - skipped > 0 ? (passed / (total - skipped)) * 100 : 0;
const linesTotal = files.reduce((a, f) => a + f.lines, 0);
const linesCovered = files.reduce((a, f) => a + f.covered, 0);
const coverage = linesTotal ? (linesCovered / linesTotal) * 100 : 0;
const fnTotal = files.reduce((a, f) => a + f.functions, 0);
const fnHit = files.reduce((a, f) => a + f.functionsHit, 0);
const okCoverage = coverage >= COVERAGE_MIN;
const okPass = passRate >= PASS_RATE_MIN;
const ok = okCoverage && okPass;

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
let commit = process.env.GITHUB_SHA || '';
try { commit = commit || execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); } catch { /* hors dépôt git */ }
const run = {
  date: new Date().toISOString(),
  version: pkg.version,
  commit: commit.slice(0, 7),
  runNumber: process.env.GITHUB_RUN_NUMBER || 'local',
  runUrl: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : '',
  node: process.version,
};
const pct = (x) => `${x.toFixed(1).replace('.', ',')} %`;
const summary = {
  ok, run, thresholds: { coverage: COVERAGE_MIN, passRate: PASS_RATE_MIN },
  tests: { total, passed, failed, skipped, passRate },
  coverage: { lines: linesTotal, covered: linesCovered, pct: coverage, functions: fnTotal, functionsHit: fnHit },
  suites: SUITES.map(({ id, label, total: t, passed: p, failed: f, skipped: k, durationMs, cases }) => ({ id, label, total: t, passed: p, failed: f, skipped: k, durationMs, cases })),
  files,
};
// ---------- Classement des tests par domaine (catalogue) ----------
const allCases = SUITES.flatMap((s) => s.cases.map((c) => {
  const cat = TESTS[c.name];
  return { ...c, suite: s.label, domaine: cat ? cat[0] : 'autre', explication: cat ? cat[1] : 'Explication à ajouter dans scripts/test-catalogue.mjs.' };
}));
const domaines = [...DOMAINES, { id: 'autre', nom: 'Tests non classés', but: 'Tests à ranger dans le catalogue (scripts/test-catalogue.mjs).' }]
  .map((d) => {
    const cases = allCases.filter((c) => c.domaine === d.id);
    return {
      ...d, cases, total: cases.length,
      passed: cases.filter((c) => c.status === 'réussi').length,
      failed: cases.filter((c) => c.status === 'échec').length,
    };
  })
  .filter((d) => d.total > 0);
const nonClasses = allCases.filter((c) => c.domaine === 'autre').length;

// Extraits du code non couvert, pour comprendre ce qui n'est pas testé.
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f.file), 'utf8').split('\n');
  f.role = FICHIERS[f.file] || '';
  f.extraits = groupRanges(f.uncovered).map(([a, b]) => ({
    lignes: a === b ? `${a}` : `${a}–${b}`,
    code: src[a - 1].trim().slice(0, 70) + (src[a - 1].trim().length > 70 ? '…' : ''),
  }));
}
function groupRanges(nums) {
  const out = [];
  for (let i = 0; i < nums.length; i++) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    out.push([nums[i], nums[j]]);
    i = j;
  }
  return out;
}

summary.domaines = domaines.map(({ id, nom, total: t, passed: p, failed: f }) => ({ id, nom, total: t, passed: p, failed: f }));
fs.writeFileSync(path.join(REPORTS, 'summary.json'), JSON.stringify(summary, null, 2));

// ---------- Textes communs aux deux rapports ----------
const totalDuration = SUITES.reduce((a, s) => a + s.durationMs, 0) / 1000;
const verdict = ok
  ? `Objectifs atteints : ${passed} tests sur ${total - skipped} réussis et ${pct(coverage)} du code exécuté par les tests.`
  : `Objectifs non atteints : ${[!okPass && `taux de réussite ${pct(passRate)} (objectif ${PASS_RATE_MIN} %)`, !okCoverage && `couverture ${pct(coverage)} (objectif ${COVERAGE_MIN} %)`].filter(Boolean).join(' et ')}.`;
const indicateurs = [
  ['Tests réussis', `${passed} / ${total - skipped} (${pct(passRate)})`, `≥ ${PASS_RATE_MIN} %`, okPass,
    'Part des vérifications automatiques qui donnent exactement le résultat attendu.'],
  ['Couverture du code', `${linesCovered} / ${linesTotal} lignes (${pct(coverage)})`, `≥ ${COVERAGE_MIN} %`, okCoverage,
    "Part des lignes de code du site exécutées au moins une fois pendant les tests. Plus elle est haute, moins il reste de code jamais vérifié."],
  ['Fonctions exécutées', `${fnHit} / ${fnTotal}${fnTotal ? ` (${pct((fnHit / fnTotal) * 100)})` : ''}`, '–', null,
    'Part des fonctions du code appelées au moins une fois (indication complémentaire).'],
  ['Tests en échec', `${failed}`, '0 idéalement', failed === 0 ? true : null,
    failed ? 'Voir le tableau « Tests en échec » ci-dessous.' : 'Aucun test ne donne un résultat inattendu.'],
  ['Durée', `${totalDuration.toFixed(1).replace('.', ',')} s`, '–', null,
    "Temps total d'exécution des tests (moteur, puis navigateur sur ordinateur et téléphone simulés)."],
];
const lecture = 'Ce rapport est produit automatiquement à chaque modification du site. '
  + 'Chaque test simule une situation réelle (un calcul, un clic, une saisie) et compare le résultat obtenu au résultat attendu. '
  + "Les tests du moteur vérifient les calculs et les jours fériés ; les tests de l'interface ouvrent le site dans un vrai navigateur, sur ordinateur et sur téléphone simulé.";
const statut = (b) => (b === true ? '✅' : b === false ? '❌' : 'ℹ️');
const etat = (d) => (d.failed ? '❌' : '✅');
const resultat = (c) => (c.status === 'réussi' ? '✅ réussi' : c.status === 'ignoré' ? '⏭️ ignoré' : '❌ échec');
const cell = (x) => String(x).replace(/\|/g, '\\|').replace(/\n/g, ' ');

// ---------- Rapport Markdown (résumé de l'exécution sur GitHub) ----------
const md = [
  `# ${ok ? '✅' : '❌'} Rapport de tests – exécution n° ${run.runNumber}`,
  '',
  `**${verdict}**`,
  '',
  `Version **${run.version}** · commit \`${run.commit}\` · ${run.date.replace('T', ' ').slice(0, 16)} UTC${run.runUrl ? ` · [voir l'exécution](${run.runUrl})` : ''}`,
  '',
  `> ${lecture}`,
  '',
  '## 1. Indicateurs clés',
  '',
  '| Indicateur | Résultat | Objectif | Statut | Ce que cela signifie |',
  '|---|---|---|:---:|---|',
  ...indicateurs.map(([a, b, c, d, e]) => `| ${a} | ${b} | ${c} | ${statut(d)} | ${e} |`),
  '',
  '## 2. Synthèse par domaine',
  '',
  '| Domaine | Ce qui est garanti | Tests | Réussis | Statut |',
  '|---|---|:---:|:---:|:---:|',
  ...domaines.map((d) => `| ${d.nom} | ${d.but} | ${d.total} | ${d.passed} | ${etat(d)} |`),
  '',
  ...(failed ? [
    '## Tests en échec',
    '',
    '| Domaine | Test | Ce qui est vérifié | Message |',
    '|---|---|---|---|',
    ...allCases.filter((c) => c.status === 'échec').map((c) => `| ${cell(domaines.find((d) => d.id === c.domaine).nom)} | ${cell(c.name)} | ${cell(c.explication)} | ${cell((c.message || '').split('\n')[0].slice(0, 160))} |`),
    '',
  ] : []),
  '## 3. Couverture du code par fichier',
  '',
  '| Fichier | Rôle | Lignes testées | Couverture | Statut |',
  '|---|---|:---:|:---:|:---:|',
  ...files.map((f) => `| \`${f.file}\` | ${f.role} | ${f.covered} / ${f.lines} | ${pct(f.pct)} | ${statut(f.pct >= COVERAGE_MIN)} |`),
  '',
  ...(files.some((f) => f.extraits.length) ? [
    'Lignes jamais exécutées pendant les tests :',
    '',
    '| Fichier | Lignes | Début du code concerné |',
    '|---|---|---|',
    ...files.flatMap((f) => f.extraits.map((x) => `| \`${f.file}\` | ${x.lignes} | \`${cell(x.code)}\` |`)),
    '',
  ] : ['Toutes les lignes de code sont exécutées par au moins un test.', '']),
  '## 4. Détail des tests',
  '',
  ...domaines.flatMap((d) => [
    `<details><summary><b>${etat(d)} ${d.nom}</b> – ${d.passed} / ${d.total} réussis</summary>`,
    '',
    '| Test | Ce qui est vérifié | Résultat | Durée |',
    '|---|---|:---:|---:|',
    ...d.cases.map((c) => `| ${cell(c.name)} | ${cell(c.explication)} | ${resultat(c)} | ${(c.time * 1000).toFixed(0)} ms |`),
    '',
    '</details>',
    '',
  ]),
  ...(nonClasses ? [`⚠️ ${nonClasses} test(s) ne sont pas encore expliqués dans \`scripts/test-catalogue.mjs\`.`, ''] : []),
].join('\n');
fs.writeFileSync(path.join(REPORTS, 'rapport.md'), md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);

// ---------- Rapport HTML (joint à chaque exécution) ----------
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const badge = (b) => (b === true ? '<span class="b ok">Atteint</span>' : b === false ? '<span class="b ko">Non atteint</span>' : '<span class="b in">Info</span>');
const gauge = (label, value, min) => `<div class="g ${value >= min ? 'ok' : 'ko'}"><span>${esc(label)}</span><strong>${pct(value)}</strong>
  <div class="bar"><i style="width:${Math.min(100, value).toFixed(1)}%"></i><b style="left:${min}%" title="Objectif ${min} %"></b></div><small>Objectif ≥ ${min} %</small></div>`;
const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rapport de tests – exécution ${esc(run.runNumber)}</title><style>
body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#f6f6f4;color:#1d1d1f}main{max-width:1000px;margin:0 auto;padding:1.5rem 1rem 3rem}
h1{font-size:1.4rem;margin:0 0 .4rem}h2{font-size:1.1rem;margin:2rem 0 .6rem}.meta{color:#5f6368;margin:.2rem 0 1rem;font-size:.9rem}
.verdict{font-size:1.05rem;font-weight:600;padding:.7rem 1rem;border-radius:10px;margin:.6rem 0;background:${ok ? '#e6f4ea;color:#14532d' : '#fdecea;color:#7f1d1d'}}
.lecture{background:#fff;border-left:4px solid #1f5fa8;padding:.6rem .9rem;color:#333;font-size:.92rem}
.gs{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.8rem;margin:1rem 0}.g{background:#fff;border:1px solid #e3e3df;border-radius:10px;padding:.8rem 1rem}
.g span{display:block;color:#5f6368;font-size:.85rem}.g strong{font-size:1.8rem}.g.ok strong{color:#1e7d38}.g.ko strong{color:#c62828}
.bar{position:relative;height:8px;background:#ecebe7;border-radius:4px;margin:.4rem 0}.bar i{display:block;height:100%;border-radius:4px;background:#1f5fa8}
.bar b{position:absolute;top:-3px;width:2px;height:14px;background:#1d1d1f}.g small{color:#5f6368}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e3e3df;font-size:.9rem;margin-bottom:.6rem}
th,td{padding:.45rem .6rem;border-bottom:1px solid #eee;text-align:left;vertical-align:top}th{background:#f1f1ef;font-weight:600}
td.c,th.c{text-align:center}td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.ko-row td{background:#fff5f5}
.b{display:inline-block;font-size:.78rem;font-weight:600;padding:.1rem .45rem;border-radius:5px;white-space:nowrap}.b.ok{background:#e6f4ea;color:#14532d}
.b.ko{background:#fdecea;color:#7f1d1d}.b.in{background:#eef2f7;color:#334}.mut{color:#5f6368;font-size:.85rem}code{font-size:.82rem;background:#f3f3f1;padding:0 .25rem;border-radius:3px}
details{background:#fff;border:1px solid #e3e3df;border-radius:8px;margin:.5rem 0;padding:.4rem .8rem}summary{cursor:pointer;font-weight:600}details table{border:0}
</style></head><body><main>
<h1>Rapport de tests – exécution n° ${esc(run.runNumber)}</h1>
<p class="meta">Version ${esc(run.version)} · commit ${esc(run.commit)} · ${esc(run.date.replace('T', ' ').slice(0, 16))} UTC · Node ${esc(run.node)}${run.runUrl ? ` · <a href="${esc(run.runUrl)}">voir sur GitHub</a>` : ''}</p>
<div class="verdict">${ok ? '✅' : '❌'} ${esc(verdict)}</div>
<p class="lecture">${esc(lecture)}</p>
<div class="gs">${gauge(`Tests réussis (${passed} / ${total - skipped})`, passRate, PASS_RATE_MIN)}${gauge(`Couverture du code (${linesCovered} / ${linesTotal} lignes)`, coverage, COVERAGE_MIN)}</div>

<h2>1. Indicateurs clés</h2>
<table><tr><th>Indicateur</th><th>Résultat</th><th>Objectif</th><th class="c">Statut</th><th>Ce que cela signifie</th></tr>
${indicateurs.map(([a, b, c, d, e]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td><td>${esc(c)}</td><td class="c">${badge(d)}</td><td class="mut">${esc(e)}</td></tr>`).join('')}</table>

<h2>2. Synthèse par domaine</h2>
<table><tr><th>Domaine</th><th>Ce qui est garanti</th><th class="c">Tests</th><th class="c">Réussis</th><th class="c">Statut</th></tr>
${domaines.map((d) => `<tr class="${d.failed ? 'ko-row' : ''}"><td><b>${esc(d.nom)}</b></td><td class="mut">${esc(d.but)}</td><td class="c">${d.total}</td><td class="c">${d.passed}</td><td class="c">${badge(!d.failed)}</td></tr>`).join('')}</table>

${failed ? `<h2>Tests en échec</h2><table><tr><th>Domaine</th><th>Test</th><th>Ce qui est vérifié</th><th>Message</th></tr>
${allCases.filter((c) => c.status === 'échec').map((c) => `<tr class="ko-row"><td>${esc(domaines.find((d) => d.id === c.domaine).nom)}</td><td>${esc(c.name)}</td><td class="mut">${esc(c.explication)}</td><td class="mut">${esc((c.message || '').slice(0, 300))}</td></tr>`).join('')}</table>` : ''}

<h2>3. Couverture du code par fichier</h2>
<table><tr><th>Fichier</th><th>Rôle</th><th class="c">Lignes testées</th><th class="c">Couverture</th><th class="c">Statut</th></tr>
${files.map((f) => `<tr><td><code>${esc(f.file)}</code></td><td class="mut">${esc(f.role)}</td><td class="c">${f.covered} / ${f.lines}</td><td class="c">${pct(f.pct)}</td><td class="c">${badge(f.pct >= COVERAGE_MIN)}</td></tr>`).join('')}</table>
${files.some((f) => f.extraits.length) ? `<p class="mut">Lignes jamais exécutées pendant les tests :</p><table><tr><th>Fichier</th><th>Lignes</th><th>Début du code concerné</th></tr>
${files.flatMap((f) => f.extraits.map((x) => `<tr><td><code>${esc(f.file)}</code></td><td>${esc(x.lignes)}</td><td><code>${esc(x.code)}</code></td></tr>`)).join('')}</table>` : '<p class="mut">Toutes les lignes de code sont exécutées par au moins un test.</p>'}

<h2>4. Détail des tests</h2>
${domaines.map((d) => `<details${d.failed ? ' open' : ''}><summary>${d.failed ? '❌' : '✅'} ${esc(d.nom)} – ${d.passed} / ${d.total} réussis</summary>
<table><tr><th>Test</th><th>Ce qui est vérifié</th><th class="c">Résultat</th><th class="n">Durée</th></tr>
${d.cases.map((c) => `<tr class="${c.status === 'échec' ? 'ko-row' : ''}"><td>${esc(c.name)}${c.message ? `<div class="mut">${esc(c.message.slice(0, 300))}</div>` : ''}</td><td class="mut">${esc(c.explication)}</td><td class="c">${esc(resultat(c))}</td><td class="n">${(c.time * 1000).toFixed(0)} ms</td></tr>`).join('')}</table></details>`).join('')}
${nonClasses ? `<p class="mut">⚠️ ${nonClasses} test(s) ne sont pas encore expliqués dans scripts/test-catalogue.mjs.</p>` : ''}
</main></body></html>`;
fs.writeFileSync(path.join(REPORTS, 'rapport.html'), html);

console.log(`\n${ok ? '✅' : '❌'} ${verdict}`);
console.log(`   Tests réussis : ${passed}/${total - skipped} (${pct(passRate)}, objectif ≥ ${PASS_RATE_MIN} %)`);
console.log(`   Couverture du code : ${linesCovered}/${linesTotal} lignes (${pct(coverage)}, objectif ≥ ${COVERAGE_MIN} %)`);
for (const d of domaines) console.log(`   ${d.failed ? '❌' : '✅'} ${d.nom.padEnd(44)} ${d.passed}/${d.total}`);
for (const f of files) console.log(`   ${f.file.padEnd(18)} ${pct(f.pct).padStart(8)}`);
if (nonClasses) console.log(`   ⚠️ ${nonClasses} test(s) à expliquer dans scripts/test-catalogue.mjs`);
console.log('Rapport : reports/rapport.html, reports/rapport.md');
process.exit(ok ? 0 : 1);
