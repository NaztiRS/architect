# Style Reference — Proposal Generation

This document defines the tone, density, and structure that the proposal skill must follow.

## Tone & Density

- **Professional and direct.** Every sentence must add value. No filler, no academic language.
- **Narrative but structured.** Use prose for context and explanations, tables for data, lists for specifications.
- **Assume the reader is a decision-maker,** not a developer. They care about: what problem you solve, how you solve it, what they get, when they get it, what they need to provide, and what it costs.
- **Be specific.** "Eliminar el 100% de la entrada manual" is better than "mejorar los procesos".
- **Quantify when possible.** Weeks, percentages, counts, team sizes.

## Document Length

- Target: 15-20 pages for a medium project, 10-15 for small, 20-30 for large/enterprise.
- If a section can be said in 3 lines, don't use 10.

## Diagrams

- **Maximum 2 diagrams** in the entire proposal:
  1. Architecture overview (system/component diagram)
  2. Timeline Gantt (phases and milestones)
- No wireframes, no flow diagrams, no scoring tables in the proposal.

## Structure

The proposal must follow this exact structure, adapting section depth to project scale:

### 1. Cover Page
- Project name / ecosystem name
- Client name
- Date and version

### 2. Index / Table of Contents
- Numbered sections with page references

### 3. Executive Summary

**Mandatory page.** This is what a busy decision-maker reads if they read nothing else. One page maximum. Lives on page 2 of the PDF, right after the cover.

