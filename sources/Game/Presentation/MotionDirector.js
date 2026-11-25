import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(Flip, DrawSVGPlugin, SplitText)

/**
 * Phase 7 — Cinematic motion director.
 *
 * Owns every GSAP tween that touches the presentation overlay. It is kept
 * strictly separate from slide *content* (SlideRenderer) and presentation
 * *state* (PresentationController): the controller resolves navigation, tells
 * the renderer to fill the stage, and asks this director to animate — the
 * director never reads navigation state and never builds markup.
 *
 * Two complementary mechanisms:
 *
 *  1. ENTRANCE / EXIT — a cinematic, per-layout intro (header + hero motif)
 *     and a short, directional outro for consecutive slides.
 *
 *  2. STAGED REVEALS — a slide may declare an ordered list of "steps". The
 *     presenter advances them one at a time with Next; after the final step,
 *     Next advances to the following slide (see `next()` / `prev()`).
 *     Backward navigation shows the previous slide fully revealed.
 *
 * Shared-element continuity is handled with GSAP Flip between a recurring
 * "hero motif" (the faceted earth / station landmark / screenshot) when both
 * the outgoing and incoming slide expose one.
 *
 * All durations live in the 500–1200 ms band unless a moment is deliberately
 * cinematic. `prefers-reduced-motion` collapses every animation to an instant,
 * step-free reveal and disables all idle loops.
 */

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

// Compact hero objects that can meaningfully "fly" between two slides. Larger
// editorial surfaces (layers, diagrams, tables) intentionally do NOT flip —
// they slide directionally instead, which reads better for dense content.
function motifSelector(slide)
{
    switch(slide.layout)
    {
        case 'title': return '.hero__earth svg'
        case 'agenda': return '.route__stop:first-child .route__glyph svg'
        case 'divider': return '.divider__glyph svg'
        case 'idea': return '.idea__step:first-child .idea__icon svg'
        case 'team': return '.member:first-child .member__avatar svg'
        case 'media':
            if(slide.id === 7) return '.media__primary img'
            if(slide.id === 8) return '.media__strip figure:first-child img'
            return '.versus__side:first-child img'
        case 'challenge': return '.challenge__pano img'
        case 'demo': return '.demo__live'
        case 'conclusion': return '.hero__earth svg'
        default: return null
    }
}

export class MotionDirector
{
    constructor(slideRenderer)
    {
        this.renderer = slideRenderer
        this.root = slideRenderer.root
        this.elements = slideRenderer.elements
        this.content = slideRenderer.elements.content

        this._tweens = []
        this._splitTexts = []
        this._idle = null
        this._exitResolve = null
        this._reduced = typeof window !== 'undefined' && window.matchMedia(REDUCED_QUERY).matches

        this._currentSlide = null
        this.stepIndex = 0
    }

    setReducedMotion(reduced)
    {
        this._reduced = !!reduced
        if(this._reduced)
        {
            // Collapse any in-flight animation and stop idle loops.
            this.kill()
        }
    }

    // -- lifecycle ------------------------------------------------------------

    get currentSlide()
    {
        return this._currentSlide
    }

