# The Hard Question — UI/UX Design Specification

> A daily philosophy app. One question. Your answer. Which philosophers think like you?

---

## 1. Design System Integration

This app lives inside the existing `experiments` site. It inherits:

```css
/* Already in globals.css */
--bg: #08080a;
--fg: #ebebeb;
--muted: #888;
--border: #1a1a1a;
--border-hover: #333;
--accent: rgba(255, 255, 255, 0.06);
--danger: #c33;

/* Fonts already loaded in root layout */
--font-display: Instrument Serif  /* questions, headings */
--font-body: DM Sans              /* body text, UI */
--font-mono: JetBrains Mono       /* stats, counters, percentages */

/* Already present: animated rainbow gradient, grain overlay */
```

### Extended Color Palette (add to globals.css or as Tailwind theme extension)

```css
:root {
  /* Philosopher school colors — muted, sophisticated */
  --school-stoicism:       #8B9DAF; /* steel blue-gray */
  --school-existentialism: #C4785C; /* burnt sienna */
  --school-utilitarianism: #7BA68C; /* sage green */
  --school-absurdism:      #B878B8; /* dusty violet */
  --school-pragmatism:     #C9A84C; /* antique gold */
  --school-nihilism:       #6B6B6B; /* cold gray */
  --school-phenomenology:  #5C8DC4; /* cerulean */
  --school-virtue-ethics:  #C45C5C; /* muted crimson */
  --school-deontology:     #5CC4B8; /* teal */
  --school-eastern:        #D4A574; /* warm sand */

  /* Similarity score gradient */
  --sim-low:    #6B6B6B;  /* <30% — gray */
  --sim-mid:    #C9A84C;  /* 30-60% — gold */
  --sim-high:   #7BA68C;  /* 60-85% — green */
  --sim-exact:  #ebebeb;  /* 85%+ — white (you think alike) */

  /* UI accents for this experiment */
  --thq-surface: #0f0f12;       /* slightly lifted surface */
  --thq-surface-2: #161619;     /* card background */
  --thq-glow: rgba(200, 180, 255, 0.04); /* subtle purple tint for focus states */
  --thq-unlock: #C9A84C;        /* gold for premium CTA */
}
```

---

## 2. Typography Scale

All sizes are `rem`. Mobile-first, desktop overrides via `md:` breakpoint.

| Element | Font | Mobile | Desktop | Weight | Tracking |
|---------|------|--------|---------|--------|----------|
| Question text | `--font-display` | `2.5rem` / `leading-[1.15]` | `4.5rem` / `leading-[1.1]` | 400 (normal) | `-0.02em` |
| Nav items | `--font-body` | `0.875rem` | `0.875rem` | 500 | `0` |
| Day counter | `--font-mono` | `0.75rem` | `0.75rem` | 400 | `0.05em` |
| Philosopher name | `--font-display` | `1.5rem` | `2rem` | 400 | `-0.01em` |
| School tag | `--font-mono` | `0.625rem` | `0.6875rem` | 500 | `0.08em` |
| Perspective text | `--font-body` | `0.9375rem` | `1rem` | 400 | `0` |
| Similarity % | `--font-mono` | `1.125rem` | `1.25rem` | 600 | `0` |
| Answer textarea | `--font-body` | `1.0625rem` | `1.125rem` | 400 | `0` |
| Fingerprint labels | `--font-mono` | `0.6875rem` | `0.75rem` | 400 | `0.04em` |
| Section headings | `--font-display` | `1.75rem` | `2.25rem` | 400 | `-0.01em` |
| Body copy | `--font-body` | `0.9375rem` | `1rem` | 400 | `0` |

---

## 3. Component Hierarchy

```
app/e/the-hard-question/
├── layout.tsx                    ← THQ-specific layout (no site nav)
├── page.tsx                      ← Main question view (SSR + client hydration)
├── fingerprint/
│   └── page.tsx                  ← Fingerprint/profile view
├── archive/
│   └── page.tsx                  ← Past questions archive (paid)
├── components/
│   ├── THQNav.tsx                ← Top navigation bar
│   ├── QuestionDisplay.tsx       ← The big question (animated)
│   ├── AnswerInput.tsx           ← Textarea + submit
│   ├── PhilosopherReveal.tsx     ← Container for reveal animation
│   ├── PhilosopherCard.tsx       ← Individual philosopher card
│   ├── SimilarityBar.tsx         ← Animated percentage bar
│   ├── FingerprintChart.tsx      ← Radar/spider chart
│   ├── FingerprintStats.tsx      ← Typography-forward stat blocks
│   ├── ArchiveList.tsx           ← Past questions list
│   ├── ArchiveCard.tsx           ← Individual archive entry
│   ├── PaywallBlur.tsx           ← Blur overlay + unlock CTA
│   ├── PaywallPrompt.tsx         ← Full upgrade prompt (fingerprint page)
│   └── DayCounter.tsx            ← "Day 47" mono counter
├── hooks/
│   ├── useQuestionState.ts       ← Question flow state machine
│   ├── useAnimatedNumber.ts      ← Number count-up animation
│   └── useFingerprint.ts         ← Fingerprint data fetching
├── lib/
│   ├── types.ts                  ← TypeScript types
│   └── api.ts                    ← API client functions
└── thq.css                       ← THQ-specific animations & styles
```

