# GameVerse Design System

Source of truth: the implemented homepage (`/`). Every value below is copied from the code, not reinterpreted.
Use this when redesigning any other page. Do not invent new colours, typefaces, shapes or motion patterns.

| Area | Where it lives |
| --- | --- |
| Styles | `scss/pc/homepage/homepage.scss` |
| Components | `libs/components/homepage/*`, `libs/components/layout/LayoutHome.tsx` |
| Motion helpers | `libs/components/homepage/homeMotion.ts` (`SCENE_QUERY`, `MOTION_QUERY`, `pad`, `gameCover`, `gameDetailHref`) |
| Scroll restoration | `libs/hooks/useHomeScrollMemory.ts` |
| Fonts | `pages/_document.tsx` (Google Fonts link) |
| Logo | `public/img/logo/` (`logoWhite.svg`, `logoText.svg`, `favicon.svg`) |
| Image tool | `scripts/replace-game-images.mjs` (`yarn images:replace`) |

> Legacy, do not reuse: `homepage.scss` lines 1–232 and the `.gv-section`, `.gv-card`, `.gv-bento`, `.gv-ranks`,
> `.gv-agents`, `.gv-community`, `.gv-board__…` (old), `.gv-events` blocks from the first redesign, plus
> `HomeSection.tsx` / `HomeGameCard.tsx`. They are no longer rendered.

---

## 1. Principles

1. **Chapters, not sections.** A page is a sequence of full-width environments, each with its own background colour. A chapter has a chapter label (`03 Leaderboard`) and an uppercase display title.
2. **One bold element per chapter.** Either the artwork or the headline dominates, never both equally.
3. **The cartridge notch is the only decorative motif.** Images, buttons and chapter edges use the cut-corner shapes in §4. No rounded cards, gradients-as-decoration or drop shadows.
4. **Numbers only for real sequences.** Chapter index, ranks, counts and slide indexes. Never as decoration.
5. **Motion follows the scroll.** Scroll-scrubbed scenes plus a single load reveal (the hero headline). Hover motion only responds to the user. Everything has a static fallback.
6. **Real data only.** Counts, ranks, totals and readouts come from the API or enums. No fabricated stats.
7. **Sound:** none. The homepage has no audio, so don't add any.

## 2. Tokens

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `--gv-void` / `--gv-ink` | `#000000` | Night environments, text on light, footer |
| Paper | `#FFFFFF` | Light environments, paper labels |
| `--gv-uv` | `#6F5BFF` | Ultraviolet environment, hero duotone base, selected markers |
| `--gv-signal` | `#D7FF3A` | Comms environment, primary search button, active `■`, kickers, flags, focus fill |
| `--gv-haze` | `#C9C4DC` | Secondary text on dark |
| Coral | `#EB6753` | Legacy brand coral; liked-heart is `#FF5470` / `#FF3D5E`. Don't use as an accent |
| `--gv-hair` | `rgba(255,255,255,.18)` | Hairlines on dark |
| `--gv-rule` | `rgba(0,0,0,.14)` | Hairlines on light |
| `--gv-muted` | `rgba(0,0,0,.6)` | Secondary text on light (`.65`–`.74` for body) |

**Environment sequence on the homepage** (alternate dark and light, never two identical neighbours):

| Chapter | Background | Text |
| --- | --- | --- |
| 00 Title (hero) | Void + duotone cover art | White |
| Banner | Void | White |
| 01 Trending | Paper | Ink |
| 02 Collection | Ultraviolet | Ink |
| 03 Leaderboard | Void + full-bleed cover (darkened) | White |
| 04 Agents | Paper | Ink |
| 05 Comms | Signal | Ink |
| 06 Events | Paper | Ink |
| 07 Credits / footer | Void | White |

**Hero duotone:** cover image `grayscale(1) contrast(1.2) brightness(.85) blur(4px)`, a gradient `155deg #8B78FF → #6F5BFF 30% → #2A159E 62% → #0A0420` with `mix-blend-mode: multiply`, black scrims (bottom 78% → 0 at 46%, left 55% → 0 at 40%), and an SVG fractal-noise grain at `opacity .16`, `mix-blend-mode: overlay`.

