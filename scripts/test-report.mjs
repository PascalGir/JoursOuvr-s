#!/usr/bin/env node
// Rapport de tests automatisé (QUA-01 / QUA-02).
// Lance les tests du moteur (avec couverture Node) puis ceux de l'interface (couverture mesurée dans Chromium),
// fusionne la couverture par fichier de js/, puis écrit reports/rapport.md, reports/rapport.html et reports/summary.json.
// Échoue (code 1) si la couverture des lignes ou le taux de tests réussis est sous l'objectif (90 % par défaut).
import { spawnSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
fs.writeFileSync(path.join(REPORTS, 'summary.json'), JSON.stringify(summary, null, 2));

// ---------- Rapport Markdown (résumé de l'exécution GitHub) ----------
const icon = (b) => (b ? '✅' : '❌');
const ranges = (nums) => {
  const out = [];
  for (let i = 0; i < nums.length; i++) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    out.push(i === j ? `${nums[i]}` : `${nums[i]}–${nums[j]}`);
    i = j;
  }
  return out.join(', ');
};
const md = [
  `# ${icon(ok)} Rapport de tests – exécution n° ${run.runNumber}`,
  '',
  `Version **${run.version}** · commit \`${run.commit}\` · ${run.date.replace('T', ' ').slice(0, 16)} UTC · Node ${run.node}${run.runUrl ? ` · [voir l'exécution](${run.runUrl})` : ''}`,
  '',
  '| Indicateur | Résultat | Objectif | Statut |',
  '|---|---|---|---|',
  `| Tests réussis | ${passed} / ${total - skipped} (${pct(passRate)}) | ≥ ${PASS_RATE_MIN} % | ${icon(okPass)} |`,
  `| Couverture des lignes | ${linesCovered} / ${linesTotal} (${pct(coverage)}) | ≥ ${COVERAGE_MIN} % | ${icon(okCoverage)} |`,
  `| Fonctions exécutées | ${fnHit} / ${fnTotal}${fnTotal ? ` (${pct((fnHit / fnTotal) * 100)})` : ''} | – | ℹ️ |`,
  '',
  '## Suites de tests',
  '',
  '| Suite | Réussis | Échecs | Ignorés | Durée |',
  '|---|---|---|---|---|',
  ...SUITES.map((s) => `| ${s.label} | ${s.passed} / ${s.total} | ${s.failed} | ${s.skipped} | ${(s.durationMs / 1000).toFixed(1)} s |`),
  '',
  '## Couverture par fichier',
  '',
  '| Fichier | Lignes couvertes | Couverture | Lignes non couvertes |',
  '|---|---|---|---|',
  ...files.map((f) => `| \`${f.file}\` | ${f.covered} / ${f.lines} | ${pct(f.pct)} | ${f.uncovered.length ? ranges(f.uncovered) : '–'} |`),
  '',
  ...(failed ? ['## Tests en échec', '', ...SUITES.flatMap((s) => s.cases.filter((c) => c.status === 'échec').map((c) => `- **${s.label}** – ${c.name}${c.message ? ` : ${c.message.split('\n')[0]}` : ''}`)), ''] : []),
  '<details><summary>Détail de tous les tests</summary>',
  '',
  ...SUITES.flatMap((s) => [`**${s.label}**`, '', ...s.cases.map((c) => `- ${c.status === 'réussi' ? '✅' : c.status === 'ignoré' ? '⏭️' : '❌'} ${c.name} (${(c.time * 1000).toFixed(0)} ms)`), '']),
  '</details>',
  '',
].join('\n');
fs.writeFileSync(path.join(REPORTS, 'rapport.md'), md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);

// ---------- Rapport HTML (à télécharger avec l'exécution) ----------
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const gauge = (label, value, min) => `<div class="g ${value >= min ? 'ok' : 'ko'}"><span>${esc(label)}</span><strong>${pct(value)}</strong>
  <div class="bar"><i style="width:${Math.min(100, value).toFixed(1)}%"></i><b style="left:${min}%"></b></div><small>Objectif ≥ ${min} %</small></div>`;
const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rapport de tests – exécution ${esc(run.runNumber)}</title><style>
body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#f6f6f4;color:#1d1d1f}main{max-width:980px;margin:0 auto;padding:1.5rem 1rem}
h1{font-size:1.4rem;margin:0 0 .3rem}h2{font-size:1.05rem;margin:1.6rem 0 .6rem}.meta{color:#5f6368;margin:0 0 1rem}
.status{display:inline-block;padding:.15rem .6rem;border-radius:6px;font-weight:600;color:#fff;background:${ok ? '#1e7d38' : '#c62828'}}
.gs{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.8rem}.g{background:#fff;border:1px solid #e3e3df;border-radius:10px;padding:.8rem 1rem}
.g span{display:block;color:#5f6368;font-size:.85rem}.g strong{font-size:1.8rem}.g.ok strong{color:#1e7d38}.g.ko strong{color:#c62828}
.bar{position:relative;height:8px;background:#ecebe7;border-radius:4px;margin:.4rem 0}.bar i{display:block;height:100%;border-radius:4px;background:#1f5fa8}
.bar b{position:absolute;top:-3px;width:2px;height:14px;background:#1d1d1f}.g small{color:#5f6368}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e3e3df;border-radius:10px;overflow:hidden;font-size:.9rem}
th,td{padding:.4rem .6rem;border-bottom:1px solid #eee;text-align:left}th{background:#f1f1ef}td.n{text-align:right;font-variant-numeric:tabular-nums}
.ko-row td{color:#c62828}.u{color:#5f6368;font-size:.8rem}</style></head><body><main>
<h1>Rapport de tests <span class="status">${ok ? 'Objectifs atteints' : 'Objectifs non atteints'}</span></h1>
<p class="meta">Exécution n° ${esc(run.runNumber)} · version ${esc(run.version)} · commit ${esc(run.commit)} · ${esc(run.date.replace('T', ' ').slice(0, 16))} UTC · Node ${esc(run.node)}${run.runUrl ? ` · <a href="${esc(run.runUrl)}">voir sur GitHub</a>` : ''}</p>
<div class="gs">${gauge(`Tests réussis (${passed} / ${total - skipped})`, passRate, PASS_RATE_MIN)}${gauge(`Couverture des lignes (${linesCovered} / ${linesTotal})`, coverage, COVERAGE_MIN)}</div>
<h2>Couverture par fichier</h2><table><tr><th>Fichier</th><th>Lignes</th><th>Couverture</th><th>Fonctions</th><th>Lignes non couvertes</th></tr>
${files.map((f) => `<tr><td>${esc(f.file)}</td><td class="n">${f.covered} / ${f.lines}</td><td class="n">${pct(f.pct)}</td><td class="n">${f.functionsHit} / ${f.functions}</td><td class="u">${esc(ranges(f.uncovered) || '–')}</td></tr>`).join('')}</table>
${SUITES.map((s) => `<h2>${esc(s.label)} – ${s.passed} / ${s.total} réussis (${(s.durationMs / 1000).toFixed(1)} s)</h2><table><tr><th>Test</th><th>Résultat</th><th>Durée</th></tr>
${s.cases.map((c) => `<tr class="${c.status === 'échec' ? 'ko-row' : ''}"><td>${esc(c.name)}${c.message ? `<div class="u">${esc(c.message)}</div>` : ''}</td><td>${c.status}</td><td class="n">${(c.time * 1000).toFixed(0)} ms</td></tr>`).join('')}</table>`).join('')}
</main></body></html>`;
fs.writeFileSync(path.join(REPORTS, 'rapport.html'), html);

console.log(`\n${ok ? '✅' : '❌'} Tests réussis : ${passed}/${total - skipped} (${pct(passRate)}, objectif ≥ ${PASS_RATE_MIN} %)`);
console.log(`${okCoverage ? '✅' : '❌'} Couverture des lignes : ${linesCovered}/${linesTotal} (${pct(coverage)}, objectif ≥ ${COVERAGE_MIN} %)`);
for (const f of files) console.log(`   ${f.file.padEnd(18)} ${pct(f.pct).padStart(8)}  ${f.uncovered.length ? `non couvertes : ${ranges(f.uncovered)}` : ''}`);
console.log(`Rapport : reports/rapport.html, reports/rapport.md`);
process.exit(ok ? 0 : 1);
