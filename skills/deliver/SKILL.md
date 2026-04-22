---
name: deliver
description: Run the complete architect pipeline — analyze requirements, generate technical proposal, user stories, HTML prototype, and export all deliverables. Accepts a requirements document or starts interactive Q&A.
argument-hint: "[ruta-documento] [--no-review] [--lang en|es]"
allowed-tools: "Read Write Bash Glob Agent"
context: fork
effort: high
---

## Your Mission

Orchestrate the full architect pipeline. Generate all deliverables directly in this session — only use subagents for truly parallel work (proposal+stories+prototype).

## Expected Output Structure

**MANDATORY — every step must write to these exact paths.** If a path doesn't match, the step is incorrect.

```
docs/software-architect/
├── fa-context.json                        ← Step 1 (deleted in Step 7)
├── README.md                              ← Step 6
├── prototype/
│   └── index.html                         ← Step 3
├── schema/
│   ├── er-diagram.mmd                     ← Step 5
│   ├── er-diagram.svg                     ← Step 7 (render)
│   ├── er-diagram.png                     ← Step 7 (render)
│   ├── schema.sql                         ← Step 5
│   └── README.md                          ← Step 5
├── diagrams/
│   ├── architecture-overview.svg          ← Step 7
│   ├── architecture-overview.png          ← Step 7
│   ├── proposal-timeline.svg              ← Step 7
│   └── proposal-timeline.png              ← Step 7
└── deliverables/
    ├── proposal/
    │   ├── proposal.md                    ← Step 2
    │   ├── proposal.docx                  ← Step 7
    │   └── proposal.pdf                   ← Step 7
    ├── stories/
    │   ├── stories.md                     ← Step 2
    │   ├── stories.docx                   ← Step 7
    │   └── stories.pdf                    ← Step 7
```

**Rules:**
- Steps 2 must create `deliverables/{name}/` directories before writing
- Step 4 must create `schema/` directory before writing
- Step 7 must create `diagrams/` directory before writing
- Steps 2, 4, 5, 6 must verify their output files exist after writing (use Glob or Bash `ls`)
- The only `.md` files in the root of `docs/software-architect/` are `README.md` and `fa-context.json`

## Pipeline

```
0. preflight → check environment, install tools
1. analyze   → fa-context.json
2. proposal  ──parallel──  stories       (subagents: only parallel pair)
   ↳ verify: deliverables/proposal/proposal.md + deliverables/stories/stories.md exist
3. prototype                              (subagent)
   ↳ verify: prototype/index.html exists
4. schema                                (direct, no subagent)
   ↳ verify: schema/er-diagram.mmd + schema/schema.sql exist
5. export                                (direct, no subagent)
   ↳ verify: README.md exists
6. diagrams + render                     (direct, no subagent)
   ↳ verify: diagrams/*.png + deliverables/*/*.pdf + deliverables/*/*.docx exist
7. validate  → consistency gate          (runs bin/validate.js)
   ↳ if failures: auto-fix loop (up to 2 retries)
8. cleanup   → optionally uninstall tools
```

## Parse Arguments

From `$ARGUMENTS`, extract:
- **Document path** — any argument that looks like a file path (contains `/` or `.` extension)
- **--no-review** — if present, skip review checkpoints between steps
- **--lang en|es** — override output language (otherwise determined during analyze)
- **--keep-tools** — if present, skip the cleanup question at the end

## Step 0: Preflight Check

Run ALL checks at once before starting any work. This prevents late failures.

### 0.1 Check Node.js/npm

```bash
node --version 2>/dev/null && npm --version 2>/dev/null
```

**If NOT found — STOP:**
> "❌ **Node.js is required.** This plugin needs Node.js to render diagrams, generate PDFs and DOCX files.
>
> Please install it from: https://nodejs.org/
>
> Once installed, run `/software-architect:deliver` again."

**Do not continue without Node.js.** The pipeline cannot produce quality deliverables without it.

### 0.2 Detect Google Chrome (REQUIRED)

**Google Chrome is a hard prerequisite.** It is used by:
- **mmdc** (mermaid-cli) — to render Mermaid diagrams as images
- **puppeteer** — to generate PDF from HTML

Without Chrome, diagrams and PDF cannot be generated locally.

```bash
# Windows
CHROME_PATH=""
for p in \
  "/c/Program Files/Google/Chrome/Application/chrome.exe" \
  "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
  "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe"; do
  if [ -f "$p" ]; then CHROME_PATH="$p"; break; fi
done

# Mac/Linux
if [ -z "$CHROME_PATH" ]; then
  CHROME_PATH=$(which google-chrome || which chromium-browser || which chrome || echo "")
fi
```