**Leaderboard shade:** `linear-gradient(90deg, rgba(0,0,0,.94) 0%, .6 42%, .25 68%, .78 100%)` plus a bottom scrim of `.85` fading to 0 at 55%. The image itself is `saturate(1.1) brightness(.72)`.

### Typefaces (loaded in `_document.tsx`)

| Variable | Family | Role |
| --- | --- | --- |
| `--gv-display` | **Archivo** (variable `wdth 62–125`, `wght 100–900`) | Display headlines, titles, body |
| `--gv-mega` | **Unbounded** 700–900 | Monuments: rank numerals, odometers, rotated counters, giant words (DEVELOPERS, platform marquee, GAMEVERSE credits) |
| `--gv-mono` | **JetBrains Mono** 400/500 | HUD only: chapter labels, kickers, readouts, buttons, meta, timestamps |

Poppins (`$font`) remains the site-wide default outside redesigned scopes.

### Spacing and layout

| Token | Value | Use |
| --- | --- | --- |
| `--gv-frame` | `16px` | HUD frame inset |
| `--gv-rail` | `56px` | Left rail (crosshair mark) |
| `--gv-inset` | `calc(16px + 56px + clamp(20px, 2.4vw, 40px))` | Left alignment of all chapter content on desktop |
| `--gv-gutter` | `clamp(16px, 4vw, 40px)` | Side padding on narrow screens |
| `--gv-edge` | `clamp(28px, 4vw, 56px)` | Height of chapter sheet edges |
| Header height | `87px` | Fixed header; first content starts at `87px + 3vh…44px` |
| Chapter padding | `clamp(64px, 9vw, 120px)` top, `clamp(56–80px, 8–10vw, 104–140px)` bottom | Non-pinned chapters |
| Right padding (desktop) | `6vw` | Keeps clear of the chapter index |

### Easing and durations

- Ease: `--gv-ease: cubic-bezier(0.23, 1, 0.32, 1)`; GSAP uses `power4.out` (load), `power2.out` (fan) and `power2.in` (exits).
- Hover/colour: `160–180ms ease`. Press: `transform 140ms var(--gv-ease)`, `scale(.96)` or `translateY(1px)`.
- Card lift: `260ms var(--gv-ease)`, `translateY(-8…-10px)`. Image crossfade: `700–900ms ease`.
- Load reveal: lines `yPercent 110 → 0`, `0.9s power4.out`, stagger `0.08`; rules draw `scale 0 → 1`, `1.1s power3.inOut`.

## 3. Typography

| Role | Font / weight | Size | Tracking / leading | Case |
| --- | --- | --- | --- | --- |
| Hero display | Archivo 850 | `min(10.4vw, 15.5vh)` | `-0.055em` / `0.84` | Upper |
| Chapter display | Archivo 850 | `clamp(3rem, 10–14vw, 6.5–12rem)`; pinned: `min(8.6–9vw, 14–15vh)` | `-0.055em…-0.06em` / `0.82–0.86` | Upper |
| Monument numeral / word | Unbounded 900 | Rank `min(21vw, 44vh)`; odometer `min(9vw, 15vh)`; DEVELOPERS `11.2vw`; credits `19vw`; marquee `clamp(64px, 14vw, 240px)` | `-0.04em…-0.06em` / `0.78–0.95` | Upper |
| Item title | Archivo 850 | `clamp(1.75rem, 3vw, 2.875rem)`; pinned `min(3–3.2vw, 5.4–6vh)` | `-0.04em` / `0.92–1` | Upper |
| Small title | Archivo 800 | `1rem–1.25rem` | `-0.01…-0.02em` | Upper |
| Body | Archivo 400 | `0.9375–1rem` | lh `1.5`, max `36–40ch` | Sentence |
| HUD label / kicker / meta | JetBrains Mono 400–500 | `0.6875–0.75rem` | `+0.06em…+0.08em` | Upper |

