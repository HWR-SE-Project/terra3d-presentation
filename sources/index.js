import './threejs-override.js'
import { Game } from './Game/Game.js'
import { SlideRenderer, renderSlideMarkup } from './Game/Presentation/SlideRenderer.js'
import { MotionDirector } from './Game/Presentation/MotionDirector.js'
import { STATION_ORDER, STATIONS } from './Game/Presentation/PresentationStations.js'
import { SLIDES, APPENDIX_SLIDES, getSlide, getDefinedSlideIds } from './Game/Presentation/slides.js'

const params = new URLSearchParams(window.location.search)

/**
 * Static 16:9 print / PDF export mode (?print=1).
 * Renders all 17 main slides + optional Q&A appendix slide in their fully revealed
 * state with zero 3D/WebGL dependencies — ready for headless Chrome PDF export.
 */
function bootPrintDeck()
{
    document.documentElement.classList.add('is-print-deck')
    document.body.innerHTML = ''

    const container = document.createElement('main')
    container.className = 'print-deck'

    const mainIds = getDefinedSlideIds()
    const totalMain = mainIds.length
    const allSlides = [
        ...mainIds.map((id) => SLIDES[id]),
        ...APPENDIX_SLIDES,
    ]

    for(const slide of allSlides)
    {
        const page = document.createElement('section')
        page.className = 'presentation print-slide is-visible'
        page.dataset.layout = slide.layout
        page.dataset.theme = slide.theme ?? 'light'
        page.dataset.flow = 'print'

        const numLabel = typeof slide.id === 'number'
            ? String(slide.id)
            : `Anhang ${slide.id}`

        page.innerHTML = `
            <div class="presentation__scrim"></div>
            <div class="presentation__brand" aria-hidden="true"><span>TERRA</span><em>GUESSR</em></div>
            <div class="presentation__stage">
                <div class="presentation__stage-inner">
                    <div class="presentation__content">${renderSlideMarkup(slide, { staticEarth: true })}</div>
                </div>
            </div>
            <div class="presentation__footer-chrome">
                <span class="presentation__slide-num">${numLabel}</span>
            </div>
        `

        container.appendChild(page)
    }

    document.body.appendChild(container)
}

/**
 * Pure 2D linear fallback presentation mode (?linear=1).
 * Guarantees instant, reliable delivery of all 17 slides + optional appendix
 * even if WebGPU/WebGL or 3D navigation is unavailable on the presentation machine.
 */
function bootLinearDeck()
{
    document.body.innerHTML = ''

    const renderer = new SlideRenderer({ standalone: true })
    const motion = new MotionDirector(renderer)
    const ids = getDefinedSlideIds()

    const startParam = Number(params.get('slide'))
    let currentId = ids.includes(startParam) ? startParam : ids[0]
    let appendixActive = false
    let appendixIndex = 0

    const showSlide = (slide, backward = false, initial = false) =>
    {
        const meta = appendixActive
            ? { indexInSection: appendixIndex + 1, totalInSection: APPENDIX_SLIDES.length, isFinal: false }
            : null

        if(initial)
        {
            renderer.setFlow('tour')
            renderer.fillStage(slide, meta)
            renderer.setActiveStation(appendixActive ? null : slide.stationId)
            renderer.setVisible(true)
            motion.enter(slide)
            return
        }

        motion.transition(slide, {
            backward,
            render: () =>
            {
                renderer.fillStage(slide, meta)
                renderer.setActiveStation(appendixActive ? null : slide.stationId)
            }
        })
    }

    renderer.onStationSelect = (stationId) =>
    {
        appendixActive = false
        const targetId = STATIONS[stationId].slideRange[0]
        const backward = targetId < currentId
        currentId = targetId
        showSlide(getSlide(currentId), backward)
    }

    window.addEventListener('keydown', (event) =>
    {
        if(event.code === 'ArrowRight' || event.code === 'Space')
        {
            event.preventDefault()
            if(appendixActive)
            {
                if(appendixIndex < APPENDIX_SLIDES.length - 1)
                {
                    appendixIndex++
                    showSlide(APPENDIX_SLIDES[appendixIndex], false)
                }
                return
            }
            const idx = ids.indexOf(currentId)
            if(idx < ids.length - 1)
            {
                currentId = ids[idx + 1]
                showSlide(getSlide(currentId), false)
            }
        }
        else if(event.code === 'ArrowLeft')
        {
            event.preventDefault()
            if(appendixActive)
            {
                if(appendixIndex > 0)
                {
                    appendixIndex--
                    showSlide(APPENDIX_SLIDES[appendixIndex], true)
                }
                return
            }
            const idx = ids.indexOf(currentId)
            if(idx > 0)
            {
                currentId = ids[idx - 1]
                showSlide(getSlide(currentId), true)
            }
        }
        else if(event.code === 'Home')
        {
            appendixActive = false
            currentId = ids[0]
            showSlide(getSlide(currentId), true)
        }
        else if(event.code === 'End')
        {
            appendixActive = false
            currentId = ids.at(-1)
            showSlide(getSlide(currentId), false)
        }
        else if(event.code === 'KeyA')
        {
            appendixActive = !appendixActive
            appendixIndex = 0
            showSlide(appendixActive ? APPENDIX_SLIDES[0] : getSlide(currentId), !appendixActive)
        }
        else if(event.code === 'Escape' && appendixActive)
        {
            appendixActive = false
            showSlide(getSlide(currentId), true)
        }
        else if(event.code === 'KeyF')
        {
            if(document.fullscreenElement)
                document.exitFullscreen()
            else
                document.documentElement.requestFullscreen().catch(() => {})
        }
        else if([ 'Digit1', 'Digit2', 'Digit3', 'Digit4' ].includes(event.code))
        {
            const stationId = STATION_ORDER[Number(event.code.slice(-1)) - 1]
            if(stationId)
                renderer.onStationSelect(stationId)
        }
    })

    showSlide(getSlide(currentId), false, true)
    window.linearDeck = {
        goTo: (id) =>
        {
            appendixActive = false
            if(getSlide(id))
            {
                currentId = id
                showSlide(getSlide(id), false, true)
            }
        },
        openAppendix: (i = 0) =>
        {
            appendixActive = true
            appendixIndex = i
            showSlide(APPENDIX_SLIDES[i], false, true)
        },
    }
}

if(params.get('print') === '1')
{
    bootPrintDeck()
}
else if(params.get('linear') === '1')
{
    bootLinearDeck()
}
else if(import.meta.env.VITE_GAME_PUBLIC)
{
    window.game = new Game()
}
else
{
    new Game()
}
