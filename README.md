# Hotel Reservation System

A web app that books rooms in a 97-room hotel using an optimal-travel-time algorithm. Built with Next.js + TypeScript + Tailwind.

---

## Problem

A hotel has **97 rooms across 10 floors**:

| Floor | Rooms | Numbering |
|------:|------:|-----------|
| 1     | 10    | 101 – 110 |
| 2     | 10    | 201 – 210 |
| …     | …     | …         |
| 9     | 10    | 901 – 910 |
| 10    | 7     | 1001 – 1007 |

The staircase and lift are on the **left side** of the building. The first room on each floor (e.g. 101, 201, 1001) is closest to the stairs/lift.

### Travel time model

| Movement | Cost |
|---|---|
| One room horizontally on the same floor | **1 min** |
| One floor vertically (stairs/lift) | **2 min** |

So getting from room **102** to room **305** means:
walk 102 → 101 (1 min) + lift floor 1 → 3 (2 × 2 = 4 min) + walk 301 → 305 (4 min) = **9 min**.

In general, for any two rooms `a` and `b`:

```
travelTime(a, b) =
  if same floor:   |a.position - b.position|
  otherwise:       (a.position − 1) + 2·|a.floor − b.floor| + (b.position − 1)
```

### Booking rules

1. A single booking may include **up to 5 rooms**.
2. **Priority 1** — Prefer rooms on the **same floor**.
3. **Priority 2** — Among same-floor options, pick the set with the **smallest span** (distance between the first and last room).
4. **Priority 3** — If no single floor has enough rooms, span multiple floors and minimise `travelTime(first, last)` across the booking.

---

## Features (deliverables)

- Interface to enter room count (1–5) and book optimally
- Visualisation of the hotel as a 10-floor section with an elevator shaft on the left
- "Generate" button to populate random occupancy (slider sets the %)
- "Reset everything" button to clear all bookings and occupancy
- Booking summary card showing the chosen rooms and the resulting travel time (`first → last`)

---

## Quick start

```bash
npm install
npm run dev      # starts the app on http://localhost:3000 (or 3001 if busy)
```

Build commands:

```bash
npm run build         # production build & typecheck
npm run start         # serve the production build
```

Test commands:

```bash
npm test              # run all 131 tests (~3 s)
npm run test:watch    # watch mode
npm run test:coverage # run with coverage report (gate set at 100% / 100% / 100% / 100%)
```

Requires Node ≥ 18.

---

## Tech stack

- **Next.js 14** (App Router) — file-based routing, single page (`app/page.tsx`)
- **React 18** — UI components
- **TypeScript** — type safety across the algorithm and the UI
- **Tailwind CSS** — utility styling, with a custom token palette in `app/globals.css`
- **next/font** — Inter Tight (UI) + JetBrains Mono (room numbers) from Google Fonts
- **Jest 30** + **React Testing Library** + **jsdom** — unit and component tests with 100% coverage

No backend, no database. All state lives in React; refreshing the page clears it.

---

## Project structure

```
hotel/
├── app/
│   ├── layout.tsx           Root layout, loads fonts
│   ├── page.tsx             Main page — state, layout, wires components
│   └── globals.css          Tailwind base + custom CSS variables (palette, slider styles)
├── components/
│   ├── Hotel.tsx            Building visualisation (floors + elevator shaft + rooms)
│   ├── Room.tsx             Single room box (available / occupied / booked)
│   ├── ControlPanel.tsx     Inputs: book / random occupancy / reset
│   └── BookingSummary.tsx   Last-booking summary card
├── lib/
│   ├── types.ts             Room, BookingResult types
│   ├── hotel.ts             Static hotel definition (97 rooms, constants)
│   ├── travel.ts            travelTime(a, b), lexCompare, bookingSpan
│   ├── booking.ts           pickRooms — the optimisation algorithm
│   └── occupancy.ts         randomOccupancy — Fisher-Yates shuffle
├── __tests__/
│   ├── lib/
│   │   ├── hotel.test.ts          24 tests
│   │   ├── travel.test.ts         17 tests
│   │   ├── booking.test.ts        24 tests
│   │   └── occupancy.test.ts      10 tests
│   ├── components/
│   │   ├── Room.test.tsx           6 tests
│   │   ├── BookingSummary.test.tsx 5 tests
│   │   ├── ControlPanel.test.tsx  17 tests
│   │   └── Hotel.test.tsx          9 tests
│   └── app/
│       ├── page.test.tsx          11 tests
│       └── layout.test.tsx         4 tests
├── jest.config.js                  Jest setup via next/jest, 100% threshold
├── jest.setup.ts                   @testing-library/jest-dom
├── package.json
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
└── tailwind.config.ts
```