Rules:
- Stagger multi-line display titles: wrap each line in a block span and indent line 2 by `12–33%` (hero: `21% / 33% / 4%`).
- **Gotcha:** `app.scss` sets `span { line-height: 1.2 }`. Give display line spans `line-height: inherit`.
- Mono is never used for body copy or headlines.
- Chapter label `.gv-chapter`: mono 12px uppercase; the number sits in a black chip (white chip on dark: `--dark`).

## 4. Shapes (mixins in `homepage.scss`)

```scss
@mixin gv-cut($c: 32px, $tab: 58%)      // raised tab along the top + one cut bottom-right corner (images, plates, panels)
@mixin gv-cut-btn($c: 12px)              // one cut bottom-left corner (buttons, chips, small tags)
@mixin gv-sheet-edge($color, $tab: 31%, $flip: false)  // notched ::before tab so a chapter overlaps the one above
```

- Typical `$c`: plates `24px`, hero plate `clamp(22px, 2.4vw, 40px)`, world plates `32px`, fan and news cards `18–20px`, thumbnails `8px`, buttons `10–12px`.
- No `border-radius` anywhere in redesigned UI.
- `clip-path` hides outlines, so clipped controls show focus as a **fill** (`background: var(--gv-signal); color: #000`). Unclipped controls use `outline: 2px solid` with a `3–6px` offset.
- A line button with a clipped border: the outer element is the border colour and a `::before` with `inset: 1px` and the same clip is the fill.

## 5. Components

| Component | Classes / file | Anatomy and states |
| --- | --- | --- |
| HUD frame | `.gv-hero__grid` (HomeHero) | 1px hair border inset 16px; rules: left rail at 56px, vertical at 58%, under-header line, bottom line 104px up; crosshair mark at rail centre |
| Header skin | `#pc-wrap.gv-home-shell #top …` | Transparent over art; scrolled bar `rgba(0,0,0,.9)` + `blur(12px)`; mono uppercase 12px links; Login as white `gv-cut-btn` chip with black text |
| Primary CTA | `.gv-cta--solid` | White fill, black mono label, 48px high, `gv-cut-btn(12px)`; hover and focus Signal |
| Secondary CTA | `.gv-cta--line` | Hair border via the `::before` technique on dark translucent fill |
| Ink CTA (light bg) | `.gv-ink-cta` / `--solid` | 44px, 1.5px black border; hover inverts; solid = black with cut, hover Ultraviolet |
| Search console | `.gv-hero__console` wraps `HeaderFilter` | Blurred dark bar, hair dividers, Signal prompt label, 62px cells, Signal search button with inverted icon, menus open **upward** |
| Plate (game card) | `.gv-plate` (TrendPlate) | Rotated Unbounded like counter + label; cut-corner cover with `No. 0n` tag and Upcoming flag; **paper-label title** (white background, `box-decoration-break: clone`) overlapping the cover's bottom edge; mono meta; price, views, like row. Whole card clickable via `.gv-plate__hit`; the title is the keyboard link |
| Fan card | `.gv-fan-card` (CollectionCard) | 3:4 cut cover with flags; caption: Unbounded rank + title + mono meta; hover lifts 10px |
| Leaderboard | `.gv-board` (TopGames) | Full-bleed active cover; giant rank numeral bleeding off the left edge; detail (Signal kicker, title, meta, price, views, like); ranked list on the right with the active row highlighted (`rgba(255,255,255,.1)`, Signal rank) |
| Agent tile | `.gv-agent-tile` (TopAgentCard) | Greyscale 4:5 cut portrait; hover or focus selects it: colour, lift 8px, Ultraviolet square before the name; drives the `aria-live` readout |
| News plate | `.gv-news-plate` | 4:3 cut image, black/Signal rank tag, uppercase title, mono meta row |
| Log entry | `.gv-log-entry` | Mono date, greyscale cut thumbnail, uppercase title, mono meta; hover darkens 6% |
| World plate | `.gv-world-plate` | 16:10 cut art (62% column, alternating side), Signal location chip, paper-label title and description overlapping the art edge |
| Like button | `.gv-plate__like`, `.gv-board__like` | Cut chip with heart and count; liked heart red; hover/focus Signal; `aria-pressed` + descriptive `aria-label` |
| Chapter index | `.gv-chapters` (HomeChapters) | Fixed right, ≥1200px, `mix-blend-mode: difference`; mono numbers; active = filled square; labels only on hover/focus |
| Credits marquee | `.gv-credits` (HomeCredits) | Unbounded 19vw GAMEVERSE loop below the footer; speed follows scroll velocity |
| Logo | `logoWhite.svg` (dark), `logoText.svg` (mark only) | Acid-green cartridge with black D-pad G; never crop the mark into a circle |

