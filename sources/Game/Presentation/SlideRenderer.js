import gsap from 'gsap'
import { Game } from '../Game.js'
import { STATION_ORDER, STATIONS } from './PresentationStations.js'

// Layouts whose content needs more than the narrow bottom-left text column
// (tables, image galleries, multi-column grids) get a wider/taller stage -
// see presentation.styl's `[data-density="wide"]` rule. Everything else
// keeps the original Phase 4 narrow text-column composition.
const WIDE_LAYOUTS = new Set([
    'idea', 'media', 'challenge', 'stack', 'flow', 'learnings',
    'table-hours', 'table-challenges', 'audit', 'testing', 'demo',
])

function list(items)
{
    return `<ul class="content-list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
}

function note(text, modifier = '')
{
    return `<p class="content-note ${modifier}">${text}</p>`
}

function goalCard({ number, title, text })
{
    return `<div class="content-goal"><span class="content-goal__number">${number}</span><h3>${title}</h3><p>${text}</p></div>`
}

/**
 * Builds the inner markup of `.presentation__content` for one slide. Pure
 * function of slide data -> HTML string; the eyebrow/title/subtitle header
 * above it is filled generically by `fillStage()` regardless of layout.
 */
function renderContent(slide)
{
    switch(slide.layout)
    {
        case 'title':
            return `<p class="content-title__byline">${slide.byline}</p>`

        case 'agenda':
            return `<ol class="content-agenda">${slide.items.map((item) => `
                <li><span class="content-agenda__number">${item.number}</span><span class="content-agenda__label">${item.label}</span><span class="content-agenda__detail">${item.detail}</span></li>
            `).join('')}</ol>`

        case 'divider':
            return list(slide.body ?? [])

        case 'idea':
            return `
                <div class="content-goals">${slide.goals.map(goalCard).join('')}</div>
                ${note(slide.audience)}
                ${note(slide.scopeNote, 'content-note--muted')}
            `

        case 'team':
            return `<div class="content-team">${slide.speakers.map((speaker) => `
                <div class="content-speaker" style="--accent:${speaker.accent}">
                    <span class="content-speaker__initials">${speaker.initials}</span>
                    <div>
                        <h3>${speaker.name}</h3>
                        <p class="content-speaker__role">${speaker.role}</p>
                        <ul class="content-speaker__packages">${speaker.workPackages.map((pkg) => `<li>${pkg}</li>`).join('')}</ul>
                    </div>
                </div>
            `).join('')}</div>`

        case 'media':
            return `
                ${list(slide.bullets.map((bullet) => `<strong>${bullet.title}.</strong> ${bullet.text}`))}
                <div class="content-gallery">${slide.screenshots.map((shot) => `
                    <figure><img src="${shot.src}" alt="${shot.alt}" loading="lazy"><figcaption>${shot.caption ?? ''}</figcaption></figure>
                `).join('')}</div>
                ${slide.footnote ? note(slide.footnote, 'content-note--muted') : ''}
            `

        case 'challenge':
            return `
                <div class="content-challenge">
                    <figure class="content-challenge__figure"><img src="${slide.screenshot.src}" alt="${slide.screenshot.alt}" loading="lazy"><figcaption>${slide.screenshot.caption ?? ''}</figcaption></figure>
                    ${list(slide.instructions)}
                </div>
            `

        case 'stack':
        {
            const { frontend, backend, data, external, quality } = slide.product
            return `
                <div class="content-stack__grid">${[ frontend, backend, data ].map((col) => `
                    <div class="content-stack__card">
                        <h3>${col.title}</h3>
                        <p class="content-stack__subtitle">${col.subtitle}</p>
                        ${col.note ? note(col.note, 'content-note--muted') : ''}
                        <ul class="content-pills">${col.stack.map((item) => `<li>${item}</li>`).join('')}</ul>
                    </div>
                `).join('')}</div>
                ${note(`<strong>Extern:</strong> ${external}`)}
                <ul class="content-pills content-pills--quality">${quality.map((item) => `<li>${item}</li>`).join('')}</ul>
                ${note(slide.environmentNote, 'content-note--callout')}
            `
        }

        case 'flow':
            return `
                <ol class="content-steps">${slide.steps.map((step) => `
                    <li class="content-step" data-actor="${step.actor}">
                        <span class="content-step__number">${step.number}</span>
                        <span class="content-step__actor">${step.actor}</span>
                        <h3>${step.title}</h3>
                        <p>${step.text}</p>
                    </li>
                `).join('')}</ol>
                ${note(slide.multiplayerNote)}
                ${note(slide.caveat, 'content-note--callout')}
            `

        case 'table-hours':
            return `
                <div class="content-table-wrap"><table class="content-table">
                    <thead><tr><th>Arbeitspaket</th><th>Plan (h)</th><th>Ist (h)</th></tr></thead>
                    <tbody>${slide.items.map((item) => `
                        <tr><td>${item.label}</td><td>${item.planHours ?? '—'}</td><td>${item.actualHours ?? '—'}</td></tr>
                    `).join('')}</tbody>
                </table></div>
                ${note(slide.note, 'content-note--callout')}
            `

        case 'table-challenges':
            return `
                <div class="content-table-wrap"><table class="content-table content-table--challenges">
                    <thead><tr><th>Herausforderung</th><th>Lösung</th><th>Status</th></tr></thead>
                    <tbody>${slide.items.map((item) => `
                        <tr>
                            <td>${item.challenge}</td>
                            <td>${item.solution}${item.source ? `<br><span class="content-source">${item.source}</span>` : ''}</td>
                            <td><span class="content-badge" data-status="${item.status}">${item.status}</span></td>
                        </tr>
                    `).join('')}</tbody>
                </table></div>
            `

        case 'learnings':
            return `<div class="content-goals">${slide.items.map(goalCard).join('')}</div>`

        case 'audit':
            return `
                <div class="content-audit__summary">
                    <div class="content-stat"><span class="content-stat__value">${slide.summary.totalPass}/${slide.summary.total}</span><span class="content-stat__label">bestanden</span></div>
                    <div class="content-stat"><span class="content-stat__value">${slide.summary.totalPartial}/${slide.summary.total}</span><span class="content-stat__label">teilweise</span></div>
                    <div class="content-stat"><span class="content-stat__value">${slide.summary.totalFail}/${slide.summary.total}</span><span class="content-stat__label">nicht bestanden</span></div>
                    <div class="content-stat"><span class="content-stat__value">${slide.summary.mandatoryPass}/${slide.summary.mandatoryTotal}</span><span class="content-stat__label">Basis-Anforderungen</span></div>
                </div>
                <div class="content-table-wrap"><table class="content-table content-table--audit">
                    <thead><tr><th>Nr.</th><th>Anforderung</th><th>Status</th></tr></thead>
                    <tbody>${slide.rows.map((row) => `
                        <tr class="${row.critical ? 'is-critical' : ''}">
                            <td>${row.nr}</td><td>${row.text}</td>
                            <td><span class="content-badge" data-status="${row.status}">${row.status}</span></td>
                        </tr>
                    `).join('')}</tbody>
                </table></div>
                ${note(slide.closing, 'content-note--muted')}
            `

        case 'testing':
            return `
                <div class="content-tiers">${slide.tiers.map((tier) => `
                    <div class="content-tier">
                        <h3>${tier.label}</h3>
                        <p class="content-tier__tool">${tier.tool}</p>
                        <p class="content-tier__result">${tier.result}</p>
                        ${note(tier.note, 'content-note--muted')}
                    </div>
                `).join('')}</div>
                ${list(slide.ciSteps)}
                ${slide.caveats.map((caveat) => note(caveat, 'content-note--callout')).join('')}
            `

        case 'demo':
            return `
                <ol class="content-demo__steps">${slide.steps.map((step) => `<li><span>${step.number}</span>${step.label}</li>`).join('')}</ol>
                ${note(slide.fallbackText, 'content-note--callout')}
                ${note(slide.returnNote)}
            `

        case 'conclusion':
            return `
                <div class="content-conclusion__lines">${slide.lines.map((line) => `<span>${line}</span>`).join('')}</div>
                <p class="content-conclusion__subline">${slide.subline}</p>
                <div class="content-conclusion__columns">
                    <div><h3>Erreicht</h3>${list(slide.achievements)}</div>
                    <div><h3>Offen</h3>${list(slide.limitations)}</div>
                </div>
                <div class="content-conclusion__closing">${slide.closing.map((line) => `<span>${line}</span>`).join('')}</div>
            `

        default:
            return list(slide.body ?? [])
    }
}

/**
 * Lightweight HTML/CSS/SVG presentation overlay. Pure rendering: it only
 * ever receives already-resolved slide objects (see slides.js) and station
 * ids to highlight - it has no notion of "next"/"previous" or of the 3D
 * world, so it stays reusable if the slide deck grows from 4 to 21 without
 * any change here.
 *
 * The 3D canvas keeps rendering behind this element at all times - it is a
 * plain fixed-position DOM layer, never a fullscreen opaque takeover.
 */
export class SlideRenderer
{
    constructor()
    {
        this.game = Game.getInstance()
        this.onStationSelect = null
        this.onClose = null

        this.build()
    }

    build()
    {
        this.root = document.createElement('div')
        this.root.className = 'presentation'

        this.root.innerHTML = `
            <div class="presentation__scrim"></div>
            <nav class="presentation__stations"></nav>
            <button type="button" class="presentation__close" aria-label="Präsentation schließen">&times;</button>
            <div class="presentation__stage">
                <div class="presentation__stage-inner">
                    <div class="presentation__eyebrow"></div>
                    <h1 class="presentation__title"></h1>
                    <p class="presentation__subtitle"></p>
                    <div class="presentation__content"></div>
                    <div class="presentation__section-nav">
                        <span class="presentation__section-count"></span>
                        <button type="button" class="presentation__finish">Zur Erkundung zurückkehren</button>
                    </div>
                </div>
            </div>
            <div class="presentation__hints">
                <span><i>&#8594;</i> / <i>Space</i> weiter</span>
                <span><i>&#8592;</i> zurück</span>
                <span class="presentation__hint--tour"><i>Home</i>/<i>End</i> Anfang/Ende</span>
                <span class="presentation__hint--tour"><i>M</i> erkunden</span>
                <span class="presentation__hint--station"><i>Esc</i> erkunden</span>
                <span><i>F</i> Vollbild</span>
            </div>
        `

        this.elements = {
            scrim: this.root.querySelector('.presentation__scrim'),
            stations: this.root.querySelector('.presentation__stations'),
            close: this.root.querySelector('.presentation__close'),
            // The GSAP fade/slide animation target. Deliberately the INNER
            // element, not `.presentation__stage` itself: GSAP's autoAlpha/y
            // tween takes ownership of the `transform` property as an
            // inline style once it first runs, which would otherwise freeze
            // in whatever CSS `transform` the *previous* layout had (e.g.
            // the title/conclusion layouts' `translate(-50%, -50%)`
            // centering hack) and silently misplace every later layout that
            // doesn't expect one. Keeping per-layout positioning on the
            // outer `.presentation__stage` (never touched by GSAP) and the
            // fade animation on this separate inner element keeps the two
            // concerns from fighting over the same `transform`.
            stage: this.root.querySelector('.presentation__stage-inner'),
            eyebrow: this.root.querySelector('.presentation__eyebrow'),
            title: this.root.querySelector('.presentation__title'),
            subtitle: this.root.querySelector('.presentation__subtitle'),
            content: this.root.querySelector('.presentation__content'),
            sectionCount: this.root.querySelector('.presentation__section-count'),
            finish: this.root.querySelector('.presentation__finish'),
        }

        this.elements.close.addEventListener('click', () => this.onClose?.())
        this.elements.finish.addEventListener('click', () => this.onClose?.())

        for(const id of STATION_ORDER)
        {
            const station = STATIONS[id]

            const dot = document.createElement('button')
            dot.type = 'button'
            dot.className = 'presentation__station-dot'
            dot.dataset.station = id
            dot.style.setProperty('--accent', station.accent)
            dot.innerHTML = `<span class="presentation__station-index">${String(station.index + 1).padStart(2, '0')}</span><span class="presentation__station-title">${station.title}</span>`

            dot.addEventListener('click', () =>
            {
                this.onStationSelect?.(id)
            })

            this.elements.stations.appendChild(dot)
        }

        document.body.appendChild(this.root)
    }

    setActiveStation(stationId)
    {
        for(const dot of this.elements.stations.children)
            dot.classList.toggle('is-active', dot.dataset.station === stationId)
    }

    fillStage(slide, sectionMeta = null)
    {
        const station = STATIONS[slide.stationId]

        this.root.dataset.layout = slide.layout
        this.root.dataset.density = WIDE_LAYOUTS.has(slide.layout) ? 'wide' : 'narrow'
        this.elements.stage.style.setProperty('--accent', station.accent)
        this.elements.eyebrow.textContent = slide.eyebrow ?? ''
        this.elements.title.textContent = slide.title ?? ''
        this.elements.subtitle.textContent = slide.subtitle ?? ''
        this.elements.content.innerHTML = renderContent(slide)

        if(sectionMeta)
        {
            this.elements.sectionCount.textContent = `Folie ${sectionMeta.indexInSection} von ${sectionMeta.totalInSection}`
            this.elements.finish.classList.toggle('is-visible', sectionMeta.isFinal)
        }
    }

    /**
     * First reveal of the whole automated tour (fade the entire overlay in).
     */
    showInitial(slide)
    {
        this.root.dataset.flow = 'tour'
        this.fillStage(slide)
        this.setActiveStation(slide.stationId)
        this.root.classList.add('is-visible')
        gsap.fromTo(this.elements.stage, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power2.out' })
    }

    /**
     * Same-station slide change: cross-fade content only, camera and
     * character stay put.
     */
    swapSlide(slide)
    {
        const stage = this.elements.stage
        gsap.to(stage, {
            autoAlpha: 0, y: -10, duration: 0.25, ease: 'power1.in',
            onComplete: () =>
            {
                this.fillStage(slide)
                gsap.fromTo(stage, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' })
            }
        })
    }

    /**
     * Hide the stage content ahead of a station-to-station transition.
     * Resolves once fully hidden.
     */
    hideForTransition()
    {
        this.setActiveStation(null)

        return new Promise((resolve) =>
        {
            gsap.to(this.elements.stage, {
                autoAlpha: 0, y: -18, duration: 0.4, ease: 'power1.in',
                onComplete: resolve
            })
        })
    }

    /**
     * Reveal the stage content for the destination station once the
     * character/camera transition has completed.
     */
    revealAfterTransition(slide)
    {
        this.root.dataset.flow = 'tour'
        this.fillStage(slide)
        this.setActiveStation(slide.stationId)
        gsap.fromTo(this.elements.stage, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    }

    /**
     * Open a single station's own slides (Phase 4.1 walk-up interaction).
     * No station nav dots, no tour hints - a close button and a "slide X
     * of Y" readout scoped to this station instead.
     */
    showStation(slide, sectionMeta)
    {
        this.root.dataset.flow = 'station'
        this.fillStage(slide, sectionMeta)
        this.setActiveStation(null)
        this.root.classList.add('is-visible')
        gsap.fromTo(this.elements.stage, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    }

    /**
     * Cross-fade to another slide within the same station's own section.
     */
    swapStationSlide(slide, sectionMeta)
    {
        const stage = this.elements.stage
        gsap.to(stage, {
            autoAlpha: 0, y: -10, duration: 0.25, ease: 'power1.in',
            onComplete: () =>
            {
                this.fillStage(slide, sectionMeta)
                gsap.fromTo(stage, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' })
            }
        })
    }

    /**
     * Fade the stage out, then hide the whole overlay - used when closing
     * a station back to exploration.
     */
    hideStation()
    {
        gsap.to(this.elements.stage, {
            autoAlpha: 0, y: -10, duration: 0.3, ease: 'power1.in',
            onComplete: () => this.setVisible(false)
        })
    }

    setVisible(visible)
    {
        this.root.classList.toggle('is-visible', visible)
    }

    get isVisible()
    {
        return this.root.classList.contains('is-visible')
    }
}