### State Machine (useQuestionState)

```
LOADING → QUESTION → ANSWERING → SUBMITTING → REVEAL → COMPLETE
```

- `LOADING`: Question fading in
- `QUESTION`: Question visible, no answer area yet
- `ANSWERING`: Answer textarea visible (auto-transitions from QUESTION after 2s or on tap)
- `SUBMITTING`: Answer sent, loading philosophers
- `REVEAL`: Philosopher cards animating in
- `COMPLETE`: All cards visible, can navigate

---

## 4. View Specifications

### 4.1 Question View (Main Screen) — `page.tsx`

**Layout:**
```
┌─────────────────────────────────┐
│ ☰ THE HARD QUESTION    Day 47 🧬│  ← THQNav (48px height)
├─────────────────────────────────┤
│                                 │
│                                 │
│   Is it possible to live        │  ← QuestionDisplay
│   an authentic life in a        │     Centered vertically
│   society that demands          │     Max-width: 48rem
│   conformity?                   │     Padding: 1.5rem mobile, 3rem desktop
│                                 │
│                                 │
│   ┌─────────────────────────┐   │
│   │ What do you think?      │   │  ← AnswerInput (appears after question)
│   │                         │   │     Fades in from below
│   │                         │   │
│   │                         │   │
│   └─────────────────────────┘   │
│                      [Submit →] │  ← Submit button (right-aligned)
│                                 │
└─────────────────────────────────┘
```

**QuestionDisplay Component:**
```tsx
// Tailwind classes:
<div className="flex min-h-[60vh] items-center justify-center px-6 md:px-12">
  <h1 className="
    font-[family-name:var(--font-display)]
    text-[2.5rem] md:text-[4.5rem]
    leading-[1.15] md:leading-[1.1]
    tracking-[-0.02em]
    text-[var(--fg)]
    max-w-3xl
    text-center
    animate-question-in
  ">
    {question}
  </h1>
</div>
```

**AnswerInput Component:**
```tsx
<div className="
  mx-auto max-w-2xl px-6 md:px-0
  animate-slide-up
  opacity-0
  [animation-delay:2000ms]
  [animation-fill-mode:forwards]
">
  <textarea
    className="
      w-full
      min-h-[8rem] md:min-h-[10rem]
      resize-none
      bg-transparent
      border-0 border-b border-[var(--border)]
      focus:border-[var(--border-hover)]
      focus:outline-none
      font-[family-name:var(--font-body)]
      text-[1.0625rem] md:text-[1.125rem]
      text-[var(--fg)]
      placeholder:text-[var(--muted)]/50
      py-4 px-0
      transition-[border-color] duration-300
    "
    placeholder="What do you think?"
    rows={5}
  />
  <div className="flex justify-end mt-4">
    <button className="
      font-[family-name:var(--font-body)]
      text-sm font-medium
      text-[var(--fg)]
      border border-[var(--border)]
      hover:border-[var(--border-hover)]
      hover:bg-[var(--accent)]
      px-6 py-3
      min-h-[44px] min-w-[44px]
      transition-all duration-200
      active:scale-[0.98]
    ">
      Submit →
    </button>
  </div>
</div>
```

### 4.2 Philosopher Reveal — appears after submit

