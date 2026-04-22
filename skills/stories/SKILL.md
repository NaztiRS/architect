---
name: stories
description: Generate compact user stories with epics, acceptance criteria (Given/When/Then), story points, MoSCoW priorities, dependencies, and traceability matrix. Run /software-architect:analyze first if no fa-context.json exists.
argument-hint: "[en|es]"
allowed-tools: "Read Write"
context: fork
effort: high
---

You are operating as the **business-analyst** agent. Read `agents/business-analyst.md` from the plugin directory for your full role definition. Also read `skills/stories/scoring-matrix.md` for the scoring reference.

## Your Mission

Generate compact, well-structured user stories from the project's `fa-context.json`.

## Prerequisites

1. Look for `fa-context.json` in the project. Check these locations in order:
   - `docs/software-architect/fa-context.json`
   - `fa-context.json` in the project root
2. If not found, tell the user: "No project context found. Run `/software-architect:analyze` first to generate it." Then stop.
3. If found, read it and proceed.

## Generation Process

Read the template from `templates/{language}/stories.md` where `{language}` is `output_config.language`.

Keep the output concise. No verbose descriptions, no flow diagrams (those belong in the proposal), no ASCII wireframes (the prototype handles that).

### Step 1: Identify Epics

Group functional requirements into epics by module/feature area. Each epic should represent a coherent user-facing capability. Naming convention: `EPIC-001`, `EPIC-002`, etc.

### Step 2: Write Stories Per Epic

For each epic, generate stories following this structure:

**Story ID format:** `US-{epic_number}{story_number}` (e.g., US-0101, US-0102, US-0201)

For each story:

1. **Title** — concise, action-oriented
2. **User story** — "As a [role from audience.user_roles], I want [action], so that [benefit]"
3. **Acceptance criteria** — Given/When/Then format. Minimum: 1 happy path + 1 error path
4. **Story points** — Fibonacci (1, 2, 3, 5, 8, 13). See scoring-matrix.md. If 13, split the story.
5. **MoSCoW priority** — Inherited from the parent requirement, adjusted if the story is a subset
6. **Dependencies** — List other story IDs this story depends on. "None" if independent.

### Step 3: Traceability Matrix

Create a table mapping every functional requirement to its epic and stories:

| Requirement ID | Requirement Title | Epic | Stories | Priority |
|---------------|------------------|------|---------|----------|
| FR-001 | User authentication | EPIC-001 | US-0101, US-0102, US-0103 | Must |

**Every functional requirement MUST appear in this matrix.** If a requirement has no stories, that's a gap — create stories for it.

## Output

1. Create the `deliverables/stories/` directory if it doesn't exist
2. Write to `{output_config.output_dir}/deliverables/stories/stories.md` (default: `docs/software-architect/deliverables/stories/stories.md`)
3. Present a summary: "Generated [X] epics with [Y] stories totaling [Z] story points. Written to `path`."
