# User Stories: {{project.name}}

**Date:** {{metadata.generated_at}}
**Total Epics:** {{total_epics}}
**Total Stories:** {{total_stories}}
**Total Story Points:** {{total_points}}

---

## Traceability Matrix

| Requirement | Epic | Stories | Priority |
|------------|------|---------|----------|
{{traceability_matrix}}

---

{{#each epics}}

## Epic: {{epic.name}}

**Description:** {{epic.description}}
**Priority:** {{epic.priority}}
**Total Points:** {{epic.total_points}}

{{#each epic.stories}}

### {{story.id}}: {{story.title}}

> As a **{{story.role}}**, I want **{{story.action}}**, so that **{{story.benefit}}**.

| Field | Value |
|-------|-------|
| Priority | {{story.priority}} |
| Story Points | {{story.points}} |
| Dependencies | {{story.dependencies}} |

**Acceptance Criteria:**

{{#each story.acceptance_criteria}}
- **Given** {{given}}
  **When** {{when}}
  **Then** {{then}}
{{/each}}

**Definition of Done:**

{{#each story.definition_of_done}}
- [ ] {{item}}
{{/each}}

{{/each}}
