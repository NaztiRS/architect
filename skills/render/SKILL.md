---
name: render
description: Export each architect deliverable independently as DOCX and PDF. Each deliverable gets its own folder with 3 formats (.md, .docx, .pdf). HTML is used only as intermediate for PDF generation and then deleted.
argument-hint: "[pdf|docx|all]"
allowed-tools: "Read Write Bash Glob"
---

## Your Mission

Export each architect deliverable independently as professionally styled corporate documents. Each deliverable (proposal, stories, todo) is rendered in its own folder with DOCX and PDF alongside the source .md.

The rendering pipeline is **fully scripted** — you do NOT generate HTML or DOCX by hand. You invoke three deterministic Node.js scripts from the plugin's `bin/` directory:

| Script | Role |
|--------|------|
| `build-report-html.js` | Markdown → styled HTML (uses `templates/{lang}/report.html`, embeds diagrams as base64) |
| `generate-pdf.js` | HTML → PDF (via puppeteer + system Chrome) |
| `generate-docx.js` | Markdown → DOCX (native Word elements, embeds diagrams as PNG) |

All scripts read metadata from `fa-context.json` and the rendered diagrams from `docs/architect/diagrams/`.

## Prerequisites

1. Look for generated deliverables in `docs/architect/deliverables/` (or custom `output_dir`):
   - `fa-context.json` — required (in `docs/architect/`)
   - At least one of `deliverables/{proposal|stories|todo}/{name}.md` — required
2. If no deliverables found: "No deliverables found. Run `/architect:deliver` or individual skills first." Then stop.
3. If `docs/architect/diagrams/` is missing or empty, run the diagrams skill logic first. Diagrams must exist as PNG before render (DOCX embeds PNG, and HTML embeds PNG as base64 for reliable PDF printing).

## Parse Arguments

From `$ARGUMENTS`:
- `pdf` — Generate PDF only
- `docx` — Generate DOCX only
- `all` (default) — Generate both

## Corporate Design System (already codified in the template)

You do NOT have to reproduce the design system in prose — it is codified in `templates/{lang}/report.html` and `bin/generate-docx.js`. Both use the same palette and typography:

- **Primary:** Navy `#1B365D` (headers, borders, badges)
- **Accent:** `#2563eb` (links, active states)
- **Text:** `#1a1a2e` headings / `#2d3748` body / `#64748b` muted
- **Surface:** `#ffffff` page / `#f8fafc` cards / `#e2e8f0` borders
- **Typography:** Inter (web/PDF) / Calibri (DOCX)
- **Cover page** with navy gradient, project initials badge, metadata line
- **Section banners** with navy gradient for H1 headings
- **Tables** with navy header row, alternating row background
- **MoSCoW badges**: `[MUST]`, `[SHOULD]`, `[COULD]`, `[WON'T]` are auto-styled
- **Callouts** via blockquote syntax
- **Diagrams** auto-embedded when a `` ```mermaid `` fence appears in markdown

## Rendering Pipeline

For each deliverable that exists (`proposal`, `stories`, `todo`):

### Step 1 — Build the HTML from markdown

```bash
node "$CLAUDE_PLUGIN_ROOT/bin/build-report-html.js" \
  "docs/architect/deliverables/{name}/{name}.md" \
  "docs/architect/deliverables/{name}/temp-{name}.html" \
  "docs/architect/fa-context.json" \
  "docs/architect/diagrams"
```

This produces a fully self-contained HTML (inline CSS from the template, base64-embedded diagrams, no external assets except the Google Fonts CDN for Inter).

### Step 2 — Generate the PDF

```bash
export PUPPETEER_EXECUTABLE_PATH="[Chrome path from preflight]"
node "$CLAUDE_PLUGIN_ROOT/bin/generate-pdf.js" \
  "docs/architect/deliverables/{name}/temp-{name}.html" \
  "docs/architect/deliverables/{name}/{name}.pdf" \
  "{ProjectName}"
```

### Step 3 — Generate the DOCX

```bash
node "$CLAUDE_PLUGIN_ROOT/bin/generate-docx.js" \
  "docs/architect/deliverables/{name}/{name}.md" \
  "docs/architect/deliverables/{name}/{name}.docx" \
  "docs/architect/fa-context.json" \
  "docs/architect/diagrams"
```

`generate-docx.js` reads the diagrams directory and auto-embeds PNG images when it finds `` ```mermaid `` fences — same behavior as the HTML builder.

### Step 4 — Clean up the temporary HTML

```bash
rm -f docs/architect/deliverables/*/temp-*.html
```

HTML is internal-only. The user only ever sees the `.md`, `.docx`, and `.pdf` under each deliverable folder.

## Iterate per deliverable

Pseudocode:

```
for name in [proposal, stories, todo]:
  md = "docs/architect/deliverables/{name}/{name}.md"
  if not exists(md): continue
  run build-report-html.js md → temp.html
  run generate-pdf.js temp.html → {name}.pdf
  run generate-docx.js md → {name}.docx
  delete temp.html
```

If a script fails (missing `puppeteer`, missing `docx`, Chrome path wrong), preserve the markdown and the already-generated formats, and report which step failed. Never leave temp HTML files behind.

## Fallbacks

- **puppeteer missing** → "PDF requires puppeteer. Run `npm install` inside the plugin directory, or generate PDF manually from the HTML via Chrome → Print → Save as PDF."
- **docx missing** → "DOCX requires the `docx` npm package. Run `npm install` inside the plugin directory."
- **diagrams missing** → call the diagrams skill first, then retry.

## Windows Notes

- Always set `PUPPETEER_EXECUTABLE_PATH` before calling `generate-pdf.js`.
- Use forward slashes in paths; Git Bash converts them.
- Never heredoc JavaScript — the scripts already exist in `bin/`, just call them.

## Output Structure

```
docs/architect/
├── diagrams/                        # Rendered Mermaid diagrams (PNG + SVG)
│   ├── architecture-overview.png
│   └── proposal-timeline.png
├── deliverables/
│   ├── proposal/
│   │   ├── proposal.md
│   │   ├── proposal.docx
│   │   └── proposal.pdf
│   ├── stories/
│   │   ├── stories.md
│   │   ├── stories.docx
│   │   └── stories.pdf
│   └── todo/
│       ├── todo.md
│       ├── todo.docx
│       └── todo.pdf
└── README.md
```

## Final Report

> "**Export complete.**
>
> | Deliverable | MD | DOCX | PDF |
> |-------------|----|------|-----|
> | Proposal | ✅ | ✅/❌ | ✅/❌ |
> | Stories | ✅ | ✅/❌ | ✅/❌ |
> | Work Plan | ✅ | ✅/❌ | ✅/❌ |
>
> Diagrams embedded: {N} images from `docs/architect/diagrams/`.
> Each deliverable is in its own folder under `docs/architect/deliverables/`."
