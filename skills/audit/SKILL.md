---
name: audit
description: Review an existing technical proposal against the Architect plugin's quality standards. Generates a compliance report with scoring across 5 dimensions — structure, content, tone, diagrams, and completeness.
argument-hint: "[path-to-proposal]"
allowed-tools: "Read, Write, Glob, Grep"
---

You are operating as the **solution-architect** agent. Read `agents/solution-architect.md` from the plugin directory for your full role definition.

## Your Mission

Evaluate an existing technical proposal against the quality standards defined in `templates/style-reference.md`. Produce a compliance report — you do NOT fix or rewrite the proposal.

## Prerequisites

1. Read `templates/style-reference.md` from the plugin directory. This is your primary evaluation reference.
2. Read `agents/solution-architect.md` for quality expectations.

## Input

From `$ARGUMENTS`, extract the path to the proposal file. Supported formats: `.md`, `.txt`, `.pdf`.

If no argument provided, ask:
> "Please provide the path to the proposal you want to audit (e.g., `docs/proposal.md`)"

Read the proposal file. If it cannot be read, stop:
> "Could not read the file at `[path]`. Please check the path and try again."

## Evaluation Dimensions

Read `templates/style-reference.md` and evaluate the proposal across these 5 dimensions:

### Dimension 1: Structure (Sections 1–15)

Check whether each of the 15 required sections exists. Match by heading text or equivalent content — the section doesn't need the exact heading from the template, but the content must be identifiable.

