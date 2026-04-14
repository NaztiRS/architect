---
name: render
description: Export each architect deliverable independently as DOCX and PDF. Each deliverable gets its own folder with 3 formats (.md, .docx, .pdf). HTML is used only as intermediate for PDF generation and then deleted.
argument-hint: "[pdf|docx|all]"
allowed-tools: "Read Write Bash Glob"
---

## Your Mission

Export each architect deliverable independently as professionally styled corporate documents. Each deliverable (proposal, stories, techstack, todo) is rendered in its own folder with DOCX and PDF alongside the source .md.

## Prerequisites

1. Look for generated deliverables in `docs/architect/deliverables/` (or custom output_dir from fa-context.json):
   - `fa-context.json` — required (in `docs/architect/`)
   - `deliverables/proposal/proposal.md`, `deliverables/stories/stories.md`, `deliverables/techstack/techstack.md`, `deliverables/todo/todo.md` — at least one required
2. If no deliverables found: "No deliverables found. Run `/architect:full-proposal` or individual skills first." Then stop.
3. Check if `docs/architect/diagrams/` exists and has images. If not, run the diagrams skill logic first to render the Mermaid diagrams as images before proceeding.

## Parse Arguments

From `$ARGUMENTS`, determine the target format:
- `pdf` — Generate PDF only
- `docx` — Generate DOCX only
- `all` — Generate both PDF and DOCX (default)
- If no argument, generate all formats

## Corporate Design System

All exported documents follow this corporate/formal design:

### Color Palette
- **Primary:** Navy blue `#1B365D` — headings, borders, accents
- **Text:** Dark gray `#333333` — body text
- **Secondary text:** Medium gray `#666666` — subtitles, metadata
- **Background:** White `#FFFFFF` — page background
- **Accent background:** Light gray `#F7FAFC` — alternating table rows, code blocks
- **Code border:** Navy blue `#1B365D` — left border on code blocks
- **Success:** Green `#276749` on `#C6F6D5` — "Could" priority badges
- **Warning:** Yellow `#975A16` on `#FEFCBF` — "Should" priority badges
- **Danger:** Red `#9B2C2C` on `#FED7D7` — "Must" priority badges
- **Neutral:** Gray `#4A5568` on `#E2E8F0` — "Won't" priority badges

### Typography
- **Headings:** Source Sans Pro (sans-serif), bold, navy blue
- **Body:** Merriweather (serif), regular, dark gray, line-height 1.8
- **Code:** Fira Code / Consolas (monospace)
- **Cover title:** 3rem, centered, navy blue
- **H1:** 2rem, bottom border 3px navy
- **H2:** 1.5rem, bottom border 1px light gray

### Document Structure
Every exported document must include:
1. **Cover page** — project name (large), subtitle (project description), date, author, version number, domain badge
2. **Table of contents** — clickable section links, hierarchical (H1 + H2 level)
3. **Sections with page breaks** — each major section starts on a new page
4. **Headers** — project name on top of each page (after cover)
5. **Footers** — page numbers centered at bottom
6. **Diagrams** — rendered images (from `docs/architect/diagrams/`), centered, with captions
7. **Tables** — navy header row, alternating row colors, full width
8. **Priority badges** — colored inline badges for MoSCoW priorities

## Rendering Pipeline

For each deliverable that exists (proposal, stories, techstack, todo):

1. Read the source `.md` from `deliverables/{name}/{name}.md`
2. Generate DOCX using `docx` npm package (with corporate styling)
3. Generate a temporary HTML file for PDF generation
4. Generate PDF using puppeteer (from the temp HTML)
5. Delete the temporary HTML file — HTML is internal only, user never sees it
6. Output: `deliverables/{name}/{name}.docx` and `deliverables/{name}/{name}.pdf`

### Temporary HTML Generation

For each deliverable, generate a temporary HTML file at `deliverables/{name}/temp-{name}.html`.

