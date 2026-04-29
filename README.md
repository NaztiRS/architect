<p align="center">
  <img src="assets/readme-top.png" alt="Software Architect animated README banner" width="100%">
</p>

# Software Architect

A Claude Code plugin for **Functional Analysis & Technical Proposal generation** for software projects.

Transform project requirements into enterprise-grade documentation and navigable HTML prototypes — in minutes, not days.

## What It Generates

| Deliverable | Audience | Description |
|------------|----------|-------------|
| **Technical Proposal** | Client / Direction | Architecture, risks, timeline, functional modules |
| **HTML Prototype** | Everyone | Navigable, responsive screens built with Tailwind CSS — zero dependencies |

Each deliverable is exported in **3 formats**: `.md`, `.docx`, `.pdf`

## Installation

Inside Claude Code, add the marketplace and install the plugin:

```
/plugin marketplace add NaztiRS/software-architect
/plugin install software-architect
```

### Requirements

- **Node.js** (for PDF / DOCX / diagram rendering)
- **Google Chrome** (used by puppeteer and mermaid-cli)

On first use, the plugin runs `npm install` inside its own directory to fetch `puppeteer`, `docx` and `@mermaid-js/mermaid-cli` — **locally**, never globally. At the end you can keep them or remove them with one command.

## Quick Start

```
/software-architect:deliver
```

That runs the full pipeline. Or start with a specific document:

```
/software-architect:deliver docs/spec.pdf
```

## Commands

| Command | Description |
|---------|-------------|
| `/software-architect:deliver` | Complete pipeline — generates everything |
| `/software-architect:analyze` | Extract requirements from document or interactive Q&A |
| `/software-architect:proposal` | Generate technical proposal |
| `/software-architect:prototype` | Navigable HTML prototype |
| `/software-architect:diagrams` | Render Mermaid diagrams as SVG/PNG |
| `/software-architect:render` | Export deliverables as PDF/DOCX |
| `/software-architect:export` | Generate README index of deliverables |
| `/software-architect:validate` | Static consistency check across all deliverables |
| `/software-architect:audit` | Review an existing proposal against Architect quality standards |

### Options

```
/software-architect:deliver docs/spec.pdf     # Start from a document
/software-architect:deliver --no-review       # Skip review checkpoints
/software-architect:deliver --lang es         # Output in Spanish
```

## How the Pipeline Works

The full pipeline (`/software-architect:deliver`) orchestrates the entire process in 5 steps:

### Step 0: Preflight Check

Before any work begins, the plugin checks your environment:

- **Node.js + npm** — required for rendering tools
- **Google Chrome** — required for diagram rendering (mmdc) and PDF generation (puppeteer)
- **npm packages** (mmdc, puppeteer, docx) — auto-installed if missing

If tools are missing, the plugin installs them and informs you. At the end, you choose whether to keep or remove them.

### Step 1: Analyze

The plugin asks you the first question:

> *"Let's get started."*
> - **A)** Scan this directory for existing documentation
> - **B)** I'll provide a document or describe the project
> - **C)** Start from scratch — walk me through the questions
> - **D)** Audit an existing proposal — check compliance with Architect standards

If you choose **D**, the plugin generates a compliance report at `docs/software-architect/audit-report.md` instead of running the full pipeline.

If you provide a document, the **solution-architect** agent extracts all requirements automatically. It calculates a completeness score — if above 85%, it only asks for confirmation. If below, it asks targeted questions one at a time about what's missing.

If no document is provided, it walks you through a structured questionnaire: project name, type, domain, scale, users, roles, features, constraints, integrations, and output preferences.

The result is a `fa-context.json` file — a structured representation of the entire project context that all other skills consume.

### Step 2: Proposal

The **solution-architect** agent generates the **Technical Proposal** — following a professional structure: market context, problem statement, objectives, functional scope (in/out), detailed modules (Objective → Trigger → Flow → Tasks), milestones with UAT criteria, architecture with stack table, team, and budget.

A review checkpoint lets you adjust before moving on.

### Step 3: Prototype

- **ux-designer** generates the **HTML Prototype** — mapping functional modules to screens, creating a navigable prototype with Tailwind CSS (via CDN). Every page has working navigation, realistic sample data, responsive design, and consistent styling. Zero dependencies — open `index.html` in any browser.

A review checkpoint lets you adjust before moving on.

### Step 4: Export + Diagrams + Render

Three operations run in sequence:

1. **Export** creates a README index organizing all deliverables by audience
2. **Diagrams** extracts the 2 Mermaid diagrams from the proposal (architecture + timeline) and renders them as SVG/PNG using mmdc or the mermaid.ink API
3. **Render** converts each deliverable markdown into professional DOCX (using the `docx` npm package for native Word formatting with corporate styling) and PDF (using puppeteer with Chrome headless)

### Step 5: Cleanup

If the plugin installed npm tools during preflight, it asks:

> *"Keep the rendering tools or uninstall them?"*

Choose to keep them for future runs, or remove them for a clean system.

## Pipeline Diagram

```
Preflight (Node.js? Chrome? Install tools)
       |
   analyze → fa-context.json
       |
      proposal
       |
      prototype
       |
   export + diagrams + render
       |
   validate (consistency gate)
       |
   cleanup (keep or remove tools?)
```

## Output Structure

```
docs/software-architect/
├── README.md
├── diagrams/
│   ├── architecture-overview.svg
│   ├── architecture-overview.png
│   ├── proposal-timeline.svg
│   └── proposal-timeline.png
├── prototype/
│   ├── index.html
│   ├── pages/
│   └── assets/
└── deliverables/
    ├── proposal/
    │   ├── proposal.md
    │   ├── proposal.docx
    │   └── proposal.pdf
```

## Specialized Agents

The plugin uses 3 specialized agents, each with domain expertise defined in their role files:

| Agent | Role | Skills | What It Does |
|-------|------|--------|-------------|
| `business-analyst` | Requirements expert | analyze | Extracts functional and non-functional requirements from documents or interactive Q&A. Detects gaps and inconsistencies. Prioritizes with MoSCoW. |
| `solution-architect` | Architecture expert | proposal | Designs scalable architectures. Produces Mermaid diagrams. Justifies every technical decision with trade-offs. |
| `ux-designer` | Prototyping expert | prototype | Maps functional modules to screens. Creates navigable HTML prototypes with Tailwind CSS. Uses realistic data from the project context. Ensures responsive design and consistent styling across all pages. |

Agents write in the user's chosen language (English or Spanish). Technical terms always remain in English.

## Requirements

- [Claude Code](https://claude.ai/code) CLI or desktop app
- Node.js + npm
- Google Chrome

The following npm packages are auto-installed (and optionally removed after):
- `@mermaid-js/mermaid-cli` — diagram rendering
- `puppeteer` — PDF generation
- `docx` — DOCX generation

## Output Languages

- English (`en`)
- Spanish (`es`)

## License

MIT — see [LICENSE](LICENSE)
