#!/usr/bin/env node
/**
 * Generate a native Word (.docx) document from a markdown deliverable using
 * the `docx` npm package. Produces corporate-styled output with:
 *
 * - Cover page (project title, description, metadata)
 * - Heading hierarchy (H1..H3)
 * - Inline formatting: **bold**, *italic*, `code`, [text](url)
 * - Ordered / unordered / nested lists (up to 3 levels)
 * - Checklists (- [ ] / - [x])
 * - Tables with navy header + alternating rows
 * - Blockquotes
 * - Horizontal rules
 * - Fenced code blocks
 * - Mermaid fences auto-embed PNG from diagrams directory
 * - Inline images ![alt](path)
 * - MoSCoW badges [MUST]/[SHOULD]/[COULD]/[WON'T] as colored bold text
 * - Page number footer
 *
 * Usage:
 *   generate-docx.js <input.md> <output.docx> [fa-context.json] [diagrams-dir]
 */

const fs = require('fs');
const path = require('path');

const inputMd = process.argv[2];
const outputDocx = process.argv[3];
const contextJson = process.argv[4];
const diagramsDirArg = process.argv[5];

if (!inputMd || !outputDocx) {
  console.error('Usage: generate-docx.js <input.md> <output.docx> [fa-context.json] [diagrams-dir]');
  process.exit(1);
}

let docx;
try {
  docx = require('docx');
} catch (e) {
  const pluginDir = path.resolve(__dirname, '..');
  console.error('[architect] Missing dependency docx. Run: cd "' + pluginDir + '" && npm install');
  process.exit(1);
}

const mdContent = fs.readFileSync(path.resolve(inputMd), 'utf8');

let context = {};
if (contextJson && fs.existsSync(path.resolve(contextJson))) {
  context = JSON.parse(fs.readFileSync(path.resolve(contextJson), 'utf8'));
}

const projectName = (context.project && context.project.name) || 'Project';
const projectDesc = (context.project && context.project.description) || '';
const date = (context.metadata && context.metadata.generated_at) || new Date().toISOString().split('T')[0];
const domain = (context.project && context.project.domain) || '';
const scale = (context.project && context.project.scale) || '';

const diagramsDir = diagramsDirArg
  ? path.resolve(diagramsDirArg)
  : (contextJson ? path.resolve(path.dirname(path.resolve(contextJson)), 'diagrams') : path.resolve('docs/software-architect/diagrams'));

let diagramFiles = [];
if (fs.existsSync(diagramsDir)) {
  diagramFiles = fs.readdirSync(diagramsDir).filter(function (f) { return /\.png$/i.test(f); });
}

function findDiagramPng(hint) {
  const h = (hint || '').toLowerCase();
  let match = null;
  if (/gantt|timeline/.test(h)) {
    match = diagramFiles.find(function (f) { return /timeline|gantt/i.test(f); });
  }
  if (!match && /graph|flowchart|sequenceDiagram|classDiagram|c4|architecture/i.test(hint || '')) {
    match = diagramFiles.find(function (f) { return /architecture|overview|diagram/i.test(f); });
  }
  if (!match) match = diagramFiles[0];
  return match ? path.join(diagramsDir, match) : null;
}

// ---------------------------------------------------------------------------
// Inline parser — produces array of TextRun / ExternalHyperlink / ImageRun
// ---------------------------------------------------------------------------

const MOSCOW_COLORS = {
  must: '9B2C2C',
  should: '975A16',
  could: '276749',
  wont: '4A5568'
};

function textRun(text, opts) {
  const base = { text: String(text), font: 'Calibri', size: 22, color: '333333' };
  return new docx.TextRun(Object.assign(base, opts || {}));
}

