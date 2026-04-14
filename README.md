# Architect

A Claude Code plugin for **Functional Analysis & Technical Proposal generation** for software projects.

Transform project requirements into enterprise-grade documentation and navigable HTML prototypes — in minutes, not days.

## What It Generates

| Deliverable | Audience | Description |
|------------|----------|-------------|
| **Technical Proposal** | Client / Direction | Architecture, risks, timeline, functional modules |
| **User Stories** | Developers / Scrum Master | Epics, acceptance criteria (Given/When/Then), story points, MoSCoW, traceability |
| **Tech Stack Analysis** | Technical Team / CTO | Weighted scoring comparison per layer, recommendation with justification |
| **Work Plan** | PM / Tech Lead | Phases, tasks, dependencies, milestones, Gantt chart |
| **HTML Prototype** | Everyone | Navigable, responsive screens built with Tailwind CSS — zero dependencies |

Each deliverable is exported in **3 formats**: `.md`, `.docx`, `.pdf`

## Quick Start

```bash
git clone https://github.com/NaztiRS/architect.git
claude --plugin-dir ./architect
```

Then run:
```
/architect:full-proposal
```

## Commands

| Command | Description |
|---------|-------------|
| `/architect:full-proposal` | Complete pipeline — generates everything |
| `/architect:analyze` | Extract requirements from document or interactive Q&A |
| `/architect:proposal` | Generate technical proposal |
| `/architect:stories` | Generate user stories (enterprise level) |
| `/architect:techstack` | Tech stack recommendation with scoring |
| `/architect:todo` | Work plan with Gantt chart |
| `/architect:prototype` | Navigable HTML prototype |
| `/architect:diagrams` | Render Mermaid diagrams as SVG/PNG |
| `/architect:render` | Export deliverables as PDF/DOCX |
| `/architect:export` | Generate README index of deliverables |

### Options

```
/architect:full-proposal docs/spec.pdf     # Start from a document
/architect:full-proposal --no-review       # Skip review checkpoints
/architect:full-proposal --lang es         # Output in Spanish
```

## How the Pipeline Works

The full pipeline (`/architect:full-proposal`) orchestrates the entire process in 7 steps:

### Step 0: Preflight Check

Before any work begins, the plugin checks your environment:

- **Node.js + npm** — required for rendering tools
- **Google Chrome** — required for diagram rendering (mmdc) and PDF generation (puppeteer)
- **npm packages** (mmdc, puppeteer, docx) — auto-installed if missing

If tools are missing, the plugin installs them and informs you. At the end, you choose whether to keep or remove them.

### Step 1: Analyze

The plugin asks you the first question:

> *"Do you have existing documentation I can work from?"*
> - **A)** Yes — provide a file path (MD, TXT, PDF)
> - **B)** No — start from scratch with interactive Q&A
> - **C)** Partial document — analyze it and ask about what's missing

If you provide a document, the **business-analyst** agent extracts all requirements automatically. It calculates a completeness score — if above 85%, it only asks for confirmation. If below, it asks targeted questions one at a time about what's missing.

If no document is provided, it walks you through a structured questionnaire: project name, type, domain, scale, users, roles, features, constraints, integrations, and output preferences.

The result is a `fa-context.json` file — a structured representation of the entire project context that all other skills consume.

### Step 2: Proposal + Stories (Parallel)

Two agents work simultaneously:

- **solution-architect** generates the **Technical Proposal** — following a professional structure: market context, problem statement, objectives, functional scope (in/out), detailed modules (Objective → Trigger → Flow → Tasks), milestones with UAT criteria, architecture with stack table, team, and budget.
- **business-analyst** generates the **User Stories** — grouping requirements into epics, writing stories in "As a [role], I want [action], so that [benefit]" format, with acceptance criteria (Given/When/Then), story points (Fibonacci), MoSCoW priorities, dependencies, and a traceability matrix linking every requirement to its stories.

