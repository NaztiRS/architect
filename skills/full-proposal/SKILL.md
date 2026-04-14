---
name: full-proposal
description: Run the complete architect pipeline — analyze requirements, generate technical proposal, user stories, tech stack analysis, work plan, HTML prototype, and export all deliverables. Accepts a requirements document or starts interactive Q&A.
argument-hint: "[ruta-documento] [--no-review] [--lang en|es]"
allowed-tools: "Read Write Bash Glob Agent"
context: fork
effort: high
---

## Your Mission

Orchestrate the full architect pipeline. Generate all deliverables directly in this session — only use subagents for truly parallel work (proposal+stories, techstack+prototype).

## Pipeline

```
0. preflight → check environment, install tools
1. analyze   → fa-context.json
2. proposal  ──parallel──  stories       (subagents: only parallel pair)
3. techstack ──parallel──  prototype     (subagents: only parallel pair)
4. todo                                  (direct, no subagent)
5. export                                (direct, no subagent)
6. diagrams + render                     (direct, no subagent)
7. cleanup   → optionally uninstall tools
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
> Once installed, run `/architect:full-proposal` again."

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
> Once installed, run `/architect:full-proposal` again."

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

Check what's already installed:

```bash
which mmdc 2>/dev/null && echo "mmdc: ✅" || echo "mmdc: ❌"
node -e "require('puppeteer')" 2>/dev/null && echo "puppeteer: ✅" || echo "puppeteer: ❌"
node -e "require('docx')" 2>/dev/null && echo "docx: ✅" || echo "docx: ❌"
```

**If any are missing**, inform the user what you found and what you'll install:

> "**Environment check:**
> - Node.js: ✅ v[X]
> - Chrome: ✅ [path]
> - mmdc: ✅/❌
> - puppeteer: ✅/❌
> - docx: ✅/❌
>
> [List what's missing]. I'll install them now. At the end of the pipeline I'll ask if you want to keep them or remove them."

Install **one by one** (prevents network failures from killing all installs):

```bash
export PUPPETEER_EXECUTABLE_PATH="[detected Chrome path]"
npm install -g @mermaid-js/mermaid-cli
npm install -g puppeteer
npm install -g docx
```

Verify each install succeeded before proceeding to the next. If one fails, report it and continue with the others.

Set `tools_installed_by_us = true`.

### 0.4 Summary

After all checks, display a single status report:
> "**Preflight complete:**
> | Component | Status |
> |-----------|--------|
> | Node.js | ✅ v[X] |
> | Chrome | ✅ [path] |
> | mmdc | ✅/❌ |
> | puppeteer | ✅/❌ |
> | docx | ✅/❌ |
>
> Ready to begin analysis."

## Step 1: Analyze

Invoke the analyze skill logic directly (no subagent needed):
- If a document path was provided, read it and pass to analyze
- If no document, start interactive Q&A (ask if user has documentation first)
- Wait until `fa-context.json` is generated

After completion, inform the user:
> "✅ **Analysis complete.** Context saved to `docs/architect/fa-context.json`.
> Completeness: [X]%. [Missing items if any].
> Next: generating technical proposal and user stories..."

## Step 2: Proposal + Stories (Parallel Subagents)

These two are independent and benefit from parallelization. Use the Agent tool:

- **Agent 1:** Generate proposal following `skills/proposal/SKILL.md` logic
- **Agent 2:** Generate stories following `skills/stories/SKILL.md` logic

Both read from the same `fa-context.json`. They don't depend on each other.

After both complete:
> "✅ **Proposal and stories generated.**
> - Proposal: `docs/architect/deliverables/proposal/proposal.md` — [brief summary]
> - Stories: `docs/architect/deliverables/stories/stories.md` — [X] epics, [Y] stories, [Z] points"

**Review checkpoint** (skip if `--no-review`):
> "Would you like to review these before continuing? (yes/no)"

## Step 3: Tech Stack + Prototype (Parallel Subagents)

These two are independent. Use the Agent tool:

- **Agent 1:** Generate techstack following `skills/techstack/SKILL.md` logic
- **Agent 2:** Generate prototype following `skills/prototype/SKILL.md` logic. Uses `stories.md` from Step 2.

After both complete:
> "✅ **Tech stack analysis and prototype generated.**
> - Tech Stack: `docs/architect/deliverables/techstack/techstack.md` — Recommended: [stack summary]
> - Prototype: `docs/architect/prototype/index.html` — [X] pages. Open in browser to navigate."

**Review checkpoint** (skip if `--no-review`):
> "Would you like to review before continuing? (yes/no)"

## Step 4: Work Plan (Direct — No Subagent)

Generate directly in this session following `skills/todo/SKILL.md` logic. This is a single file generation — no need for a subagent.

After completion:
> "✅ **Work plan generated.**
> - Plan: `docs/architect/deliverables/todo/todo.md` — [X] phases, [Y] tasks, estimated [duration]"

## Step 5: Export (Direct — No Subagent)

Consolidate deliverables directly following `skills/export/SKILL.md` logic. Simple file aggregation — no subagent needed.

## Step 6: Diagrams + Render (Direct — No Subagent)

Run both directly in this session:

1. **Diagrams:** Extract the 2 Mermaid diagrams from proposal.md, render as SVG/PNG following `skills/diagrams/SKILL.md` logic
2. **Render:** Generate DOCX and PDF for each deliverable independently following `skills/render/SKILL.md` logic

**IMPORTANT:** Before calling mmdc or any puppeteer script, ensure `PUPPETEER_EXECUTABLE_PATH` is set:
```bash
export PUPPETEER_EXECUTABLE_PATH="[Chrome path from Step 0]"
```

Delete the internal context file now that all deliverables are produced:

```bash
rm docs/architect/fa-context.json
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
> | Tech Stack Analysis | `deliverables/techstack/techstack.md` | ✅/❌ | ✅/❌ |
> | Work Plan | `deliverables/todo/todo.md` | ✅/❌ | ✅/❌ |
>
> | Other | Status | Location |
> |-------|--------|----------|
> | HTML Prototype | ✅ | `docs/architect/prototype/index.html` |
> | Diagram Images | ✅ | `docs/architect/diagrams/` |
> | Index | ✅ | `docs/architect/README.md` |
>
> Open `docs/architect/prototype/index.html` in your browser to see the prototype.
> Read `docs/architect/README.md` for the full deliverables index."

## Step 7: Cleanup (Optional)

**Only run this step if `tools_installed_by_us = true` AND `--keep-tools` was NOT passed.**

> "The rendering tools I installed earlier are still on your system:
> - `@mermaid-js/mermaid-cli` (mmdc)
> - `puppeteer`
> - `docx`
>
> Would you like to:
> - **A)** Keep them — useful if you'll run architect again
> - **B)** Uninstall them — clean up your system"

If **B**:
```bash
npm uninstall -g @mermaid-js/mermaid-cli puppeteer docx
```

> "✅ Tools uninstalled. Your system is clean. You can reinstall them anytime by running architect again."

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