---

## How room IDs work

Each room has three fields: `id`, `floor`, `position`.

- `position` is the room's index on its floor, **1 = closest to the stairs/lift**.
- For floors 1–9: `id = floor × 100 + position` (so 405 = floor 4, position 5).
- For floor 10: `id = 1000 + position` (so 1003 = floor 10, position 3).

The hotel layout is generated once at module load:

```ts
// lib/hotel.ts
export const ALL_ROOMS = buildRooms();    // 97 rooms, sorted by (floor, position)
export const TOTAL_ROOMS = 97;
export const FLOORS = 10;
export const MAX_BOOKING = 5;
```

---

## The booking algorithm

Implemented in `lib/booking.ts`. Given a target room count `N` (1–5) and the set of currently occupied room IDs, `pickRooms(N, occupied)` returns either:

```ts
{ ok: true,  rooms: Room[], travelTime: number, spansMultipleFloors: boolean }
{ ok: false, reason: string }
```

### Step 1 — Same floor (Priorities 1 & 2)

For each floor 1–10:

1. Filter the available rooms on that floor and sort by `position`.
2. If the floor has at least `N` available rooms, slide a window of size `N` over the sorted list and compute the span `lastPos − firstPos` for each window.
3. Keep the window with the smallest span.

After scanning every floor, the floor with the smallest span wins. Ties are broken by the lower starting room number (deterministic output → stable tests, predictable UI).

**Why a sliding window?** Within a floor, the optimal `N`-room booking is always a *consecutive run of N available rooms in sorted order*. Skipping an available room only widens the span — never narrows it. So we never need combinatorial enumeration on a single floor.

### Step 2 — Cross floor (Priority 3)

Only runs if **no single floor has ≥ N available rooms**.

1. Take all available rooms across the hotel and sort lexicographically by `(floor, position)`.
2. For every pair of indices `(i, j)` in the sorted list with `j − i + 1 ≥ N`:
   - The pair `(sorted[i], sorted[j])` is a candidate `(first, last)`.
   - Compute `span = travelTime(sorted[i], sorted[j])`.
3. Pick the `(i, j)` with the smallest span.
4. Compose the booking as: `sorted[i]` (first) + `sorted[j]` (last) + the `N − 2` lex-smallest available rooms strictly between them.

**Why this works.** The booking's reported travel time is `travelTime(first, last)`. Other rooms in the booking that lie *between* first and last lexicographically don't extend the route — you pass through their floors anyway when going from first to last via the left-side stairs/lift. So once `(first, last)` is fixed, any valid set of in-between rooms produces the same travel time. We pick the lex-smallest ones for stable output.

### Worked example

From the problem brief:

> Available rooms: `101, 102, 105, 106, 201, 202, 203, 210, 301, 302`.
> Guest books **4 rooms**.

Step 1 (same floor) finds:

- Floor 1: 4 available rooms `[101, 102, 105, 106]`. Window of size 4 = the whole list. Span = `106 − 101` in position = `6 − 1 = 5`.
- Floor 2: 4 available rooms `[201, 202, 203, 210]`. Span = `10 − 1 = 9`.
- Floor 3: only 2 rooms — skipped.

Floor 1 wins (span 5 < 9). The system books **101, 102, 105, 106**, travel time **5 min**. ✓ Matches the brief.

