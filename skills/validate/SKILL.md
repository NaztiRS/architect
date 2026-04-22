---
name: validate
description: Static consistency check across all architect deliverables. Runs a deterministic Node script that reports missing formats, broken prototype links, orphan epic references, missing trace from requirements to stories, unrendered diagrams, and schema gaps.
argument-hint: "[docs-dir] [--json] [--strict]"
allowed-tools: "Read Bash"
---

## Your Mission

Run the built-in validator against the architect output and surface the report to the user. You are NOT expected to fix issues here — only run the script, read the report, and if issues exist, tell the user which skill/command to run to address each class of problem.

## Prerequisites

1. `docs/software-architect/` should exist (or the path passed in `$ARGUMENTS`). If missing, inform the user to run `/software-architect:analyze` or `/software-architect:deliver` first.
2. Node.js is available (preflight already verified it in the pipeline).

## Parse Arguments

From `$ARGUMENTS`:
- First positional that is not a flag → path to the docs directory (default: `docs/software-architect`)
- `--json` — emit machine-readable JSON instead of the human report
- `--strict` — warnings become failures (useful before hand-off to a client)

## Run

```bash
node "$CLAUDE_PLUGIN_ROOT/bin/validate.js" [docs-dir] [--json] [--strict]
```

The script returns exit code `0` when there are no failures (warnings allowed unless `--strict`), and `1` otherwise.

## What the validator checks

| Area | Checks |
|------|--------|
| **context** | `fa-context.json` parses; `project.name` and `project.description` present |
| **deliverables** | proposal / stories each exist in `.md` (fail if missing), `.docx`, `.pdf` (warn if missing — hint to run `/software-architect:render`) |
| **diagrams** | Count of ```` ```mermaid ```` fences in `proposal.md` matches rendered `.png` count in `diagrams/` |
| **stories** | Epics are declared; every `Epic: Ex` reference points to a declared epic; MoSCoW badges `[MUST]/[SHOULD]/[COULD]/[WON'T]` are used; every `FR-xxx` from the context is mentioned somewhere in `stories.md` |
| **prototype** | Every internal `<a href>` to an `.html` file resolves; every local `<img src>` resolves |
| **schema** | If `schema/` exists, `.mmd` + `.sql` + `.png` are all present |

## Interpret & Respond

Read the script's stdout. Pass it through verbatim to the user (don't re-format — the script already formats the report). Then add a short "next steps" block ONLY if there were failures or warnings:

- Failures in **deliverables** → run `/software-architect:deliver` or the specific skill (`/software-architect:proposal`, etc.)
- Failures in **diagrams** → run `/software-architect:diagrams`
- Failures in **prototype** (broken links) → re-run `/software-architect:prototype` or edit the HTML files manually
- Failures in **stories** (orphan epic, missing trace) → re-run `/software-architect:stories` after tightening `fa-context.json`
- Warnings for **DOCX/PDF missing** → run `/software-architect:render`
- Warnings for **schema incomplete** → run `/software-architect:schema`

If the script exits `0` with no warnings, respond with a single line:

> "✓ **Validation passed.** All deliverables, cross-references and prototype links check out."

If there are warnings but no failures:

> "⚠ **{N} warnings**, no failures. Ship-ready but review the warnings above."

If there are failures:

> "✗ **{N} failures, {M} warnings**. Fix the failures before treating this as a deliverable."
