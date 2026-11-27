import { Game } from '../Game.js'
import { Player } from '../Player.js'
import { CameraDirector } from './CameraDirector.js'
import { CharacterDirector } from './CharacterDirector.js'
import { SlideRenderer } from './SlideRenderer.js'
import { MotionDirector } from './MotionDirector.js'
import { StationStands } from './StationStands.js'
import { STATION_ORDER, STATIONS, getStation, getRoute, getRouteDistance } from './PresentationStations.js'
import { APPENDIX_SLIDES, getSlide, getDefinedSlideIds } from './slides.js'
import { clamp } from '../utilities/maths.js'

/**
 * Single source of truth for presentation state. Four mutually exclusive modes:
 * - EXPLORATION (default/primary): free walk-around, station stands glow
 *   and prompt when approached, nothing opens on its own.
 * - STATION (primary): one station's own slides, opened by walking up to
 *   its stand and pressing E.
 * - TOUR (optional): automated 3D walk + camera choreography across every
 *   station in sequence, toggled with T.
 * - LINEAR (fallback): instant 2D slide-to-slide mode across all 17 slides
 *   without 3D station walks, toggled with L (or booted directly via ?linear=1).
 *
 * Optional appendix slide (A1) sits strictly outside the main timed deck
 * and can be toggled on demand during Q&A via key A.
 */
export class PresentationController
{
    static MODE_EXPLORATION = 'exploration'
    static MODE_STATION = 'station'
    static MODE_TOUR = 'tour'
    static MODE_LINEAR = 'linear'

    constructor()
    {
        this.game = Game.getInstance()

        this.cameraDirector = new CameraDirector()
        this.characterDirector = new CharacterDirector()
        this.slideRenderer = new SlideRenderer()
        this.motionDirector = new MotionDirector(this.slideRenderer)
        this.stationStands = new StationStands()
        this.slideRenderer.onStationSelect = (stationId) => this.jumpToStation(stationId)
        this.slideRenderer.onClose = () => this.handleCloseButton()

        this.mode = null
        this.currentSlideId = null
        this.currentStationId = null
        this.isTransitioning = false
        this.pendingTarget = null
        this.started = false

        // Optional appendix overlay state (outside main slide flow)
        this.appendixActive = false
        this.appendixIndex = 0

        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
        this.motionDirector.setReducedMotion(this.reducedMotion.matches)
        this.reducedMotion.addEventListener?.('change', (event) => this.motionDirector.setReducedMotion(event.matches))

        this.setInputs()

        this.game.reveal.events.on('complete', () => this.start())
    }

    get currentSlide()
    {
        return getSlide(this.currentSlideId)
    }