// Tokenize a markdown inline string into segments.
// Handles: `code`, **bold**, *italic*, __bold__, _italic_, [text](url), ![alt](path), [MUST]-style badges.
function tokenizeInline(text) {
  const tokens = [];
  let i = 0;
  const N = text.length;

  function pushText(s, flags) {
    if (!s) return;
    tokens.push({ type: 'text', value: s, bold: !!(flags && flags.bold), italic: !!(flags && flags.italic), code: !!(flags && flags.code), color: (flags && flags.color) || null });
  }

  // Simpler approach: regex-based, one pass.
  // We recognize tokens in priority order.
  const patterns = [
    // Inline code
    { re: /^`([^`]+)`/, make: function (m) { return { type: 'code', value: m[1] }; } },
    // Image ![alt](url)
    { re: /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/, make: function (m) { return { type: 'image', alt: m[1], url: m[2], title: m[3] || '' }; } },
    // Link [text](url)
    { re: /^\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/, make: function (m) { return { type: 'link', text: m[1], url: m[2], title: m[3] || '' }; } },
    // MoSCoW badge
    { re: /^\[(MUST|SHOULD|COULD|WON'?T)\]/i, make: function (m) { return { type: 'badge', value: m[1].replace(/'/g, '').toUpperCase() }; } },
    // Bold **...** or __...__
    { re: /^\*\*([^*]+)\*\*/, make: function (m) { return { type: 'bold', value: m[1] }; } },
    { re: /^__([^_]+)__/, make: function (m) { return { type: 'bold', value: m[1] }; } },
    // Italic *...* or _..._
    { re: /^\*(?!\s)([^*\n]+?)\*/, make: function (m) { return { type: 'italic', value: m[1] }; } },
    { re: /^_(?!\s)([^_\n]+?)_/, make: function (m) { return { type: 'italic', value: m[1] }; } }
  ];

  let buf = '';
  while (i < N) {
    const slice = text.slice(i);
    let matched = null;
    for (let p = 0; p < patterns.length; p++) {
      const m = slice.match(patterns[p].re);
      if (m) { matched = { m: m, make: patterns[p].make }; break; }
    }
    if (matched) {
      if (buf) { tokens.push({ type: 'text', value: buf }); buf = ''; }
      tokens.push(matched.make(matched.m));
      i += matched.m[0].length;
    } else {
      buf += text[i];
      i++;
    }
  }
  if (buf) tokens.push({ type: 'text', value: buf });
  return tokens;
}

// Convert tokens into docx children (TextRun / ExternalHyperlink / ImageRun)
function inlineToRuns(text, baseOpts) {
  const tokens = tokenizeInline(text);
  const children = [];
  tokens.forEach(function (t) {
    const opts = Object.assign({}, baseOpts || {});
    if (t.type === 'text') {
      children.push(textRun(t.value, opts));
    } else if (t.type === 'bold') {
      children.push(textRun(t.value, Object.assign({}, opts, { bold: true })));
    } else if (t.type === 'italic') {
      children.push(textRun(t.value, Object.assign({}, opts, { italics: true })));
    } else if (t.type === 'code') {
      children.push(textRun(t.value, Object.assign({}, opts, { font: 'Consolas', size: 20, color: '1B365D', shading: { type: docx.ShadingType.CLEAR, fill: 'F1F5F9' } })));
    } else if (t.type === 'badge') {
      const key = t.value.toLowerCase();
      children.push(textRun('[' + t.value + ']', Object.assign({}, opts, { bold: true, color: MOSCOW_COLORS[key] || '333333', size: 20 })));
    } else if (t.type === 'link') {
      children.push(new docx.ExternalHyperlink({
        link: t.url,
        children: [textRun(t.text, Object.assign({}, opts, { color: '2563EB', underline: { type: docx.UnderlineType.SINGLE } }))]
      }));
    } else if (t.type === 'image') {
      // Resolve relative path against markdown file location
      const imgPath = path.isAbsolute(t.url) ? t.url : path.resolve(path.dirname(path.resolve(inputMd)), t.url);
      if (fs.existsSync(imgPath)) {
        try {
          const buf = fs.readFileSync(imgPath);
          children.push(new docx.ImageRun({
            data: buf,
            transformation: { width: 400, height: 250 },
            type: /\.jpe?g$/i.test(imgPath) ? 'jpg' : 'png'
          }));
        } catch (e) {
          children.push(textRun('[image: ' + t.alt + ']', opts));
        }
      } else {
        children.push(textRun('[image: ' + t.alt + ']', opts));
      }
    }
  });
  return children;
}

// ---------------------------------------------------------------------------
// Block parser
// ---------------------------------------------------------------------------

const lines = mdContent.split(/\r?\n/);
const children = [];

// Cover page
children.push(
  new docx.Paragraph({ spacing: { before: 4000 } }),
  new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    children: [new docx.TextRun({ text: projectName, font: 'Calibri', size: 60, bold: true, color: '1B365D' })]
  })
);
if (projectDesc) {
  children.push(new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new docx.TextRun({ text: projectDesc, font: 'Calibri', size: 24, color: '666666', italics: true })]
  }));
}
children.push(
  new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    spacing: { before: 600 },
    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: '1B365D', space: 1 } },
    children: []
  }),
  new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [
      new docx.TextRun({ text: 'Date: ' + date, font: 'Calibri', size: 20, color: '888888' }),
      new docx.TextRun({ text: '   |   Domain: ' + domain, font: 'Calibri', size: 20, color: '888888' }),
      new docx.TextRun({ text: '   |   Scale: ' + scale, font: 'Calibri', size: 20, color: '888888' })
    ]
  }),
  new docx.Paragraph({ children: [new docx.PageBreak()] })
);

function indentOf(s) { return s.match(/^(\s*)/)[1].replace(/\t/g, '    ').length; }

function emitHeading(level, text) {
  const heading = level === 1 ? docx.HeadingLevel.HEADING_1 : level === 2 ? docx.HeadingLevel.HEADING_2 : docx.HeadingLevel.HEADING_3;
  const size = level === 1 ? 36 : level === 2 ? 28 : level === 3 ? 24 : 22;
  const border = level === 1
    ? { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: '1B365D' } }
    : level === 2
    ? { bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: 'CBD5E0' } }
    : undefined;
  const runs = inlineToRuns(text, { bold: true, color: '1B365D', size: size, font: 'Calibri' });
  return new docx.Paragraph({
    heading: heading,
    children: runs,
    spacing: { before: level === 1 ? 360 : 240, after: 120 },
    border: border,
    pageBreakBefore: level === 1 && children.length > 10 ? true : false
  });
}

function emitParagraph(text) {
  return new docx.Paragraph({
    children: inlineToRuns(text),
    spacing: { after: 120, line: 360 }
  });
}

function emitListItem(content, level, ordered, cbState) {
  const runs = inlineToRuns(content);
  const base = {
    children: runs,
    spacing: { after: 80 },
    indent: { left: 360 + level * 360 }
  };
  if (cbState !== null && cbState !== undefined) {
    const mark = cbState ? '☑ ' : '☐ ';
    return new docx.Paragraph(Object.assign({}, base, {
      children: [new docx.TextRun({ text: mark, font: 'Calibri', size: 22 })].concat(runs)
    }));
  }
  if (ordered) {
    return new docx.Paragraph(Object.assign({}, base, { numbering: { reference: 'ordered-list', level: Math.min(level, 2) } }));
  }
  return new docx.Paragraph(Object.assign({}, base, { bullet: { level: Math.min(level, 2) } }));
}

function emitCodeBlock(text, langHint) {
  return new docx.Paragraph({
    children: [new docx.TextRun({ text: text, font: 'Consolas', size: 18, color: '2d3748' })],
    shading: { fill: 'F1F5F9', type: docx.ShadingType.CLEAR },
    border: { left: { style: docx.BorderStyle.SINGLE, size: 12, color: '1B365D', space: 8 } },
    spacing: { before: 120, after: 120 },
    indent: { left: 240 }
  });
}

function emitBlockquote(text) {
  return new docx.Paragraph({
    indent: { left: 720 },
    border: { left: { style: docx.BorderStyle.SINGLE, size: 12, color: 'CBD5E0', space: 12 } },
    shading: { fill: 'F7FAFC', type: docx.ShadingType.CLEAR },
    children: inlineToRuns(text, { italics: true, color: '4A5568' }),
    spacing: { after: 120 }
  });
}

function emitHr() {
  return new docx.Paragraph({
    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: 'CBD5E0', space: 1 } },
    spacing: { before: 120, after: 120 },
    children: []
  });
}

function emitTable(headers, rows) {
  const headerCells = headers.map(function (h) {
    return new docx.TableCell({
      shading: { fill: '1B365D', type: docx.ShadingType.CLEAR },
      children: [new docx.Paragraph({
        children: inlineToRuns(h, { bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })
      })]
    });
  });
  const dataRows = rows.map(function (row, i) {
    return new docx.TableRow({
      children: row.map(function (cell) {
        return new docx.TableCell({
          shading: i % 2 === 0 ? {} : { fill: 'F8FAFC', type: docx.ShadingType.CLEAR },
          children: [new docx.Paragraph({
            children: inlineToRuns(cell, { size: 20 })
          })]
        });
      })
    });
  });
  return new docx.Table({
    width: { size: 100, type: docx.WidthType.PERCENTAGE },
    rows: [new docx.TableRow({ tableHeader: true, children: headerCells })].concat(dataRows)
  });
}

function emitDiagram(pngPath, caption) {
  try {
    const buf = fs.readFileSync(pngPath);
    return [
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [new docx.ImageRun({
          data: buf,
          transformation: { width: 520, height: 340 },
          type: 'png'
        })]
      }),
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new docx.TextRun({ text: caption, italics: true, color: '666666', font: 'Calibri', size: 18 })]
      })
    ];
  } catch (e) {
    return [new docx.Paragraph({ children: [new docx.TextRun({ text: '[Diagram: ' + caption + ' — failed to load]', color: '9B2C2C', font: 'Calibri', size: 20 })] })];
  }
}

function splitRow(row) {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map(function (c) { return c.replace(/\\\|/g, '|').trim(); });
}

function stripTags(html) {
  return String(html).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

function emitExecSummaryFromHtml(html) {
  const blocks = [];
  blocks.push(new docx.Paragraph({
    heading: docx.HeadingLevel.HEADING_2,
    children: [new docx.TextRun({ text: 'Executive Summary', font: 'Calibri', size: 28, bold: true, color: '1B365D' })],
    spacing: { before: 240, after: 180 },
    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: '1B365D' } }
  }));

  // Label + paragraph pairs
  const labelRe = /<span[^>]*class="exec-summary-label"[^>]*>([^<]+)<\/span>\s*(?:<p[^>]*>([\s\S]*?)<\/p>)?/gi;
  const textPairs = [];
  let m;
  while ((m = labelRe.exec(html)) !== null) {
    textPairs.push({ label: stripTags(m[1]), text: m[2] ? stripTags(m[2]) : '' });
  }

  // Extract grid items (Problem / Solution)
  const grid = textPairs.filter(function (p) { return p.text; });
  grid.forEach(function (p) {
    blocks.push(new docx.Paragraph({
      spacing: { before: 120, after: 60 },
      children: [new docx.TextRun({ text: p.label, bold: true, color: '2563EB', size: 18, font: 'Calibri' })]
    }));
    blocks.push(new docx.Paragraph({
      spacing: { after: 120, line: 360 },
      children: inlineToRuns(p.text)
    }));
  });

  // Metrics — render as a 4-column table
  const metricRe = /<span[^>]*class="exec-metric-value"[^>]*>([^<]+)<\/span>\s*<span[^>]*class="exec-metric-label"[^>]*>([^<]+)<\/span>/gi;
  const metrics = [];
  while ((m = metricRe.exec(html)) !== null) {
    metrics.push({ value: stripTags(m[1]), label: stripTags(m[2]) });
  }
  if (metrics.length) {
    const row = new docx.TableRow({
      children: metrics.map(function (mt) {
        return new docx.TableCell({
          shading: { fill: 'EFF6FF', type: docx.ShadingType.CLEAR },
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: mt.value, bold: true, color: '1B365D', size: 24, font: 'Calibri' })]
            }),
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: mt.label.toUpperCase(), color: '64748B', size: 14, font: 'Calibri' })]
            })
          ]
        });
      })
    });
    blocks.push(new docx.Table({
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      rows: [row]
    }));
    blocks.push(new docx.Paragraph({ spacing: { after: 120 }, children: [] }));
  }

  // KPIs and Why are labels without an inline <p>; the content sits after them.
  // Extract KPIs list
  const kpiBlock = html.match(/<div[^>]*class="exec-summary-kpis"[^>]*>([\s\S]*?)<\/div>/i);
  if (kpiBlock) {
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const items = [];
    let li;
    while ((li = liRe.exec(kpiBlock[1])) !== null) items.push(stripTags(li[1]));
    if (items.length) {
      blocks.push(new docx.Paragraph({
        spacing: { before: 120, after: 60 },
        children: [new docx.TextRun({ text: 'Success criteria', bold: true, color: '2563EB', size: 18, font: 'Calibri' })]
      }));
      items.forEach(function (t) {
        blocks.push(new docx.Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          indent: { left: 720 },
          children: inlineToRuns(t)
        }));
      });
    }
  }

  // Why block
  const whyBlock = html.match(/<div[^>]*class="exec-summary-why"[^>]*>([\s\S]*?)<\/div>/i);
  if (whyBlock) {
    const pMatch = whyBlock[1].match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (pMatch) {
      blocks.push(new docx.Paragraph({
        spacing: { before: 180, after: 60 },
        children: [new docx.TextRun({ text: 'Why this, why now', bold: true, color: '2563EB', size: 18, font: 'Calibri' })]
      }));
      blocks.push(new docx.Paragraph({
        spacing: { after: 200, line: 360 },
        children: inlineToRuns(stripTags(pMatch[1]), { italics: true, color: '475569' })
      }));
    }
  }

  // Page break after the exec summary so it stays on its own page
  blocks.push(new docx.Paragraph({ children: [new docx.PageBreak()] }));
  return blocks;
}

const SEV_STYLES = {
  low:  { fill: 'D1FAE5', color: '065F46', label: 'Low' },
  med:  { fill: 'FEF3C7', color: '92400E', label: 'Medium' },
  high: { fill: 'FED7AA', color: '9A3412', label: 'High' },
  crit: { fill: 'FECACA', color: '991B1B', label: 'Critical' }
};

function severityFromScore(prob, impact) {
  const score = (parseInt(prob, 10) || 0) * (parseInt(impact, 10) || 0);
  if (score >= 15) return 'crit';
  if (score >= 10) return 'high';
  if (score >= 5) return 'med';
  return 'low';
}

function emitRiskRegisterFromHtml(html) {
  const blocks = [];
  blocks.push(new docx.Paragraph({
    heading: docx.HeadingLevel.HEADING_2,
    children: [new docx.TextRun({ text: 'Risk Register', font: 'Calibri', size: 28, bold: true, color: '1B365D' })],
    spacing: { before: 240, after: 180 },
    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: '1B365D' } }
  }));

  // Parse rows from the HTML table
  const rowsRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRe = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
  const parsedRows = [];
  let r;
  while ((r = rowsRe.exec(html)) !== null) {
    const cells = [];
    let c;
    cellRe.lastIndex = 0;
    while ((c = cellRe.exec(r[1])) !== null) cells.push(stripTags(c[1]));
    if (cells.length >= 6) parsedRows.push(cells);
  }
  if (parsedRows.length === 0) {
    blocks.push(new docx.Paragraph({ children: [new docx.TextRun({ text: '[Risk register empty — no rows parsed]', color: '9B2C2C', font: 'Calibri', size: 20 })] }));
    return blocks;
  }

  // First row is headers
  const headers = parsedRows[0];
  const dataRows = parsedRows.slice(1);

  const headerCells = headers.map(function (h) {
    return new docx.TableCell({
      shading: { fill: '1B365D', type: docx.ShadingType.CLEAR },
      children: [new docx.Paragraph({
        children: [new docx.TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18, font: 'Calibri' })]
      })]
    });
  });

  const dataTableRows = dataRows.map(function (row) {
    // Expected columns: ID, Risk, Prob, Impact, Severity, Mitigation, Owner
    const sevKey = severityFromScore(row[2], row[3]);
    const sev = SEV_STYLES[sevKey];
    return new docx.TableRow({
      children: row.map(function (cell, idx) {
        const isSevCol = idx === 4;
        return new docx.TableCell({
          shading: isSevCol
            ? { fill: sev.fill, type: docx.ShadingType.CLEAR }
            : {},
          children: [new docx.Paragraph({
            children: [new docx.TextRun({
              text: isSevCol ? sev.label : cell,
              font: 'Calibri',
              size: 18,
              color: isSevCol ? sev.color : '333333',
              bold: isSevCol || idx === 0
            })]
          })]
        });
      })
    });
  });

  blocks.push(new docx.Table({
    width: { size: 100, type: docx.WidthType.PERCENTAGE },
    rows: [new docx.TableRow({ tableHeader: true, children: headerCells })].concat(dataTableRows)
  }));
  blocks.push(new docx.Paragraph({ spacing: { after: 200 }, children: [] }));
  return blocks;
}

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Raw HTML block — collect until tag balances, then handle specific classes
  const htmlOpen = line.match(/^\s*<(div|section|article|aside|header|footer|nav|figure|details|table)(\s|>|$)/i);
  if (htmlOpen) {
    const tag = htmlOpen[1].toLowerCase();
    const openRe = new RegExp('<' + tag + '\\b', 'gi');
    const closeRe = new RegExp('</' + tag + '\\s*>', 'gi');
    let depth = 0;
    const chunkLines = [];
    while (i < lines.length) {
      const ln = lines[i];
      chunkLines.push(ln);
      depth += (ln.match(openRe) || []).length;
      depth -= (ln.match(closeRe) || []).length;
      i++;
      if (depth <= 0) break;
    }
    const chunk = chunkLines.join('\n');
    if (/class\s*=\s*"[^"]*\bexec-summary\b/i.test(chunk)) {
      emitExecSummaryFromHtml(chunk).forEach(function (b) { children.push(b); });
    } else if (/class\s*=\s*"[^"]*\brisk-register\b/i.test(chunk)) {
      emitRiskRegisterFromHtml(chunk).forEach(function (b) { children.push(b); });
    } else {
      // Generic fallback: strip tags and emit as plain paragraph
      const plain = stripTags(chunk);
      if (plain) children.push(emitParagraph(plain));
    }
    continue;
  }

  // Fenced code
  if (/^```/.test(line)) {
    const langHint = line.replace(/^```/, '').trim();
    const codeLines = [];
    i++;
    while (i < lines.length && !/^```/.test(lines[i])) {
      codeLines.push(lines[i]);
      i++;
    }
    i++;
    if (langHint.toLowerCase() === 'mermaid') {
      const png = findDiagramPng(codeLines.join('\n'));
      const caption = /gantt|timeline/i.test(codeLines.join('\n'))
        ? ((context.output_config && context.output_config.language === 'es') ? 'Cronograma del proyecto' : 'Project timeline')
        : ((context.output_config && context.output_config.language === 'es') ? 'Arquitectura del sistema' : 'System architecture');
      if (png) {
        emitDiagram(png, caption).forEach(function (p) { children.push(p); });
        continue;
      }
      // Fallback: insert as code block
    }
    children.push(emitCodeBlock(codeLines.join('\n'), langHint));
    continue;
  }

  // Headings
  const h = line.match(/^(#{1,6})\s+(.*)$/);
  if (h) {
    children.push(emitHeading(h[1].length, h[2]));
    i++;
    continue;
  }

  // Horizontal rule
  if (/^\s*(?:-{3,}|_{3,}|\*{3,})\s*$/.test(line)) {
    children.push(emitHr());
    i++;
    continue;
  }

  // Blockquote
  if (/^\s*>\s?/.test(line)) {
    const quoted = [];
    while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
      quoted.push(lines[i].replace(/^\s*>\s?/, ''));
      i++;
    }
    children.push(emitBlockquote(quoted.join(' ')));
    continue;
  }

  // Tables
  if (/\|/.test(line) && /^\s*\|?\s*:?-+/.test(lines[i + 1] || '')) {
    const headers = splitRow(line);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && /\|/.test(lines[j]) && lines[j].trim()) {
      rows.push(splitRow(lines[j]));
      j++;
    }
    children.push(emitTable(headers, rows));
    children.push(new docx.Paragraph({ spacing: { after: 120 }, children: [] }));
    i = j;
    continue;
  }

  // Lists (possibly nested)
  if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
    const baseIndent = indentOf(line);
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) {
        const next = lines[i + 1] || '';
        if (/^\s*([-*+]|\d+\.)\s+/.test(next)) { i++; continue; }
        break;
      }
      const m = l.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
      if (!m) break;
      const ind = indentOf(l);
      const level = Math.max(0, Math.round((ind - baseIndent) / 2));
      const ordered = /\d+\./.test(m[2]);
      const content = m[3];
      const cbMatch = content.match(/^\[( |x|X)\]\s+(.*)$/);
      let cbState = null;
      let displayContent = content;
      if (cbMatch) {
        cbState = cbMatch[1].toLowerCase() === 'x';
        displayContent = cbMatch[2];
      }
      children.push(emitListItem(displayContent, level, ordered, cbState));
      i++;
    }
    continue;
  }

  // Blank line
  if (!line.trim()) {
    i++;
    continue;
  }

  // Paragraph (accumulate wrapped lines)
  const para = [line];
  i++;
  while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s+|\s*([-*+]|\d+\.)\s+|\s*>|```|\|)/.test(lines[i])) {
    para.push(lines[i]);
    i++;
  }
  children.push(emitParagraph(para.join(' ')));
}

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

const footer = new docx.Footer({
  children: [new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    children: [
      new docx.TextRun({ text: projectName + ' — ', font: 'Calibri', size: 16, color: '888888' }),
      new docx.TextRun({ children: [docx.PageNumber.CURRENT], font: 'Calibri', size: 16, color: '888888' }),
      new docx.TextRun({ text: ' / ', font: 'Calibri', size: 16, color: '888888' }),
      new docx.TextRun({ children: [docx.PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: '888888' })
    ]
  })]
});

const doc = new docx.Document({
  creator: 'Architect Plugin',
  title: projectName,
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22, color: '333333' },
        paragraph: { spacing: { after: 120, line: 360 } }
      }
    }
  },
  numbering: {
    config: [{
      reference: 'ordered-list',
      levels: [
        { level: 0, format: docx.LevelFormat.DECIMAL, text: '%1.', alignment: docx.AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 260 } } } },
        { level: 1, format: docx.LevelFormat.LOWER_LETTER, text: '%2.', alignment: docx.AlignmentType.START, style: { paragraph: { indent: { left: 1440, hanging: 260 } } } },
        { level: 2, format: docx.LevelFormat.LOWER_ROMAN, text: '%3.', alignment: docx.AlignmentType.START, style: { paragraph: { indent: { left: 2160, hanging: 260 } } } }
      ]
    }]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      footers: { default: footer }
    },
    children: children
  }]
});

docx.Packer.toBuffer(doc).then(function (buffer) {
  fs.writeFileSync(path.resolve(outputDocx), buffer);
  console.log('DOCX generated: ' + outputDocx);
}).catch(function (err) {
  console.error('DOCX generation failed:', err.message);
  process.exit(1);
});