The HTML must be **fully self-contained**:
- Inline all CSS (no external stylesheets except Google Fonts CDN)
- Embed diagram images as inline base64 data URIs (only for proposal, which has diagrams)
- No external JavaScript dependencies
- Print-optimized with `@media print` CSS

Build the HTML by:
1. Reading the deliverable markdown file (`deliverables/{name}/{name}.md`)
2. Converting markdown content to HTML sections
3. For the proposal: replacing Mermaid code blocks with `<div class="diagram"><img src="data:image/svg+xml;base64,..." alt="..."><p class="caption">...</p></div>`
4. Assembling the document with cover page and content

### CSS for corporate look

```css
@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+Pro:wght@400;600;700&display=swap');

body {
    font-family: 'Merriweather', Georgia, serif;
    color: #333;
    line-height: 1.8;
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
}

h1, h2, h3, h4 {
    font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif;
    color: #1B365D;
    margin-top: 2rem;
}

h1 { font-size: 2rem; border-bottom: 3px solid #1B365D; padding-bottom: 0.5rem; }
h2 { font-size: 1.5rem; border-bottom: 1px solid #CBD5E0; padding-bottom: 0.3rem; }

table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
}

th {
    background-color: #1B365D;
    color: white;
    padding: 0.75rem;
    text-align: left;
    font-family: 'Source Sans Pro', sans-serif;
}

td {
    padding: 0.75rem;
    border-bottom: 1px solid #E2E8F0;
}

tr:nth-child(even) { background-color: #F7FAFC; }
tr:hover { background-color: #EBF4FF; }

.cover-page {
    text-align: center;
    padding: 4rem 2rem;
    page-break-after: always;
    min-height: 90vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.cover-page h1 {
    font-size: 3rem;
    border: none;
    color: #1B365D;
    margin-bottom: 0.5rem;
}

.cover-page .subtitle {
    font-size: 1.3rem;
    color: #666;
    margin-top: 1rem;
    max-width: 600px;
}

.cover-page .divider {
    width: 100px;
    height: 4px;
    background-color: #1B365D;
    margin: 2rem auto;
}

.cover-page .meta {
    margin-top: 2rem;
    font-size: 1rem;
    color: #888;
    line-height: 2;
}

.toc {
    page-break-after: always;
}

.toc h1 {
    text-align: center;
    border: none;
}

.toc ul {
    list-style: none;
    padding: 0;
}

.toc li {
    padding: 0.5rem 0;
    border-bottom: 1px dotted #CBD5E0;
}

.toc a {
    color: #1B365D;
    text-decoration: none;
    font-family: 'Source Sans Pro', sans-serif;
}

.toc a:hover { text-decoration: underline; }

.toc .toc-h1 { font-weight: 700; font-size: 1.1rem; }
.toc .toc-h2 { padding-left: 1.5rem; font-size: 1rem; }

.section { page-break-before: always; }

code, pre {
    font-family: 'Fira Code', 'Consolas', monospace;
    background-color: #F5F5F5;
}

code { padding: 0.2rem 0.4rem; font-size: 0.9rem; }

pre {
    padding: 1rem;
    overflow-x: auto;
    border-left: 4px solid #1B365D;
}

.diagram {
    text-align: center;
    margin: 2rem 0;
    padding: 1rem;
}

.diagram img {
    max-width: 100%;
    height: auto;
    border: 1px solid #E2E8F0;
    padding: 1rem;
    background: white;
}

.diagram .caption {
    font-style: italic;
    color: #666;
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

.badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    font-family: 'Source Sans Pro', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.badge-must { background-color: #FED7D7; color: #9B2C2C; }
.badge-should { background-color: #FEFCBF; color: #975A16; }
.badge-could { background-color: #C6F6D5; color: #276749; }
.badge-wont { background-color: #E2E8F0; color: #4A5568; }

.score-high { color: #276749; font-weight: 700; }
.score-mid { color: #975A16; font-weight: 600; }
.score-low { color: #9B2C2C; font-weight: 600; }

blockquote {
    border-left: 4px solid #CBD5E0;
    margin: 1.5rem 0;
    padding: 0.75rem 1.5rem;
    background-color: #F7FAFC;
    color: #4A5568;
}

@media print {
    body { padding: 0; max-width: none; font-size: 11pt; }
    .no-print { display: none; }
    a { color: #333; text-decoration: none; }
    .section { page-break-before: always; }
    .cover-page { min-height: 100vh; }
    table { font-size: 10pt; }
    pre { font-size: 9pt; }
}
```