Now consider the alternative scenario: only `101, 102` available on floor 1, and `201, 202, 203` on floor 2.

- No floor has ≥ 4 available rooms, so Step 1 fails → Step 2.
- Sorted available: `[101, 102, 201, 202, 203]`.
- All pairs `(i, j)` with `j − i + 1 ≥ 4`:

| i | j | first | last | span = travelTime(first, last) |
|--:|--:|------:|-----:|---:|
| 0 | 3 | 101 | 202 | 0 + 2·1 + 1 = **3** |
| 0 | 4 | 101 | 203 | 0 + 2·1 + 2 = 4 |
| 1 | 4 | 102 | 203 | 1 + 2·1 + 2 = 5 |

Minimum is `(101, 202)`. Booking: `101, 102` (first + in-between) and `201, 202` (in-between + last). Travel time **3 min**. ✓ Matches the brief.

### Complexity

| Step | Cost | Notes |
|---|---|---|
| Single-floor scan | `O(F × M)` where `F = 10`, `M ≤ 10` | At most ~100 window evaluations. |
| Cross-floor scan | `O(A²)` where `A` = available rooms | `A ≤ 97`, so at most ~9 000 pair checks — instant. |

Both pieces run synchronously on every booking. No need for memoisation or web workers.

---

## State management

A single `Home` component in `app/page.tsx` owns the state:

```ts
const [occupied, setOccupied]   = useState<Set<number>>(new Set());
const [lastResult, setLastResult] = useState<BookingResult | null>(null);
```

- **Book** — runs `pickRooms`; on success, merges the new rooms into `occupied`. The last booked rooms are highlighted by deriving a `bookedIds` set from `lastResult`.
- **Generate random** — calls `randomOccupancy(percent)` (Fisher–Yates shuffle) and replaces the whole `occupied` set. Clears the last booking highlight.
- **Reset** — clears both.

`occupied` is the source of truth. Rooms are rendered as:

- **booked** if its ID is in the last successful booking
- otherwise **occupied** if in the `occupied` set
- otherwise **available**

---

## Testing

**131 tests across 10 suites, with 100% statement / branch / function / line coverage on every source file.** A `coverageThreshold` of 100% is enforced in `jest.config.js`, so any drop below trips the test command.

### Coverage report

| File | Stmts | Branch | Funcs | Lines |
|---|---:|---:|---:|---:|
| `app/layout.tsx` | 100% | 100% | 100% | 100% |
| `app/page.tsx` | 100% | 100% | 100% | 100% |
| `components/BookingSummary.tsx` | 100% | 100% | 100% | 100% |
| `components/ControlPanel.tsx` | 100% | 100% | 100% | 100% |
| `components/Hotel.tsx` | 100% | 100% | 100% | 100% |
| `components/Room.tsx` | 100% | 100% | 100% | 100% |
| `lib/booking.ts` | 100% | 100% | 100% | 100% |
| `lib/hotel.ts` | 100% | 100% | 100% | 100% |
| `lib/occupancy.ts` | 100% | 100% | 100% | 100% |
| `lib/travel.ts` | 100% | 100% | 100% | 100% |

### What's tested

