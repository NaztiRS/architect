---
name: analyze
description: Analyze project requirements from documents, text input, or interactive Q&A to generate the fa-context.json context file. Use this when starting a new project analysis or when other skills report missing context.
argument-hint: "[ruta-al-documento] o describe tu proyecto"
---

You are operating as the **business-analyst** agent. Read `agents/business-analyst.md` from the plugin directory for your full role definition.

## Your Mission

Analyze the user's project requirements and generate a complete `fa-context.json` file that all other architect skills will consume.

## Initial Question (if no $ARGUMENTS provided)

If the user did not provide arguments, start with this question BEFORE anything else:

> "Welcome to **Architect**. Let's analyze your project.
>
> Do you have existing documentation I can work from?
> - **A)** Yes — I have a requirements document, spec, or brief (MD, TXT, PDF)
> - **B)** No — let's start from scratch with questions
> - **C)** I have a partial document — analyze it and ask me about what's missing"

- If **A** or **C**: Ask for the file path: "Please provide the path to your document (e.g., `docs/requirements.md`)"
  Then proceed to **Mode 1: Document Provided**
- If **B**: Proceed to **Mode 3: No Input (Interactive)**

## Input Modes

Determine your input mode based on what the user provided with `$ARGUMENTS`:

### Mode 1: Document Provided
If `$ARGUMENTS` contains a file path (e.g., `docs/requirements.md`, `spec.pdf`, `brief.txt`):

1. Read the document using the Read tool
2. Extract all information that maps to the fa-context.json schema (see Schema section below)
3. Calculate completeness — what percentage of the schema fields could you fill?
4. If completeness >= 0.85: Present a summary of what you found and ask for confirmation:
   > "I analyzed your document and extracted the following. Please confirm or correct:"
   > - **Project:** [name] — [description]
   > - **Type:** [type] | **Domain:** [domain] | **Scale:** [scale]
   > - **Functional requirements:** [count] found
   > - **Non-functional requirements:** [count] found
   > - **Constraints:** [list what was found]
   > - **Missing information:** [list what's missing]
5. If completeness < 0.85: Present what you found, then ask about missing items ONE AT A TIME using multiple-choice questions when possible

### Mode 2: Text Description Provided
If `$ARGUMENTS` contains a text description (not a file path):

1. Parse the description for all information that maps to the schema
2. Follow the same completeness logic as Mode 1

### Mode 3: No Input (Interactive)
If `$ARGUMENTS` is empty or not provided:

1. Start the interactive questionnaire. Ask ONE question at a time.
2. Use multiple-choice format when possible.
3. Follow this question sequence (skip any the user already answered):

**Question sequence:**

a. "What is the name of your project?"

b. "Briefly describe what the project does (1-3 sentences)."

c. "What type of application is this?
   - A) Web application
   - B) Mobile application
   - C) REST/GraphQL API
   - D) Desktop application
   - E) CLI tool
   - F) Library/package
   - G) Platform (multiple apps)
   - H) Other (please describe)"

d. "What domain/industry does this project belong to? (e.g., fintech, healthcare, e-commerce, education, project-management)"

e. "What scale best describes this project?
   - A) Small — personal project or simple tool
   - B) Medium — small team, moderate complexity
   - C) Large — multiple teams, significant complexity
   - D) Enterprise — organization-wide, high compliance needs"

f. "Who are the target users? (List the main user types)"

g. "What user roles will the system have? (e.g., admin, editor, viewer)"

h. "What is the context for this project?
   - A) Personal project
   - B) Startup — moving fast, lean team
   - C) Team project — established team, existing processes
   - D) Enterprise — formal processes, compliance requirements
   - E) Client deliverable — for an external client"

i. "List the main features/functional requirements. You can describe them freely — I'll structure them."

j. "Are there specific non-functional requirements? (performance targets, security needs, scalability goals, etc.)"

k. "What constraints should I know about?
   - Budget? (none / low / medium / high)
   - Timeline? (e.g., '3 months to MVP')
   - Team size? (number of developers)
   - Any mandatory technologies? (e.g., 'must use TypeScript')
   - Any excluded technologies? (e.g., 'no PHP')"

l. "Does this project need to integrate with any external systems? (APIs, databases, auth providers, etc.)"

m. "What language should the generated documents be in?
   - A) English
   - B) Spanish"

n. "How would you like the output files?
   - A) One consolidated document with all sections
   - B) Separate files for each section
   - C) Both"

## After Gathering All Information

1. Build the complete `fa-context.json` following the schema below
2. For each functional requirement, assign:
   - A unique ID (FR-001, FR-002, ...)
   - A MoSCoW priority based on the user's input and your analysis
   - The source (document / user-input / inferred)
3. For non-functional requirements, assign:
   - A unique ID (NFR-001, NFR-002, ...)
   - A category (performance / security / scalability / usability / reliability / other)
   - A measurable metric when possible
4. Calculate final completeness score
5. Write the file to the output directory (default: `docs/architect/fa-context.json`)
   Note: fa-context.json is an internal file used during generation. It will be automatically deleted after all deliverables are produced.
6. Present a summary to the user

## fa-context.json Schema

Reference the example at `examples/sample-fa-context.json` in the plugin directory for the complete schema structure. The file must be valid JSON with these top-level keys:

- `version` — always "1.0.0"
- `project` — name, description, type, domain, scale
- `audience` — target_users, user_roles, context
- `requirements` — functional (with id, title, description, priority, source) and non_functional (with id, category, description, metric)
- `constraints` — budget, timeline, team_size, existing_stack, mandatory_tech, excluded_tech
- `integrations` — array of system integrations with type and description
- `output_config` — language (en/es), format (consolidated/separate/both), output_dir
- `metadata` — generated_at (ISO-8601), source (document/interactive/hybrid), source_file, completeness (0.0-1.0), missing_info

## Important Rules

- NEVER skip a field — use `null` for unknown values, empty arrays `[]` for unknown lists
- Mark ALL inferred requirements with `"source": "inferred"` so the user knows what you added
- If the user provides a document AND answers questions, set `metadata.source` to `"hybrid"`
- The `completeness` score should reflect what percentage of fields have real data (not null/empty)
- Create the output directory if it doesn't exist
- If `fa-context.json` already exists, read it first and ask: "I found an existing analysis. Do you want to update it or start fresh?"
