---
name: schema
description: Infer the project's domain data model from fa-context.json, user stories, and the proposal. Generates a Mermaid ER diagram (rendered to SVG/PNG) and a reference PostgreSQL DDL (schema.sql) with primary keys, foreign keys, indexes, and comments.
argument-hint: "[--dialect postgres|mysql|sqlite] [--no-render]"
allowed-tools: "Read Write Bash Glob"
---

You are operating as the **solution-architect** agent. This skill produces a first-pass data model that can be iterated with the client — not a production schema, but a defensible starting point the team can refine.

## Your Mission

Read the project's context and functional artifacts, infer the domain entities and their relationships, and emit three artifacts:

1. `docs/software-architect/schema/er-diagram.mmd` — Mermaid `erDiagram` source
2. `docs/software-architect/schema/er-diagram.{svg,png}` — rendered images
3. `docs/software-architect/schema/schema.sql` — reference DDL (PostgreSQL by default)
4. `docs/software-architect/schema/README.md` — one paragraph per entity explaining purpose and key invariants

## Prerequisites

1. `fa-context.json` must exist (check `docs/software-architect/fa-context.json` then project root). If missing: "No project context found. Run `/software-architect:analyze` first." Stop.
2. Strongly preferred (not required):
   - `docs/software-architect/deliverables/proposal/proposal.md` — modules describe entities implicitly
   - `docs/software-architect/deliverables/stories/stories.md` — epics map to entity clusters
3. If both proposal and stories are missing, work only from `fa-context.json` and flag in the output that the schema is less grounded.

## Parse Arguments

- `--dialect postgres|mysql|sqlite` — SQL dialect for `schema.sql` (default `postgres`)
- `--no-render` — skip mmdc rendering (emit only `.mmd` and `.sql`). Use when mmdc/Chrome are unavailable or for speed.

## Entity Inference Process

### Step 1 — Collect candidates

Scan these sources in order and collect entity candidates (nouns that hold state):

| Source | What to extract |
|--------|-----------------|
| `fa-context.json` → `audience.user_roles` | Each role suggests a `user` with a `role` attribute, or separate tables only if roles differ structurally |
| `fa-context.json` → `requirements.functional` | Nouns in "user can X the [entity]" phrasing |
| `fa-context.json` → `integrations` | External systems often imply mirror/cache tables (`external_customers`, `sync_log`) |
| `proposal.md` → each module's **Flow** section | Entities mentioned repeatedly across steps |
| `stories.md` → each epic | Epics like "Task Management" → `task`, "Authentication" → `user`, `session` |

**Deduplicate aggressively.** Merge synonyms (`customer`/`client`, `item`/`product`). If a concept appears once and passively, drop it.

### Step 2 — Decide what deserves a table

Keep an entity only if it satisfies at least one:

