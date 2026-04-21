---
name: diagrams
description: Render the 2 Mermaid diagrams from the proposal (architecture overview + timeline Gantt) as SVG and PNG images. Uses mmdc (mermaid-cli) if installed, falls back to mermaid.ink API. Output to docs/architect/diagrams/.
argument-hint: "--format [svg|png|both] --theme [neutral|dark|forest]"
allowed-tools: "Read Write Bash Glob"
---

## Your Mission

Extract the 2 Mermaid diagrams from the proposal deliverable and render them as high-quality image files (SVG and PNG). Only 2 diagrams are expected: the architecture overview and the timeline/Gantt chart.

## Prerequisites

1. Look for the proposal deliverable:
   - `docs/architect/deliverables/proposal/proposal.md` (or custom output_dir from fa-context.json)
2. If not found: "No proposal found. Run `/architect:proposal` or `/architect:deliver` first." Then stop.

## Parse Arguments

From `$ARGUMENTS`:
- `--format svg|png|both` — which image formats to generate (default: `both`)
- `--theme neutral|dark|forest` — Mermaid theme (default: `neutral` for corporate look)

## Step 1: Extract Diagrams

Scan `deliverables/proposal/proposal.md` for Mermaid code blocks:

```
```mermaid
[diagram code]
```
```

For each diagram found, record:
- **Context** — what section it's in (to generate a descriptive filename)
- **Diagram code** — the raw Mermaid syntax

Name each diagram descriptively based on its context:
- `deliverables/proposal/proposal.md` → Section 3 (Architecture) → `architecture-overview`
- `deliverables/proposal/proposal.md` → Section 9 (Timeline) → `proposal-timeline`

Only these 2 diagrams should be extracted and rendered. Do NOT scan stories.md, techstack.md, or todo.md for diagrams.

## Step 2: Detect Rendering Tool & Configure Chrome

Check which tool is available:

```bash
which mmdc 2>/dev/null && echo "TOOL=mmdc" || echo "mmdc not found"
```

**IMPORTANT — Set system Chrome before using mmdc:**

mmdc uses puppeteer internally, which tries to download its own Chromium (~120MB). To avoid this, detect and use the system Chrome:

```bash
# Detect system Chrome
CHROME_PATH=""
for p in \
  "/c/Program Files/Google/Chrome/Application/chrome.exe" \
  "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
  "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe"; do
  if [ -f "$p" ]; then CHROME_PATH="$p"; break; fi
done
# Mac/Linux fallback
if [ -z "$CHROME_PATH" ]; then
  CHROME_PATH=$(which google-chrome || which chromium-browser || which chrome || echo "")
fi

# Set for puppeteer/mmdc
if [ -n "$CHROME_PATH" ]; then
  export PUPPETEER_EXECUTABLE_PATH="$CHROME_PATH"
fi
```

This `export` MUST run before every `mmdc` command in the same shell session.

## Step 3: Render Diagrams

### If mmdc is available (preferred):

For each extracted diagram:

1. Write the Mermaid code to a temporary `.mmd` file
2. Use the `render-diagrams.js` script from the plugin's `bin/` directory to render both SVG and PNG:
```bash
node [plugin-dir]/bin/render-diagrams.js temp.mmd docs/architect/diagrams [theme]
```

Usage: `render-diagrams.js <input.mmd> <output-dir> [theme]`

The script handles Chrome detection, creates the output directory, and renders both SVG (transparent background) and PNG (white background, 2x scale) in a single call.

3. Delete the temporary `.mmd` file

The `neutral` theme (default) produces clean, professional diagrams suitable for corporate documents.
The script uses `--scale 2` for PNG to get high-resolution (2x) images suitable for print.

### If mmdc is NOT available (fallback to mermaid.ink API):

For each extracted diagram:

1. Encode the Mermaid code as base64 (URL-safe)
2. Use WebFetch to download images:

**SVG:**
```
https://mermaid.ink/svg/{base64_encoded_diagram}
```

**PNG:**
```
https://mermaid.ink/img/{base64_encoded_diagram}?theme=neutral&width=1200&bgColor=white
```

3. Save the downloaded files to `docs/architect/diagrams/`

### If neither works:

Inform the user:
> "Could not render diagrams. Install the plugin dependencies by running inside the plugin directory:
> ```
> npm install
> ```
> (This installs `@mermaid-js/mermaid-cli` locally in `<plugin-dir>/node_modules/`.)
> Alternatively, ensure you have internet access for the mermaid.ink fallback."

## Output Structure

```
docs/architect/diagrams/
├── architecture-overview.svg
├── architecture-overview.png
├── proposal-timeline.svg
└── proposal-timeline.png
```

## Output

1. Create the `docs/architect/diagrams/` directory if it doesn't exist
2. Report rendering results:
   > "**Diagrams rendered.**
   >
   > Method: [mmdc / mermaid.ink API]
   > Total: 2 diagrams rendered ([Y] SVG + [Z] PNG)
   > Location: `docs/architect/diagrams/`
   >
   > Diagrams:
   > - `architecture-overview` — from deliverables/proposal/proposal.md (High-Level Architecture)
   > - `proposal-timeline` — from deliverables/proposal/proposal.md (Tentative Timeline)"