**Layout (replaces answer input area):**
```
┌─────────────────────────────────┐
│ ☰ THE HARD QUESTION    Day 47 🧬│
├─────────────────────────────────┤
│                                 │
│   Is it possible to live        │  ← Question stays but shrinks
│   an authentic life...?         │     text-[1.75rem] md:text-[2.5rem]
│                                 │
│   YOUR ANSWER:                  │  ← Small label, mono
│   "I believe authenticity..."   │  ← User's answer, truncated, italic
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Jean-Paul Sartre        87% │ │  ← PhilosopherCard #1
│ │ EXISTENTIALISM              │ │     [stagger delay: 0ms]
│ │ ████████████████████░░░░    │ │
│ │ "Existence precedes essence │ │
│ │  — we are condemned to be   │ │
│ │  free..."                   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Albert Camus            72% │ │  ← PhilosopherCard #2
│ │ ABSURDISM                   │ │     [stagger delay: 150ms]
│ │ ██████████████████░░░░░░    │ │
│ │ "The absurd does not        │ │
│ │  liberate; it binds..."     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   ░░░░ BLURRED ░░░░░░░░░░░░  │ │  ← PaywallBlur (card #3+)
│   Marcus Aurelius         65% │ │     Free tier: 2 visible, rest blurred
│   ░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│ │ 🔓 Unlock all perspectives  │ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                 │
│            See your             │
│          fingerprint →          │  ← CTA to fingerprint view
│                                 │
└─────────────────────────────────┘
```

**PhilosopherCard Component:**
```tsx
<div className="
  border border-[var(--border)]
  bg-[var(--thq-surface-2)]
  p-5 md:p-6
  mx-4 md:mx-auto
  max-w-2xl
  animate-card-up
  opacity-0
  [animation-fill-mode:forwards]
  transition-[border-color] duration-200
  hover:border-[var(--border-hover)]
"
  style={{ animationDelay: `${index * 150}ms` }}
>
  {/* Header row */}
  <div className="flex items-baseline justify-between mb-3">
    <h3 className="
      font-[family-name:var(--font-display)]
      text-[1.5rem] md:text-[2rem]
      tracking-[-0.01em]
      text-[var(--fg)]
    ">
      {philosopher.name}
    </h3>
    <span className="
      font-[family-name:var(--font-mono)]
      text-[1.125rem] md:text-[1.25rem]
      font-semibold
      tabular-nums
    " style={{ color: getSimilarityColor(similarity) }}>
      {displayPercentage}%
    </span>
  </div>

  {/* School tag */}
  <span className="
    inline-block
    font-[family-name:var(--font-mono)]
    text-[0.625rem] md:text-[0.6875rem]
    font-medium
    tracking-[0.08em]
    uppercase
    px-2 py-1
    border border-current
    mb-4
  " style={{ color: getSchoolColor(philosopher.school) }}>
    {philosopher.school}
  </span>

  {/* Similarity bar */}
  <SimilarityBar percentage={similarity} delay={index * 150 + 400} />

  {/* Perspective text */}
  <p className="
    font-[family-name:var(--font-body)]
    text-[0.9375rem] md:text-[1rem]
    text-[var(--fg)]/80
    leading-relaxed
    mt-4
  ">
    "{philosopher.perspective}"
  </p>
</div>
```

**SimilarityBar Component:**
```tsx
<div className="w-full h-[3px] bg-[var(--border)] mt-2">
  <div
    className="h-full transition-[width] duration-1000 ease-out"
    style={{
      width: `${animatedPercentage}%`,
      backgroundColor: getSimilarityColor(percentage),
      transitionDelay: `${delay}ms`,
    }}
  />
</div>
```

### 4.3 Fingerprint View — `/fingerprint`

**Layout:**
```
┌─────────────────────────────────┐
│ ← THE HARD QUESTION    Day 47 🧬│
├─────────────────────────────────┤
│                                 │
│     Your Philosophical          │  ← Section heading
│        Fingerprint              │     font-display, centered
│                                 │
│         ╱‾‾‾╲                   │
│        ╱      ╲                 │
│   ────╱   ◆    ╲────           │  ← FingerprintChart
│       ╲   /|\   ╱              │     Radar/spider chart
│        ╲ / | \ ╱               │     SVG-based, animated
│         ╲__|__╱                 │     Each axis = school
│                                 │
│                                 │
│  ┌──────────┬──────────┐       │
│  │STOICISM  │EXISTENTL.│       │  ← FingerprintStats
│  │    72%   │    65%   │       │     2-column grid on mobile
│  │ ████████ │ ███████  │       │     3-column on desktop
│  ├──────────┼──────────┤       │     Mono numbers, display labels
│  │ABSURDISM │PRAGMATSM │       │
│  │    58%   │    43%   │       │
│  │ ██████   │ █████    │       │
│  └──────────┴──────────┘       │
│                                 │
│   Questions answered: 47        │  ← Stat line, mono
│   Current streak: 12 days       │
│   Most aligned: Stoicism        │
│                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                 │
│  ░░ TEASER: Evolution chart ░░  │  ← PaywallPrompt (free tier)
│  ░░ See how your thinking   ░░  │     Blurred chart + upgrade CTA
│  ░░ has shifted over time   ░░  │
│  ░░                         ░░  │
│  ░░  [Unlock for $4/mo →]  ░░  │
│                                 │
└─────────────────────────────────┘
```

