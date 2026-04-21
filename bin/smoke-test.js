#!/usr/bin/env node
/**
 * Smoke test for the architect rendering pipeline.
 *
 * Creates a small fixture inside the plugin's .smoke-test/ directory,
 * invokes:
 *   - build-report-html.js
 *   - generate-docx.js
 *   - generate-pdf.js (only if puppeteer + Chrome are available)
 * and asserts each output exists, is non-trivially sized, and contains
 * expected markers (base64 image, docx media entry, PDF magic bytes).
 *
 * Exit codes:
 *   0  — all checks passed (PDF step may be skipped if puppeteer missing)
 *   1  — at least one check failed
 *
 * Usage:
 *   node bin/smoke-test.js [--skip-pdf] [--skip-docx]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const pluginRoot = path.resolve(__dirname, '..');
const testDir = path.join(pluginRoot, '.smoke-test');
const binDir = path.join(pluginRoot, 'bin');

const skipPdf = process.argv.includes('--skip-pdf');
const skipDocx = process.argv.includes('--skip-docx');

let failures = 0;
let skipped = 0;
const results = [];

function log(ok, name, detail) {
  const mark = ok === 'skip' ? '•' : ok ? '✓' : '✗';
  const line = `  ${mark} ${name}${detail ? ' — ' + detail : ''}`;
  results.push({ ok, name, detail });
  console.log(line);
  if (ok === false) failures++;
  if (ok === 'skip') skipped++;
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { cleanDir(full); fs.rmdirSync(full); }
    else fs.unlinkSync(full);
  }
}

function setupFixture() {
  if (fs.existsSync(testDir)) cleanDir(testDir);
  fs.mkdirSync(testDir, { recursive: true });
  fs.mkdirSync(path.join(testDir, 'diagrams'), { recursive: true });

  const md = [
    '# Proposal',
    '',
    'This is a **smoke test** with _italic_ and `code` and a [link](https://example.com).',
    '',
    '<div class="exec-summary">',
    '  <div class="exec-summary-header">',
    '    <h2>Executive Summary</h2>',
    '    <span class="exec-summary-tag">Page 2 · 90-second read</span>',
    '  </div>',
    '  <div class="exec-summary-grid">',
    '    <div class="exec-summary-block">',
    '      <span class="exec-summary-label">Problem</span>',
    '      <p>Manual quote processing takes 4 hours per request.</p>',
    '    </div>',
    '    <div class="exec-summary-block">',
    '      <span class="exec-summary-label">Solution</span>',
    '      <p>AI-assisted automation with human-in-the-loop approval.</p>',
    '    </div>',
    '  </div>',
    '  <div class="exec-summary-metrics">',
    '    <div class="exec-metric"><span class="exec-metric-value">12 weeks</span><span class="exec-metric-label">Timeline</span></div>',
    '    <div class="exec-metric"><span class="exec-metric-value">€85k</span><span class="exec-metric-label">Investment</span></div>',
    '    <div class="exec-metric"><span class="exec-metric-value">4 people</span><span class="exec-metric-label">Team</span></div>',
    '    <div class="exec-metric"><span class="exec-metric-value">5</span><span class="exec-metric-label">Milestones</span></div>',
    '  </div>',
    '  <div class="exec-summary-kpis">',
    '    <span class="exec-summary-label">Success criteria</span>',
    '    <ul>',
    '      <li>Cut quote time by 70% by Sprint 3.</li>',
    '      <li>Zero manual entry in standard flows.</li>',
    '      <li>Onboarding under 1 day.</li>',
    '    </ul>',
    '  </div>',
    '  <div class="exec-summary-why">',
    '    <span class="exec-summary-label">Why this, why now</span>',
    '    <p>Quotes lost to slow response rose 22% this quarter.</p>',
    '  </div>',
    '</div>',
    '',
    '## Objectives',
    '',
    '1. Validate ordered lists',
    '2. Validate **bold** and *italic*',
    '   - Nested item one',
    '   - Nested item two with `code`',
    '3. Third objective',
    '',
    '## Table with MoSCoW',
    '',
    '| Item | Status | Priority |',
    '|------|--------|----------|',
    '| Auth | OK | [MUST] |',
    '| API | WIP | [SHOULD] |',
    '| Dashboard | TODO | [COULD] |',
    '',
    '## Diagrams',
    '',
    '```mermaid',
    'graph TD',
    '  A[Client] --> B[API]',
    '  B --> C[DB]',
    '```',
    '',
    '```mermaid',
    'gantt',
    '  title Timeline',
    '  Dev :a1, 2026-04-01, 30d',
    '```',
    '',
    '<div class="risk-register">',
    '  <div class="risk-register-header">',
    '    <h2>Risk Register</h2>',
    '    <span class="risk-register-tag">3 risks identified</span>',
    '  </div>',
    '  <div class="risk-matrix-wrapper">',
    '    <div class="risk-matrix-ylabel">Impact</div>',
    '    <div class="risk-matrix">',
    '      <div class="risk-cell sev-med"></div><div class="risk-cell sev-high"></div><div class="risk-cell sev-high"><span class="risk-marker">R1</span></div><div class="risk-cell sev-crit"></div><div class="risk-cell sev-crit"></div>',
    '      <div class="risk-cell sev-low"></div><div class="risk-cell sev-med"></div><div class="risk-cell sev-high"></div><div class="risk-cell sev-high"></div><div class="risk-cell sev-crit"></div>',
    '      <div class="risk-cell sev-low"></div><div class="risk-cell sev-med"><span class="risk-marker">R2</span></div><div class="risk-cell sev-med"></div><div class="risk-cell sev-high"></div><div class="risk-cell sev-high"></div>',
    '      <div class="risk-cell sev-low"></div><div class="risk-cell sev-low"></div><div class="risk-cell sev-med"></div><div class="risk-cell sev-med"></div><div class="risk-cell sev-high"></div>',
    '      <div class="risk-cell sev-low"><span class="risk-marker">R3</span></div><div class="risk-cell sev-low"></div><div class="risk-cell sev-low"></div><div class="risk-cell sev-med"></div><div class="risk-cell sev-med"></div>',
    '    </div>',
    '    <div class="risk-matrix-xlabel">Probability</div>',
    '  </div>',
    '  <table class="risk-table">',
    '    <thead><tr><th>ID</th><th>Risk</th><th>Prob</th><th>Impact</th><th>Severity</th><th>Mitigation</th><th>Owner</th></tr></thead>',
    '    <tbody>',
    '      <tr><td><strong>R1</strong></td><td>Third-party API returns inconsistent IDs.</td><td>3</td><td>5</td><td><span class="sev-badge sev-high">High</span></td><td>Wrap API in adapter with idempotency keys.</td><td>Tech Lead</td></tr>',
    '      <tr><td><strong>R2</strong></td><td>Unclear data migration window.</td><td>2</td><td>3</td><td><span class="sev-badge sev-med">Medium</span></td><td>Canary at 5% for 48h before cutover.</td><td>PM</td></tr>',
    '      <tr><td><strong>R3</strong></td><td>Minor styling drift across browsers.</td><td>1</td><td>1</td><td><span class="sev-badge sev-low">Low</span></td><td>Cross-browser Playwright suite.</td><td>Frontend</td></tr>',
    '    </tbody>',
    '  </table>',
    '</div>',
    '',
    '## Checklist',
    '',
    '- [x] Done',
    '- [ ] Pending',
    '',
    '> Blockquote line.',
    ''
  ].join('\n');

  const context = {
    project: {
      name: 'SmokeTest',
      description: 'Fixture project used by the architect smoke test.',
      domain: 'Internal',
      scale: 'small',
      initials: 'ST'
    },
    metadata: { generated_at: new Date().toISOString().split('T')[0] },
    output_config: { language: 'en' }
  };

  // Minimal valid 1x1 PNG (transparent pixel)
  const pngHex = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63000100000005000101ff00000000049144180000000049454e44ae426082';
  const pngBuf = Buffer.from(pngHex, 'hex');

  fs.writeFileSync(path.join(testDir, 'sample.md'), md);
  fs.writeFileSync(path.join(testDir, 'fa-context.json'), JSON.stringify(context, null, 2));
  fs.writeFileSync(path.join(testDir, 'diagrams', 'architecture-overview.png'), pngBuf);
  fs.writeFileSync(path.join(testDir, 'diagrams', 'proposal-timeline.png'), pngBuf);
}

function runNode(scriptName, args, env) {
  const script = path.join(binDir, scriptName);
  const res = spawnSync(process.execPath, [script, ...args], {
    cwd: testDir,
    env: Object.assign({}, process.env, env || {}),
    encoding: 'utf8'
  });
  return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function hasLocalDep(name) {
  return fs.existsSync(path.join(pluginRoot, 'node_modules', name)) ||
         fs.existsSync(path.join(testDir, 'node_modules', name));
}

function detectChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  return candidates.find(p => p && fs.existsSync(p)) || null;
}

// --- Run -------------------------------------------------------------------

console.log('architect smoke test\n');
setupFixture();

// 1. build-report-html.js
(() => {
  const out = path.join(testDir, 'out.html');
  const r = runNode('build-report-html.js', ['sample.md', 'out.html', 'fa-context.json', 'diagrams']);
  if (r.status !== 0) {
    log(false, 'build-report-html.js', (r.stderr || r.stdout).trim().split('\n').pop());
    return;
  }
  if (!fs.existsSync(out)) {
    log(false, 'build-report-html.js', 'output missing');
    return;
  }
  const html = fs.readFileSync(out, 'utf8');
  const checks = [
    [html.length > 5000, 'output ≥ 5 KB'],
    [html.includes('SmokeTest'), 'project name injected'],
    [html.includes('data:image/png;base64,'), 'diagrams embedded as base64'],
    [html.includes('badge-must'), 'MoSCoW badge rendered'],
    [html.includes('<strong>'), 'bold inline'],
    [html.includes('<em>'), 'italic inline'],
    [html.includes('<code>'), 'inline code'],
    [/<ol>[\s\S]*<ul>/.test(html), 'nested list'],
    [html.includes('<table>'), 'table rendered'],
    [html.includes('class="diagram-container"'), 'diagram container present'],
    [html.includes('class="exec-summary"'), 'exec-summary HTML block preserved'],
    [html.includes('exec-metric-value'), 'exec-summary metrics preserved'],
    [html.includes('class="risk-register"'), 'risk-register HTML block preserved'],
    [html.includes('risk-marker'), 'risk-register markers rendered'],
    [html.includes('sev-crit'), 'risk-register severity classes present']
  ];
  const failed = checks.filter(c => !c[0]).map(c => c[1]);
  if (failed.length === 0) log(true, 'build-report-html.js', `${html.length} bytes, all checks passed`);
  else log(false, 'build-report-html.js', 'missing: ' + failed.join(', '));
})();

// 2. generate-docx.js
(() => {
  if (skipDocx) { log('skip', 'generate-docx.js', '--skip-docx'); return; }
  if (!hasLocalDep('docx')) {
    log('skip', 'generate-docx.js', 'docx not installed (run: npm install inside plugin)');
    return;
  }
  const out = path.join(testDir, 'out.docx');
  const r = runNode('generate-docx.js', ['sample.md', 'out.docx', 'fa-context.json', 'diagrams'], {
    NODE_PATH: path.join(pluginRoot, 'node_modules')
  });
  if (r.status !== 0) {
    log(false, 'generate-docx.js', (r.stderr || r.stdout).trim().split('\n').pop());
    return;
  }
  if (!fs.existsSync(out)) {
    log(false, 'generate-docx.js', 'output missing');
    return;
  }
  const buf = fs.readFileSync(out);
  // DOCX is a ZIP — starts with "PK"
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b;
  const hasMedia = buf.includes(Buffer.from('word/media/'));
  const checks = [
    [buf.length > 5000, 'output ≥ 5 KB'],
    [isZip, 'valid zip (docx) header'],
    [hasMedia, 'diagram images embedded']
  ];
  const failed = checks.filter(c => !c[0]).map(c => c[1]);
  if (failed.length === 0) log(true, 'generate-docx.js', `${buf.length} bytes, all checks passed`);
  else log(false, 'generate-docx.js', 'missing: ' + failed.join(', '));
})();

// 3. generate-pdf.js
(() => {
  if (skipPdf) { log('skip', 'generate-pdf.js', '--skip-pdf'); return; }
  if (!hasLocalDep('puppeteer')) {
    log('skip', 'generate-pdf.js', 'puppeteer not installed');
    return;
  }
  const chrome = detectChromePath();
  if (!chrome) {
    log('skip', 'generate-pdf.js', 'Chrome not found on system');
    return;
  }
  // build-report-html already produced out.html
  const htmlIn = path.join(testDir, 'out.html');
  if (!fs.existsSync(htmlIn)) {
    log(false, 'generate-pdf.js', 'missing out.html (build-report-html step failed earlier)');
    return;
  }
  const out = path.join(testDir, 'out.pdf');
  const r = runNode('generate-pdf.js', ['out.html', 'out.pdf', 'SmokeTest'], {
    PUPPETEER_EXECUTABLE_PATH: chrome,
    NODE_PATH: path.join(pluginRoot, 'node_modules')
  });
  if (r.status !== 0) {
    log(false, 'generate-pdf.js', (r.stderr || r.stdout).trim().split('\n').pop());
    return;
  }
  if (!fs.existsSync(out)) {
    log(false, 'generate-pdf.js', 'output missing');
    return;
  }
  const buf = fs.readFileSync(out);
  const isPdf = buf.slice(0, 4).toString() === '%PDF';
  const checks = [
    [buf.length > 5000, 'output ≥ 5 KB'],
    [isPdf, 'valid PDF magic bytes']
  ];
  const failed = checks.filter(c => !c[0]).map(c => c[1]);
  if (failed.length === 0) log(true, 'generate-pdf.js', `${buf.length} bytes, all checks passed`);
  else log(false, 'generate-pdf.js', 'missing: ' + failed.join(', '));
})();

// 4. validate.js — runs against a minimal faux-output tree we set up inline
(() => {
  // Build a tiny docs/architect-like tree inside the smoke test dir
  const valRoot = path.join(testDir, 'val-docs', 'architect');
  const prop = path.join(valRoot, 'deliverables', 'proposal');
  const stor = path.join(valRoot, 'deliverables', 'stories');
  const todo = path.join(valRoot, 'deliverables', 'todo');
  const diag = path.join(valRoot, 'diagrams');
  const proto = path.join(valRoot, 'prototype');
  [prop, stor, todo, diag, path.join(proto, 'pages')].forEach(d => fs.mkdirSync(d, { recursive: true }));

  fs.writeFileSync(path.join(valRoot, 'fa-context.json'), JSON.stringify({
    project: { name: 'VD', description: 'Validate fixture', domain: 'x', scale: 's' },
    requirements: { functional: [{ id: 'FR-001', title: 'A' }] },
    output_config: { language: 'en' }
  }));
  fs.writeFileSync(path.join(prop, 'proposal.md'),
    '# Proposal\n```mermaid\ngraph TD\nA-->B\n```\n**MODULE 1: Auth**\n');
  fs.writeFileSync(path.join(stor, 'stories.md'),
    '# Stories\n## Epic E1: Auth\n- covers FR-001 [MUST]\n');
  fs.writeFileSync(path.join(todo, 'todo.md'), '# Todo\nAuth stuff.\n');
  // Render a fake PNG so diagram check passes
  const pngBuf = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63000100000005000101ff00000000049144180000000049454e44ae426082', 'hex');
  fs.writeFileSync(path.join(diag, 'architecture-overview.png'), pngBuf);
  // Prototype with only working links
  fs.writeFileSync(path.join(proto, 'index.html'), '<html><body><a href="pages/ok.html">ok</a></body></html>');
  fs.writeFileSync(path.join(proto, 'pages', 'ok.html'), '<html><body>ok</body></html>');

  const r = runNode('validate.js', [valRoot]);
  if (r.status !== 0) {
    log(false, 'validate.js', 'exit ' + r.status + ' — ' + (r.stdout.split('\n').pop() || r.stderr.split('\n').pop()));
    return;
  }
  const out = r.stdout || '';
  const checks = [
    [/project identified/.test(out), 'context check'],
    [/mermaid fence/.test(out), 'diagram count check'],
    [/epic\(s\) declared/.test(out), 'epic declaration check'],
    [/MoSCoW badge/.test(out), 'MoSCoW badge check'],
    [/all internal links resolve/.test(out), 'prototype link check'],
    [/0 failures/.test(out), 'no failures on a clean fixture']
  ];
  const failed = checks.filter(c => !c[0]).map(c => c[1]);
  if (failed.length === 0) log(true, 'validate.js', 'exit 0, clean fixture passes');
  else log(false, 'validate.js', 'missing: ' + failed.join(', '));
})();

console.log('');
console.log(`Summary: ${results.filter(r => r.ok === true).length} passed, ${failures} failed, ${skipped} skipped`);

if (!process.argv.includes('--keep')) {
  cleanDir(testDir);
  fs.rmdirSync(testDir);
}

process.exit(failures > 0 ? 1 : 0);
