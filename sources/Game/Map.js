import { Game } from './Game.js'
import { clamp } from './utilities/maths.js'

/**
 * Top-down world map, restored from the original implementation (removed in
 * Phase 1) and re-scoped to the current compact world: the four presentation
 * stations instead of the original thirteen portfolio locations.
 *
 * The map modal originally lived behind the Modals/Modals.js shell, which was
 * also removed, so this class now owns its own `.js-modals` overlay and drives
 * the same `is-displayed` / `is-visible` state transitions directly.
 */
export class Map
{
    constructor()
    {
        this.game = Game.getInstance()

        this.initiated = false
        this.isOpen = false

        this.overlay = document.querySelector('.js-modals')
        this.modal = this.overlay.querySelector('.modal[data-name="map"]')
        this.element = this.modal.querySelector('.js-map-container')

        this.setTrigger()
        this.setClose()
        this.setInputs()
    }

    open()
    {
        if(this.isOpen)
            return

        this.isOpen = true

        if(!this.initiated)
            this.init()

        this.texture.update()

        this.overlay.classList.add('is-displayed')
        this.modal.classList.add('is-displayed')

        requestAnimationFrame(() =>
        {
            requestAnimationFrame(() =>
            {
                this.overlay.classList.add('is-visible')
            })
        })

        // Freeze gameplay while the map is up (same behaviour as the original
        // modal filter) - movement/action keys are gated behind 'wandering'.
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('modal')
    }

    close()
    {
        if(!this.isOpen)
            return

        this.isOpen = false

        this.overlay.classList.remove('is-visible')

        // Give control back to free exploration once the fade starts.
        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('wandering')

        // Unmount after the 0.3s opacity transition (mirrors the CSS duration).
        setTimeout(() =>
        {
            this.modal.classList.remove('is-displayed')
            this.overlay.classList.remove('is-displayed')
        }, 300)
    }

    toggle()
    {
        if(this.isOpen)
            this.close()
        else
            this.open()
    }

    init()
    {
        this.initiated = true

        this.setLocations()
        this.setPlayer()
        this.setTexture()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 14)
    }

    /**
     * The four presentation stations. Pins are placed at each station's
     * respawn point (the same spot clicking a pin teleports you to), keeping
     * the original "pin = fast-travel" interaction intact.
     */
    setLocations()
    {
        this.locations = {}
        this.locations.items = [
            { name: 'Konzept', respawnName: 'konzept' },
            { name: 'Gameplay', respawnName: 'gameplay' },
            { name: 'Engineering', respawnName: 'engineering' },
            { name: 'Qualität', respawnName: 'qualitaet' },
        ]

        for(const item of this.locations.items)
        {
            const respawn = this.game.respawns.getByName(item.respawnName)
            const mapPosition = this.worldToMap(respawn.position)

            // HTML
            const html = /* html */`
                <div class="pin"></div>
                <div class="name-container">
                    <div class="name">${item.name}</div>
                </div>
            `

            const element = document.createElement('div')
            element.classList.add('location')
            element.innerHTML = html
            element.style.left = `${mapPosition.x * 100}%`
            element.style.top = `${mapPosition.y * 100}%`
            element.style.zIndex = Math.round(mapPosition.y * 1000)

            this.element.append(element)

            element.addEventListener('click', () =>
            {
                this.game.player.respawn(item.respawnName, () =>
                {
                    this.game.view.focusPoint.isTracking = true
                })
                this.close()
            })
        }
    }

    setPlayer()
    {
        this.player = {}
        this.player.element = this.element.querySelector('.js-player')
        this.player.roundedPosition = { x: null, y: null }
        this.player.roundedRotation = null
    }

    setTexture()
    {
        this.texture = {}
        this.texture.element = this.element.querySelector('.js-texture')
        this.texture.previousUrl = null

        this.texture.element.addEventListener('load', () =>
        {
            this.texture.element.classList.add('is-visible')
        })

        this.texture.update = () =>
        {
            const url = this.game.dayCycles.intervalEvents.get('night').inInterval ? 'ui/map/map-night.webp' : 'ui/map/map-day.webp'

            if(url !== this.texture.previousUrl)
            {
                this.texture.element.classList.remove('is-visible')
                this.texture.previousUrl = url
                this.texture.element.src = url
            }
        }
    }

    setTrigger()
    {
        const element = this.game.domElement.querySelector('.js-map-trigger')

        element.addEventListener('click', () =>
        {
            this.open()
        })

        element.addEventListener('keydown', (event) =>
        {
            event.preventDefault()
        })
    }

    setClose()
    {
        this.modal.querySelector('.js-close').addEventListener('click', () =>
        {
            this.close()
        })

        this.overlay.addEventListener('click', (event) =>
        {
            if(event.target === this.overlay)
                this.close()
        })
    }

    setInputs()
    {
        // The original map was toggled with M. The presentation tour mode has
        // since claimed M, so the map owns M again here while the tour moved
        // to T (see PresentationController.js) - both features stay fully
        // reachable without colliding.
        this.game.inputs.addActions([
            { name: 'map', categories: [ 'modal', 'wandering' ], keys: [ 'Keyboard.KeyM' ] },
        ])

        this.game.inputs.events.on('map', (action) =>
        {
            if(action.active)
                this.toggle()
        })
    }

    worldToMap(coordinates)
    {
        let x = coordinates.x
        let y = typeof coordinates.z !== 'undefined' ? coordinates.z : coordinates.y

        x /= this.game.terrain.size
        y /= this.game.terrain.size

        x += 0.5
        y += 0.5

        x = clamp(x, 0, 1)
        y = clamp(y, 0, 1)

        return { x, y }
    }

    update()
    {
        if(!this.isOpen)
            return

        // Position (feet, XZ) - rounded to a tenth of a world unit (sub-pixel
        // on the rendered map) rather than a whole unit, so walking slowly
        // doesn't produce visible steps while still skipping redundant
        // layout writes when the player is standing still.
        const position = this.game.player.position2
        const playerRoundedX = Math.round(position.x * 10) / 10
        const playerRoundedY = Math.round(position.y * 10) / 10

        if(playerRoundedX !== this.player.roundedPosition.x || playerRoundedY !== this.player.roundedPosition.y)
        {
            this.player.roundedPosition.x = playerRoundedX
            this.player.roundedPosition.y = playerRoundedY

            const playerCoordinates = this.worldToMap(this.player.roundedPosition)
            const x = Math.round(playerCoordinates.x * 1000) / 10
            const y = Math.round(playerCoordinates.y * 1000) / 10

            this.player.element.style.left = `${x}%`
            this.player.element.style.top = `${y}%`
        }

        // Orientation - updated independently so turning in place still moves
        // the marker. The character faces (sin, cos) in world XZ (three.js
        // +Z forward) while the map's Y axis is +Z, so the marker sprite
        // (drawn facing "up") needs the half-turn offset.
        const rotation = Math.round(this.game.player.rotationY * 1000) / 1000

        if(rotation !== this.player.roundedRotation)
        {
            this.player.roundedRotation = rotation
            this.player.element.style.transform = `rotate(${Math.PI - this.game.player.rotationY}rad)`
        }
    }
}
