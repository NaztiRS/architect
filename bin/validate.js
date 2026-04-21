#!/usr/bin/env node
/**
 * Static validator for an architect project output.
 *
 * Reads docs/architect/ (or the path passed as first argument) and checks
 * that the deliverables form a coherent, internally consistent set:
 *
 *   - fa-context.json exists and has required fields
 *   - Each expected deliverable exists in all three formats (md / docx / pdf)
 *   - Diagrams referenced in proposal.md are rendered under diagrams/
 *   - User stories reference epics that exist
 *   - MoSCoW badges use recognised values
 *   - Prototype internal links resolve to existing HTML files
 *   - Prototype <img> local paths resolve to existing files
 *   - Schema artifacts, if present, are consistent (SVG/PNG for every .mmd)
 *
 * Output: a human-readable report with ✓ / ⚠ / ✗ per check, grouped by area.
 * Exit code: 0 if all errors clear (warnings allowed), 1 if any ✗.
 *
 * Usage:
 *   node bin/validate.js [docs-dir] [--json] [--strict]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const strict = args.includes('--strict'); // warnings fail
const docsDir = path.resolve(
  args.find(a => !a.startsWith('--')) || 'docs/architect'
);

const results = [];
function record(level, area, message, detail) {
  results.push({ level: level, area: area, message: message, detail: detail || null });
}
const ok = (a, m, d) => record('ok', a, m, d);
const warn = (a, m, d) => record('warn', a, m, d);
const fail = (a, m, d) => record('fail', a, m, d);

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; }
}
function readJsonSafe(p) {
  const c = readFileSafe(p);
  if (c == null) return null;
  try { return JSON.parse(c); } catch (e) { return null; }
}
function existsFile(p) {
  try { return fs.statSync(p).isFile(); } catch (e) { return false; }
}
function existsDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch (e) { return false; }
}

// ---------------------------------------------------------------------------
// Pre-flight: docs-dir exists
// ---------------------------------------------------------------------------

if (!existsDir(docsDir)) {
  fail('paths', 'docs directory not found', docsDir);
  emitReport();
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. fa-context.json
// ---------------------------------------------------------------------------

const contextPath = path.join(docsDir, 'fa-context.json');
let ctx = readJsonSafe(contextPath);
let contextLang = 'en';

if (!existsFile(contextPath)) {
  // fa-context.json is deleted at the end of /architect:deliver; that's fine.
  warn('context', 'fa-context.json not present (normal after /architect:deliver finishes)', contextPath);
} else if (!ctx) {
  fail('context', 'fa-context.json is not valid JSON', contextPath);
} else {
  const requiredTop = ['project'];
  const requiredProject = ['name', 'description'];
  for (const k of requiredTop) {
    if (!(k in ctx)) fail('context', 'missing top-level field', k);
  }
  if (ctx.project) {
    for (const k of requiredProject) {
      if (!ctx.project[k]) fail('context', 'project.' + k + ' missing or empty');
    }
    if (ctx.project.name) ok('context', 'project identified', ctx.project.name);
  }
  if (ctx.output_config && ctx.output_config.language) contextLang = ctx.output_config.language;
}

// ---------------------------------------------------------------------------
// 2. Deliverables exist in all 3 formats
// ---------------------------------------------------------------------------

const deliverablesDir = path.join(docsDir, 'deliverables');
const EXPECTED = [
  { key: 'proposal', label: 'Technical proposal' },
  { key: 'stories', label: 'User stories' },
  { key: 'todo', label: 'Work plan' }
];

if (!existsDir(deliverablesDir)) {
  fail('deliverables', 'deliverables/ directory missing', deliverablesDir);
} else {
  EXPECTED.forEach(function (d) {
    const folder = path.join(deliverablesDir, d.key);
    if (!existsDir(folder)) {
      fail('deliverables', d.label + ' folder missing', folder);
      return;
    }
    ['md', 'docx', 'pdf'].forEach(function (ext) {
      const f = path.join(folder, d.key + '.' + ext);
      if (existsFile(f)) ok('deliverables', d.label + ' ' + ext.toUpperCase(), path.relative(docsDir, f));
      else {
        if (ext === 'md') fail('deliverables', d.label + ' markdown missing', path.relative(docsDir, f));
        else warn('deliverables', d.label + ' ' + ext.toUpperCase() + ' missing (run /architect:render)', path.relative(docsDir, f));
      }
    });
  });
}

// ---------------------------------------------------------------------------
// 3. Diagrams referenced in proposal are rendered
// ---------------------------------------------------------------------------

const proposalMd = readFileSafe(path.join(deliverablesDir, 'proposal', 'proposal.md'));
const diagramsDir = path.join(docsDir, 'diagrams');
if (proposalMd) {
  const fences = (proposalMd.match(/```mermaid/g) || []).length;
  if (fences === 0) {
    warn('diagrams', 'proposal.md declares no Mermaid diagrams');
  } else {
    if (!existsDir(diagramsDir)) {
      fail('diagrams', 'diagrams/ directory missing but proposal has ' + fences + ' Mermaid fence(s)');
    } else {
      const pngs = fs.readdirSync(diagramsDir).filter(f => /\.png$/i.test(f)).length;
      const svgs = fs.readdirSync(diagramsDir).filter(f => /\.svg$/i.test(f)).length;
      if (pngs < fences) fail('diagrams', 'only ' + pngs + ' PNG(s) for ' + fences + ' Mermaid fence(s) — run /architect:diagrams');
      else ok('diagrams', fences + ' mermaid fence(s) ↔ ' + pngs + ' PNG(s) ↔ ' + svgs + ' SVG(s)');
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Stories: epic references + MoSCoW badges
// ---------------------------------------------------------------------------

const storiesMd = readFileSafe(path.join(deliverablesDir, 'stories', 'stories.md'));
if (storiesMd) {
  // Collect epic IDs. Convention: headings like "## Epic E1: Authentication" or "### E-01 — Auth"
  const epicIds = new Set();
  const epicHeadingRe = /^#{2,3}\s+(?:epic\s+)?([A-Z]{1,3}[-_]?\d+|\bE\d+\b)/gim;
  let em;
  while ((em = epicHeadingRe.exec(storiesMd)) !== null) {
    epicIds.add(em[1].toUpperCase().replace(/[-_]/g, ''));
  }

  // Collect story references to epics
  const storyRefs = [];
  const storyRefRe = /epic[:\s-]+([A-Z]{1,3}[-_]?\d+|\bE\d+\b)/gi;
  let sm;
  while ((sm = storyRefRe.exec(storiesMd)) !== null) {
    storyRefs.push(sm[1].toUpperCase().replace(/[-_]/g, ''));
  }

  if (epicIds.size > 0) {
    ok('stories', epicIds.size + ' epic(s) declared');
    const orphans = storyRefs.filter(r => !epicIds.has(r));
    if (orphans.length > 0) {
      const unique = Array.from(new Set(orphans));
      fail('stories', 'stories reference unknown epic(s): ' + unique.join(', '));
    }
  } else {
    warn('stories', 'no epics detected (convention: "## Epic E1: Name" or "## E-01 Name")');
  }

  // MoSCoW badges
  const validMoscow = /\[(MUST|SHOULD|COULD|WON'?T)\]/g;
  const invalidMoscow = /\[(HIGH|LOW|MEDIUM|CRITICAL|NICE[-\s]?TO[-\s]?HAVE)\]/gi;
  const bad = storiesMd.match(invalidMoscow) || [];
  if (bad.length > 0) warn('stories', 'non-MoSCoW priority tags detected: ' + Array.from(new Set(bad)).join(', '));

  const moscowCount = (storiesMd.match(validMoscow) || []).length;
  if (moscowCount === 0) warn('stories', 'no MoSCoW priority badges found (expected [MUST]/[SHOULD]/[COULD]/[WON\'T])');
  else ok('stories', moscowCount + ' MoSCoW badge(s) used');

  // Traceability: every FR-xxx / REQ-xxx from context referenced somewhere in stories
  if (ctx && ctx.requirements && Array.isArray(ctx.requirements.functional)) {
    const ids = ctx.requirements.functional.map(r => r.id).filter(Boolean);
    const missing = ids.filter(id => !storiesMd.includes(id));
    if (missing.length > 0) {
      warn('stories', 'functional requirement(s) without traceability in stories.md: ' + missing.slice(0, 8).join(', ') + (missing.length > 8 ? ', +' + (missing.length - 8) + ' more' : ''));
    } else if (ids.length > 0) {
      ok('stories', ids.length + ' functional requirement(s) all traced');
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Todo: modules from proposal represented in work plan
// ---------------------------------------------------------------------------

const todoMd = readFileSafe(path.join(deliverablesDir, 'todo', 'todo.md'));
if (todoMd && proposalMd) {
  // Extract module titles from proposal: "**MODULE N: Name**" or "### Module N — Name"
  const moduleRe = /\*\*MODULE\s+\d+\s*[:—-]\s*([^*\n]+?)\*\*|###\s+Module\s+\d+\s*[:—-]\s*(.+)/gi;
  const modules = new Set();
  let mm;
  while ((mm = moduleRe.exec(proposalMd)) !== null) {
    modules.add((mm[1] || mm[2] || '').trim().toLowerCase());
  }
  if (modules.size > 0) {
    const todoLower = todoMd.toLowerCase();
    const orphans = Array.from(modules).filter(m => m && !todoLower.includes(m.split(/\s+/).slice(0, 3).join(' ')));
    if (orphans.length > 0) {
      warn('todo', orphans.length + ' proposal module(s) not found in todo.md: ' + orphans.slice(0, 3).join('; '));
    } else {
      ok('todo', modules.size + ' proposal module(s) represented in work plan');
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Prototype: internal links and local images resolve
// ---------------------------------------------------------------------------

const protoDir = path.join(docsDir, 'prototype');
const protoIndex = path.join(protoDir, 'index.html');
if (existsDir(protoDir) && existsFile(protoIndex)) {
  const htmlFiles = walkHtml(protoDir);
  const pageSet = new Set(htmlFiles.map(f => path.resolve(f).toLowerCase()));
  const brokenLinks = [];
  const brokenImages = [];
  htmlFiles.forEach(function (file) {
    const html = readFileSafe(file);
    if (!html) return;
    const hrefRe = /href\s*=\s*"([^"#?]+)(?:[?#][^"]*)?"/gi;
    let hm;
    while ((hm = hrefRe.exec(html)) !== null) {
      const target = hm[1];
      if (/^(https?:)?\/\//i.test(target) || target.startsWith('data:') || target.startsWith('mailto:') || target.startsWith('#')) continue;
      if (target.endsWith('.html') || target.endsWith('/')) {
        const resolved = path.resolve(path.dirname(file), target.endsWith('/') ? target + 'index.html' : target);
        if (!pageSet.has(resolved.toLowerCase()) && !existsFile(resolved)) {
          brokenLinks.push({ from: path.relative(docsDir, file), to: target });
        }
      }
    }
    const imgRe = /<img[^>]+src\s*=\s*"([^"]+)"/gi;
    let im;
    while ((im = imgRe.exec(html)) !== null) {
      const src = im[1];
      if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) continue;
      const resolved = path.resolve(path.dirname(file), src);
      if (!existsFile(resolved)) brokenImages.push({ from: path.relative(docsDir, file), to: src });
    }
  });
  if (brokenLinks.length > 0) fail('prototype', brokenLinks.length + ' broken internal link(s)', brokenLinks.slice(0, 5).map(b => b.from + ' → ' + b.to).join(' ; '));
  else ok('prototype', htmlFiles.length + ' HTML page(s), all internal links resolve');
  if (brokenImages.length > 0) warn('prototype', brokenImages.length + ' missing local image(s)', brokenImages.slice(0, 5).map(b => b.from + ' → ' + b.to).join(' ; '));
} else if (existsDir(protoDir)) {
  fail('prototype', 'prototype/ exists but index.html missing');
}

function walkHtml(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && /\.html$/i.test(e.name)) out.push(full);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 7. Schema artifacts (optional)
// ---------------------------------------------------------------------------

const schemaDir = path.join(docsDir, 'schema');
if (existsDir(schemaDir)) {
  const entries = fs.readdirSync(schemaDir);
  const hasMmd = entries.some(f => /\.mmd$/i.test(f));
  const hasSql = entries.some(f => /\.sql$/i.test(f));
  const hasPng = entries.some(f => /\.png$/i.test(f));
  if (!hasMmd) warn('schema', 'schema/ exists but no .mmd file found');
  if (!hasSql) warn('schema', 'schema/ exists but no .sql file found');
  if (hasMmd && !hasPng) warn('schema', 'schema .mmd present but not rendered (run /architect:schema or /architect:diagrams)');
  if (hasMmd && hasSql && hasPng) ok('schema', 'schema artifacts complete (.mmd + .sql + .png)');
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function emitReport() {
  const counts = { ok: 0, warn: 0, fail: 0 };
  results.forEach(r => counts[r.level]++);

  if (jsonMode) {
    const payload = { summary: counts, checks: results, docsDir: docsDir };
    console.log(JSON.stringify(payload, null, 2));
    return counts;
  }

  const glyph = { ok: '✓', warn: '⚠', fail: '✗' };
  const byArea = {};
  results.forEach(r => { (byArea[r.area] = byArea[r.area] || []).push(r); });
  const areaOrder = ['context', 'deliverables', 'diagrams', 'stories', 'todo', 'prototype', 'schema', 'paths'];
  console.log('architect validate — ' + path.relative(process.cwd(), docsDir));
  console.log('');
  areaOrder.forEach(area => {
    const items = byArea[area];
    if (!items) return;
    console.log('  ' + area);
    items.forEach(r => {
      const mark = glyph[r.level] || '?';
      const detail = r.detail ? ' (' + r.detail + ')' : '';
      console.log('    ' + mark + ' ' + r.message + detail);
    });
  });
  console.log('');
  console.log('Summary: ' + counts.ok + ' ok, ' + counts.warn + ' warnings, ' + counts.fail + ' failures');
  return counts;
}

const counts = emitReport();
const shouldFail = counts.fail > 0 || (strict && counts.warn > 0);
process.exit(shouldFail ? 1 : 0);
