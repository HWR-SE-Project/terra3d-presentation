import { Game } from '../Game.js'
import { Player } from '../Player.js'
import { CameraDirector } from './CameraDirector.js'
import { CharacterDirector } from './CharacterDirector.js'
import { SlideRenderer } from './SlideRenderer.js'
import { MotionDirector } from './MotionDirector.js'
import { StationStands } from './StationStands.js'
import { STATION_ORDER, STATIONS, getStation, getRoute } from './PresentationStations.js'
import { getSlide, getDefinedSlideIds } from './slides.js'

/**
 * Single source of truth for presentation state. Three mutually exclusive
 * modes:
 * - EXPLORATION (default/primary): free walk-around, station stands glow
 *   and prompt when approached, nothing opens on its own.
 * - STATION (primary): one station's own slides, opened by walking up to
 *   its stand and pressing the interact key. Camera cuts to that station's
 *   cinematic framing; the character itself is never moved - only manual
 *   input is suspended - so closing it is a simple reverse, not a restore.
 * - TOUR (secondary/optional): the original Phase 4 automated walk+camera
 *   choreography across every station in sequence, toggled with M.
 *
 * Camera motion, character motion and slide markup are all still delegated
 * to a dedicated module and only ever driven from here.
 */
export class PresentationController
{
    static MODE_EXPLORATION = 'exploration'
    static MODE_STATION = 'station'
    static MODE_TOUR = 'tour'

    constructor()
    {
        this.game = Game.getInstance()

        this.cameraDirector = new CameraDirector()
        this.characterDirector = new CharacterDirector()
        this.slideRenderer = new SlideRenderer()
        this.motionDirector = new MotionDirector(this.slideRenderer)
        this.stationStands = new StationStands()
        this.slideRenderer.onStationSelect = (stationId) => this.goToSlide(STATIONS[stationId].slideRange[0])
        this.slideRenderer.onClose = () => this.closeStation()

        this.mode = null
        this.currentSlideId = null
        this.currentStationId = null
        this.isTransitioning = false
        this.pendingTarget = null
        this.started = false

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
            { name: 'stationInteract',        categories: [ 'wandering' ],                        keys: [ 'Keyboard.KeyE', 'Gamepad.cross' ] },
            { name: 'presentationNext',       categories: [ 'tour', 'station' ],                  keys: [ 'Keyboard.ArrowRight', 'Keyboard.Space' ] },
            { name: 'presentationPrev',       categories: [ 'tour', 'station' ],                  keys: [ 'Keyboard.ArrowLeft' ] },
            { name: 'presentationFirst',      categories: [ 'tour' ],                              keys: [ 'Keyboard.Home' ] },
            { name: 'presentationLast',       categories: [ 'tour' ],                              keys: [ 'Keyboard.End' ] },
            { name: 'presentationFullscreen', categories: [ 'tour', 'station', 'wandering' ],     keys: [ 'Keyboard.KeyF' ] },
            { name: 'presentationEscape',     categories: [ 'tour', 'station', 'wandering' ],     keys: [ 'Keyboard.Escape' ] },
            { name: 'presentationModeToggle', categories: [ 'tour', 'wandering' ],                 keys: [ 'Keyboard.KeyM' ] },
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
        on('presentationNext', () => this.mode === PresentationController.MODE_STATION ? this.stationNext() : this.next())
        on('presentationPrev', () => this.mode === PresentationController.MODE_STATION ? this.stationPrev() : this.prev())
        on('presentationFirst', () => this.goToSlide(getDefinedSlideIds()[0]))
        on('presentationLast', () => this.goToSlide(getDefinedSlideIds().at(-1)))
        on('presentationFullscreen', () => this.toggleFullscreen())
        on('presentationEscape', () => this.handleEscape())
        on('presentationModeToggle', () => this.toggleMode())

        document.addEventListener('fullscreenchange', () =>
        {
            this.isFullscreen = !!document.fullscreenElement
        })
    }

    /**
     * Called once the boot intro (Reveal.js) finishes. Free exploration is
     * the default/primary experience - no slides open, no camera cut, no
     * character movement. currentStationId/currentSlideId just seed a sane
     * starting point for the optional tour mode if the player invokes it
     * with M before ever opening a station themselves.
     */
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

    handleInteract()
    {
        if(this.mode !== PresentationController.MODE_EXPLORATION)
            return

        const stationId = this.stationStands.nearestStationId
        if(!stationId)
            return

        this.openStation(stationId)
    }

    getStationSlideIds(stationId)
    {
        const [ from, to ] = getStation(stationId).slideRange
        return getDefinedSlideIds().filter((id) => id >= from && id <= to)
    }

    sectionMeta(slideId)
    {
        const station = getStation(getSlide(slideId).stationId)
        const [ from, to ] = station.slideRange
        const definedIds = this.getStationSlideIds(station.id)

        return {
            indexInSection: slideId - from + 1,
            totalInSection: to - from + 1,
            isFinal: slideId === definedIds.at(-1),
        }
    }

    /**
     * Open one station's own slides from exploration. The character stays
     * exactly where it was walked to - only the camera cuts to the
     * station's cinematic framing and manual movement is suspended - so
     * closing it later is a plain reverse, never a snap-back/restore.
     */
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

    // --- Optional secondary mode: the original Phase 4 automated tour ---

    next()
    {
        if(this.mode !== PresentationController.MODE_TOUR)
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
        if(this.mode !== PresentationController.MODE_TOUR)
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

    /**
     * Direct navigation to any defined slide id (used by Home/End and the
     * station nav dots, only meaningful in tour mode). Same-station moves
     * only swap slide content; cross-station moves trigger a full cinematic
     * transition.
     */
    goToSlide(slideId)
    {
        if(this.mode !== PresentationController.MODE_TOUR)
            return

        if(this.isTransitioning)
        {
            this.skipTransition()
            return
        }

        if(slideId === this.currentSlideId)
            return

        const slide = getSlide(slideId)
        if(!slide)
            return

        const targetStation = getStation(slide.stationId)

        if(targetStation.id === this.currentStationId)
        {
            const fromSlide = this.currentSlide
            this.currentSlideId = slideId

            this.motionDirector.transition(slide, {
                fromSlide,
                backward: slideId < fromSlide.id,
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
        const duration = Math.max(2.2, Math.min(4.5, route.length * 2))

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

    /**
     * Force the in-flight station transition to its destination instantly -
     * used when the presenter navigates again while already transitioning,
     * so input never queues up or gets lost.
     */
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
    }

    enterTour()
    {
        const station = getStation(this.currentStationId)

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
        if(this.mode === PresentationController.MODE_STATION)
        {
            this.closeStation()
            return
        }

        if(document.fullscreenElement)
            document.exitFullscreen()
    }
}
