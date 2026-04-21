#!/usr/bin/env node
/**
 * Builds a self-contained HTML report from a markdown deliverable using the
 * corporate template at templates/{lang}/report.html.
 *
 * Usage:
 *   build-report-html.js <input.md> <output.html> <fa-context.json> [diagrams-dir]
 *
 * - Replaces ```mermaid ... ``` fences with <img src="data:image/png;base64,..."/>
 *   read from `diagrams-dir` (matches by diagram heuristic: architecture, timeline).
 * - Parses a safe subset of markdown (headings, paragraphs, lists, tables,
 *   blockquotes, code, inline bold/italic/code/links, images).
 * - Wraps the content into the template's {{content}} slot, replacing metadata
 *   placeholders from fa-context.json.
 */

const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: build-report-html.js <input.md> <output.html> <fa-context.json> [diagrams-dir]');
  process.exit(1);
}

const [, , inMd, outHtml, ctxPath, diagramsDirArg] = process.argv;
if (!inMd || !outHtml || !ctxPath) usage();

const mdPath = path.resolve(inMd);
const outPath = path.resolve(outHtml);
const contextPath = path.resolve(ctxPath);
const diagramsDir = diagramsDirArg
  ? path.resolve(diagramsDirArg)
  : path.resolve(path.dirname(contextPath), 'diagrams');

if (!fs.existsSync(mdPath)) { console.error('Markdown not found: ' + mdPath); process.exit(1); }
if (!fs.existsSync(contextPath)) { console.error('fa-context.json not found: ' + contextPath); process.exit(1); }

const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
const lang = (context.output_config && context.output_config.language) || 'en';

const pluginRoot = path.resolve(__dirname, '..');
const templatePath = path.join(pluginRoot, 'templates', lang, 'report.html');
const templateFallback = path.join(pluginRoot, 'templates', 'en', 'report.html');
const resolvedTemplate = fs.existsSync(templatePath) ? templatePath : templateFallback;
if (!fs.existsSync(resolvedTemplate)) {
  console.error('Template not found: ' + resolvedTemplate);
  process.exit(1);
}