    setInputs()
    {
        this.game.inputs.addActions([
            { name: 'stationInteract',        categories: [ 'wandering' ],                             keys: [ 'Keyboard.KeyE', 'Gamepad.cross' ] },
            { name: 'presentationNext',       categories: [ 'tour', 'station', 'linear' ],             keys: [ 'Keyboard.ArrowRight', 'Keyboard.Space' ] },
            { name: 'presentationPrev',       categories: [ 'tour', 'station', 'linear' ],             keys: [ 'Keyboard.ArrowLeft' ] },
            { name: 'presentationFirst',      categories: [ 'tour', 'linear' ],                        keys: [ 'Keyboard.Home' ] },
            { name: 'presentationLast',       categories: [ 'tour', 'linear' ],                        keys: [ 'Keyboard.End' ] },
            { name: 'presentationFullscreen', categories: [ 'tour', 'station', 'linear', 'wandering' ], keys: [ 'Keyboard.KeyF' ] },
            { name: 'presentationEscape',     categories: [ 'tour', 'station', 'linear', 'wandering' ], keys: [ 'Keyboard.Escape' ] },
            { name: 'presentationModeToggle', categories: [ 'tour', 'wandering', 'linear' ],           keys: [ 'Keyboard.KeyT' ] },
            { name: 'presentationLinear',     categories: [ 'tour', 'station', 'linear', 'wandering' ], keys: [ 'Keyboard.KeyL' ] },
            { name: 'presentationAppendix',   categories: [ 'tour', 'station', 'linear' ],             keys: [ 'Keyboard.KeyA' ] },
            { name: 'presentationStation1',   categories: [ 'tour', 'linear' ],                        keys: [ 'Keyboard.Digit1' ] },
            { name: 'presentationStation2',   categories: [ 'tour', 'linear' ],                        keys: [ 'Keyboard.Digit2' ] },
            { name: 'presentationStation3',   categories: [ 'tour', 'linear' ],                        keys: [ 'Keyboard.Digit3' ] },
            { name: 'presentationStation4',   categories: [ 'tour', 'linear' ],                        keys: [ 'Keyboard.Digit4' ] },
        ])

        const on = (name, handler) =>
        {
            this.game.inputs.events.on(name, (action) =>
            {
                if(action.active)
                    handler()
            })
        }

        on('stationInteract', () => this.handleInteract())
        on('presentationNext', () => this.handleNext())
        on('presentationPrev', () => this.handlePrev())
        on('presentationFirst', () => this.goToSlide(getDefinedSlideIds()[0]))
        on('presentationLast', () => this.goToSlide(getDefinedSlideIds().at(-1)))
        on('presentationFullscreen', () => this.toggleFullscreen())
        on('presentationEscape', () => this.handleEscape())
        on('presentationModeToggle', () => this.toggleMode())
        on('presentationLinear', () => this.toggleLinearMode())
        on('presentationAppendix', () => this.toggleAppendix())
        on('presentationStation1', () => this.jumpToStation(STATION_ORDER[0]))
        on('presentationStation2', () => this.jumpToStation(STATION_ORDER[1]))
        on('presentationStation3', () => this.jumpToStation(STATION_ORDER[2]))
        on('presentationStation4', () => this.jumpToStation(STATION_ORDER[3]))

        document.addEventListener('fullscreenchange', () =>
        {
            this.isFullscreen = !!document.fullscreenElement
        })
    }

    start()
    {
        if(this.started)
            return
        this.started = true

        this.currentStationId = STATION_ORDER[0]
        this.currentSlideId = getDefinedSlideIds()[0]

        this.mode = PresentationController.MODE_EXPLORATION
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('wandering')
        this.stationStands.setActive(true)
    }

    handleCloseButton()
    {
        if(this.appendixActive)
        {
            this.closeAppendix()
            return
        }

        if(this.mode === PresentationController.MODE_STATION)
            this.closeStation()
        else if(this.mode === PresentationController.MODE_LINEAR)
            this.exitLinearMode()
    }

    handleInteract()
    {
        if(this.mode !== PresentationController.MODE_EXPLORATION)
            return

        const stationId = this.stationStands.nearestStationId
        if(!stationId)
            return

        this.openStation(stationId)
    }

    handleNext()
    {
        if(this.appendixActive)
        {
            this.stepAppendix(1)
            return
        }

        if(this.mode === PresentationController.MODE_STATION)
            this.stationNext()
        else
            this.next()
    }

    handlePrev()
    {
        if(this.appendixActive)
        {
            this.stepAppendix(-1)
            return
        }

        if(this.mode === PresentationController.MODE_STATION)
            this.stationPrev()
        else
            this.prev()
    }

    jumpToStation(stationId)
    {
        if(this.appendixActive)
            this.appendixActive = false

        const station = getStation(stationId)
        if(!station)
            return

        this.goToSlide(station.slideRange[0])
    }

    getStationSlideIds(stationId)
    {
        const [ from, to ] = getStation(stationId).slideRange
        return getDefinedSlideIds().filter((id) => id >= from && id <= to)
    }