**FingerprintChart (SVG Radar):**
```tsx
// Custom SVG radar chart — NO external charting library
// Each vertex = philosophical school
// Values 0-100 mapped to radius
// Animated: vertices interpolate from center to final position over 800ms

<svg viewBox="0 0 400 400" className="w-full max-w-[20rem] md:max-w-[24rem] mx-auto">
  {/* Grid lines — concentric polygons at 25%, 50%, 75%, 100% */}
  {[0.25, 0.5, 0.75, 1].map(scale => (
    <polygon
      key={scale}
      points={getPolygonPoints(numSchools, scale)}
      fill="none"
      stroke="var(--border)"
      strokeWidth="1"
    />
  ))}

  {/* Axis lines from center to each vertex */}
  {schools.map((_, i) => (
    <line
      key={i}
      x1="200" y1="200"
      x2={axisEndpoints[i].x} y2={axisEndpoints[i].y}
      stroke="var(--border)"
      strokeWidth="1"
    />
  ))}

  {/* Data polygon — the fingerprint shape */}
  <polygon
    points={animatedDataPoints}
    fill="rgba(200, 180, 255, 0.08)"
    stroke="var(--fg)"
    strokeWidth="1.5"
    className="transition-all duration-800 ease-out"
  />

  {/* Vertex dots */}
  {dataPoints.map((point, i) => (
    <circle
      key={i}
      cx={point.x} cy={point.y}
      r="3"
      fill={getSchoolColor(schools[i])}
      className="transition-all duration-800 ease-out"
      style={{ transitionDelay: `${i * 50}ms` }}
    />
  ))}

  {/* Labels */}
  {schools.map((school, i) => (
    <text
      key={i}
      x={labelPositions[i].x} y={labelPositions[i].y}
      className="font-[family-name:var(--font-mono)] text-[0.625rem] fill-[var(--muted)]"
      textAnchor="middle"
    >
      {school.toUpperCase()}
    </text>
  ))}
</svg>
```

**FingerprintStats Component:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 gap-0">
  {schools.map((school, i) => (
    <div
      key={school.name}
      className="
        border border-[var(--border)]
        p-4 md:p-5
        -mt-px -ml-px  /* collapse borders */
      "
    >
      <span className="
        font-[family-name:var(--font-mono)]
        text-[0.625rem]
        tracking-[0.08em]
        uppercase
        block mb-2
      " style={{ color: getSchoolColor(school.name) }}>
        {school.name}
      </span>
      <span className="
        font-[family-name:var(--font-mono)]
        text-[1.5rem] md:text-[2rem]
        font-semibold
        text-[var(--fg)]
        tabular-nums
        block
      ">
        {school.percentage}%
      </span>
      {/* Mini bar */}
      <div className="w-full h-[2px] bg-[var(--border)] mt-2">
        <div
          className="h-full"
          style={{
            width: `${school.percentage}%`,
            backgroundColor: getSchoolColor(school.name),
          }}
        />
      </div>
    </div>
  ))}
</div>
```

### 4.4 Archive View — `/archive` (paid)

**Layout:**
```
┌─────────────────────────────────┐
│ ← THE HARD QUESTION    Day 47 🧬│
├─────────────────────────────────┤
│                                 │
│         Archive                 │  ← font-display heading
│                                 │
│  ┌─────────────────────────────┐│
│  │ Day 47 · Feb 17, 2026      ││  ← ArchiveCard
│  │                             ││     Border left = top school color
│  │ Is it possible to live an   ││
│  │ authentic life in a society ││
│  │ that demands conformity?    ││
│  │                             ││
│  │ ▸ Sartre 87% · Camus 72%   ││  ← Mini match summary, mono
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ Day 46 · Feb 16, 2026      ││
│  │                             ││
│  │ Can a person be truly       ││
│  │ selfless, or is all         ││
│  │ altruism secretly selfish?  ││
│  │                             ││
│  │ ▸ Mill 79% · Kant 71%      ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ Day 45 · Feb 15, 2026      ││
│  │ ...                         ││
│  └─────────────────────────────┘│
│                                 │
│       Load more ↓               │
│                                 │
└─────────────────────────────────┘
```

**ArchiveCard:**
```tsx
<div className="
  border border-[var(--border)]
  border-l-2
  bg-[var(--thq-surface-2)]
  p-5 md:p-6
  transition-[border-color] duration-200
  hover:border-[var(--border-hover)]
  cursor-pointer
