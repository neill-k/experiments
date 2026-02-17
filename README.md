# experiments

A collection of small, self-contained web experiments — built overnight by AI agents, reviewed by a human in the morning.

**Live at** [experiments.neillkillgore.com](https://experiments.neillkillgore.com)

## How it works

An automated pipeline runs nightly:

1. **Ideator** (9 PM CT) — generates and selects an experiment concept
2. **Planner** (10 PM CT) — writes a detailed implementation plan
3. **Implementer** (11:30 PM CT) — builds it
4. **Tester** (2:30 AM CT) — validates TypeScript, checks for regressions

Between stages, a human can review output and leave feedback. By morning, there's a new experiment live on the site — or at least a solid attempt at one.

Improvement crons also run periodically to polish existing experiments (bug fixes, mobile improvements, visual tweaks).

## Current experiments

| Experiment | Description |
|---|---|
| 🐜 [Ant Farm](https://experiments.neillkillgore.com/e/ant-farm) | A living ant colony simulation — dig tunnels, forage, build underground |
| 🫧 [The Blob](https://experiments.neillkillgore.com/e/the-blob) | Bioluminescent entities that split, merge, hunt, flee, and glitch |
| 📝 [Prompt Library](https://experiments.neillkillgore.com/e/prompt-library) | Organize, version, and test prompts for LLM applications |
| 🤖 [Agent Spec Builder](https://experiments.neillkillgore.com/e/agent-spec-builder) | Turn agent ideas into implementable Markdown specs |

## Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (Postgres, Auth, RLS)
- **Hosting:** Vercel
- **Auth:** GitHub OAuth
- **Fonts:** Instrument Serif, DM Sans, JetBrains Mono

## Project structure

```
src/
├── app/
│   ├── e/                    # Each experiment lives here
│   │   ├── ant-farm/
│   │   ├── the-blob/
│   │   ├── prompt-library/
│   │   └── agent-spec-builder/
│   ├── api/                  # API routes
│   └── page.tsx              # Homepage / experiment index
├── lib/
│   ├── experiments.ts        # Experiment registry (source of truth)
│   └── supabase/             # Supabase client setup
supabase/
└── migrations/               # Database migrations
docs/                         # Design specs and API docs
```

## Adding an experiment

1. Create a directory under `src/app/e/<slug>/`
2. Add the experiment to the registry in `src/lib/experiments.ts`
3. Run `npx tsc --noEmit` to validate (do NOT run `next build` — it OOMs on this machine)

## Local development

```bash
cp .env.example .env.local
# Fill in your Supabase project URL and anon key
npm install
npm run dev
```

## Design constraints

- Dark theme (`#08080a` / `#ebebeb`)
- No rounded corners — hard edges everywhere
- Mobile-first
- Each experiment should feel self-contained but visually consistent with the site

## Want to build your own?

See the **[Setup Guide](docs/setup-guide.md)** for a full walkthrough of how to configure the overnight pipeline, set up the cron jobs, and adapt it for your own projects.

## License

MIT