## Format: PDF

For each deliverable, generate PDF from its temporary HTML using puppeteer.

**IMPORTANT:** Use the `generate-pdf.js` script from the plugin's `bin/` directory instead of creating temporary scripts. This permanent script handles Chrome detection and puppeteer configuration automatically.

1. **Puppeteer (preferred — npm package):**

Run `generate-pdf.js` for each deliverable using the plugin's `bin/` directory:

```bash
export PUPPETEER_EXECUTABLE_PATH="[Chrome path from preflight]"
node [plugin-dir]/bin/generate-pdf.js "docs/architect/deliverables/proposal/temp-proposal.html" "docs/architect/deliverables/proposal/proposal.pdf" "ProjectName"
node [plugin-dir]/bin/generate-pdf.js "docs/architect/deliverables/stories/temp-stories.html" "docs/architect/deliverables/stories/stories.pdf" "ProjectName"
node [plugin-dir]/bin/generate-pdf.js "docs/architect/deliverables/techstack/temp-techstack.html" "docs/architect/deliverables/techstack/techstack.pdf" "ProjectName"
node [plugin-dir]/bin/generate-pdf.js "docs/architect/deliverables/todo/temp-todo.html" "docs/architect/deliverables/todo/todo.pdf" "ProjectName"
```

Usage: `generate-pdf.js <input.html> <output.pdf> [project-name]`

Then delete all temporary HTML files:
```bash
rm docs/architect/deliverables/*/temp-*.html
```

2. **If puppeteer is NOT available:**
> "PDF generation requires puppeteer. You can:
> - Install it: `npm install -g puppeteer`
> - Or generate HTML manually and use Chrome's Print → Save as PDF"

## Format: DOCX

Generate DOCX **natively** using the `docx` npm package for each deliverable independently. This creates real Word documents with proper styles — NOT an HTML-to-Word conversion.

**Why `docx` instead of `html-to-docx`:** The `html-to-docx` package loses all CSS styling (colors, fonts, table formatting, cover page layout). The `docx` package generates Word-native elements with full style control.

**IMPORTANT:** Use the `generate-docx.js` script from the plugin's `bin/` directory instead of creating temporary scripts. This permanent script handles markdown parsing, corporate styling, cover pages, tables, and page footers automatically.

Usage: `generate-docx.js <input.md> <output.docx> [fa-context.json]`

Run for each deliverable:
```bash
node [plugin-dir]/bin/generate-docx.js "docs/architect/deliverables/proposal/proposal.md" "docs/architect/deliverables/proposal/proposal.docx" "docs/architect/fa-context.json"
node [plugin-dir]/bin/generate-docx.js "docs/architect/deliverables/stories/stories.md" "docs/architect/deliverables/stories/stories.docx" "docs/architect/fa-context.json"
node [plugin-dir]/bin/generate-docx.js "docs/architect/deliverables/techstack/techstack.md" "docs/architect/deliverables/techstack/techstack.docx" "docs/architect/fa-context.json"
node [plugin-dir]/bin/generate-docx.js "docs/architect/deliverables/todo/todo.md" "docs/architect/deliverables/todo/todo.docx" "docs/architect/fa-context.json"
```

### DOCX Structure to Generate

```javascript
const docx = require('docx');
const fs = require('fs');
const path = require('path');
// docx provides: Document, Packer, Paragraph, TextRun, HeadingLevel,
// Table, TableRow, TableCell, ImageRun, PageBreak, AlignmentType,
// WidthType, ShadingType, BorderStyle, Footer, PageNumber, etc.
```

#### 1. Document Setup