## 6. Artwork

- **Two layers on dark scenes:** a blurred, tinted full-bleed atmosphere plus a sharp, full-colour cut plate. Never stretch a small image full-bleed without the atmosphere treatment.
- **Sources:** official publisher or store key art for games; Unsplash photos for lifestyle and community. No fan art or watermarked images.
- **Sizes:** game cover (`gameImages[0]`) ≥ 2560×1440 (minimum 1920×1080); other images ≥ 1920 wide; event and article photos 1600–2400 wide.
- **Crops:** centre the subject. Covers are cropped to portrait (4:5, 3:4), square, 16:10 and full-screen; prefer key art without logos or text.
- **Workflow:** put files in `game-images/<Game Title>/1.jpg…`, run `yarn images:replace` (dry run), then `--apply`. Database paths don't change.

## 7. Layout

- Desktop content aligns to `--gv-inset`; right side keeps `6vw` or the HUD padding clear.
- **Asymmetric heads:** large headline left (≈ 55–60%), side column right with count, description and CTA (`grid-template-columns: 1.25fr 1fr`).
- **Overlap is intentional:** titles straddle image edges, portraits overlap giant words, chapters overlap the previous one via the sheet edge (`margin-top` negative only inside scenes).
- Lists of items scatter: offset heights and vertical offsets (`-16vh / +14vh`) on horizontal tracks; even items `+4vw` in grids.
- `z-index: 2` on every chapter section so later chapters paint over earlier ones.

## 8. Motion

- All scenes use GSAP + ScrollTrigger inside `gsap.matchMedia()`:
  - `SCENE_QUERY = '(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)'` for pinned or scrubbed scenes.
  - `MOTION_QUERY = '(prefers-reduced-motion: no-preference)'` for non-pinned motion.
- Always `return () => mm.revert()`, and kill custom triggers or listeners in the scene's cleanup.

| Pattern | Where | Recipe |
| --- | --- | --- |
| Pinned runway | Hero 230vh, Collection 210vh, Leaderboard 540vh | Section height in CSS inside the scene media; the stage is `position: sticky; top: 0; height: 100svh`; timeline `start: 'top top', end: 'bottom bottom', scrub: 0.6` |
| Horizontal track | Trending | Section height = `track.scrollWidth − stage.clientWidth + innerHeight`, recomputed on `refreshInit`; `x: -distance`; inner images pan ±6% via `containerAnimation` |
| Cartridge exit | Hero, Leaderboard | Last 10–28% of the timeline: stage `scale .58–.62`, `rotation ±4–5`, `yPercent -8…-10`, `--gv-stage-cut` 0 → 56–64px (clip-path notch grows) |
| Sheet over | Banner over hero | Next sheet `z-index: 1; margin-top: -32vh` inside the scene media |
| Assemble | Leaderboard entry | Scattered cut tiles tween to the centre, `scale 2.6`, fade; background fades in |
| Fan open | Collection | Cards fan from a stack to `x = pos·13vw, rotationY = pos·-16°, z = |pos|·-140`, `power2.out` |
| Odometer | Collection | Tween `{value: 0 → total}`, write `pad(round(value))` to the element |
| Active index | Hero covers, Leaderboard ranks | `onUpdate` maps progress to an index and calls `setActive` only when it changes; CSS crossfades |
| Tilt in | Comms news, Events | `rotation ±6–7 → ±1.5/0 → ∓4` (keyframes), `scale .9 → 1 → .94`, scrubbed by element visibility |
| Parallax depth | Agents | Word `xPercent 4 → -6`; items `yPercent` alternate `[-14, 10, -4]` |
| Marquee | Banner, Credits | Banner `xPercent 3 → -18` scrubbed; credits loop `xPercent -50 / 28s`, `timeScale` = 1 + velocity/300 (max 9), eases back to 1 |
| Load reveal | Hero only | Masked lines rise; frame rules draw. **One per page** |
| Intro | Homepage, once per session (`HomeIntro`, `introGate`) | Void overlay: `PRESS / START / GAMEVERSE` typed 70ms/letter with a 3-letter Signal/UV/Haze/paper flicker trail; mono `PLAYER 1` · `READY`; Signal ■ and Haze + sparks twinkle; cut-corner UV then Signal plates flood (`power2.in`); the stage lifts (`yPercent -100`) and hands over to the hero load reveal. Any key/press skips; reduced motion = static 0.8s + fade. Not a second load reveal: the hero reveal waits for it |

