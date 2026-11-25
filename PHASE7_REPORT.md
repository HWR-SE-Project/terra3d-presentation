# Phase 7 — Cinematic Motion Design · Final Report

**Baseline:** `dc2b51a` (Phase 6 — creative direction & visual design for all 21 slides)
**Scope:** `sources/Game/Presentation/MotionDirector.js` (new), `PresentationController.js`,
`SlideRenderer.js`, `sources/style/presentation.styl`

---

## 0. Visual-audit limitation (stated up front)

This model **cannot read images** (confirmed: the PNG screenshots in `phase6-shots/final/`
return "this model does not support image input"). The Phase 6 composition, alignment and
readability could therefore **not** be re-audited by eye. What *was* verified programmatically
is listed in §5; it is a structural check, **not** an aesthetic review. The Phase 6 human-eye
caveat (`PHASE6_REPORT.md` §6) still stands and is unchanged by this phase.

---

## 1. Motion architecture

Motion was introduced as a single, centralized director while keeping the three
Phase-4/5/6 concerns strictly separate:

| Module | Concern | Change |
|---|---|---|
| `SlideRenderer.js` | slide **content** (markup/CSS hooks) | gsap removed; only fills the stage + exposes `setFlow()` |
| `PresentationController.js` | presentation **state** (modes/navigation) | routes Next/Prev through step logic + director |
| `MotionDirector.js` (**new**) | **motion** (every tween that touches the overlay) | owns all GSAP work |

`MotionDirector` never reads navigation state and never builds markup — it receives a
resolved slide and a `render()` callback, and animates the DOM the renderer produced.

### Two complementary mechanisms

1. **Entrance / exit** — a per-layout cinematic intro (header stagger + hero motif) and a
   short, directional outro for consecutive slides.
2. **Staged reveals** — each slide declares an ordered list of `steps`. Next reveals the next
   step; after the final step Next advances to the following slide. Prev un-reveals a step,
   then moves to the previous slide (shown fully revealed). Backward navigation therefore
   never forces the presenter to re-step.

### Motion primitives (meaningful, not decorative)

- **Shared-element transitions** via GSAP `Flip` between a recurring "hero motif" (faceted
  earth, station landmark, screenshot, LIVE badge) on consecutive slides.
- **SVG path drawing** via `DrawSVGPlugin` (route line, sequence-diagram arrows, check mark,
  core ring).
- **Geometric transformation** (earth scale/rotation, landmark pop/rotation, VS mark).
- **Wordmark typography** via `SplitText` (per-character, restrained, no overshoot).
- **Sequential reveals** (staggered fade/rise, layer separation).
- **Numerical count-up** (verified audit/testing figures only).
- **Subtle idle rotation** of the faceted earth while the presenter speaks.

### Interruption & cleanup

All tweens are tracked in `MotionDirector` and killed on interruption (`kill()`), which also
reverts any `SplitText`, stops idle loops and resolves any pending exit promise. Every
entrance/exit clears inline `transform`/`opacity`/`visibility` on completion, so CSS layout
transforms are never permanently overridden and elements never linger in a half-animated
state. Same-station swaps are non-blocking and self-cancelling — rapid keyboard input simply
restarts the transition and always drives content to the target slide.

### Reduced motion

`prefers-reduced-motion` collapses every animation to an instant, step-free reveal and
disables all idle loops (JS) and all CSS keyframes/transitions (`.presentation`, the
challenge ping, the demo blink, the station prompt).

---

## 2. Slide-by-slide motion

All durations sit in the 500–1200 ms band except the deliberately cinematic moments (marked).