**If Chrome is NOT found — STOP:**
> "❌ **Google Chrome is required** for diagram rendering and PDF generation.
>
> Please install it from: https://www.google.com/chrome/
>
> Once installed, run `/software-architect:deliver` again."

**Do not continue without Chrome.** It is needed by mmdc and puppeteer.

**If Chrome IS found:**
```bash
echo "Chrome found: $CHROME_PATH"
export PUPPETEER_EXECUTABLE_PATH="$CHROME_PATH"
```

**CRITICAL:** The `PUPPETEER_EXECUTABLE_PATH` variable MUST be set to the system Chrome path. This:
1. Prevents mmdc and puppeteer from downloading their own Chromium (~120MB)
2. Must be set BEFORE `npm install` (puppeteer checks on install)
3. Must be set BEFORE every call to `mmdc` or any puppeteer script

### 0.3 Check/Install Rendering Tools

The plugin declares its dependencies in `package.json` (inside the plugin directory). All tools (`mmdc`, `puppeteer`, `docx`) are installed **locally** in `<plugin-dir>/node_modules/`, never globally.

Check if already installed:

```bash
PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$0")")}"
[ -d "$PLUGIN_DIR/node_modules" ] && echo "deps: ✅" || echo "deps: ❌"
```

**If missing**, inform the user and install in a single step:

> "**Environment check:**
> - Node.js: ✅ v[X]
> - Chrome: ✅ [path]
> - Plugin dependencies: ❌
>
> I'll install them now (locally in the plugin directory, not globally). At the end I'll ask if you want to keep them or remove them."

Install **once** inside the plugin directory:

```bash
export PUPPETEER_EXECUTABLE_PATH="[detected Chrome path]"
cd "$PLUGIN_DIR" && npm install
```

`PUPPETEER_EXECUTABLE_PATH` must be set BEFORE `npm install` so puppeteer skips downloading Chromium (~120MB).

Set `tools_installed_by_us = true`.

### 0.4 Summary

After all checks, display a single status report:
> "**Preflight complete:**
> | Component | Status |
> |-----------|--------|
> | Node.js | ✅ v[X] |
> | Chrome | ✅ [path] |
> | Plugin deps (mmdc + puppeteer + docx) | ✅ |
>
> Ready to begin analysis."

## Step 1: Analyze

Invoke the analyze skill logic directly (no subagent needed):
- If a document path was provided, read it and pass to analyze
- If no document, start interactive Q&A (ask if user has documentation first)
- Wait until `fa-context.json` is generated

After completion, inform the user:
> "✅ **Analysis complete.** Context saved to `docs/software-architect/fa-context.json`.
> Completeness: [X]%. [Missing items if any].
> Next: generating technical proposal and user stories..."

## Step 2: Proposal + Stories (Parallel Subagents)

These two are independent and benefit from parallelization. Use the Agent tool:

- **Agent 1:** Generate proposal following `skills/proposal/SKILL.md` logic
- **Agent 2:** Generate stories following `skills/stories/SKILL.md` logic

Both read from the same `fa-context.json`. They don't depend on each other.

**CRITICAL:** Both agents MUST write to `deliverables/` subdirectories:
- Proposal → `docs/software-architect/deliverables/proposal/proposal.md`
- Stories → `docs/software-architect/deliverables/stories/stories.md`

Pass this instruction explicitly to each subagent prompt.

After both complete, **verify output**:

```bash
ls -la docs/software-architect/deliverables/proposal/proposal.md docs/software-architect/deliverables/stories/stories.md
```

If either is missing from the expected path, check if it was written to the wrong location (e.g., root of `docs/software-architect/`). If so, move it:

```bash
mkdir -p docs/software-architect/deliverables/proposal
mkdir -p docs/software-architect/deliverables/stories
mv docs/software-architect/proposal.md docs/software-architect/deliverables/proposal/proposal.md 2>/dev/null
mv docs/software-architect/stories.md docs/software-architect/deliverables/stories/stories.md 2>/dev/null
```

> "✅ **Proposal and stories generated.**
> - Proposal: `docs/software-architect/deliverables/proposal/proposal.md` — [brief summary]
> - Stories: `docs/software-architect/deliverables/stories/stories.md` — [X] epics, [Y] stories, [Z] points"

