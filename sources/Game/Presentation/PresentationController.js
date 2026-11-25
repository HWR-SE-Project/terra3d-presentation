import { Game } from '../Game.js'
import { Player } from '../Player.js'
import { CameraDirector } from './CameraDirector.js'
import { CharacterDirector } from './CharacterDirector.js'
import { SlideRenderer } from './SlideRenderer.js'
import { STATIONS, getStation, getRoute } from './PresentationStations.js'
import { getSlide, getDefinedSlideIds } from './slides.js'

/**
 * Single source of truth for presentation state: current slide/station,
 * presentation vs. exploration mode, and transition locking. Everything
 * else (camera motion, character motion, slide markup) is delegated to a
 * dedicated module and only ever driven from here.
 */
export class PresentationController
{
    static MODE_PRESENTATION = 'presentation'
    static MODE_EXPLORATION = 'exploration'

    constructor()
    {
        this.game = Game.getInstance()

        this.cameraDirector = new CameraDirector()
        this.characterDirector = new CharacterDirector()
        this.slideRenderer = new SlideRenderer()
        this.slideRenderer.onStationSelect = (stationId) => this.goToSlide(STATIONS[stationId].slideRange[0])

        this.mode = null
        this.currentSlideId = null
        this.currentStationId = null
        this.isTransitioning = false
        this.pendingTarget = null
        this.started = false

        this.setInputs()

        this.game.reveal.events.on('complete', () => this.start())
    }

    setInputs()
    {
        this.game.inputs.addActions([
            { name: 'presentationNext',       categories: [ 'presentation' ],              keys: [ 'Keyboard.ArrowRight', 'Keyboard.Space' ] },
            { name: 'presentationPrev',       categories: [ 'presentation' ],              keys: [ 'Keyboard.ArrowLeft' ] },
            { name: 'presentationFirst',      categories: [ 'presentation' ],              keys: [ 'Keyboard.Home' ] },
            { name: 'presentationLast',       categories: [ 'presentation' ],              keys: [ 'Keyboard.End' ] },
            { name: 'presentationFullscreen', categories: [ 'presentation', 'wandering' ], keys: [ 'Keyboard.KeyF' ] },
            { name: 'presentationEscape',     categories: [ 'presentation', 'wandering' ], keys: [ 'Keyboard.Escape' ] },
            { name: 'presentationModeToggle', categories: [ 'presentation', 'wandering' ], keys: [ 'Keyboard.KeyM' ] },
        ])

        const on = (name, handler) =>
        {
            this.game.inputs.events.on(name, (action) =>
            {
                if(action.active)
                    handler()
            })
        }

        on('presentationNext', () => this.next())
        on('presentationPrev', () => this.prev())
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
     * Called once the boot intro (Reveal.js) finishes - presentation mode
     * is the primary/default mode for this app, so it takes over right as
     * the world becomes interactive.
     */
    start()
    {
        if(this.started)
            return
        this.started = true

        const firstSlideId = getDefinedSlideIds()[0]
        const slide = getSlide(firstSlideId)
        const station = getStation(slide.stationId)

        this.mode = PresentationController.MODE_PRESENTATION
        this.currentSlideId = firstSlideId
        this.currentStationId = station.id

        this.game.player.state = Player.STATE_LOCKED
        this.characterDirector.skip(station.standPoint, station.facingYRotation)
        this.cameraDirector.enter(station.camera)

        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('presentation')

        this.slideRenderer.showInitial(slide)
    }

    next()
    {
        if(this.mode !== PresentationController.MODE_PRESENTATION)
            return

        if(this.isTransitioning)
        {
            this.skipTransition()
            return
        }

        const ids = getDefinedSlideIds()
        const index = ids.indexOf(this.currentSlideId)
        if(index === -1 || index === ids.length - 1)
            return

        this.goToSlide(ids[index + 1])
    }

    prev()
    {
        if(this.mode !== PresentationController.MODE_PRESENTATION)
            return

        if(this.isTransitioning)
        {
            this.skipTransition()
            return
        }

        const ids = getDefinedSlideIds()
        const index = ids.indexOf(this.currentSlideId)
        if(index <= 0)
            return

        this.goToSlide(ids[index - 1])
    }

    /**
     * Direct navigation to any defined slide id (used by Home/End, the
     * station nav dots, and next()/prev()). Same-station moves only swap
     * slide content; cross-station moves trigger a full cinematic
     * transition.
     */
    goToSlide(slideId)
    {
        if(this.mode !== PresentationController.MODE_PRESENTATION)
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
            this.currentSlideId = slideId
            this.slideRenderer.swapSlide(slide)
            return
        }

        this.performStationTransition(targetStation, slideId)
    }

    async performStationTransition(targetStation, targetSlideId)
    {
        this.isTransitioning = true
        this.pendingTarget = { station: targetStation, slideId: targetSlideId }

        await this.slideRenderer.hideForTransition()

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

        this.slideRenderer.revealAfterTransition(getSlide(targetSlideId))
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
        if(this.isTransitioning)
        {
            this.skipTransition()
            return
        }

        if(this.mode === PresentationController.MODE_PRESENTATION)
            this.enterExploration()
        else if(this.mode === PresentationController.MODE_EXPLORATION)
            this.enterPresentation()
    }

    enterExploration()
    {
        this.mode = PresentationController.MODE_EXPLORATION

        this.slideRenderer.setVisible(false)
        this.cameraDirector.exit()

        this.game.player.state = Player.STATE_DEFAULT
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('wandering')
    }

    /**
     * Restore a valid slide/station/camera state when coming back from
     * exploration. The character may have wandered far from its station,
     * so the snap-back is masked behind the game's own respawn-style
     * overlay transition (Overlay.js), exactly like Player.respawn().
     */
    enterPresentation()
    {
        const station = getStation(this.currentStationId)

        this.game.overlay.show(() =>
        {
            this.characterDirector.skip(station.standPoint, station.facingYRotation)
            this.cameraDirector.enter(station.camera)

            this.mode = PresentationController.MODE_PRESENTATION
            this.game.player.state = Player.STATE_LOCKED
            this.game.inputs.filters.clear()
            this.game.inputs.filters.add('presentation')

            this.slideRenderer.setVisible(true)
            this.slideRenderer.revealAfterTransition(getSlide(this.currentSlideId))

            this.game.overlay.hide()
        })
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
        if(document.fullscreenElement)
            document.exitFullscreen()
    }
}