| Slide | Entrance | Staged steps (Next) |
|---|---|---|
| **01 Titelfolie** | eyebrow → faceted earth scale+rotate (1.3 s) → per-letter wordmark → subtitle/byline | — (earth keeps a 48 s idle rotation) |
| **02 Agenda** | route line draws L→R; stop 01 pops | 3 × next station landmark |
| **03 Das Konzept** | gem landmark pops; giant "01" fades; body staggers | — |
| **04 Projektidee** | step 01 (Entdecken) pops | Raten · Vergleichen · audience/scope |
| **05 Team** | count "2" fades; member 01 avatar rolls + body slides + chips pop | member 02 |
| **06 Produktrundgang** | origami globe spins in (0.9 s); body staggers | — |
| **07 Startbildschirm** | hero screenshot rises+scales (0.8 s) | 2 × callouts (+ tutorial shot) |
| **08 Einzelspieler** | phase 01 + frame 01 | 2 × (phase + filmstrip frame) |
| **09 Mehrspieler** | VS mark pops; lobby side | round side · footnote |
| **10 Publikums-Challenge** | panorama Ken-Burns settles (1.4 s); question chip | **presenter reveal** — slow push-in focus (2.4 s), no answer in DOM |
| **11 Engineering** | core ring draws, ticks stagger, center pops | — |
| **12 Technologie-Stack** | layer 01 (Frontend) | 2 × layers · extern/QS/note |
| **13 Ablauf** | diagram frame + lifelines | **6 × message draw + legend** · notes |
| **14 Aufwandsschätzung** | key | 5 rows (no fabricated numbers) · note |
| **15 Herausforderungen** | (header) | 3 × problem→arrow→solution, status pop/fade |
| **16 Erkenntnisse** | (header) | 3 × insight (restrained type) |
| **17 Qualität** | ring + check draw (0.7+0.5 s); body staggers | — |
| **18 Anforderungsaudit** | summary bar grows + 8/7/5/6 count-up | 3 × table rows by status · methodology |
| **19 Testing** | (header) | 3 × tier + count-up · CI · caveats |
| **20 Live-Demo** | LIVE badge pops | 3 × demo steps · notes |
| **21 Abschluss** | earth + lines + subline (mirrors 01) | columns · **"Danke. Fragen?"** |

### Shared-element (Flip) transitions

Applied automatically whenever two consecutive slides both expose a compact hero motif:
01→02 (earth → Konzept landmark), 02→03 (landmark enlarged), 03→04, 04→05, 06→07
(globe → home screen), 07→08, 08→09, 09→10 (screenshot → dominant panorama), 17→18
(check → audit), 20→21 (LIVE → earth). The dense engineering/quality surfaces (layers,
diagram, tables) slide directionally instead, which reads better for heavy content.

---

## 3. Presenter control

- **Next** (`→`/Space) reveals the next step; on the last step it advances the slide.
- **Prev** (`←`) un-reveals a step; at step 0 it moves to the previous slide (fully shown).
- **Home/End** (tour) jump directly; **M** toggles tour/exploration; **Esc** closes a station
  or exits fullscreen; **F** fullscreen.
- A slide never auto-advances and a station never auto-opens the next station.
- Rapid input is safe: same-station swaps self-cancel; cross-station walks are skipped via
  the existing `skipTransition()`.

---

## 4. Station interaction (unchanged behaviour, re-animated)

Opening a stand keeps the character's exact world position/orientation (only manual input is
suspended); the camera cuts in while the overlay and first slide animate in together.
Closing animates the slide out, restores the camera and returns manual controls — a plain
reverse, never a snap-back. The optional automated tour and its cross-station
walk+camera choreography are preserved, and the slide backdrop now fades during the walk so
the journey between stations is visible.

---

## 5. Validation

| Check | Result |
|---|---|
| Production build (`npm run build`) | ✅ 896 ms → 792 ms (no regression); only pre-existing warnings (chunk size, `eval` in `vm-browserify`) |
| Dev server boots + serves modules | ✅ `MotionDirector.js` / `PresentationController.js` → HTTP 200 |
| Content completeness | ✅ all 21 slides render through the unchanged `renderContent` switch; every verified string preserved verbatim (only additive `data-*`/`<span class="num">` hooks) |
| Count-up integrity | ✅ counts drive `.num[data-to]` only (8/7/5/6 audit, 106/64/7 testing); placeholder hours (14) are never animated |
| `prefers-reduced-motion` | ✅ JS collapses to instant + CSS disables keyframes/transitions |
| Interactive browser walk-through, screenshots, video | ❌ **not performed** — no headless browser is available and this model cannot view images |

---

## 6. Remaining limitations (honest)

1. **No human-eye/visual verification.** No browser walk-through, screenshots or video were
   captured (no headless browser in the environment; model cannot read images). Motion timing,
   FLIP aesthetics and readability were reasoned about structurally, not seen.
2. **Slide 10 answer.** The verified answer lives only in the speaker notes and is unverified
   in the source, so the presenter-controlled "reveal" is a cinematic focus on the panorama —
   no answer text is fabricated in the DOM.
3. **SplitText/Flip cleanup under mid-flight interruption** is handled by `kill()` +
   re-render, but the exact visual result of a FLIP killed at its very first frames was not
   visually inspected.
4. **Responsive < 900 px** motion is lightly exercised; the target remains 1920×1080.