    sectionMeta(slideId)
    {
        const station = getStation(getSlide(slideId).stationId)
        const definedIds = this.getStationSlideIds(station.id)
        const indexInSection = definedIds.indexOf(slideId) + 1

        return {
            indexInSection,
            totalInSection: definedIds.length,
            isFinal: slideId === definedIds.at(-1),
        }
    }

    // --- Optional Appendix overlay (outside main presentation flow) ---

    toggleAppendix()
    {
        if(!APPENDIX_SLIDES.length)
            return

        if(this.appendixActive)
            this.closeAppendix()
        else
            this.openAppendix(0)
    }

    openAppendix(index = 0)
    {
        if(this.isTransitioning)
            this.skipTransition()

        this.appendixActive = true
        this.appendixIndex = clamp(index, 0, APPENDIX_SLIDES.length - 1)
        const slide = APPENDIX_SLIDES[this.appendixIndex]

        this.motionDirector.transition(slide, {
            backward: false,
            render: () =>
            {
                this.slideRenderer.fillStage(slide, {
                    indexInSection: this.appendixIndex + 1,
                    totalInSection: APPENDIX_SLIDES.length,
                    isFinal: false,
                })
                this.slideRenderer.setActiveStation(null)
            }
        })
    }

    stepAppendix(delta)
    {
        const nextIndex = this.appendixIndex + delta
        if(nextIndex < 0 || nextIndex >= APPENDIX_SLIDES.length)
            return

        this.appendixIndex = nextIndex
        const slide = APPENDIX_SLIDES[this.appendixIndex]

        this.motionDirector.transition(slide, {
            backward: delta < 0,
            render: () =>
            {
                this.slideRenderer.fillStage(slide, {
                    indexInSection: this.appendixIndex + 1,
                    totalInSection: APPENDIX_SLIDES.length,
                    isFinal: false,
                })
                this.slideRenderer.setActiveStation(null)
            }
        })
    }

    closeAppendix()
    {
        if(!this.appendixActive)
            return

        this.appendixActive = false
        const slide = this.currentSlide
        if(!slide)
            return

        const meta = this.mode === PresentationController.MODE_STATION
            ? this.sectionMeta(slide.id)
            : null

        this.motionDirector.transition(slide, {
            backward: true,
            render: () =>
            {
                this.slideRenderer.fillStage(slide, meta)
                this.slideRenderer.setActiveStation(
                    this.mode === PresentationController.MODE_STATION ? null : slide.stationId
                )
            }
        })
    }

    // --- Station mode ---

    openStation(stationId)
    {
        if(this.mode !== PresentationController.MODE_EXPLORATION)
            return

        const slideId = this.getStationSlideIds(stationId)[0]
        if(!slideId)
            return

        const station = getStation(stationId)

        this.mode = PresentationController.MODE_STATION
        this.currentStationId = stationId
        this.currentSlideId = slideId
        this.appendixActive = false

        this.stationStands.setActive(false)
        this.game.player.state = Player.STATE_LOCKED
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('station')

        this.cameraDirector.enter(station.camera)
        this.slideRenderer.setFlow('station')
        this.slideRenderer.fillStage(getSlide(slideId), this.sectionMeta(slideId))
        this.slideRenderer.setActiveStation(null)
        this.slideRenderer.setVisible(true)
        this.motionDirector.enter(this.currentSlide)
    }

    closeStation()
    {
        if(this.mode !== PresentationController.MODE_STATION)
            return

        this.appendixActive = false
        this.motionDirector.exit(this.currentSlide, 'close').then(() => this.slideRenderer.setVisible(false))
        this.cameraDirector.exit()

        this.game.player.state = Player.STATE_DEFAULT
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('wandering')

        this.mode = PresentationController.MODE_EXPLORATION
        this.stationStands.setActive(true)
    }

