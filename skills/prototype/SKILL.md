---
name: prototype
description: Generate a navigable, production-grade HTML prototype with Tailwind CSS, Lucide icons, Chart.js, dark mode, and realistic states (empty/loading/error). Zero build step — opens directly in any browser. Run /software-architect:analyze first if no fa-context.json exists.
argument-hint: "[en|es]"
allowed-tools: "Read Write Glob"
context: fork
effort: high
---

You are operating as the **ux-designer** agent. Read `agents/ux-designer.md` from the plugin directory for your full role definition.

## Your Mission

Generate a complete, navigable HTML prototype that brings the project's user stories to life. The prototype must look like a real product shipped by a design-led team — not like a wireframe or an AI mock.

## Prerequisites

1. Look for `fa-context.json` in `docs/software-architect/` then `./`.
2. If not found: "No project context found. Run `/software-architect:analyze` first." Then stop.
3. Highly recommended: `docs/software-architect/deliverables/stories/stories.md` — map stories to screens. If missing, derive screens from `functional_requirements` in `fa-context.json`.

## Design System

The prototype uses a **single source of truth** for styling: `assets/tokens.css` (CSS custom properties). Every page reads from these variables. No hardcoded colors in markup.

### Tokens (`assets/tokens.css`)

```css
:root {
  /* Brand */
  --brand-900: #0F1B3D;
  --brand-800: #1B365D;   /* primary */
  --brand-700: #2C5282;
  --brand-500: #2563EB;   /* accent */
  --brand-400: #60A5FA;
  --brand-100: #DBEAFE;
  --brand-50:  #EFF6FF;

  /* Neutrals */
  --ink-900: #0F172A;
  --ink-800: #1E293B;
  --ink-700: #334155;
  --ink-600: #475569;
  --ink-500: #64748B;
  --ink-400: #94A3B8;
  --ink-300: #CBD5E1;
  --ink-200: #E2E8F0;
  --ink-100: #F1F5F9;
  --ink-50:  #F8FAFC;
  --surface: #FFFFFF;

  /* Semantic */
  --success: #059669;
  --success-bg: #D1FAE5;
  --warning: #D97706;
  --warning-bg: #FEF3C7;
  --danger: #DC2626;
  --danger-bg: #FEE2E2;
  --info: #0284C7;
  --info-bg: #E0F2FE;

  /* Radius & shadow */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-xl: 20px;
  --shadow-sm: 0 1px 2px rgba(15,23,42,0.05);
  --shadow-md: 0 4px 12px -2px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.05);
  --shadow-lg: 0 12px 32px -8px rgba(15,23,42,0.15);

  /* Typography */
  --font-sans: 'Inter', -apple-system, system-ui, sans-serif;
}

html.dark {
  --surface: #0F172A;
  --ink-900: #F1F5F9;
  --ink-800: #E2E8F0;
  --ink-700: #CBD5E1;
  --ink-600: #94A3B8;
  --ink-500: #64748B;
  --ink-400: #475569;
  --ink-300: #334155;
  --ink-200: #1E293B;
  --ink-100: #0F172A;
  --ink-50:  #020617;
  --brand-50: rgba(37,99,235,0.12);
  --brand-100: rgba(37,99,235,0.18);
}

body { font-family: var(--font-sans); color: var(--ink-800); background: var(--ink-50); }
```

### Design Rules

- **Subtle radius**: cards `--r-lg` (14px), buttons/inputs `--r-md` (10px), pills `--r-xl`, avatars `rounded-full`. Sharp corners are no longer required — modern corporate.
- **Icons**: always use **Lucide** via CDN. Never emojis as UI icons. Use `data-lucide="icon-name"` and call `lucide.createIcons()`.
- **Charts**: use **Chart.js** via CDN in any dashboard with metrics. Always paint with brand tokens.
- **Typography**: Inter 300–800 from Google Fonts CDN. Headings 600–800, body 400, labels 500 uppercase tracking.
- **Dark mode**: toggle in the navbar persists to `localStorage`. Every color comes from tokens — no `bg-white` hardcoded.
- **Microinteractions**: `transition-all duration-200` on every interactive element, `hover:-translate-y-0.5` on cards, visible focus rings (`focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`).
- **States**: every list / table / dashboard screen must include visible examples of at least two of: empty state, skeleton loading, error state, success toast.
- **Responsive**: mobile first. Nav collapses to hamburger under 768px. Sidebars become drawers.
- **Accessibility**: semantic landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`), labels on every input, `aria-current="page"` on active nav, contrast AA.
- **Realistic data**: pull names, numbers, dates, statuses directly from `fa-context.json` (roles, domain, features). Never "Lorem ipsum", never "John Doe" if the project is in Spanish.

## Required pages

### 1. `index.html` — Landing / Dashboard

Depends on the project:
- B2B SaaS / dashboards → metrics dashboard with 4 KPI cards + 1 line chart + 1 pie chart + recent-activity feed + CTA to primary action.
- E-commerce / marketplace → hero + featured items grid + categories.
- Internal tool → task inbox + sidebar filters.

Pick from stories.md. The dashboard must feel populated, not empty.

### 2. One page per epic

For each epic in stories.md, generate at least one page covering its main flow. Include CRUD operations if the epic requires them.

### 3. `design-system.html` — Component Library

A single page showcasing the prototype's building blocks — lets stakeholders see the design decisions in isolation:
- Color palette (brand, neutrals, semantic)
- Typography scale
- Buttons (primary / secondary / ghost / destructive / icon-only) in all states
- Inputs (text / select / textarea / checkbox / radio / toggle) with valid / invalid states
- Badges (status / priority / count)
- Cards, stat cards, empty state, alert / toast, modal, drawer, tabs
- Icons grid (shows which Lucide icons are used)

This page makes the prototype look deliberately designed.

## CDN stack (exactly these, no others)

```html
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/styles.css">
```

Tailwind config (inline `<script>` before `</head>`):

```html
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          brand: {
            50: '#EFF6FF', 100: '#DBEAFE', 400: '#60A5FA',
            500: '#2563EB', 700: '#2C5282', 800: '#1B365D', 900: '#0F1B3D'
          },
          ink: {
            50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1',
            400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155',
            800: '#1E293B', 900: '#0F172A'
          }
        },
        fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
        borderRadius: { DEFAULT: '10px', md: '10px', lg: '14px', xl: '20px' }
      }
    }
  };