Fallbacks: below 900px wide, below 560px tall, or with reduced motion, there's no pinning. Stages become normal flow, tracks become scroll-snap rails (`useHomeRail` with arrow controls), fans become snap rows, and hero covers auto-advance every 5s (narrow screens, motion allowed).

After data loads, call `ScrollTrigger.refresh()` and depend effects on list length (`[items.length]`). Pages with scenes should use the `useHomeScrollMemory` pattern so Back restores the position.

## 9. Responsive

| Breakpoint | Behaviour |
| --- | --- |
| `< 640` | Single column; rails 80vw items |
| `≥ 900` | Desktop compositions and scenes (with `min-height: 560px`) |
| `≥ 1024` | Two-column Comms grid |
| `≥ 1200` | Chapter index visible |
| `≥ 1280` | Agents grid 5 columns |

- `useDeviceDetect()` returns `mobile` by user agent: the mobile layout (`#mobile-wrap`) renders a subset of chapters. Narrow **desktop** windows use the CSS fallbacks above. Design both.
- Guard horizontal overflow: giant words and marquees live inside `overflow: hidden` chapters, and fixed-width legacy containers must shrink (see the `#mobile-wrap.gv-home-shell #footer .footer-container` fix).
- Test at 1440×900, 820px desktop and 390px mobile UA. `document.documentElement.scrollWidth` must equal the viewport width.

## 10. Accessibility

- Chapter labels and decorative numerals are `aria-hidden`. Real headings stay plain ("Top ranked", "Trending games"); visual-only words use `.gv-visually-hidden` for the full label.
- Interactive items keep a real link or button as the keyboard target. Large click layers are `aria-hidden` with `tabIndex={-1}`.
- Likes: `aria-pressed` and `aria-label="Like <title>, <n> likes"`. Selection readouts use `aria-live="polite"`.
- Focus must be visible on every control (§4). Body text on Ultraviolet and Signal is black; keep body ≥ 15px.
- `prefers-reduced-motion`: all scenes off, transitions limited to colour and opacity.

## 11. Applying this to other pages

1. **Scope:** add a page shell class (like `gv-home-shell` in `LayoutHome`) and put page styles under it. Restyle shared `Top`/`Footer` only under that class.
2. **Reuse, don't fork:** move shared tokens and mixins (`gv-cut`, `gv-cut-btn`, `gv-sheet-edge`, `.gv-chapter`, `.gv-cta`, `.gv-ink-cta`) into a shared partial before the second page uses them.
3. **Compose each page as chapters:** pick environments from §2 (alternate dark and light), one bold element each.
4. **Keep business logic:** change markup and classes only. Queries, handlers, routing and state stay untouched.
5. **Checklist before review:**
   - Tokens only, no new colours or fonts.
   - Cut shapes, no radius.
   - Mono only for HUD text.
   - Display text uppercase Archivo 850.
   - Real data in readouts.
   - One load reveal at most.
   - Every scene has a static fallback.
   - Reduced motion respected.
   - Visible focus.
   - No horizontal overflow at 390px.
   - `yarn tsc --noEmit` passes.

**Don't:**
- Rounded cards or soft shadows.
- Gradient buttons.
- New accent colours.
- Coral as an accent.
- Mono body text.
- Fade-up on every section.
- Fabricated stats.
- Logos baked into cover crops.
- The legacy `.gv-section` / `.gv-card` styles.