    stationNext()
    {
        if(this.motionDirector.next(this.currentSlide))
            return

        const ids = this.getStationSlideIds(this.currentStationId)
        const index = ids.indexOf(this.currentSlideId)
        if(index === -1 || index === ids.length - 1)
            return

        const fromSlide = this.currentSlide
        this.currentSlideId = ids[index + 1]
        const toSlide = this.currentSlide

        this.motionDirector.transition(toSlide, {
            fromSlide,
            backward: false,
            render: () =>
            {
                this.slideRenderer.fillStage(toSlide, this.sectionMeta(this.currentSlideId))
                this.slideRenderer.setActiveStation(null)
            }
        })
    }

    stationPrev()
    {
        if(this.motionDirector.prev(this.currentSlide))
            return

        const ids = this.getStationSlideIds(this.currentStationId)
        const index = ids.indexOf(this.currentSlideId)
        if(index <= 0)
            return

        const fromSlide = this.currentSlide
        this.currentSlideId = ids[index - 1]
        const toSlide = this.currentSlide

        this.motionDirector.transition(toSlide, {
            fromSlide,
            backward: true,
            render: () =>
            {
                this.slideRenderer.fillStage(toSlide, this.sectionMeta(this.currentSlideId))
                this.slideRenderer.setActiveStation(null)
            }
        })
    }

    // --- Tour & Linear fallback modes ---

    next()
    {
        if(this.mode !== PresentationController.MODE_TOUR && this.mode !== PresentationController.MODE_LINEAR)
            return

        if(this.isTransitioning)
        {
            this.skipTransition()
            return
        }

        if(this.motionDirector.next(this.currentSlide))
            return

        const ids = getDefinedSlideIds()
        const index = ids.indexOf(this.currentSlideId)
        if(index === -1 || index === ids.length - 1)
            return

        this.goToSlide(ids[index + 1])
    }

    prev()
    {
        if(this.mode !== PresentationController.MODE_TOUR && this.mode !== PresentationController.MODE_LINEAR)
            return

        if(this.isTransitioning)
        {
            this.skipTransition()
            return
        }

        if(this.motionDirector.prev(this.currentSlide))
            return

        const ids = getDefinedSlideIds()
        const index = ids.indexOf(this.currentSlideId)
        if(index <= 0)
            return

        this.goToSlide(ids[index - 1])
    }

    goToSlide(slideId)
    {
        if(this.mode !== PresentationController.MODE_TOUR && this.mode !== PresentationController.MODE_LINEAR)
            return

        if(this.isTransitioning)
        {
            this.skipTransition()
            return
        }

        if(slideId === this.currentSlideId && !this.appendixActive)
            return

        const slide = getSlide(slideId)
        if(!slide)
            return

        this.appendixActive = false
        const targetStation = getStation(slide.stationId)

        if(this.mode === PresentationController.MODE_LINEAR || targetStation.id === this.currentStationId)
        {
            const fromSlide = this.currentSlide
            this.currentStationId = targetStation.id
            this.currentSlideId = slideId

            this.motionDirector.transition(slide, {
                fromSlide,
                backward: fromSlide ? slideId < fromSlide.id : false,
                render: () =>
                {
                    this.slideRenderer.fillStage(slide)
                    this.slideRenderer.setActiveStation(slide.stationId)
                }
            })
            return
        }

        this.performStationTransition(targetStation, slideId)
    }

    async performStationTransition(targetStation, targetSlideId)
    {
        this.isTransitioning = true
        this.pendingTarget = { station: targetStation, slideId: targetSlideId }

        await this.motionDirector.exit(this.currentSlide, 'cross')

        const route = getRoute(this.currentStationId, targetStation.id)
        const distance = getRouteDistance(route)
        const duration = clamp(distance / this.game.physicalCharacter.walkSpeed, 2.5, 20)

        await Promise.all([
            this.characterDirector.walkRoute(route, targetStation.facingYRotation),
            this.cameraDirector.flyTo(targetStation.camera, { duration }),
        ])

        this.currentStationId = targetStation.id
        this.currentSlideId = targetSlideId
        this.isTransitioning = false
        this.pendingTarget = null

        const slide = getSlide(targetSlideId)
        this.slideRenderer.setFlow('tour')
        this.slideRenderer.fillStage(slide)
        this.slideRenderer.setActiveStation(targetStation.id)
        this.motionDirector.enter(slide, { restoreBackdrop: true })
    }