    /**
     * Entrance from a blank/backdrop state (station open, tour reveal, cross
     * station arrive). Non-blocking.
     */
    enter(slide, { restoreBackdrop = false } = {})
    {
        this.kill()
        this._currentSlide = slide
        const spec = this._spec(slide)

        if(this._reduced)
        {
            this.stepIndex = spec.steps.length
            this._set([ ...this._backdrop(), this.elements.stage ], { clearProps: 'transform,opacity,visibility' })
            return
        }

        if(restoreBackdrop)
        {
            this.track(gsap.fromTo(this._backdrop(), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power1.out', clearProps: 'opacity,visibility' }))
            this.track(gsap.fromTo(this.elements.stage, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power1.out', clearProps: 'opacity,visibility' }))
        }

        this.stepIndex = 0
        this._prepare(slide)
        this._entrance(slide)
    }

    /**
     * Outro. `mode` is 'close' (station close) or 'cross' (tour cross-station,
     * where the whole backdrop also fades so the world walk is visible).
     * Resolves once the outro finishes (or is skipped).
     */
    exit(slide, mode = 'close')
    {
        this.kill()

        return new Promise((resolve) =>
        {
            this._exitResolve = resolve

            if(this._reduced)
            {
                resolve()
                this._exitResolve = null
                return
            }

            const targets = mode === 'cross'
                ? [ ...this._backdrop(), this.elements.stage ]
                : this.elements.stage

            const vars = mode === 'cross'
                ? { autoAlpha: 0, duration: 0.45, ease: 'power1.in' }
                : { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power1.in' }

            this.track(gsap.to(targets, {
                ...vars,
                onComplete: () =>
                {
                    this._exitResolve = null
                    resolve()
                }
            }))
        })
    }

    /**
     * Consecutive-slide transition (same station). Plays a short directional
     * outro, swaps content via `render()`, then runs the entrance — with a
     * Flip shared-element flight when both slides expose a hero motif.
     * Non-blocking and self-cancelling: rapid input just restarts it.
     */
    transition(toSlide, { fromSlide, backward = false, render })
    {
        this.kill()
        this._currentSlide = toSlide
        const spec = this._spec(toSlide)

        if(this._reduced)
        {
            render()
            this.stepIndex = spec.steps.length
            this._flipState = null
            return
        }

        const fromSel = motifSelector(fromSlide)
        const toSel = motifSelector(toSlide)
        const fromEl = fromSel ? this._qs(fromSel) : null
        this._flipState = (fromEl && toSel) ? Flip.getState(fromEl) : null

        const doRender = () =>
        {
            render()
            this.stepIndex = backward ? spec.steps.length : 0
            if(!backward)
                this._prepare(toSlide)

            // Re-open the stage container the outro just closed, sliding the
            // new content in from the narrative direction.
            this.track(gsap.fromTo(this.elements.stage,
                { autoAlpha: 0, x: backward ? -34 : 34 },
                { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))

            if(backward)
                this._simpleEntrance(toSlide)
            else
                this._entrance(toSlide)

            if(!backward)
            {
                if(fromSel && toSel)
                {
                    const toEl = this._qs(toSel)
                    if(toEl && this._flipState)
                        this.track(Flip.from(this._flipState, { targets: toEl, duration: 0.7, ease: 'power2.inOut' }))
                }
            }
            this._flipState = null
        }

        this.track(gsap.to(this.elements.stage, {
            autoAlpha: 0,
            x: backward ? 34 : -34,
            duration: 0.26,
            ease: 'power1.in',
            onComplete: doRender
        }))
    }

    // -- presenter-controlled steps ------------------------------------------

    /**
     * Reveal the next staged step. Returns true when a step was revealed,
     * false when the slide is already fully revealed (caller should advance
     * to the following slide).
     */
    next(slide)
    {
        if(this._reduced)
            return false

        const spec = this._spec(slide)
        if(this.stepIndex >= spec.steps.length)
            return false

        for(const directive of spec.steps[this.stepIndex])
            this._applyDirective(directive, 'show')

        this.stepIndex++
        return true
    }

    /**
     * Un-reveal the most recent step. Returns true when a step was hidden,
     * false when already at the first step (caller should go to the previous
     * slide).
     */
    prev(slide)
    {
        if(this._reduced)
            return false

        const spec = this._spec(slide)
        if(this.stepIndex <= 0)
            return false

        this.stepIndex--
        for(const directive of spec.steps[this.stepIndex])
            this._applyDirective(directive, 'hide')

        return true
    }

    // -- interruption & cleanup ----------------------------------------------

    kill()
    {
        for(const tween of this._tweens)
            tween?.kill()
        this._tweens.length = 0

        for(const split of this._splitTexts)
            split?.revert()
        this._splitTexts.length = 0

        this._idle = null

        if(this._exitResolve)
        {
            const resolve = this._exitResolve
            this._exitResolve = null
            resolve()
        }

        if(this.elements.stage)
            this._set(
                [ this.elements.stage, this.elements.eyebrow, this.elements.title, this.elements.subtitle ],
                { clearProps: 'transform,opacity,visibility' }
            )
        if(this.elements.scrim)
            this._set(this._backdrop(), { clearProps: 'opacity,visibility' })
    }

    // -- internals ------------------------------------------------------------

    _backdrop()
    {
        return [ this.elements.scrim, this.elements.pattern, this.elements.watermark ]
    }

    _qs(selector, scope = this.content)
    {
        return scope?.querySelector?.(selector) ?? null
    }

    _resolve(selector)
    {
        if(!selector)
            return []
        if(typeof selector === 'function')
            return selector(this.content, this.root)
        const nodes = this.content?.querySelectorAll?.(selector)
        const list = nodes && nodes.length ? Array.from(nodes) : Array.from(this.root.querySelectorAll(selector))
        return list
    }

    track(tween)
    {
        if(!tween)
            return tween
        if(Array.isArray(tween))
            this._tweens.push(...tween)
        else
            this._tweens.push(tween)
        return tween
    }

    _set(targets, vars)
    {
        gsap.set(targets, vars)
    }

    _dur(value)
    {
        return this._reduced ? 0 : value
    }

    // -- generic header + entrance -------------------------------------------

    _entrance(slide, { delay = 0 } = {})
    {
        const showHeader = slide.layout !== 'title' && slide.layout !== 'conclusion'

        if(showHeader)
        {
            this.track(gsap.fromTo(this.elements.eyebrow,
                { autoAlpha: 0, x: -14 },
                { autoAlpha: 1, x: 0, duration: this._dur(0.5), delay, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))

            this.track(gsap.fromTo(this.elements.title,
                { autoAlpha: 0, y: 22 },
                { autoAlpha: 1, y: 0, duration: this._dur(0.6), delay: delay + 0.06, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }))

            this.track(gsap.fromTo(this.elements.subtitle,
                { autoAlpha: 0, y: 14 },
                { autoAlpha: 1, y: 0, duration: this._dur(0.5), delay: delay + 0.14, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))
        }

        const spec = this._spec(slide)
        for(const directive of spec.enter)
            this._applyDirective(directive, 'show', delay)

        this._startIdle(slide)
    }

    _simpleEntrance(slide)
    {
        this.track(gsap.fromTo(
            [ this.elements.eyebrow, this.elements.title, this.elements.subtitle, this.elements.content ],
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: this._dur(0.38), ease: 'power1.out', stagger: 0.05, clearProps: 'opacity,visibility' }
        ))
        this._startIdle(slide)
    }

    _prepare(slide)
    {
        const spec = this._spec(slide)
        for(const step of spec.steps)
            for(const directive of step)
                this._applyDirective(directive, 'hide')
    }

    _startIdle(slide)
    {
        if(this._reduced)
            return

        if(slide.layout === 'title' || slide.layout === 'conclusion')
        {
            const earth = this._qs('.hero__earth svg')
            if(earth)
                this._idle = this.track(gsap.to(earth, { rotation: '+=360', duration: 48, ease: 'none', repeat: -1, delay: 1.6 }))
        }
    }

    // -- directive engine -----------------------------------------------------

    _applyDirective(directive, mode, delay = 0)
    {
        const targets = this._resolve(directive.q)

        if(directive.t === 'count')
        {
            if(targets.length)
            {
                if(mode === 'instant')
                    targets.forEach((el) => { el.textContent = el.dataset.to ?? '0' })
                else if(mode === 'hide')
                    targets.forEach((el) => { el.textContent = '0' })
                else
                    targets.forEach((el) => this._count(el, directive.o, delay))
            }
            return
        }

        if(directive.t === 'custom')
        {
            if(mode === 'show')
            {
                directive.run(this.content, this)
                return
            }
            if(!targets.length)
                return
            if(mode === 'hide')
            {
                this._set(targets, { autoAlpha: 0 })
                return
            }
            this._set(targets, { autoAlpha: 1, clearProps: 'transform,opacity,visibility' })
            return
        }

        if(!targets.length)
            return

        if(mode === 'hide')
        {
            this._set(targets, this._hiddenVars(directive))
        }
        else if(mode === 'instant')
        {
            if(directive.t === 'draw')
                this._set(targets, { drawSVG: '0% 100%' })
            else
                this._set(targets, { autoAlpha: 1, clearProps: 'transform,opacity,visibility' })
        }
        else
        {
            this._show(targets, directive, delay)
        }
    }

    _hiddenVars(directive)
    {
        switch(directive.t)
        {
            case 'reveal': return { autoAlpha: 0, y: directive.o?.y ?? 18 }
            case 'pop': return { autoAlpha: 0, scale: 0.72 }
            case 'draw': return { drawSVG: '0% 0%' }
            case 'fade': return { autoAlpha: 0 }
            default: return { autoAlpha: 0, y: directive.o?.y ?? 18 }
        }
    }

    _show(targets, directive, delay)
    {
        const o = directive.o ?? {}
        const dur = this._dur(o.duration ?? 0.65)

        if(directive.t === 'reveal')
        {
            this.track(gsap.to(targets, {
                autoAlpha: 1,
                y: 0,
                duration: dur,
                delay: delay + (o.delay ?? 0),
                stagger: o.stagger ?? 0.09,
                ease: o.ease ?? 'power3.out',
                clearProps: 'transform,opacity,visibility'
            }))
        }
        else if(directive.t === 'pop')
        {
            this.track(gsap.to(targets, {
                autoAlpha: 1,
                scale: 1,
                duration: dur,
                delay: delay + (o.delay ?? 0),
                stagger: o.stagger ?? 0.08,
                ease: o.ease ?? 'back.out(1.4)'
            }))
        }
        else if(directive.t === 'draw')
        {
            this.track(gsap.fromTo(targets,
                { drawSVG: '0% 0%' },
                {
                    drawSVG: '0% 100%',
                    duration: this._dur(o.duration ?? 0.7),
                    delay: delay + (o.delay ?? 0),
                    stagger: o.stagger ?? 0.1,
                    ease: 'power1.inOut'
                }))
        }
        else if(directive.t === 'fade')
        {
            this.track(gsap.to(targets, {
                autoAlpha: 1,
                duration: dur,
                delay: delay + (o.delay ?? 0),
                stagger: o.stagger ?? 0.08,
                ease: o.ease ?? 'power1.out',
                clearProps: 'opacity,visibility'
            }))
        }
    }

    _count(el, o, delay = 0)
    {
        const to = parseFloat(el.dataset.to ?? '0')
        el.textContent = '0'
        const proxy = { v: 0 }
        this.track(gsap.to(proxy, {
            v: to,
            duration: this._dur(o?.duration ?? 1.0),
            delay: delay + (o?.delay ?? 0),
            ease: 'power1.out',
            onUpdate: () => { el.textContent = Math.round(proxy.v) },
            onComplete: () => { el.textContent = to }
        }))
    }

    // -- per-layout motion spec ----------------------------------------------

    _spec(slide)
    {
        const layout = slide.layout

        if(layout === 'title')
            return { enter: [ { t: 'custom', run: (root) => this._titleEnter(root) } ], steps: [] }

        if(layout === 'agenda')
        {
            return {
                enter: [
                    { t: 'custom', run: (root) =>
                    {
                        const line = root.querySelector('.route__line')
                        if(line) this.track(gsap.fromTo(line, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: this._dur(0.85), ease: 'power2.inOut', clearProps: 'transform' }))
                    } },
                    { t: 'pop', q: '.route__stop:nth-child(1)', o: { delay: 0.3 } },
                ],
                steps: [
                    [ { t: 'pop', q: '.route__stop:nth-child(2)' } ],
                    [ { t: 'pop', q: '.route__stop:nth-child(3)' } ],
                    [ { t: 'pop', q: '.route__stop:nth-child(4)' } ],
                ],
            }
        }

        if(layout === 'divider')
        {
            return {
                enter: [ { t: 'custom', run: (root) => this._dividerEnter(root, slide) } ],
                steps: [],
            }
        }

        if(layout === 'idea')
        {
            return {
                enter: [
                    { t: 'pop', q: '.idea__step:nth-child(1)' },
                ],
                steps: [
                    [ { t: 'pop', q: '.idea__step:nth-child(2)' } ],
                    [ { t: 'pop', q: '.idea__step:nth-child(3)' } ],
                    [ { t: 'reveal', q: '.idea__meta', o: { y: 14 } } ],
                ],
            }
        }

        if(layout === 'team')
        {
            return {
                enter: [
                    { t: 'custom', run: (root) =>
                    {
                        this.track(gsap.fromTo(root.querySelector('.team__count'), { autoAlpha: 0 }, { autoAlpha: 1, duration: this._dur(0.9), ease: 'power2.out', clearProps: 'opacity,visibility' }))
                        const member = root.querySelector('.member:first-child')
                        if(member) this._memberIn(member)
                    } },
                ],
                steps: [
                    [ { t: 'custom', q: '.member:last-child', run: (root) => this._memberIn(root.querySelector('.member:last-child')) } ],
                ],
            }
        }

        if(layout === 'media')
        {
            if(slide.id === 7)
            {
                return {
                    enter: [
                        { t: 'custom', run: (root) =>
                        {
                            const primary = root.querySelector('.media__primary')
                            if(primary) this.track(gsap.fromTo(primary, { autoAlpha: 0, y: 26, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: this._dur(0.8), ease: 'power3.out', clearProps: 'transform,opacity,visibility' }))
                        } },
                    ],
                    steps: [
                        [ { t: 'reveal', q: '.callouts li:nth-child(1)' } ],
                        [ { t: 'reveal', q: '.callouts li:nth-child(2), .media__rail .shot--secondary', o: { stagger: 0.12 } } ],
                    ],
                }
            }

            if(slide.id === 8)
            {
                return {
                    enter: [
                        { t: 'reveal', q: '.phase:nth-child(1), .media__strip figure:nth-child(1)', o: { stagger: 0.1 } },
                    ],
                    steps: [
                        [ { t: 'reveal', q: '.phase:nth-child(2), .media__strip figure:nth-child(2)', o: { stagger: 0.1 } } ],
                        [ { t: 'reveal', q: '.phase:nth-child(3), .media__strip figure:nth-child(3)', o: { stagger: 0.1 } } ],
                    ],
                }
            }

            return {
                enter: [
                    { t: 'pop', q: '.versus__mark' },
                    { t: 'reveal', q: '.versus__side:first-child', o: { y: 20 } },
                ],
                steps: [
                    [ { t: 'reveal', q: '.versus__side:last-child', o: { y: 20 } } ],
                    [ { t: 'reveal', q: '.media--versus .note', o: { y: 12 } } ],
                ],
            }
        }

        if(layout === 'challenge')
        {
            return {
                enter: [
                    { t: 'custom', run: (root) =>
                    {
                        const pano = root.querySelector('.challenge__pano img')
                        const ask = root.querySelector('.challenge__ask')
                        if(pano) this.track(gsap.fromTo(pano, { autoAlpha: 0.5, scale: 1.07 }, { autoAlpha: 1, scale: 1, duration: this._dur(1.4), ease: 'power3.out', clearProps: 'transform,opacity,visibility' }))
                        if(ask) this.track(gsap.fromTo(ask, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: this._dur(0.6), delay: 0.4, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))
                    } },
                ],
                steps: [
                    [ { t: 'custom', q: '.challenge__pano img', run: (root) => this._challengeReveal(root) } ],
                ],
            }
        }

        if(layout === 'stack')
        {
            return {
                enter: [
                    { t: 'reveal', q: '.stack__layer:nth-child(1)', o: { y: 18 } },
                ],
                steps: [
                    [ { t: 'reveal', q: '.stack__layer:nth-child(2)', o: { y: 18 } } ],
                    [ { t: 'reveal', q: '.stack__layer:nth-child(3)', o: { y: 18 } } ],
                    [ { t: 'reveal', q: '.stack__external, .stack__quality, .stack > .note', o: { y: 12, stagger: 0.1 } } ],
                ],
            }
        }

        if(layout === 'flow')
        {
            const messageSteps = Array.from({ length: 6 }, (_, i) =>
                [
                    { t: 'custom', q: `.flow-diagram [data-message="${i + 1}"], .flow__legend-item[data-step="${i + 1}"]`, run: (root) => this._flowStep(root, i + 1) },
                ])

            return {
                enter: [
                    { t: 'reveal', q: '.flow-diagram', o: { y: 16 } },
                ],
                steps: [
                    ...messageSteps,
                    [ { t: 'reveal', q: '.flow__notes', o: { y: 12 } } ],
                ],
            }
        }

        if(layout === 'table-hours')
        {
            return {
                enter: [
                    { t: 'reveal', q: '.hours__key', o: { y: 10 } },
                ],
                steps: [
                    [ { t: 'reveal', q: '.hours__rows li', o: { stagger: 0.09 } } ],
                    [ { t: 'reveal', q: '.hours > .note', o: { y: 12 } } ],
                ],
            }
        }

        if(layout === 'table-challenges')
        {
            const rowStep = (index) =>
                [
                    { t: 'custom', q: `.challenges__row:nth-child(${index})`, run: (root) => this._challengeRow(root, index) },
                ]
            return {
                enter: [],
                steps: [ rowStep(1), rowStep(2), rowStep(3) ],
            }
        }

        if(layout === 'learnings')
        {
            return {
                enter: [],
                steps: [
                    [ { t: 'reveal', q: '.learnings__item:nth-child(1)', o: { y: 20 } } ],
                    [ { t: 'reveal', q: '.learnings__item:nth-child(2)', o: { y: 20 } } ],
                    [ { t: 'reveal', q: '.learnings__item:nth-child(3)', o: { y: 20 } } ],
                ],
            }
        }

        if(layout === 'audit')
        {
            return {
                enter: [
                    { t: 'custom', run: (root) => this._auditEnter(root) },
                ],
                steps: [
                    [ { t: 'fade', q: '.audit__table thead, .audit__table tbody tr[data-status="nicht bestanden"]', o: { stagger: 0.08 } } ],
                    [ { t: 'fade', q: '.audit__table tbody tr[data-status="teilweise"]', o: { stagger: 0.1 } } ],
                    [ { t: 'fade', q: '.audit__table tbody tr[data-status="bestanden"]', o: { stagger: 0.1 } } ],
                    [ { t: 'reveal', q: '.audit__method', o: { y: 14 } } ],
                ],
            }
        }

        if(layout === 'testing')
        {
            return {
                enter: [],
                steps: [
                    [ { t: 'reveal', q: '.tiers__tier:nth-child(1)', o: { y: 16 } }, { t: 'count', q: '.tiers__tier:nth-child(1) .num' } ],
                    [ { t: 'reveal', q: '.tiers__tier:nth-child(2)', o: { y: 16 } }, { t: 'count', q: '.tiers__tier:nth-child(2) .num' } ],
                    [ { t: 'reveal', q: '.tiers__tier:nth-child(3)', o: { y: 16 } }, { t: 'count', q: '.tiers__tier:nth-child(3) .num' } ],
                    [ { t: 'reveal', q: '.testing__ci', o: { y: 14 } } ],
                    [ { t: 'reveal', q: '.testing__caveats', o: { y: 14 } } ],
                ],
            }
        }

        if(layout === 'demo')
        {
            return {
                enter: [
                    { t: 'custom', run: (root) =>
                    {
                        const live = root.querySelector('.demo__live')
                        if(live) this.track(gsap.fromTo(live, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: this._dur(0.7), ease: 'back.out(1.5)' }))
                    } },
                ],
                steps: [
                    [ { t: 'pop', q: '.demo__steps li:nth-child(1)' } ],
                    [ { t: 'pop', q: '.demo__steps li:nth-child(2)' } ],
                    [ { t: 'pop', q: '.demo__steps li:nth-child(3)' } ],
                    [ { t: 'reveal', q: '.demo__notes', o: { y: 14 } } ],
                ],
            }
        }

        if(layout === 'conclusion')
            return { enter: [ { t: 'custom', run: (root) => this._conclusionEnter(root) } ], steps: this._closingSteps() }

        // Fallback — any future layout still gets a dignified staggered reveal.
        return { enter: [ { t: 'reveal', q: '.presentation__content > *', o: { stagger: 0.1 } } ], steps: [] }
    }

    // -- bespoke animation helpers -------------------------------------------

    _titleEnter(root)
    {
        const tl = gsap.timeline()
        this.track(tl)

        const eyebrow = root.querySelector('.hero__eyebrow')
        const earth = root.querySelector('.hero__earth svg')
        const title = root.querySelector('.hero__title')
        const subtitle = root.querySelector('.hero__subtitle')
        const byline = root.querySelector('.hero__byline')

        if(eyebrow) tl.fromTo(eyebrow, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.1)
        if(earth) tl.fromTo(earth, { autoAlpha: 0, scale: 0.88, rotation: -24 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.3, ease: 'power3.out' }, 0.2)

        if(title)
        {
            const split = new SplitText(title, { type: 'chars' })
            this._splitTexts.push(split)
            tl.fromTo(split.chars,
                { autoAlpha: 0, y: 30, rotation: -6, transformOrigin: '50% 100%' },
                { autoAlpha: 1, y: 0, rotation: 0, duration: 0.7, stagger: 0.045, ease: 'power3.out', clearProps: 'transform,opacity,visibility' },
                0.55)
        }

        if(subtitle) tl.fromTo(subtitle, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.95)
        if(byline) tl.fromTo(byline, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 1.05)
    }

    _conclusionEnter(root)
    {
        const tl = gsap.timeline()
        this.track(tl)

        const eyebrow = root.querySelector('.hero__eyebrow')
        const earth = root.querySelector('.hero__earth svg')
        const lines = root.querySelectorAll('.hero__lines span')
        const subline = root.querySelector('.hero__subline')

        if(eyebrow) tl.fromTo(eyebrow, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.05)
        if(earth) tl.fromTo(earth, { autoAlpha: 0, scale: 0.9, rotation: 20 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.2, ease: 'power3.out' }, 0.15)
        if(lines.length) tl.fromTo(lines, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.5)
        if(subline) tl.fromTo(subline, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.9)
    }

    _closingSteps()
    {
        return [
            [ { t: 'reveal', q: '.hero__columns', o: { y: 16 } } ],
            [ { t: 'custom', q: '.hero__closing span', run: (root) =>
            {
                const spans = root.querySelectorAll('.hero__closing span')
                this.track(gsap.fromTo(spans,
                    { autoAlpha: 0, y: 26, scale: 0.94 },
                    { autoAlpha: 1, y: 0, scale: 1, duration: this._dur(0.7), stagger: 0.16, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }))
            } } ],
        ]
    }

    _dividerEnter(root, slide)
    {
        const tl = gsap.timeline()
        this.track(tl)

        const glyph = root.querySelector('.divider__glyph svg')
        const number = root.querySelector('.divider__number')
        const items = root.querySelectorAll('.divider__body .list li')
        const kind = slide.stationId

        if(glyph)
        {
            if(kind === 'engineering')
            {
                const ring = glyph.querySelector('circle[r="22"]')
                const ticks = glyph.querySelectorAll('line')
                const center = glyph.querySelectorAll('circle[r="11"], circle[r="5"]')
                if(ring) tl.fromTo(ring, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.8, ease: 'power1.inOut' }, 0.1)
                if(ticks.length) tl.fromTo(ticks, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.04, ease: 'power2.out', clearProps: 'opacity,visibility' }, 0.4)
                if(center.length) tl.fromTo(center, { autoAlpha: 0, scale: 0.4, transformOrigin: 'center' }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 0.5)
            }
            else if(kind === 'qualitaet')
            {
                const ring = glyph.querySelector('circle')
                const check = glyph.querySelector('path')
                if(ring) tl.fromTo(ring, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.7, ease: 'power1.inOut' }, 0.1)
                if(check) tl.fromTo(check, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.5, ease: 'power1.inOut' }, 0.5)
            }
            else if(kind === 'gameplay')
            {
                tl.fromTo(glyph, { autoAlpha: 0, scale: 0.7, rotation: -60 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.9, ease: 'power3.out' }, 0.1)
            }
            else
            {
                tl.fromTo(glyph, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'back.out(1.5)' }, 0.1)
            }
        }

        if(number) tl.fromTo(number, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: 'power2.out', clearProps: 'opacity,visibility' }, 0.3)
        if(items.length) tl.fromTo(items, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.55)
    }

    _memberIn(member)
    {
        if(!member)
            return
        const avatar = member.querySelector('.member__avatar')
        const body = member.querySelector('.member__body')

        if(avatar)
            this.track(gsap.fromTo(avatar, { autoAlpha: 0, rotation: -10, scale: 0.7, transformOrigin: '50% 50%' }, { autoAlpha: 1, rotation: 0, scale: 1, duration: 0.55, ease: 'back.out(1.5)' }))

        if(body)
        {
            this.track(gsap.fromTo(body, { autoAlpha: 0, x: 22 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))
            const pkgs = body.querySelectorAll('.member__packages li')
            if(pkgs.length)
                this.track(gsap.fromTo(pkgs, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.07, ease: 'back.out(1.7)', delay: 0.25 }))
        }
    }

    _challengeReveal(root)
    {
        const pano = root.querySelector('.challenge__pano img')
        const ask = root.querySelector('.challenge__ask')
        // The verified answer lives only in the speaker notes (unverified in the
        // source). This step is a cinematic "focus" on the panorama that hands
        // the floor to the presenter for the verbal reveal — it never fabricates
        // an answer in the DOM.
        if(pano) this.track(gsap.to(pano, { scale: 1.06, duration: this._dur(2.4), ease: 'power1.inOut', clearProps: 'transform' }))
        if(ask) this.track(gsap.to(ask, { autoAlpha: 0.45, duration: this._dur(0.8), ease: 'power1.out' }))
    }

    _flowStep(root, index)
    {
        const group = root.querySelector(`.flow-diagram [data-message="${index}"]`)
        const legend = root.querySelector(`.flow__legend-item[data-step="${index}"]`)

        if(group)
        {
            this.track(gsap.to(group, { autoAlpha: 1, duration: 0.08 }))
            const strokes = group.querySelectorAll('line, path')
            if(strokes.length)
                this.track(gsap.fromTo(strokes, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.7, stagger: 0.08, ease: 'power1.inOut' }))
            const texts = group.querySelectorAll('text')
            if(texts.length)
                this.track(gsap.fromTo(texts, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, delay: 0.3, clearProps: 'opacity,visibility' }))
        }

        if(legend)
            this.track(gsap.fromTo(legend, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))
    }

    _challengeRow(root, index)
    {
        const row = root.querySelector(`.challenges__row:nth-child(${index})`)
        if(!row)
            return

        const arrow = row.querySelector('.challenges__arrow')
        const status = row.querySelector('.challenges__status')
        const statusValue = row.dataset.status

        this.track(gsap.to(row, { autoAlpha: 1, duration: 0.1 }))
        if(arrow)
            this.track(gsap.fromTo(arrow, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))
        if(status)
        {
            if(statusValue === 'gelöst')
                this.track(gsap.fromTo(status, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)', delay: 0.3 }))
            else
                this.track(gsap.fromTo(status, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, delay: 0.3, clearProps: 'opacity,visibility' }))
        }
    }

    _auditEnter(root)
    {
        const summary = root.querySelector('.audit__summary')
        const segs = root.querySelectorAll('.audit__seg')
        const nums = root.querySelectorAll('.audit__stats .num')

        if(summary)
            this.track(gsap.fromTo(summary, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, clearProps: 'opacity,visibility' }))
        if(segs.length)
            this.track(gsap.fromTo(segs, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.9, stagger: 0.12, ease: 'power2.out' }))
        nums.forEach((el, i) => this._count(el, { duration: 1.0, delay: 0.15 * i }))
    }
}