"
  style={{ borderLeftColor: getSchoolColor(topMatch.school) }}
>
  {/* Date line */}
  <div className="
    font-[family-name:var(--font-mono)]
    text-[0.6875rem]
    text-[var(--muted)]
    tracking-[0.04em]
    mb-3
  ">
    Day {dayNumber} · {formattedDate}
  </div>

  {/* Question */}
  <p className="
    font-[family-name:var(--font-display)]
    text-[1.25rem] md:text-[1.5rem]
    leading-[1.25]
    text-[var(--fg)]
    mb-3
  ">
    {question}
  </p>

  {/* Match summary */}
  <div className="
    font-[family-name:var(--font-mono)]
    text-[0.6875rem]
    text-[var(--muted)]
    tracking-[0.02em]
  ">
    ▸ {matches.map(m => `${m.name} ${m.pct}%`).join(' · ')}
  </div>
</div>
```

### 4.5 Navigation — `THQNav`

```
┌─────────────────────────────────────────┐
│                                         │
│  THE HARD QUESTION         Day 47   🧬  │
│                                    ↑    │
│  ↑ font-display             ↑   fingerprint
│    link to /             mono counter   │
│                                         │
│  (on sub-pages: ← replaces title)      │
│                                         │
└─────────────────────────────────────────┘
```

```tsx
<nav className="
  fixed top-0 left-0 right-0 z-50
  border-b border-[var(--border)]
  bg-[var(--bg)]/80
  backdrop-blur-md
  h-12
">
  <div className="
    mx-auto max-w-3xl h-full
    flex items-center justify-between
    px-4 md:px-6
  ">
    {/* Left: title or back arrow */}
    <Link href="/e/the-hard-question" className="
      font-[family-name:var(--font-display)]
      text-base
      text-[var(--fg)]/90
      hover:text-[var(--fg)]
      transition-colors duration-200
    ">
      {isSubPage ? '←' : 'The Hard Question'}
    </Link>

    {/* Right: day counter + fingerprint + archive */}
    <div className="flex items-center gap-4">
      <DayCounter day={currentDay} />

      {/* Archive icon — lock if free tier */}
      <Link href="/e/the-hard-question/archive" className="
        w-11 h-11
        flex items-center justify-center
        text-[var(--muted)]
        hover:text-[var(--fg)]
        transition-colors duration-200
        relative
      ">
        <ArchiveIcon className="w-4 h-4" />
        {!isPaid && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--thq-unlock)]" />
        )}
      </Link>

      {/* Fingerprint icon */}
      <Link href="/e/the-hard-question/fingerprint" className="
        w-11 h-11
        flex items-center justify-center
        text-[var(--muted)]
        hover:text-[var(--fg)]
        transition-colors duration-200
      ">
        <FingerprintIcon className="w-5 h-5" />
      </Link>
    </div>
  </div>
</nav>
```

**DayCounter:**
```tsx
<span className="
  font-[family-name:var(--font-mono)]
  text-[0.75rem]
  text-[var(--muted)]
  tracking-[0.05em]
  tabular-nums
">
  Day {day}