    skipTransition()
    {
        if(!this.pendingTarget)
            return

        const { station } = this.pendingTarget
        this.characterDirector.skip(station.standPoint, station.facingYRotation)
        this.cameraDirector.skip(station.camera)
    }

    toggleMode()
    {
        if(this.mode === PresentationController.MODE_STATION)
            return

        if(this.isTransitioning)
        {
            this.skipTransition()
            return
        }

        if(this.mode === PresentationController.MODE_TOUR)
            this.exitTour()
        else if(this.mode === PresentationController.MODE_EXPLORATION)
            this.enterTour()
        else if(this.mode === PresentationController.MODE_LINEAR)
        {
            this.exitLinearMode()
            this.enterTour()
        }
    }

    toggleLinearMode()
    {
        if(this.isTransitioning)
            this.skipTransition()

        if(this.mode === PresentationController.MODE_LINEAR)
            this.exitLinearMode()
        else
            this.enterLinearMode()
    }

    enterLinearMode()
    {
        this.appendixActive = false
        this.stationStands.setActive(false)
        this.mode = PresentationController.MODE_LINEAR

        this.game.player.state = Player.STATE_LOCKED
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('linear')

        if(!this.currentSlideId)
            this.currentSlideId = getDefinedSlideIds()[0]
        this.currentStationId = this.currentSlide.stationId

        this.slideRenderer.setFlow('tour')
        this.slideRenderer.setVisible(true)
        this.slideRenderer.fillStage(this.currentSlide)
        this.slideRenderer.setActiveStation(this.currentSlide.stationId)
        this.motionDirector.enter(this.currentSlide)
    }

    exitLinearMode()
    {
        this.appendixActive = false
        this.mode = PresentationController.MODE_EXPLORATION

        this.motionDirector.kill()
        this.slideRenderer.setVisible(false)
        this.cameraDirector.exit()

        this.game.player.state = Player.STATE_DEFAULT
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('wandering')
        this.stationStands.setActive(true)
    }

    enterTour()
    {
        const station = getStation(this.currentStationId)

        this.appendixActive = false
        this.stationStands.setActive(false)

        this.game.overlay.show(() =>
        {
            this.characterDirector.skip(station.standPoint, station.facingYRotation)
            this.cameraDirector.enter(station.camera)

            this.mode = PresentationController.MODE_TOUR
            this.game.player.state = Player.STATE_LOCKED
            this.game.inputs.filters.clear()
            this.game.inputs.filters.add('tour')

            this.slideRenderer.setFlow('tour')
            this.slideRenderer.setVisible(true)
            this.slideRenderer.fillStage(this.currentSlide)
            this.slideRenderer.setActiveStation(this.currentSlide.stationId)
            this.motionDirector.enter(this.currentSlide)

            this.game.overlay.hide()
        })
    }

    exitTour()
    {
        this.appendixActive = false
        this.mode = PresentationController.MODE_EXPLORATION

        this.motionDirector.kill()
        this.slideRenderer.setVisible(false)
        this.cameraDirector.exit()

        this.game.player.state = Player.STATE_DEFAULT
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('wandering')
        this.stationStands.setActive(true)
    }

    toggleFullscreen()
    {
        if(document.fullscreenElement)
            document.exitFullscreen()
        else
            document.documentElement.requestFullscreen().catch(() => {})
    }

    handleEscape()
    {
        if(this.appendixActive)
        {
            this.closeAppendix()
            return
        }

        if(this.mode === PresentationController.MODE_STATION)
        {
            this.closeStation()
            return
        }

        if(this.mode === PresentationController.MODE_LINEAR)
        {
            this.exitLinearMode()
            return
        }

        if(document.fullscreenElement)
            document.exitFullscreen()
    }
}
