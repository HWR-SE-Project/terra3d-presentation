import gsap from 'gsap'
import { Game } from '../Game.js'
import { STATION_ORDER, STATIONS } from './PresentationStations.js'

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

        this.build()
    }

    build()
    {
        this.root = document.createElement('div')
        this.root.className = 'presentation'

        this.root.innerHTML = `
            <div class="presentation__scrim"></div>
            <nav class="presentation__stations"></nav>
            <div class="presentation__stage">
                <div class="presentation__eyebrow"></div>
                <h1 class="presentation__title"></h1>
                <p class="presentation__subtitle"></p>
                <ul class="presentation__body"></ul>
            </div>
            <div class="presentation__hints">
                <span><i>&#8594;</i> / <i>Space</i> weiter</span>
                <span><i>&#8592;</i> zurück</span>
                <span><i>Home</i>/<i>End</i> Anfang/Ende</span>
                <span><i>M</i> erkunden</span>
                <span><i>F</i> Vollbild</span>
            </div>
        `

        this.elements = {
            scrim: this.root.querySelector('.presentation__scrim'),
            stations: this.root.querySelector('.presentation__stations'),
            stage: this.root.querySelector('.presentation__stage'),
            eyebrow: this.root.querySelector('.presentation__eyebrow'),
            title: this.root.querySelector('.presentation__title'),
            subtitle: this.root.querySelector('.presentation__subtitle'),
            body: this.root.querySelector('.presentation__body'),
        }

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

    fillStage(slide)
    {
        const station = STATIONS[slide.stationId]

        this.root.dataset.layout = slide.layout
        this.elements.stage.style.setProperty('--accent', station.accent)
        this.elements.eyebrow.textContent = slide.eyebrow ?? ''
        this.elements.title.textContent = slide.title ?? ''
        this.elements.subtitle.textContent = slide.subtitle ?? ''
        this.elements.body.innerHTML = (slide.body ?? []).map((line) => `<li>${line}</li>`).join('')
    }

    /**
     * First reveal of the whole presentation (fade the entire overlay in).
     */
    showInitial(slide)
    {
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
        this.fillStage(slide)
        this.setActiveStation(slide.stationId)
        gsap.fromTo(this.elements.stage, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' })
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
