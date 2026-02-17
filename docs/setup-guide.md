# Setting Up Your Own Overnight AI Experiment Pipeline

> **A note before you start:** This guide documents one person's setup for having AI agents build and deploy web experiments overnight. It's not the only way to do this — it's just a way that works. Take what's useful, adapt it to your situation, and make it your own.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Setup](#2-project-setup)
3. [The Overnight Pipeline — How It Works](#3-the-overnight-pipeline--how-it-works)
4. [Setting Up the Crons](#4-setting-up-the-crons)
5. [The Improvement Crons](#5-the-improvement-crons)
6. [The Human-in-the-Loop Flow](#6-the-human-in-the-loop-flow)
7. [Design System (Optional)](#7-design-system-optional)
8. [Tips and Lessons Learned](#8-tips-and-lessons-learned)
9. [Adapting for Your Own Projects](#9-adapting-for-your-own-projects)

---

## 1. Prerequisites

Before you begin, you'll need the following:

### OpenClaw

This pipeline runs on [OpenClaw](https://docs.openclaw.ai), an AI agent platform that provides cron scheduling, subagent spawning, tool access (shell, browser, file I/O), and messaging. Install it and get it running first — the rest of this guide assumes you have a working OpenClaw setup with access to a capable model (Claude Sonnet 4 or better recommended for the implementation stage).

### A Web Framework

This guide uses **Next.js** (App Router) as the example, but the pipeline pattern works with any web framework — Astro, SvelteKit, plain HTML, whatever you like. You just need something that:

- Has a dev server for local testing
- Can be deployed automatically from a git push
- Supports creating isolated pages/routes for each experiment

### Vercel (or any auto-deploy platform)

The magic of this pipeline is that **pushing to `main` triggers a deploy**. Vercel does this out of the box when connected to a GitHub repo. Netlify, Cloudflare Pages, and Railway work similarly. The key requirement: push code → site updates automatically.

### GitHub

Your code lives in a GitHub repo. The AI agent commits and pushes directly to `main` (or a branch, if you prefer). The auto-deploy platform picks up the change.

### Supabase (Optional)

If your experiments need a database, auth, or real-time features, [Supabase](https://supabase.com) is a good fit — free tier is generous, Postgres is solid, and the JS client is straightforward. But plenty of experiments are purely client-side and don't need a database at all. Skip this if you're starting simple.

---

## 2. Project Setup

### Create your project

```bash
npx create-next-app@latest experiments --typescript --tailwind --app
cd experiments
git init
git remote add origin git@github.com:YOUR_USERNAME/experiments.git
```

### Set up the experiment registry

The experiment registry is a central file that lists every experiment on the site. This is important — the pipeline reads it to know what already exists (so it doesn't repeat ideas), and the homepage reads it to display the experiment index.

Create `src/lib/experiments.ts`:

```typescript
/**
 * Single source of truth for the experiment registry.
 *
 * When adding a new experiment, add it here — homepage, sitemap,
 * and inter-experiment navigation all read from this list.
 */

export const REPO_URL = 'https://github.com/YOUR_USERNAME/experiments'

export interface Experiment {
  slug: string
  date: string
  title: string
  description: string
  tags: string[]
  icon?: string
}

/** Returns the GitHub URL for an experiment's source directory. */
export function sourceUrl(slug: string): string {
  return `${REPO_URL}/tree/main/src/app/e/${slug}`
}

export const experiments: Experiment[] = [
  // The pipeline adds new entries here.
  // Example:
  // {
  //   slug: 'particle-garden',
  //   date: '2026-03-01',
  //   title: 'Particle Garden',
  //   description: 'An interactive garden of physics-driven particles',
  //   tags: ['creative', 'canvas', 'interactive'],
  //   icon: '🌱',
  // },
]
```

Each experiment lives in its own directory under `src/app/e/<slug>/` with at least a `page.tsx`. This keeps experiments isolated — one broken experiment doesn't take down the others.

### Project structure

```
src/
├── app/
│   ├── e/                    # Each experiment lives here
│   │   ├── my-experiment/
│   │   │   ├── page.tsx      # Main experiment page
│   │   │   └── ...           # Supporting files
│   │   └── another-one/
│   ├── api/                  # API routes (if needed)
│   └── page.tsx              # Homepage / experiment index
├── lib/
│   ├── experiments.ts        # Experiment registry (source of truth)
│   └── supabase/             # Supabase client setup (if using)
pipeline/                     # Pipeline stage outputs
├── 01-ideator.md
├── 02-planner.md
├── 03-implementer.md
└── 04-tester.md
FEEDBACK.md                   # Human feedback for the pipeline
IMPROVEMENTS.md               # Backlog for improvement crons
DESIGN.md                     # Design constraints (optional)
```

### Configure environment variables (if using Supabase)

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Connect to Vercel

```bash
npm i -g vercel
vercel link
```

Or just connect the GitHub repo through the Vercel dashboard. The important thing is that every push to `main` triggers a production deploy. When the Implementer stage pushes code at midnight, the experiment should be live by 12:05 AM.

---

## 3. The Overnight Pipeline — How It Works

The core idea: **four stages run sequentially overnight, each building on the previous stage's output**. You go to sleep, and by morning there's a new experiment deployed to your site.

```
9 PM          10 PM          11:30 PM         2:30 AM         Morning
  │             │               │                │               │
  ▼             ▼               ▼                ▼               ▼
Ideator  →  Planner  →   Implementer  →     Tester  →    You wake up
              │               │                │          to a new
           (optional       (builds &         (tests &     experiment
            human            pushes)          fixes)       live on
            review)                                        your site
```

Each stage writes its output to a file in the `pipeline/` directory. The next stage reads that file as input. This gives you a paper trail and makes it easy to intervene between stages.

### Stage 1: Ideator (9 PM)

The Ideator generates experiment ideas. It:

- Reads `src/lib/experiments.ts` to see what already exists
- Reads `FEEDBACK.md` if it exists, to incorporate your input
- Brainstorms 3–5 ideas with brief descriptions
- Picks a top recommendation
- Writes everything to `pipeline/01-ideator.md`

This is the creative stage. The agent considers what would be interesting, what's technically feasible in a single night, and what hasn't been done before.

### Stage 2: Planner (10 PM)

The Planner takes the Ideator's output and creates a detailed implementation plan. It:

- Reads `pipeline/01-ideator.md`
- Selects one idea (usually the top recommendation, unless you've left feedback saying otherwise)
- Researches any APIs or techniques needed (can spawn subagents to research in parallel)
- Writes a detailed implementation plan: file structure, component breakdown, data flow, key algorithms
- Writes to `pipeline/02-planner.md`

A good plan is specific enough that the Implementer can execute it without ambiguity, but flexible enough to allow creative decisions during implementation.

### Stage 3: Implementer (11:30 PM)

The Implementer is where the actual code gets written. It:

- Reads `pipeline/02-planner.md` for the plan
- Reads `FEEDBACK.md` for any additional human guidance
- Reads `DESIGN.md` for design constraints (if it exists)
- Creates the experiment directory under `src/app/e/<slug>/`
- Writes all the code
- Adds the experiment to the registry in `src/lib/experiments.ts`
- Runs `npx tsc --noEmit` to validate TypeScript
- Commits and pushes to `main`
- Writes a summary to `pipeline/03-implementer.md`

This stage can spawn subagents for parallel work — for example, one subagent builds the main simulation logic while another handles the UI chrome and layout. The auto-deploy picks up the push and the experiment goes live.

### Stage 4: Tester (2:30 AM)

The Tester validates the deployed experiment. It:

- Reads `pipeline/03-implementer.md` for context on what was built
- Opens the deployed URL in a browser (both desktop and mobile viewports)
- Checks for visual issues, broken interactions, console errors
- Fixes any problems it finds, commits, and pushes
- Runs TypeScript checks to make sure nothing else broke
- Writes a test report to `pipeline/04-tester.md`

The gap between Implementer (11:30 PM) and Tester (2:30 AM) is intentional — it gives Vercel time to deploy and for any edge caching to settle.

---

## 4. Setting Up the Crons

Each pipeline stage is an **OpenClaw cron job**. Crons fire on schedule, start an isolated agent session, deliver a prompt, and the agent executes it.

### Key concepts

- **`sessionTarget: isolated`** — Each cron runs in its own session, not your main chat. This keeps your conversation clean and prevents stages from interfering with each other.
- **`payload.kind: agentTurn`** — The cron delivers a prompt to the agent, as if you typed it.
- **Timezone** — Set your cron timezone to wherever you are. The examples below use `America/Chicago` (US Central).

### Stage 1: Ideator

```yaml
name: "Pipeline: Ideator"
schedule: "0 21 * * *"           # 9:00 PM daily
timezone: "America/Chicago"
sessionTarget: isolated
payload:
  kind: agentTurn
  message: |
    You are the Ideator stage of the experiment pipeline.

    ## Your Task
    Generate 3-5 experiment ideas for the experiments site.

    ## Read These First
    - `src/lib/experiments.ts` — the experiment registry (don't repeat existing ones)
    - `FEEDBACK.md` — human feedback, if any (then delete it after reading)

    ## Requirements
    - Each idea: title, one-paragraph description, key technical approach, estimated complexity
    - Pick a top recommendation and explain why
    - Ideas should be self-contained, buildable in one night
    - Think creatively — interactive visualizations, simulations, tools, toys, generative art

    ## Output
    Write your ideas to `pipeline/01-ideator.md`.
    Announce to the user what you've come up with (brief summary).
```

### Stage 2: Planner

```yaml
name: "Pipeline: Planner"
schedule: "0 22 * * *"           # 10:00 PM daily
timezone: "America/Chicago"
sessionTarget: isolated
payload:
  kind: agentTurn
  message: |
    You are the Planner stage of the experiment pipeline.

    ## Your Task
    Read the Ideator output and create a detailed implementation plan.

    ## Read These First
    - `pipeline/01-ideator.md` — tonight's experiment ideas
    - `FEEDBACK.md` — human feedback, if any (may override the idea selection)
    - `src/lib/experiments.ts` — existing experiments for context
    - `DESIGN.md` — design constraints, if it exists

    ## Requirements
    - Select one experiment to build (top recommendation unless feedback says otherwise)
    - Write a detailed plan: file structure, components, data flow, algorithms
    - Note any external APIs or libraries needed
    - Be specific enough that an Implementer can build it without ambiguity
    - Include mobile considerations

    ## Output
    Write the plan to `pipeline/02-planner.md`.
    Announce to the user: what you're planning, and ask if they want to adjust anything before implementation starts.
```

### Stage 3: Implementer

```yaml
name: "Pipeline: Implementer"
schedule: "30 23 * * *"          # 11:30 PM daily
timezone: "America/Chicago"
sessionTarget: isolated
payload:
  kind: agentTurn
  message: |
    You are the Implementer stage of the experiment pipeline.

    ## Your Task
    Build the planned experiment.

    ## Read These First
    - `pipeline/02-planner.md` — the implementation plan
    - `FEEDBACK.md` — human feedback, if any
    - `DESIGN.md` — design constraints, if it exists
    - `src/lib/experiments.ts` — the experiment registry

    ## Requirements
    - Create the experiment under `src/app/e/<slug>/`
    - Add it to the registry in `src/lib/experiments.ts`
    - Follow the design constraints (dark theme, no rounded corners, etc.)
    - Run `npx tsc --noEmit` to validate — do NOT run `next build`
    - Fix any TypeScript errors before committing
    - Commit with a descriptive message and push to main
    - Use subagents for parallel work if the experiment has independent parts

    ## Output
    Write a build summary to `pipeline/03-implementer.md` (what was built, any issues, the deployed URL).
    Announce to the user that the experiment has been pushed.
```

### Stage 4: Tester

```yaml
name: "Pipeline: Tester"
schedule: "30 2 * * *"           # 2:30 AM daily
timezone: "America/Chicago"
sessionTarget: isolated
payload:
  kind: agentTurn
  message: |
    You are the Tester stage of the experiment pipeline.

    ## Your Task
    Test tonight's deployed experiment and fix any issues.

    ## Read These First
    - `pipeline/03-implementer.md` — what was built and where it's deployed
    - `src/lib/experiments.ts` — to find the experiment URL

    ## Requirements
    - Open the experiment in a browser at desktop size (1280x800) and mobile size (390x844)
    - Check for: visual bugs, broken interactions, console errors, layout issues
    - Test the homepage too — make sure the new experiment appears in the index
    - Fix any issues you find, run `npx tsc --noEmit`, commit and push
    - Check that existing experiments still work (no regressions)

    ## Output
    Write a test report to `pipeline/04-tester.md`.
    Announce results to the user.
```

### The FEEDBACK.md pattern

Between any two stages, you can drop a `FEEDBACK.md` file in the project root to influence what happens next:

```markdown
# Feedback

## For the Planner
I'd prefer the "particle garden" idea over the "drum machine." Keep it purely client-side, no Supabase needed.

## For the Implementer
Make sure the canvas is full-screen. Use requestAnimationFrame, not setInterval.
```

Each stage reads `FEEDBACK.md` at the start. This is your lever — you don't have to use it, but it's there when you want to steer the pipeline.

---

## 5. The Improvement Crons

Beyond building new experiments, you'll want crons that polish existing work. These run from an `IMPROVEMENTS.md` backlog.

### The IMPROVEMENTS.md backlog

Create a file in the project root:

```markdown
# Improvements Backlog

Items for the improvement crons to work through, one at a time.

- [ ] Ant Farm: ants clip through tunnel walls at sharp angles
- [ ] The Blob: add touch support for mobile (currently mouse-only)
- [ ] Homepage: add a loading skeleton while experiments load
- [ ] Prompt Library: the "copy to clipboard" button doesn't give feedback
- [ ] All experiments: add a consistent "back to home" link
```

The crons pick up one item per run, implement it, check it off, commit, and push. Keeping the scope small (one item per run) reduces the risk of breakage.

### Overnight polishing cron

Runs hourly during the quiet hours to chip away at the backlog:

```yaml
name: "Improvements: Overnight"
schedule: "0 0-7 * * *"         # Every hour, midnight to 7 AM
timezone: "America/Chicago"
sessionTarget: isolated
payload:
  kind: agentTurn
  message: |
    You are the improvement agent.

    ## Your Task
    Pick ONE unchecked item from `IMPROVEMENTS.md` and implement it.

    ## Rules
    - Read `IMPROVEMENTS.md` — pick the top unchecked item
    - If all items are checked or the file doesn't exist, reply HEARTBEAT_OK and do nothing
    - Keep changes small and focused — one improvement per run
    - Run `npx tsc --noEmit` to validate
    - Commit with a clear message, push to main
    - Check off the item in `IMPROVEMENTS.md` and commit that too
    - Announce what you did to the user
```

### Daytime improvement cron

Runs less frequently during the day, catching things that surface while you're reviewing:

```yaml
name: "Improvements: Daytime"
schedule: "0 9,12,15,18 * * *"  # Every 3 hours during the day
timezone: "America/Chicago"
sessionTarget: isolated
payload:
  kind: agentTurn
  message: |
    You are the improvement agent.

    ## Your Task
    Pick ONE unchecked item from `IMPROVEMENTS.md` and implement it.

    ## Rules
    - Read `IMPROVEMENTS.md` — pick the top unchecked item
    - If all items are checked or the file doesn't exist, reply HEARTBEAT_OK and do nothing
    - Keep changes small and focused — one improvement per run
    - Run `npx tsc --noEmit` to validate
    - Commit with a clear message, push to main
    - Check off the item in `IMPROVEMENTS.md` and commit that too
    - Announce what you did to the user
```

You can add items to `IMPROVEMENTS.md` anytime — just tell your agent "add this to the improvements backlog" or edit the file yourself.

---

## 6. The Human-in-the-Loop Flow

The pipeline is designed so you can sleep through it, but also so you can intervene when you want to. Here's how the flow works in practice:

### The default flow (no intervention)

```
9 PM    Ideator fires → writes ideas → announces: "Here are tonight's ideas"
10 PM   Planner fires → reads ideas → writes plan → announces: "Here's the plan"
11:30   Implementer fires → reads plan → builds it → pushes → announces: "It's live"
2:30 AM Tester fires → tests → fixes → announces: "Test report ready"
7 AM    You wake up → read announcements → see a new experiment on your site
```

You didn't do anything. The pipeline ran autonomously. This is the default.

### The interventionist flow

```
9 PM    Ideator fires → announces: "Here are tonight's ideas"
9:15    You read them → "I like idea #3 but make it use WebGL instead of Canvas2D"
9:16    You write that to FEEDBACK.md (or just tell the agent to do it)
10 PM   Planner fires → reads FEEDBACK.md → plans around your preference
10:05   Planner announces: "Here's the plan — WebGL particle system with..."
10:10   You: "Looks good, go for it" (no FEEDBACK.md needed — silence = approval)
11:30   Implementer fires → builds it → pushes
...
```

### Key principles

1. **Silence is consent.** If you don't leave feedback, the next stage proceeds with the previous stage's output as-is.
2. **Never jump ahead.** Don't tell the Ideator to also build the experiment. Each stage has its job. The pipeline files are the handoff mechanism.
3. **FEEDBACK.md is the interface.** If you want to change something, write it there. The next cron picks it up.
4. **Announcements keep you informed.** Each stage messages you with a summary. You can read them in the morning or respond in real-time — your choice.

---

## 7. Design System (Optional)

If you want visual consistency across experiments, define your constraints in a `DESIGN.md` file at the project root. Every pipeline stage that touches code will read it.

### Example DESIGN.md

```markdown
# Design Constraints

## Colors
- Background: `#08080a`
- Text: `#ebebeb`
- Muted text: `#888888`
- Accent: use sparingly, experiment-specific

## Typography
- Headings: Instrument Serif (serif)
- Body: DM Sans (sans-serif)
- Code: JetBrains Mono (monospace)

## Layout
- No rounded corners — hard edges everywhere (`rounded-none` or `border-radius: 0`)
- Mobile-first: design for 390px wide, then scale up
- Full-bleed experiments: use the entire viewport when it makes sense
- Consistent header/nav when the experiment has UI controls

## Interactions
- Prefer keyboard + mouse + touch (support all three)
- Use CSS transitions over JS animations where possible
- requestAnimationFrame for canvas/WebGL work, never setInterval

## General
- Each experiment should feel self-contained
- Dark theme always — no light mode toggle
- Keep dependencies minimal — prefer vanilla JS/CSS over libraries
```

The pipeline stages reference this file like a style guide. The Planner incorporates these constraints into the implementation plan. The Implementer follows them while coding. The Tester checks for violations.

You don't need to start with a design system. Let a few experiments accumulate, see what patterns emerge, and codify them afterward.

---

## 8. Tips and Lessons Learned

These come from running this pipeline nightly. Some were learned the hard way.

### Use `tsc --noEmit`, not `next build`

```bash
npx tsc --noEmit
```

This validates TypeScript without actually building the project. On a resource-constrained machine (like a small VPS), `next build` can OOM or take 10+ minutes. `tsc --noEmit` runs in seconds and catches the same type errors. The real build happens on Vercel's infrastructure when you push.

### Subagent parallelism is powerful, but be careful

OpenClaw lets a stage spawn subagents that work in parallel. This is great for the Implementer — you can have one subagent build the simulation logic while another builds the UI. But watch out for **concurrent file write conflicts**. If two subagents try to edit the same file at the same time, one of them will win and the other's changes will be lost.

**Solutions:**
- Structure the work so subagents touch different files
- Use `exec` with heredoc scripts for large file writes (atomic write)
- Have one "orchestrator" subagent that merges work at the end

### Let crons be the source of truth

It's tempting to manually trigger pipeline stages when you're excited. Resist this. The cron schedule ensures stages run in order with proper spacing. If you skip ahead (e.g., triggering the Implementer before the Planner is done), you'll get confused output.

If you want to rerun a stage, wait for the next cron cycle, or adjust the cron schedule temporarily.

### Keep IMPROVEMENTS.md as a living backlog

Every time you notice something — a visual bug, a missing feature, a mobile issue — add it to `IMPROVEMENTS.md`. Don't try to fix it yourself. The improvement crons will get to it. This keeps your backlog organized and ensures nothing falls through the cracks.

### The pipeline directory is your paper trail

The `pipeline/` directory contains the output from every stage. When something goes wrong, read through the chain: Did the Ideator pick a bad idea? Did the Planner miss something? Did the Implementer misinterpret the plan? The paper trail makes debugging straightforward.

### Start simple

Your first experiment doesn't need Supabase, WebGL, or external APIs. Make it a pure client-side canvas animation. Get the pipeline working end-to-end with something simple before adding complexity.

### Commit messages matter

Tell the Implementer to write descriptive commit messages. When you're reviewing the git log in the morning, "Add particle garden experiment with gravity simulation and color-cycling" is much more useful than "add experiment."

---

## 9. Adapting for Your Own Projects

This pipeline is a pattern, not a prescription. Here's how to make it yours.

### You don't have to use Next.js

Any web framework works. The pipeline cares about:
- A place to put experiment files (a directory structure)
- A registry of experiments (a data file)
- A way to validate the code (`tsc`, `eslint`, framework-specific checks)
- A way to deploy (push to git → auto-deploy)

Astro, SvelteKit, Nuxt, Remix, even plain HTML with a static site generator — all fine.

### You don't need Supabase

Many experiments are purely client-side: canvas animations, physics simulations, generative art, interactive toys. No database needed. Only set up Supabase (or any backend) when you actually need to persist data or authenticate users.

### Adjust the schedule to your life

The example schedule assumes US Central time and going to bed around 11 PM:

| Stage | Time | Why |
|---|---|---|
| Ideator | 9 PM | Early enough to review before bed |
| Planner | 10 PM | You can still leave feedback |
| Implementer | 11:30 PM | Runs while you sleep |
| Tester | 2:30 AM | Deploy has settled, tests against production |

If you're in Europe, shift everything. If you're a night owl, push it later. If you don't care about reviewing between stages, you could run all four stages back-to-back in 2 hours.

### The pattern is what matters

The specific tools and frameworks are secondary. The core pattern is:

```
Ideate → Plan → Build → Test
   ↑                      │
   └── Human feedback ─────┘
```

Each stage:
1. Reads the previous stage's output
2. Does its job
3. Writes its output to a known location
4. Announces what it did

That's it. You could implement this with different AI platforms, different languages, different deployment targets. The pipeline structure is the thing worth copying.

### Experiment with the experiments

Try different things:
- **Themed weeks:** Tell the Ideator to focus on physics simulations for a week
- **Collaborative experiments:** Have the pipeline build multiplayer experiences
- **Portfolio pieces:** Use the pipeline to build polished showcase projects, not just toys
- **Learning tool:** Focus on areas you want to learn — tell the Ideator "I want to learn WebGL" and it'll generate ideas that teach you WebGL

The pipeline is a creative engine. Point it at whatever interests you and let it run.

---

## Getting Started Checklist

- [ ] Install and configure [OpenClaw](https://docs.openclaw.ai)
- [ ] Create your web project and push to GitHub
- [ ] Connect the GitHub repo to Vercel (or your deploy platform)
- [ ] Create `src/lib/experiments.ts` (or your registry equivalent)
- [ ] Create the `pipeline/` directory
- [ ] Set up the 4 pipeline cron jobs in OpenClaw
- [ ] (Optional) Create `DESIGN.md` with your visual constraints
- [ ] (Optional) Create `IMPROVEMENTS.md` with initial backlog items
- [ ] (Optional) Set up improvement crons
- [ ] Go to sleep and wake up to something new 🌅

---

*This guide is part of the [experiments](https://github.com/neill-k/experiments) project. Questions, improvements, and your own experiments are welcome.*