A review checkpoint lets you adjust both before moving on.

### Step 3: Tech Stack + Prototype (Parallel)

Two more agents work simultaneously:

- **solution-architect** generates the **Tech Stack Analysis** — evaluating 2-3 candidates per layer (frontend, backend, database, infrastructure, testing, CI/CD) with a weighted scoring table (scalability 25%, learning curve 15%, community 15%, cost 20%, fit 25%). If you specified an existing stack, it validates your choices instead of recommending from scratch.
- **ux-designer** generates the **HTML Prototype** — mapping user stories to screens, creating a navigable prototype with Tailwind CSS (via CDN). Every page has working navigation, realistic sample data, responsive design, and consistent styling. Zero dependencies — open `index.html` in any browser.

Another review checkpoint before continuing.

### Step 4: Work Plan

The **project-planner** agent generates the **Work Plan** — breaking the project into phases (MVP, v1, v2), with tasks grouped by epic, dependencies, milestones with deliverables, a Mermaid Gantt chart, and a prioritized getting-started checklist.

### Step 5: Export + Diagrams + Render

Three operations run in sequence:

1. **Export** creates a README index organizing all deliverables by audience
2. **Diagrams** extracts the 2 Mermaid diagrams from the proposal (architecture + timeline) and renders them as SVG/PNG using mmdc or the mermaid.ink API
3. **Render** converts each deliverable markdown into professional DOCX (using the `docx` npm package for native Word formatting with corporate styling) and PDF (using puppeteer with Chrome headless)

### Step 6: Cleanup

If the plugin installed npm tools during preflight, it asks:

> *"Keep the rendering tools or uninstall them?"*

Choose to keep them for future runs, or remove them for a clean system.

## Pipeline Diagram

```
Preflight (Node.js? Chrome? Install tools)
       |
   analyze → fa-context.json
       |
   proposal  ──parallel──  stories
       |                      |
   techstack ──parallel──  prototype
       |
      todo
       |
   export + diagrams + render
       |
   cleanup (keep or remove tools?)
```

## Output Structure

```
docs/architect/
├── README.md
├── diagrams/
│   ├── architecture-overview.svg
│   ├── architecture-overview.png
│   ├── proposal-timeline.svg
│   └── proposal-timeline.png
├── prototype/
│   ├── index.html
│   └── pages/
└── deliverables/
    ├── proposal/
    │   ├── proposal.md
    │   ├── proposal.docx
    │   └── proposal.pdf
    ├── stories/
    │   ├── stories.md
    │   ├── stories.docx
    │   └── stories.pdf
    ├── techstack/
    │   ├── techstack.md
    │   ├── techstack.docx
    │   └── techstack.pdf
    └── todo/
        ├── todo.md
        ├── todo.docx
        └── todo.pdf
```

## Specialized Agents

The plugin uses 4 specialized agents, each with domain expertise defined in their role files:

| Agent | Role | Skills | What It Does |
|-------|------|--------|-------------|
| `business-analyst` | Requirements expert | analyze, stories | Extracts requirements from documents or Q&A. Detects gaps and implicit assumptions. Writes acceptance criteria in Given/When/Then. Assigns MoSCoW priorities and story points. Never assumes — asks precise questions when info is missing. |
| `solution-architect` | Architecture expert | proposal, techstack | Designs scalable architectures. Evaluates tech stacks with objective scoring. Produces Mermaid diagrams. Justifies every technical decision with trade-offs. Scales complexity to the project. |
| `ux-designer` | Prototyping expert | prototype | Maps user stories to screens. Creates navigable HTML prototypes with Tailwind CSS. Uses realistic data from the project context. Ensures responsive design and consistent styling across all pages. |
| `project-planner` | Planning expert | todo | Decomposes projects into phases and tasks. Estimates effort realistically (with 20-30% padding). Identifies dependencies and critical path. Creates Gantt charts and prioritized checklists. |

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