</script>
```

## Shared assets

### `assets/styles.css` — non-Tailwind utilities

```css
.card { background: var(--surface); border: 1px solid var(--ink-200); border-radius: var(--r-lg); box-shadow: var(--shadow-sm); }
.card-hover { transition: all 200ms ease; }
.card-hover:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

.btn { display: inline-flex; align-items: center; gap: .5rem; padding: .55rem 1rem; border-radius: var(--r-md); font-weight: 600; font-size: .875rem; transition: all 200ms ease; }
.btn-primary { background: var(--brand-800); color: #fff; }
.btn-primary:hover { background: var(--brand-700); transform: translateY(-1px); box-shadow: var(--shadow-md); }
.btn-secondary { background: var(--surface); color: var(--brand-800); border: 1px solid var(--ink-200); }
.btn-secondary:hover { background: var(--brand-50); border-color: var(--brand-500); }
.btn-ghost { color: var(--ink-600); }
.btn-ghost:hover { background: var(--ink-100); color: var(--ink-900); }

.badge { display: inline-flex; align-items: center; gap: .35rem; padding: .2rem .65rem; border-radius: 999px; font-size: .75rem; font-weight: 600; }
.badge-info { background: var(--brand-50); color: var(--brand-700); }
.badge-success { background: var(--success-bg); color: var(--success); }
.badge-warning { background: var(--warning-bg); color: var(--warning); }
.badge-danger { background: var(--danger-bg); color: var(--danger); }

.stat-card { background: var(--surface); border: 1px solid var(--ink-200); border-radius: var(--r-lg); padding: 1.25rem; }
.stat-value { font-size: 1.75rem; font-weight: 800; color: var(--brand-800); letter-spacing: -0.02em; line-height: 1.1; }
.stat-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-500); font-weight: 600; margin-top: .35rem; }
.stat-delta { font-size: .75rem; font-weight: 600; margin-top: .5rem; display: inline-flex; align-items: center; gap: .25rem; }
.stat-delta.up { color: var(--success); }
.stat-delta.down { color: var(--danger); }

/* Skeleton loading */
.skeleton { background: linear-gradient(90deg, var(--ink-100) 25%, var(--ink-200) 50%, var(--ink-100) 75%); background-size: 200% 100%; animation: skeleton 1.4s ease-in-out infinite; border-radius: var(--r-sm); }
@keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Empty state */
.empty { text-align: center; padding: 3rem 1.5rem; }
.empty-icon { width: 56px; height: 56px; background: var(--brand-50); color: var(--brand-700); border-radius: var(--r-lg); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
.empty-title { font-weight: 700; color: var(--ink-800); font-size: 1rem; }
.empty-desc { color: var(--ink-500); font-size: .875rem; margin-top: .35rem; max-width: 420px; margin-inline: auto; }

/* Toast */
.toast { position: fixed; bottom: 1.5rem; right: 1.5rem; background: var(--surface); border: 1px solid var(--ink-200); border-left: 3px solid var(--success); padding: .85rem 1.1rem; border-radius: var(--r-md); box-shadow: var(--shadow-lg); display: flex; gap: .75rem; align-items: center; animation: toast-in .3s ease; }
@keyframes toast-in { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

/* Navigation */
.nav-link { padding: .5rem .85rem; border-radius: var(--r-md); font-weight: 500; color: var(--ink-600); transition: all 200ms ease; font-size: .875rem; }
.nav-link:hover { background: var(--ink-100); color: var(--ink-900); }
.nav-link[aria-current="page"] { background: var(--brand-50); color: var(--brand-700); }

/* Focus */
*:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; border-radius: var(--r-sm); }
```

### `assets/app.js` — shared behavior

```javascript
// Theme (dark mode)
(function () {
  const saved = localStorage.getItem('theme');
  const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefers)) document.documentElement.classList.add('dark');
})();
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  if (window.lucide) lucide.createIcons();
}

