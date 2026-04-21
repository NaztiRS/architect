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

### 3. Target Market & Ideal Client
- Who is the client, what industry, what makes them unique
- Brief context about their business model and market position
- Why this project matters to them specifically
- 1-2 paragraphs maximum

### 4. Understanding the Need
**Problem to Solve:**
- Bullet points describing specific pain points with concrete impact
- Each pain point should resonate with the decision-maker
- Example: "Conocimiento fragmentado y dependiente — la inteligencia del negocio reside en Excels pesados y en el conocimiento tácito del equipo."

### 5. Project Objectives
- Numbered list of clear, measurable objectives
- Each objective starts with a strong verb (Eliminar, Centralizar, Proteger, Sentar)
- Each objective is self-contained (understandable without context)
- 4-6 objectives maximum

### 6. Functional Scope

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

### 7. Detailed Functional Proposal

For each module, use this exact structure:

**MODULE N: [Name]**
- **Objective:** One sentence — what this module achieves for the business.
- **Trigger:** What event or action initiates this module.
- **Flow:** Step-by-step description of how it works (numbered steps). This is the "happy path" — what happens when everything goes right.
- **Development Tasks at High Level:** Numbered list of technical tasks needed to build this module (1.1, 1.2, 1.3...). Each task is 1-2 sentences.

Also include a subsection for **Business Rules and Approvals** if the project requires human-in-the-loop validation. Example: "The system will never publish, send to the end client, or move a quote to Approved status. It only injects Drafts that require a user click to advance."

### 8. Implementation Timeline

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

### 9. Technical Architecture

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

### 10. Proposed Team

| Role | Dedication | Responsibility |
|------|-----------|---------------|
| Solution Architect | X% | [brief] |
| Fullstack Developer | X% | [brief] |
| ... | ... | ... |

### 11. Budget (optional — depends on context)

| Concept | Amount |
|---------|--------|
| Development Phase 1 | [X] |
| Infrastructure (monthly) | [X] |
| ... | ... |

### 12. Support Service
- What support is included post-launch
- SLA terms if applicable
- Warranty period

### 13. Gantt Timeline (Mermaid — this is diagram 2 of 2)

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
