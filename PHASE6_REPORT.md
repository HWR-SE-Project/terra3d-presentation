# Phase 6 — Creative Direction & Visual Design · Final Report

**Baseline:** `02c1958` + `fdfc915` (Phase 5, full 21-slide deck) → **checkpoint** `5e19761`
**Scope:** `sources/Game/Presentation/SlideRenderer.js`, `sources/style/presentation.styl`, `.gitignore` (screenshot dir)

---

## 1. What changed

Phase 5 rendered the 21 slides as a single generic "card grid" system: every
content type (goals, speakers, stack, steps, tiers, stats) used the same
rounded border + translucent background recipe, in one narrow bottom-left
column for most slides and a roomier box for tables. It was functional and
compliant, but visually homogeneous — the opposite of an art-directed deck.

Phase 6 replaces that with a per-layout art direction while **preserving every
verified fact, speaker note, TODO and source reference from `slides.js`
verbatim** (confirmed by a programmatic content-completeness check against all
21 slides — zero missing strings).

No game-side files were touched: the 3D world, character movement, interactive
stands, proximity/E-to-open, station navigation, exploration mode, automated
tour, camera and presentation state management are byte-for-byte unchanged.
`SlideRenderer`'s public API (`fillStage`, `showInitial`, `swapSlide`,
`hideForTransition`, `revealAfterTransition`, `showStation`,
`swapStationSlide`, `hideStation`, `setVisible`, `isVisible`) and its
`data-layout` / `data-density` / `data-flow` contracts are unchanged, so the
controller, camera/character directors and stand code are untouched.

## 2. Design system (reusable primitives)

The palette was taken **directly from the real TerraGuessr app**
(`terraguessr/frontend/src/styles/index.css`): deep indigo-violet space scale
(`#090718 → #352d64`), warm cream ink (`#fbf7ee`), muted/subtle lavender text,
a confident lime brand accent (`#c0f66b`) plus sky/amber/violet/rose
secondaries, and `ink` (`#1b2a10`) for text on lime. Surfaces are warm and
solid with hairline light borders and layered soft shadows — **no
glassmorphism, no excessive glow**.

| Primitive | Where | Implementation |
|---|---|---|
| Typography scale | everywhere | Fredoka display / Nunito body; eyebrow (accent line + small caps), oversized title (up to 112 px), muted subtitle, body, caption |
| Faceted earth | 01, 21, station glyphs | deterministic icosahedron SVG (12 vertices / 30 edges / 20 faces) with lime/sky "continent" facets |
| Station landmarks | 02, 03/06/11/17 | SVG glyphs mirroring the 3D landmarks: gem (Konzept), origami globe (Gameplay), pulsing core (Engineering), ring+check (Qualität) |
| Slide watermark | all | giant faint 2-digit slide number, bottom-right |
| Background treatment | all | full-coverage radial scrim + faint dot grid (`.presentation__pattern`) |
| Status badges | 15, 18 | lime/amber/rose pills, single source of truth |
| Diagram components | 13 | SVG sequence diagram (lifelines, request/response arrows, color-coded lanes) |
| Numerical viz | 18 | horizontal stacked status bar + 4 large stat figures |
| Image presentation | 07–10 | framed screenshots (hairline border + soft shadow + caption) |
| Chapter dividers | 03/06/11/17 | shared oversized-title + landmark + giant numeral layout |

## 3. Per-slide art direction

- **01 Titelfolie** — centered hero: faceted earth, 148 px `TerraGuessr`
  wordmark, lime tagline, eyebrow and byline. Minimal and atmospheric.
- **02 Agenda** — four station stops (landmark glyph + index + label + detail)
  joined by a lime route line: the four stations as a geographic journey, not
  a bullet list.
- **03 Das Konzept** — oversized `Das Konzept` (112 px) beside the faceted-gem
  landmark and a giant `01` numeral.
- **04 Projektidee & Ziele** — Entdecken → Raten → Vergleichen as a three-step
  flow with compass/pin/podium icons and connector arrows, plus audience and
  scope notes.
- **05 Team & Rollen** — two hexagonal initials-avatars (MK lime / YV sky)
  with role and work-package chips; a giant `2` motif. No generic profile cards.
- **06 Produktrundgang** — chapter divider centred on the origami-globe glyph.
- **07 Startbildschirm** — one dominant hero screenshot with a numbered
  callout rail (Zwei Einstiege / How to play) and a secondary tutorial shot.
- **08 Einzelspieler** — the loop grouped as **Explore → Guess → Evaluate**
  above a three-frame screenshot filmstrip.
- **09 Mehrspieler** — a competitive `VS` composition (lobby ⇄ round) visually
  distinct from the singleplayer filmstrip.
- **10 Publikums-Challenge** — full-bleed panorama with a centred question
  chip, a live "ping" dot and presenter-controlled reveal (unchanged notes).
- **11 Engineering & Architektur** — technical chapter divider on the core glyph.
- **12 Technologie-Stack** — three architectural layers (Frontend / Backend /
  Datenhaltung) with the app stack clearly separated from the
  "Präsentationsumgebung" callout. Authentic tech names only, no logo collage.
