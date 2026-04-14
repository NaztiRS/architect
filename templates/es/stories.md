# Historias de Usuario: {{project.name}}

**Fecha:** {{metadata.generated_at}}
**Total Épicas:** {{total_epics}}
**Total Historias:** {{total_stories}}
**Total Story Points:** {{total_points}}

---

## Matriz de Trazabilidad

| Requisito | Épica | Historias | Prioridad |
|----------|-------|----------|-----------|
{{traceability_matrix}}

---

{{#each epics}}

## Épica: {{epic.name}}

**Descripción:** {{epic.description}}
**Prioridad:** {{epic.priority}}
**Puntos Totales:** {{epic.total_points}}

{{#each epic.stories}}

### {{story.id}}: {{story.title}}

> Como **{{story.role}}**, quiero **{{story.action}}**, para **{{story.benefit}}**.

| Campo | Valor |
|-------|-------|
| Prioridad | {{story.priority}} |
| Story Points | {{story.points}} |
| Dependencias | {{story.dependencies}} |

**Criterios de Aceptación:**

{{#each story.acceptance_criteria}}
- **Dado** {{given}}
  **Cuando** {{when}}
  **Entonces** {{then}}
{{/each}}

**Definición de Hecho:**

{{#each story.definition_of_done}}
- [ ] {{item}}
{{/each}}

{{/each}}