**Review checkpoint** (skip if `--no-review`):
> "Would you like to review these before continuing? (yes/no)"

## Step 3: Prototype (Subagent)

Generate the prototype using a subagent:

- **Agent:** Generate prototype following `skills/prototype/SKILL.md` logic. Uses `stories.md` from Step 2.

After completion:
> "✅ **Prototype generated.**
> - Prototype: `docs/software-architect/prototype/index.html` — [X] pages. Open in browser to navigate."

**Review checkpoint** (skip if `--no-review`):
> "Would you like to review before continuing? (yes/no)"

## Step 4: Schema (Direct — No Subagent)

Generate the reference data model following `skills/schema/SKILL.md` logic. Reads `fa-context.json`, `proposal.md` and `stories.md` to infer entities + relationships, and emits:

- `docs/software-architect/schema/er-diagram.mmd` (Mermaid erDiagram source)
- `docs/software-architect/schema/schema.sql` (reference DDL, PostgreSQL by default)
- `docs/software-architect/schema/README.md` (entity notes + open questions)

Rendering of the ER diagram happens in Step 6 together with the proposal diagrams (single `render-diagrams.js` pass over all `.mmd` files).

**CRITICAL:** Create `schema/` directory before writing. Verify after:

```bash
mkdir -p docs/software-architect/schema
```

After completion, **verify output**:

```bash
ls docs/software-architect/schema/er-diagram.mmd docs/software-architect/schema/schema.sql
```

If `.mmd` or `.sql` ended up elsewhere (e.g., as `er-diagram.md` instead of `er-diagram.mmd`), rename them.

> "✅ **Schema generated.** {N} entities, {M} relationships — `docs/software-architect/schema/`."

## Step 5: Export (Direct — No Subagent)

Consolidate deliverables directly following `skills/export/SKILL.md` logic. Simple file aggregation — no subagent needed.

## Step 6: Diagrams + Render (Direct — No Subagent)

Run both directly in this session:

1. **Diagrams:** Extract the 2 Mermaid diagrams from proposal.md plus the ER diagram from `docs/software-architect/schema/er-diagram.mmd` (if Step 4 produced one), and render them all as SVG/PNG following `skills/diagrams/SKILL.md` logic. The ER diagram renders in place — its outputs live under `docs/software-architect/schema/`.
2. **Render:** Generate DOCX and PDF for each deliverable independently following `skills/render/SKILL.md` logic

**IMPORTANT:** Before calling mmdc or any puppeteer script, ensure `PUPPETEER_EXECUTABLE_PATH` is set:
```bash
export PUPPETEER_EXECUTABLE_PATH="[Chrome path from Step 0]"
```

**IMPORTANT:** Create the diagrams directory before rendering:
```bash
mkdir -p docs/software-architect/diagrams
```

After rendering, **verify all expected files exist**:

```bash
echo "=== Diagrams ==="
ls docs/software-architect/diagrams/*.png docs/software-architect/diagrams/*.svg 2>/dev/null || echo "NO DIAGRAM IMAGES FOUND"
echo "=== Deliverables ==="
for name in proposal stories; do
  echo "--- $name ---"
  ls docs/software-architect/deliverables/$name/$name.{md,docx,pdf} 2>/dev/null || echo "  MISSING FILES for $name"
done
echo "=== Schema ==="
ls docs/software-architect/schema/er-diagram.{mmd,png,svg} docs/software-architect/schema/schema.sql 2>/dev/null || echo "MISSING SCHEMA FILES"
```

If any files are missing, report which ones and attempt to re-run the specific sub-step before continuing.

Delete the internal context file now that all deliverables are produced:

```bash
rm docs/software-architect/fa-context.json
```

After completion:
> "✅ **All deliverables generated and exported.**
>
> ## Summary
>
> | Deliverable | MD | DOCX | PDF |
> |------------|-----|------|-----|
> | Technical Proposal | `deliverables/proposal/proposal.md` | ✅/❌ | ✅/❌ |
> | User Stories | `deliverables/stories/stories.md` | ✅/❌ | ✅/❌ |
>
> | Other | Status | Location |
> |-------|--------|----------|
> | HTML Prototype | ✅ | `docs/software-architect/prototype/index.html` |
> | Diagram Images | ✅ | `docs/software-architect/diagrams/` |
> | Data Model (ER + SQL) | ✅/❌ | `docs/software-architect/schema/` |
> | Index | ✅ | `docs/software-architect/README.md` |
>
> Open `docs/software-architect/prototype/index.html` in your browser to see the prototype.
> Read `docs/software-architect/README.md` for the full deliverables index."