- **13 Architektur & Ablauf** — an SVG sequence diagram (Client / Backend /
  Datenbank lifelines, six numbered request/response messages) with a
  full-text legend, the polling note and the honest caveat.
- **14 Aufwandsschätzung** — editorial plan-vs-ist bar tracks; values remain
  `—` placeholders because the verified source has none (TODO preserved).
- **15 Herausforderungen & Lösungen** — problem → solution rows with a
  directional arrow and a status badge (gelöst / offen) + source.
- **16 Gewonnene Erkenntnisse** — three insights with oversized numerals and
  expressive typography.
- **17 Anforderungen & Qualität** — final divider on the ring+check glyph.
- **18 Anforderungsaudit** — a stacked 8/7/5 status bar + four stat figures,
  the 10-row table with a highlighted critical row, and the (previously
  dropped) methodology list.
- **19 Testing & Qualitätssicherung** — three test tiers with large verified
  numbers (106/106, 64/64, 7/7), the CI pipeline and both caveats.
- **20 Live-Demo** — a dramatic pulsing `LIVE` badge, three demo steps and the
  launch/return notes (demo-launch functionality untouched).
- **21 Abschluss & Fragen** — mirrors the opening: the same faceted earth,
  `Entdecken. Raten. Dazulernen.`, the achieved/open columns, and
  `Danke. Fragen?` closing.

## 4. Before / after

| Aspect | Before (Phase 5) | After (Phase 6) |
|---|---|---|
| Composition model | one shared card grid, bottom-left column | per-layout hero/split/flow/diagram compositions |
| Title / dividers | 2.6 rem, same as body slides | 112–148 px oversized wordmarks + landmarks |
| Tech stack | 3 generic cards + pills | layered architecture diagram |
| Game round flow | 6 equal cards in a grid | SVG sequence diagram + legend |
| Audit | 4 stat cards + table | stacked status bar + figures + methodology |
| Challenge | cropped screenshot + list | full-bleed panorama + question chip + ping |
| Team | 2 profile cards | hexagonal avatars + work-package chips |
| Agenda | 4 numbered rows | geographic route with landmark glyphs |
| Earth | absent | deterministic faceted-earth SVG (also closing slide) |

Screenshots: `phase6-shots/before/slide-01..21.png` vs
`phase6-shots/final/slide-01..21.png` (1920×1080, headed Chrome, WebGPU).

## 5. Verification

- **Layout audit (all 21 slides, 1920×1080):** 0 viewport overflows, 0 text
  clips, 0 collapsed stages, 0 console errors — in both station and tour flows.
- **Content completeness:** all key verified strings present on all 21 slides.
- **Contrast:** every text/background pair ≥ 5.0:1 (cream 18.1, muted 9.9,
  subtle 5.0, ink-on-lime 12.0). No low-contrast pair introduced.
- **Production build:** `npm run build` succeeds (890 ms); the only warnings
  (chunk size, `eval` in `vm-browserify`) are pre-existing, documented in
  `PRESENTATION_COMPLIANCE.md` §8.
- **Tour mode:** `enterTour()` → `goToSlide(1..21)` completes at slide 21 with
  zero errors (cinematic transitions intact).

## 6. Remaining limitations (honest)

1. **No human-eye pixel review.** This model cannot read images (the attached
   PDF and all PNG screenshots are unreadable here). Visual quality was
   therefore verified **programmatically** (overflow/clip/overlap, contrast
   ratios, typography scale, content completeness, non-empty renders via PNG
   byte size) rather than by inspection. The screenshots in `phase6-shots/`
   are the human review artifact — please eyeball them and flag any
   composition you want pushed further.
2. **Screenshot annotation positions** (slide 07) are semantic rail callouts,
   not pixel-precise over-image pins, because the exact in-frame UI layout
   could not be inspected against the screenshots.
3. **Aufwand (14) remains placeholder-only** — the underlying project has no
   plan/ist hours (verified TODO preserved), so the visualization intentionally
   shows empty tracks rather than invented numbers.
4. **Responsive < 900 px** is styled but only lightly verified; the target is
   the 1920×1080 projector layout.

## 7. Preparation for Phase 7 (motion)

The design was built with future shared-element transitions in mind:

- Every layout keeps a stable shell (`eyebrow`/`title`/`subtitle`/`content`/
  `section-nav`) with `data-layout` per slide — a clean hook for cross-fade
  and shared-header motion.
- The **faceted earth SVG** and the **four landmark glyphs** are generated by
  pure string builders (`polyEarthSVG`, `landmarkSVG`) — reusable as morph/swap
  targets between the title, dividers and the closing slide.
- The **sequence diagram** (`flowDiagramSVG`) already numbers its six messages
  and could be revealed step-by-step by toggling each message's opacity.
- The **route line** (02), **idea/phase arrows** (04/08) and the **audit
  status bar** (18) are primed for draw-in / count-up animation.
- `--accent` / `--accent-rgb` CSS custom properties are set per station, so a
  later accent-tint transition between stations needs no markup changes.
- No motion was implemented, per the phase boundary.