```javascript
const doc = new docx.Document({
    creator: 'Architect Plugin — Claude Code',
    title: projectName + ' — Technical Report',
    styles: {
        default: {
            document: {
                run: { font: 'Calibri', size: 22, color: '333333' },
                paragraph: { spacing: { after: 120, line: 360 } }
            },
            heading1: {
                run: { font: 'Calibri', size: 36, bold: true, color: '1B365D' },
                paragraph: { spacing: { before: 360, after: 120 },
                    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: '1B365D' } } }
            },
            heading2: {
                run: { font: 'Calibri', size: 28, bold: true, color: '1B365D' },
                paragraph: { spacing: { before: 240, after: 120 },
                    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: 'CBD5E0' } } }
            },
            heading3: {
                run: { font: 'Calibri', size: 24, bold: true, color: '1B365D' },
                paragraph: { spacing: { before: 200, after: 100 } }
            }
        }
    },
    sections: [coverSection, tocSection, proposalSection, storiesSection, techstackSection, todoSection]
});
```

#### 2. Cover Page Section

```javascript
const coverSection = {
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children: [
        new docx.Paragraph({ spacing: { before: 4000 } }),  // top spacing
        new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [new docx.TextRun({ text: projectName, font: 'Calibri', size: 60, bold: true, color: '1B365D' })]
        }),
        new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [new docx.TextRun({ text: projectDescription, font: 'Calibri', size: 24, color: '666666', italics: true })]
        }),
        // Divider line
        new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            spacing: { before: 600 },
            border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: '1B365D', space: 1 } }
        }),
        // Metadata
        new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            spacing: { before: 600 },
            children: [
                new docx.TextRun({ text: 'Date: ' + date, font: 'Calibri', size: 20, color: '888888', break: 1 }),
                new docx.TextRun({ text: 'Domain: ' + domain, font: 'Calibri', size: 20, color: '888888', break: 1 }),
                new docx.TextRun({ text: 'Scale: ' + scale, font: 'Calibri', size: 20, color: '888888', break: 1 })
            ]
        }),
        new docx.Paragraph({ children: [new docx.PageBreak()] })
    ]
};
```

#### 3. Tables with Corporate Styling

```javascript
// Helper to create styled tables
function createTable(headers, rows) {
    return new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        rows: [
            // Header row — navy background, white text
            new docx.TableRow({
                tableHeader: true,
                children: headers.map(h => new docx.TableCell({
                    shading: { fill: '1B365D', type: docx.ShadingType.CLEAR },
                    children: [new docx.Paragraph({
                        children: [new docx.TextRun({ text: h, bold: true, color: 'FFFFFF', font: 'Calibri', size: 20 })]
                    })]
                }))
            }),
            // Data rows — alternating background
            ...rows.map((row, i) => new docx.TableRow({
                children: row.map(cell => new docx.TableCell({
                    shading: i % 2 === 0 ? {} : { fill: 'F7FAFC', type: docx.ShadingType.CLEAR },
                    children: [new docx.Paragraph({
                        children: [new docx.TextRun({ text: String(cell), font: 'Calibri', size: 20, color: '333333' })]
                    })]
                }))
            }))
        ]
    });
}
```

#### 4. Diagram Images

```javascript
// Embed PNG diagrams (NOT SVG — Word doesn't support SVG well)
function createDiagramImage(pngPath, caption) {
    const imageBuffer = fs.readFileSync(pngPath);
    return [
        new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [new docx.ImageRun({
                data: imageBuffer,
                transformation: { width: 600, height: 400 },  // adjust per diagram
                type: 'png'
            })]
        }),
        new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [new docx.TextRun({ text: caption, italics: true, color: '666666', font: 'Calibri', size: 18 })]
        })
    ];
}
```

#### 5. Footers with Page Numbers

```javascript
// Add to each section properties
properties: {
    page: {
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
    },
    footers: {
        default: new docx.Footer({
            children: [new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                    new docx.TextRun({ text: 'Page ', font: 'Calibri', size: 16, color: '888888' }),
                    new docx.PageNumber(),
                    new docx.TextRun({ text: ' — ' + projectName, font: 'Calibri', size: 16, color: '888888' })
                ]
            })]
        })
    }
}
```