- **`lib/hotel.ts`** — exact 97-room count, 10-floor structure, distribution (10 per floor except F10 = 7), `id = floor·100 + position` for floors 1–9, `id = 1000 + position` for floor 10, sort order, ID uniqueness, position/floor bounds, `roomsOnFloor()` for valid floors, invalid floors, and ordering.
- **`lib/travel.ts`** — `travelTime` same-floor (zero, adjacent, far, floor 10), cross-floor including the README's `102 → 305 = 9 min` example, symmetry, max journey `101 → 1007 = 24`; `lexCompare` for identical/lower/higher-floor and same-floor cases plus comparator usage; `bookingSpan` for empty/single/multi-room and unsorted input.
- **`lib/booking.ts`** — input validation (0, negative, 6, 100), capacity guard (full hotel, partial); single-floor including **both worked examples from the README**, sliding-window over gaps, span-tie → lower floor wins, span-tie within floor → lower position wins, skipping floors that lack capacity, booking on floor 10; cross-floor with the brief's `101,102,201,202 → travel 3 min` example, minimal-pair selection, `spansMultipleFloors` flag; properties — determinism, sort order, exact count, never returns occupied/duplicate rooms, travel-time consistency, and a stress test that books the entire hotel in 5-room chunks until all 97 are taken.
- **`lib/occupancy.ts`** — size assertions at 0% / 1% / 25% / 50% / 100%, negative & >100 clamping, only-valid-IDs invariant, no duplicates, and a probabilistic uniqueness check (two 50% shuffles aren't identical; collision probability ≈ 10⁻²⁸).
- **`components/Room.tsx`** — each of the three states renders the right Tailwind class fragment, the title attribute is correct, and the room ID renders as text. Floor-10 ID rendering verified.
- **`components/BookingSummary.tsx`** — null, failure, single-floor success, multi-floor success; room chips render in order; travel time string is correct.
- **`components/ControlPanel.tsx`** — stepper increment / decrement / lower-bound clamp / upper-bound clamp, typed valid number, typed too-high (clamps to max), typed too-low (clamps to 1), typed NaN (ignored — the `Number.isFinite` guard), slider updates display, Book / Generate / Reset all invoke their props with the correct arguments, `disabled` prop respected.
- **`components/Hotel.tsx`** — all 97 rooms render, all floor labels (`01`–`10`) appear, state is propagated correctly (available / occupied / booked, with booked winning over occupied), only 7 rooms on floor 10, the building header and lobby line render, and exactly 10 elevator-shaft stop markers appear. The child `Room` component is mocked to expose `data-state` for verification.
- **`app/page.tsx`** — initial render and stats strip (97 / 0 / 0%), booking flow on success (occupied + booked sets update, summary shows), booking flow on failure (occupied unchanged, summary shows failure reason), repeated bookings accumulate occupancy but booked-set only reflects the most recent, random replaces occupancy and clears the highlight, reset clears everything, and the `bookedIds` memo returns an empty set when `lastResult.ok` is false. All child components and `lib/` functions are mocked, leaving the test focused purely on Home's orchestration logic.
- **`app/layout.tsx`** — `metadata.title` / `metadata.description` exports, returned tree is an `<html lang="en">` with the font-variable class names composed, and children are wrapped inside the body. `next/font/google` is mocked to fixed values and `globals.css` is virtual-mocked to a noop.

### Mocking strategy

For each test, **every dependency the unit doesn't own is mocked**:

- `Hotel.test.tsx` mocks `Room` so we can assert which state was passed to each room ID without coupling to Room's internals.
- `page.test.tsx` mocks `Hotel`, `ControlPanel`, `BookingSummary`, `pickRooms`, `randomOccupancy`, and the `hotel.ts` constants. Mocked child components expose handlers as plain buttons (`mock-book`, `mock-random`, `mock-reset`) and surface their props via `data-*` attributes, so we can fire-and-assert in isolation.
- `layout.test.tsx` mocks `next/font/google` and `globals.css` (the latter as a virtual module) so the layout can be imported without touching the real font fetch or PostCSS pipeline.

### Notes on the Jest setup

- `next/jest` provides the SWC transform for `.ts` / `.tsx` plus automatic CSS/asset stubs and a `next/font/google` stub.
- An explicit `moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" }` is added in `jest.config.js` because `next/jest`'s built-in mapper does NOT cover the `@/*` path alias for `jest.mock()` resolution (only for `import` statements via SWC). Without this, `jest.mock("@/components/Hotel", …)` fails with "Cannot find module".
- The setup file is referenced via `setupFilesAfterEnv` (the correct key — `setupFilesAfterEach` does not exist in Jest's config).
- Test environment is `jsdom` so the lib tests, component tests, and page tests can all share one config.

---

## UI design notes

The visual style is intentionally restrained — minimal chrome, one accent colour, mono numerals.

### Palette

CSS variables in `app/globals.css`:

| Variable | Hex | Used for |
|---|---|---|
| `--bg` | `#fafaf8` | Page background |
| `--surface` | `#ffffff` | Cards |
| `--ink` | `#161513` | Primary text, primary button |
| `--ink-muted` | `#79766e` | Labels, secondary text |
| `--available` | `#0c6b46` | Available room text |
| `--available-bg` | `#ecf8f0` | Available room background |
| `--occupied` | `#c93c3c` | Occupied room text |
| `--occupied-bg` | `#fbeae9` | Occupied room background |
| `--booked` | `#161513` | Booked room — solid fill |
| `--booked-halo` | `#f5e6b8` | Soft amber halo around booked rooms |

### Typography

- **Inter Tight** — body and UI labels
- **JetBrains Mono** — all numerals (room IDs, floor numbers, percentage, travel time)

### Components at a glance

- **Hotel** — three flex columns: floor numbers, elevator shaft (a continuous vertical rail with a ring stop at each floor), and the rooms grid. A dashed "Lobby / Ground" rule at the bottom anchors it as a section drawing.
- **Room** — a tight 52×36 box with a thin colored border. Booked rooms are filled with the dark ink and gain a soft amber outer shadow so they read as "actively selected" against the rest.
- **ControlPanel** — number-stepper (`−` / value / `+`) + primary Book button, range slider with a green fill for occupancy, ghost-link Reset.
- **BookingSummary** — pill chips for the booked rooms, then the travel time on its own row. If the booking fails, the same card switches to a soft red background with the failure reason.

Native number-input spinner arrows are hidden globally via CSS so the stepper is the only way to change the count.

---

## Edge cases

- **Booking size 0 or > 5** — UI clamps the input to `1..5`; algorithm returns `{ ok: false, reason: 'Booking size must be between 1 and 5.' }` if called outside that range.
- **Not enough rooms in the entire hotel** — `pickRooms` returns `{ ok: false, reason: 'Only X room(s) available.' }`.
- **Random occupancy at 100 %** — every room is occupied; any booking afterwards fails until reset.
- **Random occupancy at 0 %** — booking always succeeds and always picks from floor 1 (because the lex-smallest available rooms are there).
- **Determinism** — the algorithm always returns the same answer for the same `(count, occupied)` input. Ties break by lex order (lower floor, lower position).

---

## File-by-file reference

### `lib/hotel.ts`
Static definition of the building. Exports `ALL_ROOMS`, `TOTAL_ROOMS`, `FLOORS`, `MAX_BOOKING`, and a `roomsOnFloor(floor)` helper.

### `lib/travel.ts`
- `travelTime(a, b)` — minutes between two rooms.
- `lexCompare(a, b)` — sort comparator by `(floor, position)`.
- `bookingSpan(rooms)` — travel time from the lex-smallest to the lex-largest room in a list.

### `lib/booking.ts`
- `pickRooms(count, occupied)` — main entry point.
- `pickSingleFloor` — Step 1 helper (sliding window per floor).
- `pickCrossFloor` — Step 2 helper (`O(A²)` pair scan).

### `lib/occupancy.ts`
- `randomOccupancy(percent)` — Fisher–Yates shuffle on all 97 IDs, takes the first `⌊97 · percent / 100⌋` as occupied.

### `lib/types.ts`
Shared TypeScript types: `Room`, `BookingResult` (discriminated union of success/failure).

### `app/page.tsx`
The whole app — state, handlers, layout, header, legend, stats strip, two-column body, footer-less.

### `components/Hotel.tsx`, `Room.tsx`, `ControlPanel.tsx`, `BookingSummary.tsx`
Pure presentation components — they receive props and render. No state of their own except local form state in `ControlPanel`.

---

## What's deliberately not here

- **Persistence** — no localStorage, no backend. Refresh = reset.
- **Authentication / multi-user** — single-tenant demo.
- **E2E tests** — only unit and component tests are included (see [Testing](#testing)).
- **Animations beyond the basics** — kept minimal so the focus stays on correctness and clarity.

---

## License

Educational / assignment use.