// Active nav
document.addEventListener('DOMContentLoaded', function () {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach(a => {
    if (a.getAttribute('href').endsWith(current)) a.setAttribute('aria-current', 'page');
  });
  if (window.lucide) lucide.createIcons();
});

// Mobile drawer
function toggleDrawer(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('hidden');
}

// Toast
function toast(message, type) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<i data-lucide="' + (type === 'error' ? 'alert-circle' : 'check-circle-2') + '" class="w-5 h-5 text-' + (type === 'error' ? 'red' : 'green') + '-500"></i><span>' + message + '</span>';
  document.body.appendChild(t);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => t.remove(), 3000);
}
```

## Page template (every page uses this shell)

```html
<!DOCTYPE html>
<html lang="{{output_config.language}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{project.name}} — [Page Title]</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>/* tailwind.config (see above) */</script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="../assets/tokens.css">
  <link rel="stylesheet" href="../assets/styles.css">
</head>
<body class="min-h-screen">
  <!-- Top bar -->
  <header class="sticky top-0 z-30 bg-[var(--surface)] border-b border-ink-200 backdrop-blur">
    <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <a href="../index.html" class="flex items-center gap-2 font-bold text-ink-900 dark:text-white">
          <span class="w-8 h-8 rounded-lg bg-brand-800 text-white flex items-center justify-center text-sm font-black">{{project.initials}}</span>
          <span>{{project.name}}</span>
        </a>
        <nav class="hidden md:flex gap-1">
          <!-- Render one link per main epic -->
          <a data-nav href="../index.html" class="nav-link">Dashboard</a>
          <!-- ... -->
        </nav>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-ghost" onclick="toggleTheme()" aria-label="Toggle theme">
          <i data-lucide="sun" class="w-4 h-4 hidden dark:inline"></i>
          <i data-lucide="moon" class="w-4 h-4 inline dark:hidden"></i>
        </button>
        <div class="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">
          {{sample_user_initials}}
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-6 py-8">
    <!-- Page content -->
  </main>

  <script src="../assets/app.js"></script>
</body>
</html>
```

`index.html` at the root uses `assets/` (no `../`). Internal pages in `pages/` use `../assets/`.

## Generation process

### Step 1 — Plan the screens

From `stories.md`, map each epic to 1–2 screens. Write a table inline:

| Epic | Screens | Key Interactions | States shown |
|------|---------|------------------|--------------|
| Authentication | login.html, register.html | Form validation, error, success | invalid email, wrong password, loading |
| ... | ... | ... | ... |

### Step 2 — Create shared assets

Write `assets/tokens.css`, `assets/styles.css`, `assets/app.js` exactly as specified above.

### Step 3 — Build `index.html`

Dashboard / landing with 4 KPIs + 1 line chart + 1 donut + recent activity. Use Chart.js with brand colors (`--brand-800`, `--brand-500`, `--brand-400`). Populate data derived from the project context.

### Step 4 — Build `pages/*.html`

One HTML per screen identified in Step 1. Every page:
- Uses the shell template
- Is fully clickable (all nav links point somewhere real)
- Shows realistic data
- Includes at least one state variant (empty / loading / error) where relevant
- Works in dark mode

### Step 5 — Build `pages/design-system.html`

The component library page. Showcases tokens, typography, buttons, inputs, badges, cards, stat cards, empty state, toast, modal skeleton.

### Step 6 — README

```markdown
# {{project.name}} — Prototype

## View
Open `index.html` in any modern browser. No build step.

## Pages
| Page | Related Stories |
|------|-----------------|
| index.html | Dashboard summary |
| pages/design-system.html | Component library — design reference |
| pages/{epic}.html | ... |

## Tech
- Tailwind CSS (CDN) with custom brand config
- Lucide Icons
- Chart.js
- CSS custom properties for theming (dark mode toggle persisted to localStorage)
- Zero build step
```

## Output structure

```
{output_dir}/prototype/
├── index.html
├── pages/
│   ├── design-system.html
│   └── [one-per-epic].html
├── assets/
│   ├── tokens.css
│   ├── styles.css
│   └── app.js
└── README.md
```

## Hard rules

- **Never use emoji as UI icons.** Always Lucide.
- **Never hardcode colors in markup.** Always reference tokens or Tailwind config.
- **Every dashboard must have at least one chart.** No empty dashboards.
- **Every list/table must have an empty state** reachable via a filter or query string (`?state=empty`).
- **All links work.** If a link has no target, remove it — don't leave `href="#"` sprinkled around.
- **Dark mode is not optional.** Every page must render correctly in both themes.
- **UI text in `output_config.language`.** Technical terms stay in English.
- **Prototype is a first-class deliverable.** Same care as documentation.

## Output

Write all files to `{output_dir}/prototype/` (default `docs/software-architect/prototype/`). Present a summary:

> "Prototype generated at `path`. **{X}** pages created including the design system reference. Toggle theme with the sun/moon icon. Open `index.html` in your browser."