#### 6. Priority Badges (as colored text)

```javascript
// MoSCoW badges as colored bold text (Word doesn't have HTML badges)
function priorityRun(priority) {
    const colors = { must: '9B2C2C', should: '975A16', could: '276749', wont: '4A5568' };
    return new docx.TextRun({
        text: '[' + priority.toUpperCase() + ']',
        bold: true,
        color: colors[priority] || '333333',
        font: 'Calibri',
        size: 18
    });
}
```

#### 7. Save the Document

```javascript
docx.Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(docxPath, buffer);
    console.log('DOCX generated: ' + docxPath);
}).catch(err => {
    console.error('DOCX generation failed:', err.message);
    process.exit(1);
});
```

### Execution

The `generate-docx.js` script in `bin/` handles all of the above automatically:
1. Reads `fa-context.json` for metadata (project name, description, domain, scale, date)
2. Reads the markdown deliverable and parses it into sections, paragraphs, tables, and lists
3. Generates a cover page with project info
4. Builds the Document with corporate styling and saves to the output path

If the `docx` package is NOT available:
> "DOCX generation requires the `docx` package. You can:
> - Install it: `npm install -g docx`"

### Key Rules for DOCX Quality

- **Use PNG for images, never SVG** — Word doesn't render SVG reliably
- **Parse markdown into structured elements** — don't try to convert HTML. Read the .md files directly and map: `#` → Heading1, `##` → Heading2, `|...|` → Table, `- [ ]` → checkbox paragraph, etc.
- **Page break between major sections** — use `new docx.PageBreak()` between proposal, stories, techstack, and todo sections
- **Consistent font: Calibri** — the corporate standard for Word documents
- **Use the Write tool to create the script** — never heredocs

## Script Best Practices

- **Never use bash heredocs** for JavaScript code — they break with nested quotes on Windows
- **Always use the Write tool** to create temp `.js` files, then `node file.js`, then `rm file.js`
- **Always use Node.js** for any scripting — never Python (not installed by default on Windows)
- **Always set `PUPPETEER_EXECUTABLE_PATH`** before running puppeteer or mmdc scripts
- **Always use `path.resolve()`** in Node scripts to handle Windows path differences
- **Always use PNG for Word images** — convert SVG to PNG before embedding

## Export Output Structure

```
docs/architect/
├── diagrams/                        # Rendered diagram images (only 2: architecture + timeline)
│   ├── architecture-overview.svg
│   ├── architecture-overview.png
│   ├── proposal-timeline.svg
│   └── proposal-timeline.png
├── deliverables/
│   ├── proposal/
│   │   ├── proposal.md              # Source markdown
│   │   ├── proposal.docx            # Word document
│   │   └── proposal.pdf             # PDF document
│   ├── techstack/
│   │   ├── techstack.md
│   │   ├── techstack.docx
│   │   └── techstack.pdf
│   ├── stories/
│   │   ├── stories.md
│   │   ├── stories.docx
│   │   └── stories.pdf
│   └── todo/
│       ├── todo.md
│       ├── todo.docx
│       └── todo.pdf
├── prototype/                       # HTML navigable prototype
└── README.md
```

Note: HTML files are generated as an intermediate step for PDF creation and then deleted. The user never sees HTML files.

## Output

Present a complete summary:
> "**Export complete.**
>
> Diagrams: 2 images in `docs/architect/diagrams/`
>
> Deliverables rendered:
> | Deliverable | MD | DOCX | PDF |
> |-------------|-----|------|-----|
> | Proposal | ✅ | ✅/❌ | ✅/❌ |
> | Stories | ✅ | ✅/❌ | ✅/❌ |
> | Tech Stack | ✅ | ✅/❌ | ✅/❌ |
> | Work Plan | ✅ | ✅/❌ | ✅/❌ |
>
> Each deliverable is in its own folder under `docs/architect/deliverables/`."