Emit this section using the exact HTML block below (the template's CSS styles it as a distinguished card). Replace the placeholders with project-specific values derived from `fa-context.json`:

```html
<div class="exec-summary">
  <div class="exec-summary-header">
    <h2>Executive Summary</h2>
    <span class="exec-summary-tag">Page 2 · 90-second read</span>
  </div>
  <div class="exec-summary-grid">
    <div class="exec-summary-block">
      <span class="exec-summary-label">Problem</span>
      <p>[One sentence: the specific pain this project addresses. No generalities.]</p>
    </div>
    <div class="exec-summary-block">
      <span class="exec-summary-label">Solution</span>
      <p>[One sentence: how we solve it. Name the approach, not the tech stack.]</p>
    </div>
  </div>
  <div class="exec-summary-metrics">
    <div class="exec-metric">
      <span class="exec-metric-value">[N] weeks</span>
      <span class="exec-metric-label">Timeline</span>
    </div>
    <div class="exec-metric">
      <span class="exec-metric-value">[€/$ X]</span>
      <span class="exec-metric-label">Investment</span>
    </div>
    <div class="exec-metric">
      <span class="exec-metric-value">[N] people</span>
      <span class="exec-metric-label">Team</span>
    </div>
    <div class="exec-metric">
      <span class="exec-metric-value">[N]</span>
      <span class="exec-metric-label">Milestones</span>
    </div>
  </div>
  <div class="exec-summary-kpis">
    <span class="exec-summary-label">Success criteria</span>
    <ul>
      <li>[KPI 1 with a target number — e.g., "Reduce manual quote time by 70%"]</li>
      <li>[KPI 2 — e.g., "Zero human intervention in standard flows by Sprint 3"]</li>
      <li>[KPI 3 — e.g., "Onboarding of a new client in &lt; 1 day"]</li>
    </ul>
  </div>
  <div class="exec-summary-why">
    <span class="exec-summary-label">Why this, why now</span>
    <p>[Two sentences max. The window of opportunity or the cost of inaction.]</p>
  </div>
</div>
```

Rules for writing the content:
- **Problem** and **Solution** are exactly one sentence each. If you need two sentences, you are not being specific enough.
- **Metrics** are concrete — no ranges, no "~", no "approximately" here. If you don't have the number yet, write "TBD" — never invent.
- **Success criteria** must be measurable. "Improve UX" is not a KPI. "Cut page load to <1.5s" is.
- **Why now** answers: what breaks if we wait six months? Or: what opportunity closes?

### 4. Target Market & Ideal Client
- Who is the client, what industry, what makes them unique
- Brief context about their business model and market position
- Why this project matters to them specifically
- 1-2 paragraphs maximum

### 5. Understanding the Need
**Problem to Solve:**
- Bullet points describing specific pain points with concrete impact
- Each pain point should resonate with the decision-maker
- Example: "Conocimiento fragmentado y dependiente — la inteligencia del negocio reside en Excels pesados y en el conocimiento tácito del equipo."

### 6. Project Objectives
- Numbered list of clear, measurable objectives
- Each objective starts with a strong verb (Eliminar, Centralizar, Proteger, Sentar)
- Each objective is self-contained (understandable without context)
- 4-6 objectives maximum

### 7. Functional Scope

**6.1 In Scope:**
Brief introduction paragraph, then list each module/feature area as a subsection.

**6.2 Out of Scope:**
Bullet list of what is explicitly NOT included. This manages expectations and prevents scope creep. Be specific: "No se procesarán Excels históricos que no sigan una estructura mínima."

**6.3 Preconditions:**
What the client MUST provide or guarantee for the project to succeed. Each precondition should explain the consequence if not met. Example:
- "Aprobación del Sprint 0: Ningún desarrollo comenzará hasta que el cliente valide y firme formalmente los entregables del Sprint 0."
- "Acceso a APIs: El cliente debe facilitar credenciales con permisos de administrador/desarrollador para [list systems]."

**6.4 Assumptions:**
What you assume to be true. If an assumption is wrong, it triggers a change request. Example:
- "Se asume que la API REST oficial de [system] expone los endpoints necesarios para crear y modificar [entities]."
- "Se asume que los documentos entrantes son PDFs de texto seleccionable o escaneos con buena resolución."

### 8. Detailed Functional Proposal

For each module, use this exact structure:

**MODULE N: [Name]**
- **Objective:** One sentence — what this module achieves for the business.
- **Trigger:** What event or action initiates this module.
- **Flow:** Step-by-step description of how it works (numbered steps). This is the "happy path" — what happens when everything goes right.
- **Development Tasks at High Level:** Numbered list of technical tasks needed to build this module (1.1, 1.2, 1.3...). Each task is 1-2 sentences.

Also include a subsection for **Business Rules and Approvals** if the project requires human-in-the-loop validation. Example: "The system will never publish, send to the end client, or move a quote to Approved status. It only injects Drafts that require a user click to advance."

### 9. Implementation Timeline

**Total Estimated Duration:** [X] weeks/months.
**Methodology:** Iterative sprints of [X] weeks.

For each milestone:

**MILESTONE N: [Name] — Sprint [X]**
- **Duration:** Weeks [start]-[end]
- **Deliverables:** Bullet list of what is delivered
- **Acceptance Criteria (UAT):** Specific test scenario that the client will execute to validate.
- **Responsible:**
  - Provider: [roles]
  - Client: [roles and actions required]

Include a note: "This is a high-level timeline. Specific dates will be defined in coordination with the client, based on the effective start date."

### 10. Technical Architecture

Brief description of the architectural approach (1-2 paragraphs). Mention: cloud-native, API-first, security model.

**Architecture Diagram** (Mermaid — this is diagram 1 of 2)

**Technology Stack Table:**

| Layer/Module | Selected Technology | Discarded Alternative | Justification |
|-------------|--------------------|-----------------------|---------------|
| Orchestration | [tech] | [alt] | [why] |
| Database | [tech] | [alt] | [why] |
| Frontend | [tech] | [alt] | [why] |
| AI Engine | [tech] | [alt] | [why] |
| ... | ... | ... | ... |

**Planned Integrations:**
List of external systems with brief description of what data flows.

**Infrastructure & Environments:**
- Development/staging: managed by provider
- Production: specify hosting, VMs, storage
- Estimated monthly cost for infrastructure (if applicable)

### 11. Proposed Team

| Role | Dedication | Responsibility |
|------|-----------|---------------|
| Solution Architect | X% | [brief] |
| Fullstack Developer | X% | [brief] |
| ... | ... | ... |

### 12. Budget (optional — depends on context)

| Concept | Amount |
|---------|--------|
| Development Phase 1 | [X] |
| Infrastructure (monthly) | [X] |
| ... | ... |

### 13. Risk Register (MANDATORY)

Risks are surfaced both as a **visual heatmap** (5×5 probability × impact grid) and as a **detailed table**. Emit the exact HTML block below — the template's CSS handles the heatmap layout; the DOCX renderer converts it to a table with severity-colored cells.

Scoring scale (both axes, 1–5):

| Value | Probability | Impact |
|-------|-------------|--------|
| 1 | Rare | Negligible |
| 2 | Unlikely | Minor |
| 3 | Possible | Moderate |
| 4 | Likely | Major |
| 5 | Almost certain | Severe |

Severity = probability × impact. Cells 1–4 are **low** (green), 5–9 **medium** (yellow), 10–14 **high** (orange), 15–25 **critical** (red).

```html
<div class="risk-register">
  <div class="risk-register-header">
    <h2>Risk Register</h2>
    <span class="risk-register-tag">[N] risks identified</span>
  </div>

  <div class="risk-matrix-wrapper">
    <div class="risk-matrix-ylabel">Impact →</div>
    <div class="risk-matrix">
      <!-- 5x5 grid. Each cell may contain one or more <span class="risk-marker">R1</span>.
           Cells are generated from (prob=1..5, impact=1..5). Impact is the Y axis (rows),
           probability is the X axis (columns). Row 1 (top) = impact 5, row 5 (bottom) = impact 1. -->
      <div class="risk-cell sev-med" data-cell="1-5"></div>
      <div class="risk-cell sev-high" data-cell="2-5"></div>
      <div class="risk-cell sev-high" data-cell="3-5"><span class="risk-marker">R1</span></div>
      <div class="risk-cell sev-crit" data-cell="4-5"></div>
      <div class="risk-cell sev-crit" data-cell="5-5"></div>

      <div class="risk-cell sev-low" data-cell="1-4"></div>
      <div class="risk-cell sev-med" data-cell="2-4"></div>
      <div class="risk-cell sev-high" data-cell="3-4"><span class="risk-marker">R2</span></div>
      <div class="risk-cell sev-high" data-cell="4-4"></div>
      <div class="risk-cell sev-crit" data-cell="5-4"></div>

      <div class="risk-cell sev-low" data-cell="1-3"></div>
      <div class="risk-cell sev-med" data-cell="2-3"><span class="risk-marker">R3</span></div>
      <div class="risk-cell sev-med" data-cell="3-3"></div>
      <div class="risk-cell sev-high" data-cell="4-3"></div>
      <div class="risk-cell sev-high" data-cell="5-3"></div>

      <div class="risk-cell sev-low" data-cell="1-2"></div>
      <div class="risk-cell sev-low" data-cell="2-2"></div>
      <div class="risk-cell sev-med" data-cell="3-2"></div>
      <div class="risk-cell sev-med" data-cell="4-2"></div>
      <div class="risk-cell sev-high" data-cell="5-2"></div>

      <div class="risk-cell sev-low" data-cell="1-1"></div>
      <div class="risk-cell sev-low" data-cell="2-1"></div>
      <div class="risk-cell sev-low" data-cell="3-1"></div>
      <div class="risk-cell sev-med" data-cell="4-1"></div>
      <div class="risk-cell sev-med" data-cell="5-1"></div>
    </div>
    <div class="risk-matrix-xlabel">Probability →</div>
  </div>

  <table class="risk-table">
    <thead>
      <tr>
        <th>ID</th><th>Risk</th><th>Prob</th><th>Impact</th><th>Severity</th><th>Mitigation</th><th>Owner</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>R1</strong></td>
        <td>[Risk description — one sentence, concrete, not a generality]</td>
        <td>3</td><td>5</td>
        <td><span class="sev-badge sev-high">High</span></td>
        <td>[Concrete mitigation: what will be done, when, by whom]</td>
        <td>[Role or name]</td>
      </tr>
      <!-- repeat per risk -->
    </tbody>
  </table>
</div>
```

Rules for writing risks:

- **5–10 risks total.** Fewer than 5 = you're being optimistic. More than 10 = you're padding.
- **Each risk is one sentence,** concrete and specific to this project. Not "technical complexity" — instead "The third-party API returns inconsistent entity IDs between test and prod, detected in discovery call".
- **Probability and impact are integers 1–5.** If the team can't agree on 3 vs 4, pick the higher.
- **Mitigation is an action, not a hope.** "Monitor carefully" is not mitigation. "Deploy canary at 5% for 48h before full rollout" is.
- **Owner is a role or name,** never "the team".
- **Markers in the matrix** must match the IDs in the table (R1..Rn). Place each risk in its (prob, impact) cell.

### 14. Support Service
- What support is included post-launch
- SLA terms if applicable
- Warranty period

### 15. Gantt Timeline (Mermaid — this is diagram 2 of 2)

A visual Gantt chart showing all milestones, their duration, and dependencies.

---

## Language Adaptation

- If `output_config.language` is `es`: Write in professional Spanish. Technical terms stay in English (API, Sprint, UAT, CRM, etc.)
- If `output_config.language` is `en`: Write in professional English.

## What NOT to Include in the Proposal

- User stories (those go in stories deliverable)
- Wireframes or mockups (those go in prototype)
- Detailed task breakdowns (those go in todo deliverable)
- Flow diagrams per module (keep it narrative)