- It has identity (you'd reference it by ID from elsewhere)
- It has lifecycle (create, update, delete, archive)
- Multiple entities link to it

Drop it if it's:
- Purely computed (`total_price` is a column, not a table)
- Ephemeral (a one-shot modal form's state)
- A config constant (enum values belong in CHECK constraints, not a table, unless they need metadata)

### Step 3 — Assign attributes

For each entity, define:

- **Primary key** — prefer `id BIGSERIAL` (or `UUID` for distributed/public-facing IDs)
- **Timestamps** — every table gets `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- **Soft delete** — add `deleted_at TIMESTAMPTZ` only if stories mention restore/archive/undo. Otherwise omit.
- **Domain columns** — only what's justified by the stories/modules. No speculative columns.
- **Nullability** — be strict. `NOT NULL` by default; nullable only when the story explicitly allows absence.
- **Uniqueness** — add UNIQUE constraints where the domain demands it (email, slug, external IDs).

### Step 4 — Relationships

For each pair of entities, ask: *"When I have an X, do I need to find its Y's? When I have a Y, do I need to know its X?"*

- **1:1** — rare; usually you can merge into one table.
- **1:N** — add `x_id` FK on the N side (e.g. `task.project_id`).
- **N:M** — add a join table `xy` with `x_id`, `y_id`, composite PK, and any link attributes (e.g. `user_project.role`).

Every FK column:
- Has an index (unless it's already the PK or part of one).
- Has an `ON DELETE` rule chosen intentionally: `CASCADE` for ownership (project → tasks), `RESTRICT` for shared references (user → audit_log), `SET NULL` for optional pointers.

### Step 5 — Emit artifacts

Now produce the four files.

## Output 1 — `er-diagram.mmd`

Use Mermaid `erDiagram`. Keep it readable — don't dump every column, only the ones that drive relationships or identify the entity.

```
erDiagram
    USER ||--o{ PROJECT : "owns"
    PROJECT ||--o{ TASK : "contains"
    USER }o--o{ PROJECT : "member_of"

    USER {
        bigserial id PK
        text email UK
        text name
        timestamptz created_at
    }

    PROJECT {
        bigserial id PK
        bigint owner_id FK
        text name
        text slug UK
        timestamptz created_at
    }

    TASK {
        bigserial id PK
        bigint project_id FK
        text title
        text status
        timestamptz due_at
    }
```

Cardinality notation:
- `||--||` one-to-one
- `||--o{` one-to-many (one required on the left, zero-or-many on the right)
- `}o--o{` many-to-many

Label every relationship verbally (`"owns"`, `"contains"`, `"member_of"`). Empty labels are forbidden.

## Output 2 — Render to SVG/PNG

Unless `--no-render` was passed, render with the existing script. Ensure Chrome is detected the same way as the `diagrams` skill (set `PUPPETEER_EXECUTABLE_PATH` before invoking).

```bash
node "$CLAUDE_PLUGIN_ROOT/bin/render-diagrams.js" \
  "docs/software-architect/schema/er-diagram.mmd" \
  "docs/software-architect/schema" \
  neutral
```

This produces `er-diagram.svg` and `er-diagram.png` alongside the `.mmd` source.

**Fallback if mmdc is missing:** try the `mermaid.ink` API the same way `skills/diagrams/SKILL.md` does. If both fail, leave only the `.mmd` file and warn the user — the markdown diagram is still shippable.

## Output 3 — `schema.sql`

Write a complete, runnable DDL file. PostgreSQL by default. Structure:

```sql
-- {{project.name}} — Reference schema (PostgreSQL)
-- Generated by architect. Treat as a starting point, not a production-ready migration.

BEGIN;

-- ============================================================================
-- Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- only if UUIDs are used

-- ============================================================================
-- Tables
-- ============================================================================

-- <entity_name>: one-line purpose
CREATE TABLE user (
    id          BIGSERIAL PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('admin', 'team-lead', 'developer', 'viewer')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- project: top-level container owned by exactly one user
CREATE TABLE project (
    id          BIGSERIAL PRIMARY KEY,
    owner_id    BIGINT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_project_owner_id ON project(owner_id);

-- task: work item inside a project
CREATE TABLE task (
    id          BIGSERIAL PRIMARY KEY,
    project_id  BIGINT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
    due_at      TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_task_project_id ON task(project_id);
CREATE INDEX idx_task_status ON task(status);

-- N:M link: users that belong to a project with a role
CREATE TABLE project_member (
    project_id  BIGINT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);
CREATE INDEX idx_project_member_user_id ON project_member(user_id);

-- ============================================================================
-- Touch updated_at triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER touch_user_updated_at   BEFORE UPDATE ON user   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_project_updated_at BEFORE UPDATE ON project FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_task_updated_at   BEFORE UPDATE ON task   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;
```

Rules:
- **Wrap in `BEGIN; ... COMMIT;`** so it applies atomically when a DBA runs it.
- **Single-line comments above each table** explaining its purpose.
- **CHECK constraints for enums** — never invent a `role` or `status` table unless the domain needs extra metadata.
- **Every FK gets an index** on the owning side (unless it's the leading column of the PK).
- **Touch trigger for `updated_at`** on every table that has the column.
- **Dialect variations:**
  - `mysql` → `BIGINT AUTO_INCREMENT`, no CHECK (use ENUM), `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` replaces the trigger.
  - `sqlite` → `INTEGER PRIMARY KEY AUTOINCREMENT`, `TEXT` for timestamps (ISO8601), CHECK constraints OK.

Reserved-word safety: if an entity name collides with a SQL keyword (`user`, `order`, `group`), add a suffix in SQL (`app_user`) but keep the bare name in the ER diagram.

## Output 4 — `README.md`

One paragraph per entity. Format:

```markdown
# {{project.name}} — Data Model

Inferred from `fa-context.json` plus the proposal and stories. Reference model, not a production migration. The team should review nullability, tenancy (is everything scoped to an `organization_id`?), and soft-delete semantics before implementing.

**Dialect:** PostgreSQL
**Entities:** {N}   **Relationships:** {M}

## Entities

### `user`
Authenticates and owns or belongs to projects. Email is unique and doubles as login identifier. Role governs global permissions.

### `project`
Top-level container for tasks. Owned by one user (`owner_id`) and optionally shared with others via `project_member`. Slug is used in URLs and must be unique globally.

### `task`
Work item inside a project. Status transitions through `backlog → in_progress → review → done`. Deletion cascades from project.

### `project_member`
Join table that grants users access to a project they don't own, with a per-project role.

## Open questions for the team

- Is there multi-tenancy? (No `organization_id` assumed yet.)
- Do tasks need assignees? (Not in the analyzed stories; add `assignee_id` FK if yes.)
- Do projects need archival vs hard delete? (No soft-delete assumed.)
```

The **Open questions** section is mandatory — every schema has uncertainty; surface it instead of guessing.

## Execution Summary

After generating all four files, report:

> "**Schema generated.**
>
> | Artifact | Location |
> |----------|----------|
> | ER diagram (Mermaid) | `docs/software-architect/schema/er-diagram.mmd` |
> | ER diagram (SVG + PNG) | `docs/software-architect/schema/er-diagram.{svg,png}` |
> | Reference DDL | `docs/software-architect/schema/schema.sql` |
> | Entity notes | `docs/software-architect/schema/README.md` |
>
> **Entities:** {N}   **Relationships:** {M}   **Dialect:** {dialect}
>
> Review the *Open questions* section in the README before handing the schema to engineering."

## Windows Notes

- Always set `PUPPETEER_EXECUTABLE_PATH` before invoking `render-diagrams.js`.
- Use forward slashes in paths; Git Bash converts them.
- Never heredoc the `.sql` file — use the Write tool.
