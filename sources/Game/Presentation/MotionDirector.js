import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(DrawSVGPlugin, SplitText)

/**
 * Restrained, executive GSAP motion director.
 *
 * Keeps animations subtle, controlled, and purposeful:
 *   - Gentle opacity + short vertical reveals (never bouncy or exaggerated).
 *   - Progressive DrawSVG for sequence diagram arrows.
 *   - Smooth tabular number counting & flat bar scaling for quantitative data.
 *   - Clean cross-fade transitions across dark, light, and split slides.
 *   - Full `prefers-reduced-motion` support.
 */

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

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
        this._exitResolve = null
        this._pendingRender = null
        this._reduced = typeof window !== 'undefined' && window.matchMedia(REDUCED_QUERY).matches

        this._currentSlide = null
        this.stepIndex = 0
    }

    setReducedMotion(reduced)
    {
        this._reduced = !!reduced
        this.renderer.titleGlobe?.setReducedMotion(this._reduced)
        if(this._reduced)
            this.kill()
    }

    get currentSlide()
    {
        return this._currentSlide
    }

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
            this.track(gsap.fromTo(this._backdrop(), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power1.out', clearProps: 'opacity,visibility' }))
            this.track(gsap.fromTo(this.elements.stage, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power1.out', clearProps: 'opacity,visibility' }))
        }

        this.stepIndex = 0
        this._prepare(slide)
        this._entrance(slide)
    }

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
                ? { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }
                : { autoAlpha: 0, duration: 0.24, ease: 'power1.in' }

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

    transition(toSlide, { backward = false, render })
    {
        this.kill()
        this._currentSlide = toSlide
        const spec = this._spec(toSlide)

        if(this._reduced)
        {
            render()
            this.stepIndex = spec.steps.length
            return
        }

        const doRender = () =>
        {
            this._pendingRender = null
            render()
            this.stepIndex = backward ? spec.steps.length : 0
            if(!backward)
                this._prepare(toSlide)

            this.track(gsap.fromTo(this.elements.stage,
                { autoAlpha: 0, x: backward ? -16 : 16 },
                { autoAlpha: 1, x: 0, duration: 0.32, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))

            if(backward)
                this._simpleEntrance()
            else
                this._entrance(toSlide)
        }

        this._pendingRender = doRender
        this.track(gsap.to(this.elements.stage, {
            autoAlpha: 0,
            x: backward ? 16 : -16,
            duration: 0.18,
            ease: 'power1.in',
            onComplete: doRender
        }))
    }

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

    kill()
    {
        if(this._pendingRender)
        {
            const flush = this._pendingRender
            this._pendingRender = null
            flush()
        }

        for(const tween of this._tweens)
            tween?.kill()
        this._tweens.length = 0

        for(const split of this._splitTexts)
            split?.revert()
        this._splitTexts.length = 0

        if(this._exitResolve)
        {
            const resolve = this._exitResolve
            this._exitResolve = null
            resolve()
        }

        if(this.elements.stage)
            this._set(this.elements.stage, { clearProps: 'transform,opacity,visibility' })
        if(this.elements.scrim)
            this._set(this._backdrop(), { clearProps: 'opacity,visibility' })
    }

    // -- internals ------------------------------------------------------------

    _backdrop()
    {
        return [ this.elements.scrim, this.elements.brand ].filter(Boolean)
    }

    _resolve(selector)
    {
        if(!selector)
            return []
        if(typeof selector === 'function')
            return selector(this.content, this.root)
        const nodes = this.content?.querySelectorAll?.(selector)
        return nodes && nodes.length ? Array.from(nodes) : Array.from(this.root.querySelectorAll(selector))
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

    _entrance(slide, { delay = 0 } = {})
    {
        const headerEls = this.content.querySelectorAll('.slide-head__title, .slide-head__subtitle')
        if(headerEls.length)
        {
            this.track(gsap.fromTo(headerEls,
                { autoAlpha: 0, y: 10 },
                { autoAlpha: 1, y: 0, duration: this._dur(0.42), delay, stagger: 0.06, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))
        }

        const spec = this._spec(slide)
        for(const directive of spec.enter)
            this._applyDirective(directive, 'show', delay)
    }

    _simpleEntrance()
    {
        this.track(gsap.fromTo(this.content,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: this._dur(0.28), ease: 'power1.out', clearProps: 'opacity,visibility' }))
    }

    _prepare(slide)
    {
        const spec = this._spec(slide)
        for(const step of spec.steps)
            for(const directive of step)
                this._applyDirective(directive, 'hide')
    }

    _applyDirective(directive, mode, delay = 0)
    {
        const targets = this._resolve(directive.q)

        if(directive.t === 'count')
        {
            if(targets.length)
            {
                if(mode === 'hide')
                    targets.forEach((el) => { el.textContent = '0' })
                else
                    targets.forEach((el) => this._count(el, directive.o, delay))
            }
            return
        }

        if(directive.t === 'custom')
        {
            if(mode === 'show')
                directive.run(this.content, this)
            else if(targets.length)
                this._set(targets, mode === 'hide' ? { autoAlpha: 0 } : { autoAlpha: 1, clearProps: 'transform,opacity,visibility' })
            return
        }

        if(!targets.length)
            return

        if(mode === 'hide')
            this._set(targets, this._hiddenVars(directive))
        else
            this._show(targets, directive, delay)
    }

    _hiddenVars(directive)
    {
        switch(directive.t)
        {
            case 'reveal': return { autoAlpha: 0, y: directive.o?.y ?? 12 }
            case 'draw': return { drawSVG: '0% 0%' }
            case 'fade': return { autoAlpha: 0 }
            default: return { autoAlpha: 0, y: 12 }
        }
    }

    _show(targets, directive, delay)
    {
        const o = directive.o ?? {}
        const dur = this._dur(o.duration ?? 0.44)

        if(directive.t === 'reveal')
        {
            this.track(gsap.to(targets, {
                autoAlpha: 1,
                y: 0,
                duration: dur,
                delay: delay + (o.delay ?? 0),
                stagger: o.stagger ?? 0.06,
                ease: o.ease ?? 'power2.out',
                clearProps: 'transform,opacity,visibility'
            }))
        }
        else if(directive.t === 'draw')
        {
            this.track(gsap.fromTo(targets,
                { drawSVG: '0% 0%' },
                {
                    drawSVG: '0% 100%',
                    duration: this._dur(o.duration ?? 0.6),
                    delay: delay + (o.delay ?? 0),
                    stagger: o.stagger ?? 0.08,
                    ease: 'power1.inOut'
                }))
        }
        else if(directive.t === 'fade')
        {
            this.track(gsap.to(targets, {
                autoAlpha: 1,
                duration: dur,
                delay: delay + (o.delay ?? 0),
                stagger: o.stagger ?? 0.05,
                ease: 'power1.out',
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
            duration: this._dur(o?.duration ?? 0.78),
            delay: delay + (o?.delay ?? 0),
            ease: 'power2.out',
            onUpdate: () => { el.textContent = Math.round(proxy.v) },
            onComplete: () => { el.textContent = to }
        }))
    }

    // -- per-layout motion specs ----------------------------------------------

    _spec(slide)
    {
        switch(slide.layout)
        {
            case 'title':
                return { enter: [ { t: 'custom', run: (root) => this._titleEnter(root) } ], steps: [] }

            case 'divider':
            case 'divider-light':
                return { enter: [ { t: 'custom', run: (root) => this._dividerEnter(root) } ], steps: [] }

            case 'agenda':
                return {
                    enter: [
                        { t: 'reveal', q: '.agenda__col', o: { y: 12, stagger: 0.08, delay: 0.12 } },
                        { t: 'fade', q: '.anchor-band', o: { delay: 0.36 } },
                    ],
                    steps: [],
                }

            case 'split-idea':
                return {
                    enter: [
                        { t: 'reveal', q: '.split-layout__dark > *', o: { y: 10, stagger: 0.06 } },
                        { t: 'reveal', q: '.num-row', o: { y: 12, stagger: 0.08, delay: 0.14 } },
                    ],
                    steps: [],
                }

            case 'goals':
                return {
                    enter: [
                        { t: 'reveal', q: '.goals__row, .goals__kpi', o: { y: 12, stagger: 0.08, delay: 0.12 } },
                        { t: 'count', q: '.goals__kpi .num', o: { delay: 0.26 } },
                        { t: 'fade', q: '.anchor-band', o: { delay: 0.36 } },
                    ],
                    steps: [],
                }

            case 'team':
                return {
                    enter: [
                        { t: 'reveal', q: '.team__col', o: { y: 12, stagger: 0.08, delay: 0.12 } },
                        { t: 'fade', q: '.anchor-band', o: { delay: 0.38 } },
                    ],
                    steps: [],
                }

            case 'versus':
                return {
                    enter: [
                        { t: 'reveal', q: '.versus__col', o: { y: 12, stagger: 0.1, delay: 0.12 } },
                    ],
                    steps: [],
                }

            case 'product-mosaic':
                return {
                    enter: [
                        { t: 'reveal', q: '.mosaic__main, .mosaic__sub', o: { y: 12, stagger: 0.09, delay: 0.12 } },
                    ],
                    steps: [],
                }

            case 'showcase':
                return {
                    enter: [
                        { t: 'reveal', q: '.showcase__primary', o: { y: 12, delay: 0.1 } },
                        { t: 'reveal', q: '.showcase__point', o: { y: 12, stagger: 0.08, delay: 0.2 } },
                    ],
                    steps: [],
                }

            case 'architecture':
                return {
                    enter: [
                        { t: 'reveal', q: '.arch__tier, .arch__block', o: { y: 10, stagger: 0.07, delay: 0.12 } },
                        { t: 'fade', q: '.slide-footnote', o: { delay: 0.36 } },
                    ],
                    steps: [],
                }

            case 'sequence':
                return {
                    enter: [ { t: 'custom', run: (root) => this._sequenceEnter(root) } ],
                    steps: [],
                }

            case 'challenges':
                return {
                    enter: [
                        { t: 'reveal', q: '.split-layout__dark > *', o: { y: 10, stagger: 0.06 } },
                        { t: 'reveal', q: '.challenge-row', o: { y: 12, stagger: 0.09, delay: 0.14 } },
                    ],
                    steps: [],
                }

            case 'hours':
                return {
                    enter: [
                        { t: 'reveal', q: '.hours__table tbody tr, .hours__table tfoot tr, .hours__risk', o: { y: 8, stagger: 0.05, delay: 0.12 } },
                        { t: 'fade', q: '.anchor-band', o: { delay: 0.36 } },
                    ],
                    steps: [],
                }

            case 'learnings':
                return {
                    enter: [
                        { t: 'reveal', q: '.learnings__col', o: { y: 12, stagger: 0.1, delay: 0.12 } },
                    ],
                    steps: [],
                }

            case 'quality':
                return {
                    enter: [ { t: 'custom', run: (root) => this._qualityEnter(root) } ],
                    steps: [],
                }

            case 'statement':
                return {
                    enter: [
                        { t: 'reveal', q: '.statement__lines span', o: { y: 14, stagger: 0.09, delay: 0.08 } },
                        { t: 'reveal', q: '.statement__group', o: { y: 12, stagger: 0.1, delay: 0.24 } },
                    ],
                    steps: [],
                }

            case 'demo':
                return {
                    enter: [
                        { t: 'reveal', q: '.demo__step', o: { y: 10, stagger: 0.06, delay: 0.12 } },
                        { t: 'reveal', q: '.demo__prompt > *', o: { y: 10, stagger: 0.07, delay: 0.24 } },
                    ],
                    steps: [],
                }

            case 'qa':
                return {
                    enter: [
                        { t: 'reveal', q: '.qa__left > *, .qa__right > *', o: { y: 12, stagger: 0.07, delay: 0.08 } },
                    ],
                    steps: [],
                }

            case 'appendix-audit':
                return {
                    enter: [
                        { t: 'reveal', q: '.audit__table', o: { y: 10, stagger: 0.08, delay: 0.1 } },
                        { t: 'fade', q: '.slide-footnote', o: { delay: 0.3 } },
                    ],
                    steps: [],
                }

            default:
                return { enter: [], steps: [] }
        }
    }

    // -- bespoke controlled animation helpers ---------------------------------

    _titleEnter(root)
    {
        const tl = gsap.timeline()
        this.track(tl)

        const academic = root.querySelector('.hero__academic')
        const title = root.querySelector('.hero__name')
        const tagline = root.querySelector('.hero__tagline')
        const rule = root.querySelector('.hero__rule')
        const byline = root.querySelector('.hero__byline')
        const planetStage = root.querySelector('.hero__planet-stage')

        if(academic)
            tl.fromTo(academic, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.38, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.04)
        if(title)
            tl.fromTo(title, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.1)
        if(tagline)
            tl.fromTo(tagline, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.2)
        if(rule)
            tl.fromTo(rule, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.42, ease: 'power2.out', clearProps: 'transform' }, 0.3)
        if(byline)
            tl.fromTo(byline, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.38, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.36)
        if(planetStage)
            tl.fromTo(planetStage, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.14)
    }

    _dividerEnter(root)
    {
        const items = root.querySelectorAll('.divider__kicker, .divider__title, .divider__subtitle')
        if(items.length)
            this.track(gsap.fromTo(items, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))
    }

    _sequenceEnter(root)
    {
        const msgs = root.querySelectorAll('.seq-msg')
        msgs.forEach((g, idx) =>
        {
            const delay = 0.08 + idx * 0.08
            const strokes = g.querySelectorAll('line, path')
            const text = g.querySelectorAll('text')
            if(strokes.length)
                this.track(gsap.fromTo(strokes, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.38, delay, ease: 'power2.out' }))
            if(text.length)
                this.track(gsap.fromTo(text, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.26, delay: delay + 0.12, ease: 'power1.out', clearProps: 'opacity,visibility' }))
        })

        const facts = root.querySelectorAll('.sequence__fact')
        if(facts.length)
            this.track(gsap.fromTo(facts, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.36, delay: 0.48, stagger: 0.08, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))
    }

    _qualityEnter(root)
    {
        const cols = root.querySelectorAll('.quality__col')
        const nums = root.querySelectorAll('.quality .num')
        const segs = root.querySelectorAll('.audit__seg, .qbar__fill')

        if(cols.length)
            this.track(gsap.fromTo(cols, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.44, delay: 0.1, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }))
        nums.forEach((el, i) => this._count(el, { duration: 0.72, delay: 0.16 + i * 0.07 }))
        if(segs.length)
            this.track(gsap.fromTo(segs, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.65, delay: 0.24, stagger: 0.06, ease: 'power2.out' }))
    }
}
