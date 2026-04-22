---
name: proposal
description: Generate a complete technical proposal document from the project context. Includes architecture, components, risks, and timeline. Run /software-architect:analyze first if no fa-context.json exists.
argument-hint: "[en|es]"
allowed-tools: "Read Write"
context: fork
effort: high
---

You are operating as the **solution-architect** agent. Read `agents/solution-architect.md` from the plugin directory for your full role definition.

## Your Mission

Generate a complete Technical Proposal document based on the project's `fa-context.json`.

## Style Guidance

**IMPORTANT:** Read `templates/style-reference.md` from the plugin directory BEFORE generating the proposal. It contains the complete structure, tone, and formatting rules based on real consulting proposals. Follow it strictly.

No other Mermaid diagrams should be included in the proposal.

## Prerequisites

1. Look for `fa-context.json` in the project. Check these locations in order:
   - The path specified in the user's arguments (if any)
   - `docs/software-architect/fa-context.json`
   - `fa-context.json` in the project root
2. If not found, tell the user: "No project context found. Run `/software-architect:analyze` first to generate it." Then stop.
3. If found, read it and proceed.

## Generation Process

Read the appropriate template from the plugin directory: `templates/{language}/proposal.md` where `{language}` is `output_config.language` from the context file.

Generate each section of the proposal:

### 1. Executive Summary (MANDATORY)

Emit the exact HTML block defined in `templates/style-reference.md` §3. This is a single-page visual card: Problem / Solution (one sentence each), Timeline / Investment / Team / Milestones metrics, 3 measurable KPIs, and a "Why this, why now" closer.

Both the PDF (via `build-report-html.js`) and the DOCX (via `generate-docx.js`) detect this `<div class="exec-summary">` block and render it as a distinguished page. Do NOT replace it with prose paragraphs — the block is the deliverable.

Fill every placeholder with project-specific values from `fa-context.json`. If a number is unknown, write `TBD` — never invent.

### 2. Project Scope
- **In Scope:** List all functional requirements (reference FR-IDs)
- **Out of Scope:** Explicitly state what this project does NOT include. This is critical for setting expectations. Derive from context: if it's an MVP, many features are out of scope.

### 3. High-Level Architecture
- Choose the appropriate architecture pattern based on project type, scale, and constraints
- Create a Mermaid architecture diagram showing main components and their relationships (this is diagram 1 of 2)
- Explain why this architecture was chosen over alternatives

### 4. Modules
For each module/component, describe using this structure:
- **Objective** — what this module achieves
- **Trigger** — what initiates this module's behavior
- **Flow** — step-by-step description of how it works
- **Development Tasks** — high-level tasks needed to build it

### 5. Integration Points
- Detail each integration from `integrations` in the context
- Specify protocols, authentication, data formats

### 6. Non-Functional Requirements
- Table mapping each NFR to how the architecture addresses it
- Include specific metrics from the context

### 7. Risk Register (MANDATORY)

Emit the exact HTML block defined in `templates/style-reference.md` §13 (Risk Register). Both the PDF template and the DOCX renderer detect `<div class="risk-register">` and produce: a 5×5 probability × impact heatmap (PDF) or a severity-coloured table (DOCX).

Rules:
- **5–10 risks.** Fewer = optimistic; more = padding.
- Each risk has **probability 1–5**, **impact 1–5**, a concrete **mitigation action** (not a hope), and an **owner** (role or name, never "the team").
- Place a `<span class="risk-marker">Rn</span>` inside each matrix cell where a risk sits (probability × impact coordinates). Markers must match the IDs in the table below.
- Severity classes follow score = prob × impact: `sev-low` (1–4), `sev-med` (5–9), `sev-high` (10–14), `sev-crit` (15–25). Apply to the matching cell and to the `<span class="sev-badge">` in the Severity column.

### 8. Effort Estimation
- Break down by phase (at minimum: MVP, v1)
- Estimate in story points and calendar time
- Factor in team_size from constraints

### 9. Tentative Timeline
- Mermaid Gantt chart showing phases, milestones, and dependencies (this is diagram 2 of 2)
- Must respect the `timeline` constraint from context

### 10. Next Steps
- Concrete action items to move forward
- What decisions need to be made

## Output

1. Create the `deliverables/proposal/` directory if it doesn't exist
2. Write the proposal to `{output_config.output_dir}/deliverables/proposal/proposal.md` (default: `docs/software-architect/deliverables/proposal/proposal.md`)
3. Present a brief summary to the user: "Technical proposal generated at `path`. Key highlights: ..."
