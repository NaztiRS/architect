---
name: proposal
description: Generate a complete technical proposal document from the project context. Includes architecture, components, risks, and timeline. Run /architect:analyze first if no fa-context.json exists.
argument-hint: "[en|es]"
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
   - `docs/architect/fa-context.json`
   - `fa-context.json` in the project root
2. If not found, tell the user: "No project context found. Run `/architect:analyze` first to generate it." Then stop.
3. If found, read it and proceed.

## Generation Process

Read the appropriate template from the plugin directory: `templates/{language}/proposal.md` where `{language}` is `output_config.language` from the context file.

Generate each section of the proposal:

### 1. Executive Summary (2-3 paragraphs)
- What the project is, who it's for, and why it matters
- Key differentiators or challenges
- High-level approach

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

### 7. Risks & Mitigations
- Identify 5-10 risks based on the project's constraints, scale, and complexity
- Rate each: Likelihood (Low/Medium/High) × Impact (Low/Medium/High)
- Provide concrete mitigation strategies

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
2. Write the proposal to `{output_config.output_dir}/deliverables/proposal/proposal.md` (default: `docs/architect/deliverables/proposal/proposal.md`)
3. Present a brief summary to the user: "Technical proposal generated at `path`. Key highlights: ..."