| # | Expected Section | What to look for |
|---|-----------------|-----------------|
| 1 | Cover Page | Project name, client name, date |
| 2 | Index / Table of Contents | Numbered section list |
| 3 | Executive Summary | The `exec-summary` HTML block or equivalent structured summary with Problem, Solution, metrics, KPIs, Why now |
| 4 | Target Market & Ideal Client | Client context, industry, business model |
| 5 | Understanding the Need | Pain points with concrete impact |
| 6 | Project Objectives | Numbered measurable objectives with strong verbs |
| 7 | Functional Scope | In Scope, Out of Scope, Preconditions, Assumptions subsections |
| 8 | Detailed Functional Proposal | Modules with Objective, Trigger, Flow, Development Tasks |
| 9 | Implementation Timeline | Milestones with duration, deliverables, UAT criteria |
| 10 | Technical Architecture | Architecture description, Mermaid diagram, tech stack table, integrations, infrastructure |
| 11 | Proposed Team | Roles table with dedication and responsibility |
| 12 | Budget | Cost breakdown table (optional — flag if missing but don't penalize heavily) |
| 13 | Risk Register | The `risk-register` HTML block or equivalent with probability × impact scoring and mitigation |
| 14 | Support Service | Post-launch support, SLA, warranty |
| 15 | Gantt Timeline | Mermaid Gantt chart |

### Dimension 2: Content Quality

For each section that exists, evaluate depth:

- **Executive Summary:** Has all 6 parts (Problem, Solution, Timeline, Investment, Team, Milestones, Success criteria, Why now)? Problem and Solution are exactly one sentence each? KPIs are measurable?
- **Modules (§8):** Each module has Objective, Trigger, Flow (numbered steps), and Development Tasks?
- **Risks (§13):** Each risk has probability (1–5), impact (1–5), concrete mitigation, and named owner? 5–10 risks total?
- **Milestones (§9):** Each has duration, deliverables, UAT criteria, and responsible parties?
- **Tech Stack (§10):** Table includes Selected Technology, Discarded Alternative, and Justification columns?

### Dimension 3: Tone & Density

- Professional and direct? No filler or academic language?
- Specific and quantified? ("Reduce manual time by 70%" vs. "improve processes")
- Appropriate length for project scale? (10–15 pages small, 15–20 medium, 20–30 large)
- Decision-maker audience? (focuses on what/how/when/cost, not implementation details)

### Dimension 4: Diagrams

- Exactly 2 Mermaid diagrams? (architecture overview + Gantt timeline)
- No extra diagrams? (no wireframes, no flow diagrams, no scoring tables)
- Mermaid syntax appears valid? (opens with ` ```mermaid ` fence, uses recognized diagram type)

### Dimension 5: Completeness

- Functional Scope has all 4 subsections? (In Scope, Out of Scope, Preconditions, Assumptions)
- Team section present with roles table?
- Budget section present? (warn if missing, don't hard-fail)
- Support/warranty section present?
- Objectives use strong verbs and are measurable?

## Scoring

For each of the 15 sections, assign a score:

| Score | Meaning |
|-------|---------|
| 0 | Missing — section not found |
| 1 | Present but deficient — exists but lacks required elements |
| 2 | Compliant — meets the standard |

- **Max raw score:** 30 (15 sections × 2)
- **Normalized:** `(raw_score / 30) × 100`, rounded to nearest integer
- **Verdict thresholds:**
  - ≥ 80 → ✅ Compliant
  - 50–79 → ⚠️ Partially compliant
  - < 50 → ❌ Non-compliant

## Output

### File: `docs/software-architect/audit-report.md`

Create the directory `docs/software-architect/` if it doesn't exist.

Write the report following this exact structure:

```
# Audit Report — [proposal filename]

**Date:** [YYYY-MM-DD]
**Overall Score:** [X/100]
**Verdict:** [✅ Compliant / ⚠️ Partially compliant / ❌ Non-compliant]

## Section Compliance

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | Cover Page | [✅/⚠️/❌] | [one-line finding] |
| 2 | Index | [✅/⚠️/❌] | [one-line finding] |
| 3 | Executive Summary | [✅/⚠️/❌] | [one-line finding] |
| 4 | Target Market | [✅/⚠️/❌] | [one-line finding] |
| 5 | Understanding the Need | [✅/⚠️/❌] | [one-line finding] |
| 6 | Project Objectives | [✅/⚠️/❌] | [one-line finding] |
| 7 | Functional Scope | [✅/⚠️/❌] | [one-line finding] |
| 8 | Detailed Functional Proposal | [✅/⚠️/❌] | [one-line finding] |
| 9 | Implementation Timeline | [✅/⚠️/❌] | [one-line finding] |
| 10 | Technical Architecture | [✅/⚠️/❌] | [one-line finding] |
| 11 | Proposed Team | [✅/⚠️/❌] | [one-line finding] |
| 12 | Budget | [✅/⚠️/❌] | [one-line finding] |
| 13 | Risk Register | [✅/⚠️/❌] | [one-line finding] |
| 14 | Support Service | [✅/⚠️/❌] | [one-line finding] |
| 15 | Gantt Timeline | [✅/⚠️/❌] | [one-line finding] |

## Detailed Findings

### Structure
[Paragraph: which sections are missing, which are out of order, overall structural assessment]

### Content Quality
[Paragraph: depth of Executive Summary, modules, risks, milestones, tech stack table]

### Tone & Density
[Paragraph: tone assessment, filler detected, specificity level, length appropriateness]

### Diagrams
[Paragraph: count of diagrams, types found, Mermaid validity, extra diagrams if any]

### Completeness
[Paragraph: scope subsections, team, budget, support, objectives quality]

## Recommendations
[Numbered list of prioritized improvements, most impactful first]
```

### Console Summary

After writing the file, display:

> "**Audit complete.**
>
> | Metric | Value |
> |--------|-------|
> | Score | [X/100] |
> | Verdict | [✅/⚠️/❌] |
> | Sections present | [N/15] |
> | Sections compliant | [N/15] |
>
> Full report: `docs/software-architect/audit-report.md`
>
> **Top 3 issues:**
> 1. [most critical finding]
> 2. [second finding]
> 3. [third finding]"

## Windows Notes

- Use forward slashes in all paths.
- Read PDF files using the Read tool (it supports PDF natively).

## Context

This is a Claude Code plugin. Skills are markdown instruction files — they tell Claude how to behave, not executable code. The file must be written with the `---` YAML frontmatter at the very top.

The plugin directory is `C:\DEV_PROJECTS\MY\software-architect`. Other skills for reference pattern live at `skills/validate/SKILL.md`, `skills/analyze/SKILL.md`, etc.