## Step 7: Validate + Auto-Fix Loop

Run the built-in validator. If it finds failures, **automatically retry** the failing areas up to 2 times before reporting to the user.

### 8.1 Run Validation

```bash
node "$CLAUDE_PLUGIN_ROOT/bin/validate.js" "docs/software-architect"
```

Note: `fa-context.json` has already been deleted in Step 7. The validator treats a missing `fa-context.json` as a **warning**, not a failure.

### 8.2 If Exit Code 0

Validation passed. Proceed to Step 8 (cleanup).

> "✅ **Validation: {N} ok, {M} warnings, {K} failures.**"

### 8.3 If Exit Code 1 — Auto-Fix Loop

Parse the validator output to identify which areas failed. For each failing area, take corrective action:

| Failing Area | Auto-Fix Action |
|---|---|
| `deliverables` folder missing | Create `deliverables/{proposal,stories}/` and move any root-level `.md` files into them |
| `deliverables/*` .md missing | The corresponding skill (proposal/stories) failed — **cannot auto-fix**, report to user |
| `deliverables/*` .docx or .pdf missing | Re-run the render pipeline for that specific deliverable using `bin/build-report-html.js`, `bin/generate-pdf.js`, `bin/generate-docx.js` |
| `diagrams` missing PNG/SVG | Re-run diagram rendering: extract Mermaid from `deliverables/proposal/proposal.md` and render with `bin/render-diagrams.js` or mermaid.ink fallback |
| `schema` missing PNG | Re-run ER diagram rendering with `bin/render-diagrams.js` |
| `prototype` broken links | Check prototype HTML and fix broken navigation links |
| `stories` orphan epics | Check story epic references and fix mismatches |

After applying fixes, **re-run validation**:

```bash
node "$CLAUDE_PLUGIN_ROOT/bin/validate.js" "docs/software-architect"
```

**Maximum 2 retry attempts.** If failures persist after 2 retries:

1. Report all remaining failures clearly to the user
2. Show which auto-fixes were attempted
3. Offer concrete next steps:

> "⚠️ **Validation could not resolve {K} failures after 2 auto-fix attempts:**
>
> [list each remaining failure]
>
> **Next steps:**
> - [specific command to fix each issue, e.g., `/software-architect:render` for missing PDFs]
>
> Would you like to proceed to cleanup, or stop here to fix these manually?"

Do NOT silently skip failures. Always inform the user.

## Step 8: Cleanup (Optional)

**Only run this step if `tools_installed_by_us = true` AND `--keep-tools` was NOT passed.**

> "The rendering dependencies I installed earlier are in the plugin directory (`<plugin-dir>/node_modules`):
> - `@mermaid-js/mermaid-cli` (mmdc)
> - `puppeteer`
> - `docx`
>
> Would you like to:
> - **A)** Keep them — useful if you'll run architect again (no re-download next time)
> - **B)** Remove them — frees disk space"

If **B**:
```bash
rm -rf "$PLUGIN_DIR/node_modules"
```

> "✅ Dependencies removed. They only lived in the plugin directory — your global npm and system are untouched. You can reinstall anytime by running architect again."

If **A**:
> "✅ Tools kept. They'll be detected automatically next time you run architect."

## Windows Compatibility

This plugin must work on Windows. Follow these rules:

- **Always use Node.js for scripts** — never Python. Python is not installed by default on Windows. Node.js is guaranteed available if npm tools are installed.
- **Chrome path on Windows:** `C:/Program Files/Google/Chrome/Application/chrome.exe` — always check this path and set `PUPPETEER_EXECUTABLE_PATH` before using mmdc or puppeteer.
- **Never use heredocs for complex scripts.** Bash heredocs with nested quotes break on Windows Git Bash. Instead, use the Write tool to create a temporary `.js` file, then run it with `node temp-file.js`, then delete the temp file.
- **Path separators:** Use forward slashes `/` in all paths, even on Windows. Git Bash handles the conversion.
- **No `python3` command** — on Windows it's `python` or doesn't exist. Avoid entirely.

## Error Handling

- If any step fails, preserve all completed outputs and inform the user which step failed
- The user can re-run individual skills to regenerate specific deliverables
- If `fa-context.json` already exists at Step 1, ask: "Existing analysis found. Update it or start fresh?"
- If npm install fails for one package, continue with the others and report which failed