</span>
```

---

## 5. Animation Specifications

### Add to `thq.css` (loaded by THQ layout):

```css
/* ===== Question fade-in ===== */
@keyframes question-in {
  0% {
    opacity: 0;
    transform: translateY(12px);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.animate-question-in {
  animation: question-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* ===== Answer area slide up ===== */
@keyframes slide-up {
  0% {
    opacity: 0;
    transform: translateY(24px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* ===== Philosopher card entrance ===== */
@keyframes card-up {
  0% {
    opacity: 0;
    transform: translateY(32px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-card-up {
  animation: card-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* ===== Question shrink (when transitioning to reveal) ===== */
@keyframes question-shrink {
  0% {
    font-size: var(--question-size-full);
    padding-top: 0;
  }
  100% {
    font-size: var(--question-size-small);
    padding-top: 0;
  }
}

.animate-question-shrink {
  transition: font-size 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              min-height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ===== Similarity bar fill ===== */
.similarity-bar-fill {
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ===== Page transition wrapper ===== */
@keyframes page-enter {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-page-enter {
  animation: page-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* ===== Number count-up (handled in JS, but transition for smoothness) ===== */
.animated-number {
  transition: opacity 0.3s ease;
}

/* ===== Blur overlay for paywall ===== */
.paywall-blur {
  filter: blur(6px);
  user-select: none;
  pointer-events: none;
}

/* ===== Fingerprint radar chart vertex animation ===== */
@keyframes vertex-pop {
  0% {
    r: 0;
    opacity: 0;
  }
  60% {
    r: 4;
    opacity: 1;
  }
  100% {
    r: 3;
    opacity: 1;
  }
}

.animate-vertex {
  animation: vertex-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* ===== Submit button pulse on ready ===== */
@keyframes subtle-pulse {
  0%, 100% {
    border-color: var(--border-hover);
  }
  50% {
    border-color: var(--fg);
  }
}

.animate-submit-ready {
  animation: subtle-pulse 2s ease-in-out infinite;
}
```

### Animation Timing Summary

| Animation | Duration | Easing | Delay |
|-----------|----------|--------|-------|
| Question fade-in | 1200ms | `cubic-bezier(0.16, 1, 0.3, 1)` | 0ms |
| Answer slide-up | 600ms | same | 2000ms after question |
| Question shrink | 600ms | same | 0ms (on submit) |
| Card entrance (each) | 700ms | same | `index * 150ms` |
| Similarity bar fill | 1000ms | same | `index * 150 + 400ms` |
| Number count-up | 1200ms | JS `easeOutExpo` | `index * 150 + 300ms` |
| Radar vertex pop | 500ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `index * 50ms` |
| Page enter | 500ms | `cubic-bezier(0.16, 1, 0.3, 1)` | 0ms |

### `useAnimatedNumber` Hook

```tsx
function useAnimatedNumber(target: number, duration = 1200, delay = 0): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCurrent(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return current;
}
```

---

## 6. Responsive Breakpoints

Using Tailwind's default breakpoints. Mobile-first approach.

| Breakpoint | Width | Adaptations |
|-----------|-------|-------------|
| Base (mobile) | `<768px` | Question: 2.5rem, single-column cards, full-width nav, 2-col fingerprint grid |
| `md` (tablet) | `≥768px` | Question: 4.5rem, cards max-w-2xl centered, 3-col fingerprint grid |
| `lg` (desktop) | `≥1024px` | Max-w-3xl container, more generous padding |

### Mobile-Specific Considerations

```
Touch targets:     All interactive elements ≥ 44px × 44px
Nav icons:         w-11 h-11 (44px)
Submit button:     min-h-[44px] px-6 py-3
Archive cards:     p-5 (generous tap area)
Textarea:          min-h-[8rem] on mobile (comfortable typing)
Question:          px-6 (24px side padding, prevents edge-crowding)
Vertical centering: min-h-[60vh] for question area (readable without scroll)
Keyboard:          Answer area should use `pb-[env(safe-area-inset-bottom)]`
                   to stay above the keyboard on iOS
```

### Safe Area & Viewport

```tsx
// In layout.tsx <head> or metadata
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

```css
/* Add to thq.css */
.thq-container {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 7. Paywall UI

### PaywallBlur Component (for philosopher cards)

```tsx
<div className="relative mx-4 md:mx-auto max-w-2xl">
  {/* Blurred card content */}
  <div className="paywall-blur" aria-hidden="true">
    <PhilosopherCard philosopher={philosopher} similarity={similarity} />
  </div>

  {/* Unlock overlay */}
  <div className="
    absolute inset-0
    flex items-center justify-center
    bg-[var(--bg)]/40
  ">
    <button className="
      font-[family-name:var(--font-body)]
      text-sm font-medium
      text-[var(--thq-unlock)]
      border border-[var(--thq-unlock)]/30
      hover:border-[var(--thq-unlock)]
      px-5 py-3
      min-h-[44px]
      transition-all duration-200
      flex items-center gap-2
    ">
      <LockIcon className="w-3.5 h-3.5" />
      Unlock all perspectives
    </button>
  </div>
</div>
```

### PaywallPrompt Component (for fingerprint page)

```tsx
<div className="
  border border-[var(--border)]
  p-6 md:p-8
  mx-4 md:mx-auto
  max-w-2xl
  text-center
  mt-8
">
  {/* Teaser chart (blurred) */}
  <div className="paywall-blur mb-6" aria-hidden="true">
    {/* Fake evolution chart showing fingerprint over time */}
    <div className="h-40 bg-[var(--thq-surface)] flex items-end gap-1 px-4">
      {fakeBars.map((h, i) => (
        <div key={i} className="flex-1 bg-[var(--border-hover)]" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>

  <h3 className="
    font-[family-name:var(--font-display)]
    text-[1.5rem] md:text-[1.75rem]
    text-[var(--fg)]
    mb-2
  ">
    See how your thinking evolves
  </h3>

  <p className="
    font-[family-name:var(--font-body)]
    text-sm
    text-[var(--muted)]
    mb-6
    max-w-md mx-auto
  ">
    Track your philosophical fingerprint over time. See full philosopher
    perspectives and browse your complete archive.
  </p>

  <button className="
    font-[family-name:var(--font-body)]
    text-sm font-medium
    text-[var(--bg)]
    bg-[var(--thq-unlock)]
    hover:bg-[var(--thq-unlock)]/90
    px-8 py-3
    min-h-[44px]
    transition-all duration-200
  ">
    Upgrade — $4/month
  </button>

  <p className="
    font-[family-name:var(--font-mono)]
    text-[0.625rem]
    text-[var(--muted)]/60
    mt-3
    tracking-[0.04em]
  ">
    Cancel anytime. No commitment.
  </p>
</div>
```

---

## 8. THQ Layout (`layout.tsx`)

This experiment gets its **own layout** that replaces the site nav:

```tsx
// app/e/the-hard-question/layout.tsx
import { THQNav } from './components/THQNav';
import './thq.css';

export const metadata = {
  title: 'The Hard Question',
  description: 'One hard philosophical question per day. Answer it. See which philosophers think like you.',
};

export default function THQLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <THQNav />
      <div className="flex-1 pt-12 thq-container">
        {children}
      </div>
    </div>
  );
}
```

**Important:** This layout should **not** render the parent site's `<nav>` element. The THQ experience is self-contained. Since the parent layout already renders a nav, the THQ layout should hide it:

```tsx
// Option A: Use a CSS class on <main> that the parent layout can detect
// Option B: Just style the THQ nav to overlay the parent nav (both are fixed, THQ is z-51)
// Recommended: Option B for simplicity

// THQNav gets z-[51] to layer above the parent nav at z-50
```

---

## 9. Color Utility Functions

```tsx
// lib/colors.ts

const schoolColors: Record<string, string> = {
  'Stoicism':       'var(--school-stoicism)',
  'Existentialism': 'var(--school-existentialism)',
  'Utilitarianism': 'var(--school-utilitarianism)',
  'Absurdism':      'var(--school-absurdism)',
  'Pragmatism':     'var(--school-pragmatism)',
  'Nihilism':       'var(--school-nihilism)',
  'Phenomenology':  'var(--school-phenomenology)',
  'Virtue Ethics':  'var(--school-virtue-ethics)',
  'Deontology':     'var(--school-deontology)',
  'Eastern':        'var(--school-eastern)',
};

export function getSchoolColor(school: string): string {
  return schoolColors[school] ?? 'var(--muted)';
}

export function getSimilarityColor(percentage: number): string {
  if (percentage >= 85) return 'var(--sim-exact)';
  if (percentage >= 60) return 'var(--sim-high)';
  if (percentage >= 30) return 'var(--sim-mid)';
  return 'var(--sim-low)';
}
```

---

## 10. TypeScript Types

```tsx
// lib/types.ts

export interface Question {
  id: string;
  text: string;
  dayNumber: number;
  date: string; // ISO date
  category?: string;
}

export interface PhilosophicalSchool {
  name: string;
  color: string;
}

export interface Philosopher {
  id: string;
  name: string;
  school: string;
  perspective: string;
  imageUrl?: string;
}

export interface PhilosopherMatch {
  philosopher: Philosopher;
  similarity: number; // 0-100
}

export interface UserAnswer {
  questionId: string;
  text: string;
  submittedAt: string;
}

export interface FingerprintData {
  schools: {
    name: string;
    percentage: number;
  }[];
  totalAnswered: number;
  currentStreak: number;
  topSchool: string;
}

export interface ArchiveEntry {
  question: Question;
  answer: UserAnswer;
  topMatches: PhilosopherMatch[];
}

export type QuestionState =
  | 'loading'
  | 'question'
  | 'answering'
  | 'submitting'
  | 'reveal'
  | 'complete';
```

---

## 11. Accessibility Considerations

### Semantic Structure
- Question is an `<h1>` — one per page, screen readers announce it
- Philosopher names are `<h3>` within the reveal section
- Nav uses `<nav>` with `aria-label="The Hard Question navigation"`
- Archive uses `<ol>` (ordered list of days)

### ARIA & Screen Reader Support
```tsx
// Question area
<section aria-label="Today's question" aria-live="polite">
  <h1>...</h1>
</section>

// Answer area
<label htmlFor="thq-answer" className="sr-only">Your answer</label>
<textarea id="thq-answer" aria-describedby="thq-answer-hint" />
<span id="thq-answer-hint" className="sr-only">
  Write your thoughts on today's philosophical question
</span>

// Philosopher reveal
<section aria-label="Philosopher perspectives" aria-live="polite">
  <div role="list">
    <div role="listitem" aria-label="Jean-Paul Sartre — 87% match">
      ...
    </div>
  </div>
</section>

// Similarity bar
<div
  role="meter"
  aria-valuenow={87}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="87% similarity with Sartre"
>
  <div className="similarity-bar-fill" />
</div>

// Paywall blur
<div aria-hidden="true" className="paywall-blur">
  {/* Blurred content — hidden from screen readers */}
</div>
<button aria-label="Unlock all philosopher perspectives for $4 per month">
  Unlock all perspectives
</button>
```

### Keyboard Navigation
- Tab order: Nav links → Question (read) → Textarea → Submit → Philosopher cards → Next action
- Cards are not focusable in reveal view (read-only)
- Archive cards are focusable links (`<a>` or button with `role="link"`)
- `Escape` from textarea does not submit (only explicit button click or Ctrl+Enter)

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  .animate-question-in,
  .animate-slide-up,
  .animate-card-up,
  .animate-page-enter,
  .animate-vertex {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .similarity-bar-fill {
    transition: none !important;
  }
}
```

### Color Contrast
- Primary text `#ebebeb` on `#08080a` → ratio **15.8:1** ✅ (AAA)
- Muted text `#888` on `#08080a` → ratio **5.3:1** ✅ (AA)
- School tag colors are decorative; text content is always accessible
- Similarity percentages use numeric values, not color-only

### Focus Styles
```css
/* Add to thq.css */
.thq-container *:focus-visible {
  outline: 2px solid var(--fg);
  outline-offset: 2px;
}
```

---

## 12. Complete Page Flow (User Journey)

### First Visit
1. User arrives → question fades in (1.2s)
2. After 2s, answer textarea slides up from below
3. User types answer in journal-style textarea
4. Submit button appears/pulses when text is entered
5. On submit → textarea fades out, question shrinks to smaller size
6. Philosopher cards stagger-animate upward (150ms apart)
7. Similarity percentages count up from 0
8. Free tier: 2 cards visible, 3rd+ blurred with unlock CTA
9. "See your fingerprint →" CTA appears below cards

### Return Visit (already answered today)
1. Question shown at reduced size
2. User's answer shown in italic below
3. Philosopher cards displayed immediately (no animation)
4. If before midnight: "Come back tomorrow for a new question"

### Fingerprint Page
1. Page enters with fade-up animation
2. Radar chart vertices animate from center outward (50ms stagger per vertex)
3. School percentage stats are visible below
4. Free tier: top section visible, evolution chart is blurred paywall
5. Paid tier: full chart + historical evolution line graph

---

## 13. Implementation Notes

### Data Flow
- Questions: Served from Supabase (one per day, pre-loaded)
- Answers: Stored in Supabase, associated with user + question
- Philosopher matching: Server action or API route calling an embedding/similarity service
- Fingerprint: Computed server-side from all user answers, cached

### Auth
- Leverage existing auth system (AuthButtons already in parent layout)
- Anonymous users can answer but don't get fingerprint accumulation
- Prompt sign-in for persistent data

### Performance
- Question text is SSR'd (fast first paint, good SEO)
- Philosopher matching is async (server action after submit)
- Fingerprint chart is client-only (SVG + JS animation)
- Archive uses infinite scroll with cursor-based pagination

### File Structure Summary
```
app/e/the-hard-question/
├── layout.tsx              ← THQ layout with own nav
├── page.tsx                ← QuestionDisplay + AnswerInput + PhilosopherReveal
├── thq.css                 ← All custom animations and styles
├── fingerprint/
│   └── page.tsx            ← FingerprintChart + FingerprintStats + PaywallPrompt
├── archive/
│   └── page.tsx            ← ArchiveList (paid gate)
├── components/
│   ├── THQNav.tsx
│   ├── QuestionDisplay.tsx
│   ├── AnswerInput.tsx
│   ├── PhilosopherReveal.tsx
│   ├── PhilosopherCard.tsx
│   ├── SimilarityBar.tsx
│   ├── FingerprintChart.tsx
│   ├── FingerprintStats.tsx
│   ├── ArchiveList.tsx
│   ├── ArchiveCard.tsx
│   ├── PaywallBlur.tsx
│   ├── PaywallPrompt.tsx
│   └── DayCounter.tsx
├── hooks/
│   ├── useQuestionState.ts
│   ├── useAnimatedNumber.ts
│   └── useFingerprint.ts
└── lib/
    ├── types.ts
    ├── colors.ts
    └── api.ts
```