const template = fs.readFileSync(resolvedTemplate, 'utf8');
const md = fs.readFileSync(mdPath, 'utf8');

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initialsFrom(name) {
  return String(name || 'PR')
    .split(/\s+/)
    .filter(Boolean)
    .map(function (w) { return w[0]; })
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

// Inline markdown: bold, italic, code, links, images.
// Order matters: code first to avoid interpreting markers inside code.
function renderInline(raw) {
  if (raw == null) return '';
  var placeholders = [];
  var MARK_OPEN = 'PH';
  var MARK_CLOSE = '';
  function hold(html) {
    placeholders.push(html);
    return MARK_OPEN + (placeholders.length - 1) + MARK_CLOSE;
  }

  var text = raw;

  // Inline code
  text = text.replace(/`([^`]+)`/g, function (_, c) {
    return hold('<code>' + escapeHtml(c) + '</code>');
  });

  // Images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, alt, url, title) {
    var titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
    return hold('<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(alt) + '"' + titleAttr + ' style="max-width:100%;height:auto;">');
  });

  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, t, url, title) {
    var titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
    return hold('<a href="' + escapeHtml(url) + '"' + titleAttr + '>' + escapeHtml(t) + '</a>');
  });

  // Escape remaining HTML
  text = escapeHtml(text);

  // Bold **text** and __text__
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic *text* and _text_
  text = text.replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  text = text.replace(/(^|[\s(])_(?!\s)([^_\n]+?)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');

  // MoSCoW priority badges: [MUST], [SHOULD], [COULD], [WON'T]
  text = text.replace(/\[(MUST|SHOULD|COULD|WON&#39;?T)\]/gi, function (_, p) {
    var cls = { must: 'badge-must', should: 'badge-should', could: 'badge-could', wont: 'badge-wont' };
    var clean = p.replace(/&#39;/g, '').toLowerCase();
    return '<span class="badge ' + (cls[clean] || '') + '">' + clean.toUpperCase() + '</span>';
  });

  // Restore placeholders
  var restoreRe = new RegExp(MARK_OPEN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)' + MARK_CLOSE, 'g');
  text = text.replace(restoreRe, function (_, i) { return placeholders[Number(i)]; });
  return text;
}

// ---------------------------------------------------------------------------
// Diagram embedding
// ---------------------------------------------------------------------------

var diagramFiles = [];
if (fs.existsSync(diagramsDir)) {
  diagramFiles = fs.readdirSync(diagramsDir).filter(function (f) { return /\.(png|svg)$/i.test(f); });
}

function findDiagramPng(hint) {
  var h = (hint || '').toLowerCase();
  var match = null;
  if (/gantt|timeline/.test(h)) {
    match = diagramFiles.find(function (f) { return /timeline|gantt/i.test(f) && /\.png$/i.test(f); });
  }
  if (!match && /graph|flowchart|sequenceDiagram|classDiagram|c4|architecture/i.test(hint || '')) {
    match = diagramFiles.find(function (f) { return /architecture|overview|diagram/i.test(f) && /\.png$/i.test(f); });
  }
  if (!match) {
    match = diagramFiles.find(function (f) { return /\.png$/i.test(f); });
  }
  return match ? path.join(diagramsDir, match) : null;
}

function pngToDataUri(filePath) {
  try {
    var buf = fs.readFileSync(filePath);
    return 'data:image/png;base64,' + buf.toString('base64');
  } catch (e) {
    return null;
  }
}

function replaceMermaidBlocks(source) {
  return source.replace(/```mermaid\n([\s\S]*?)```/g, function (_, code) {
    var pngPath = findDiagramPng(code);
    var caption = /gantt|timeline/i.test(code)
      ? (lang === 'es' ? 'Cronograma del proyecto' : 'Project timeline')
      : (lang === 'es' ? 'Arquitectura del sistema' : 'System architecture');
    if (pngPath) {
      var uri = pngToDataUri(pngPath);
      if (uri) {
        return '\n<!--DIAGRAM-->\n<div class="diagram-container"><img src="' + uri + '" alt="' + escapeHtml(caption) + '"><p class="diagram-caption">' + escapeHtml(caption) + '</p></div>\n<!--/DIAGRAM-->\n';
      }
    }
    return '```mermaid\n' + code + '```';
  });
}

// ---------------------------------------------------------------------------
// Block-level markdown parser
// ---------------------------------------------------------------------------

function parseMarkdownToHtml(source) {
  var withDiagrams = replaceMermaidBlocks(source);
  var lines = withDiagrams.split(/\r?\n/);
  var out = [];
  var i = 0;

  function isBlank(s) { return !s || !s.trim(); }

  function flushParagraph(buffer) {
    if (buffer.length === 0) return;
    var joined = buffer.join(' ').trim();
    if (joined) out.push('<p>' + renderInline(joined) + '</p>');
  }

  function indentOf(s) {
    return s.match(/^(\s*)/)[1].replace(/\t/g, '    ').length;
  }

  function parseList(start) {
    var listLines = [];
    var j = start;
    var firstIndent = indentOf(lines[start]);
    while (j < lines.length) {
      var ln = lines[j];
      if (isBlank(ln)) {
        var next = lines[j + 1] || '';
        if (/^\s*([-*+]|\d+\.)\s+/.test(next)) { j++; continue; }
        break;
      }
      if (!/^\s*([-*+]|\d+\.)\s+/.test(ln) && indentOf(ln) <= firstIndent) break;
      listLines.push(ln);
      j++;
    }

    function build(startIdx, baseIndent) {
      var items = [];
      var k = startIdx;
      while (k < listLines.length) {
        var ln = listLines[k];
        var ind = indentOf(ln);
        if (ind < baseIndent) break;
        if (ind > baseIndent) {
          var nested = buildNested(k, ind);
          if (items.length) items[items.length - 1] += nested[0];
          k = nested[1];
          continue;
        }
        var m = ln.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)$/);
        if (!m) break;
        var content = m[1];
        var cbMatch = content.match(/^\[( |x|X)\]\s+(.*)$/);
        var itemHtml;
        if (cbMatch) {
          var checked = cbMatch[1].toLowerCase() === 'x';
          itemHtml = '<label style="display:inline-flex;gap:.5rem;align-items:flex-start;"><input type="checkbox" disabled' + (checked ? ' checked' : '') + '> <span>' + renderInline(cbMatch[2]) + '</span></label>';
        } else {
          itemHtml = renderInline(content);
        }
        items.push('<li>' + itemHtml);
        k++;
      }
      return [items.map(function (i2) { return i2 + '</li>'; }).join(''), k];
    }

    function buildNested(startIdx, indent) {
      var nestedType = /^\s*\d+\./.test(listLines[startIdx]) ? 'ol' : 'ul';
      var r = build(startIdx, indent);
      return ['<' + nestedType + '>' + r[0] + '</' + nestedType + '>', r[1]];
    }

    var rootType = /^\s*\d+\./.test(listLines[0]) ? 'ol' : 'ul';
    var built = build(0, firstIndent);
    return ['<' + rootType + '>' + built[0] + '</' + rootType + '>', j];
  }

  function splitRow(row) {
    return row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split(/(?<!\\)\|/)
      .map(function (c) { return c.replace(/\\\|/g, '|').trim(); });
  }

  function parseTable(start) {
    var header = lines[start];
    var sep = lines[start + 1] || '';
    if (!/^\s*\|?.+\|/.test(header) || !/^\s*\|?\s*:?-+/.test(sep)) return null;
    var headers = splitRow(header);
    var rows = [];
    var j = start + 2;
    while (j < lines.length && /\|/.test(lines[j]) && !isBlank(lines[j])) {
      rows.push(splitRow(lines[j]));
      j++;
    }
    var thead = '<thead><tr>' + headers.map(function (h) { return '<th>' + renderInline(h) + '</th>'; }).join('') + '</tr></thead>';
    var tbody = '<tbody>' + rows.map(function (r) {
      return '<tr>' + r.map(function (c) { return '<td>' + renderInline(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody>';
    return ['<table>' + thead + tbody + '</table>', j];
  }

  var paragraph = [];

  while (i < lines.length) {
    var line = lines[i];

    if (line.trim() === '<!--DIAGRAM-->') {
      flushParagraph(paragraph); paragraph = [];
      var chunk = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '<!--/DIAGRAM-->') {
        chunk.push(lines[i]);
        i++;
      }
      out.push(chunk.join('\n'));
      i++;
      continue;
    }

    // Raw HTML block — when a line starts with an opening block-level tag,
    // pass lines through untouched until the matching closing tag balances.
    // Recognized block tags are conservative to avoid hijacking inline usage.
    var htmlOpen = line.match(/^\s*<(div|section|article|aside|header|footer|nav|figure|figcaption|details|summary|table)(\s|>|$)/i);
    if (htmlOpen) {
      flushParagraph(paragraph); paragraph = [];
      var tag = htmlOpen[1].toLowerCase();
      var openRe = new RegExp('<' + tag + '\\b', 'gi');
      var closeRe = new RegExp('</' + tag + '\\s*>', 'gi');
      var depth = 0;
      var chunkLines = [];
      while (i < lines.length) {
        var ln = lines[i];
        chunkLines.push(ln);
        depth += (ln.match(openRe) || []).length;
        depth -= (ln.match(closeRe) || []).length;
        i++;
        if (depth <= 0) break;
      }
      out.push(chunkLines.join('\n'));
      continue;
    }

    if (/^```/.test(line)) {
      flushParagraph(paragraph); paragraph = [];
      var langHint = line.replace(/^```/, '').trim();
      var codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      var langAttr = langHint ? ' class="language-' + escapeHtml(langHint) + '"' : '';
      out.push('<pre><code' + langAttr + '>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
      continue;
    }

    if (/^\s*(?:-{3,}|_{3,}|\*{3,})\s*$/.test(line)) {
      flushParagraph(paragraph); paragraph = [];
      out.push('<hr>');
      i++;
      continue;
    }

    var h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushParagraph(paragraph); paragraph = [];
      var level = h[1].length;
      var content = renderInline(h[2]);
      if (level === 1) {
        out.push('<div class="section-banner"><div class="icon">§</div><div><h2>' + content + '</h2></div></div>');
      } else if (level === 2) {
        out.push('<h3>' + content + '</h3>');
      } else {
        out.push('<h' + level + '>' + content + '</h' + level + '>');
      }
      i++;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      flushParagraph(paragraph); paragraph = [];
      var qLines = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        qLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      out.push('<blockquote>' + renderInline(qLines.join(' ')) + '</blockquote>');
      continue;
    }

    if (/\|/.test(line) && /\|/.test(lines[i + 1] || '') && /^\s*\|?\s*:?-+/.test(lines[i + 1] || '')) {
      flushParagraph(paragraph); paragraph = [];
      var res = parseTable(i);
      if (res) {
        out.push(res[0]);
        i = res[1];
        continue;
      }
    }

    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      flushParagraph(paragraph); paragraph = [];
      var list = parseList(i);
      out.push(list[0]);
      i = list[1];
      continue;
    }

    if (isBlank(line)) {
      flushParagraph(paragraph); paragraph = [];
      i++;
      continue;
    }

    paragraph.push(line);
    i++;
  }
  flushParagraph(paragraph);
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

var contentHtml = parseMarkdownToHtml(md);

var project = context.project || {};
var metadata = context.metadata || {};

var replacements = {
  '{{project.name}}': escapeHtml(project.name || 'Project'),
  '{{project.description}}': escapeHtml(project.description || ''),
  '{{project.domain}}': escapeHtml(project.domain || ''),
  '{{project.scale}}': escapeHtml(project.scale || ''),
  '{{project.initials}}': escapeHtml(project.initials || initialsFrom(project.name)),
  '{{metadata.generated_at}}': escapeHtml(metadata.generated_at || new Date().toISOString().split('T')[0]),
  '{{content}}': contentHtml
};

var html = template;
Object.keys(replacements).forEach(function (k) {
  html = html.split(k).join(replacements[k]);
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, 'utf8');
console.log('HTML built: ' + outPath);
