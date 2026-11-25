import { Game } from '../Game.js'
import { STATIONS, INTERACTION_RADIUS, findNearestStation } from './PresentationStations.js'

/**
 * Proximity detection + visual feedback for the four walk-up presentation
 * stands (Phase 4.1). Pure "is the player near a stand" bookkeeping -
 * PresentationController owns the actual mode switch and reads
 * `nearestStationId` when the player presses the interact key; this class
 * only ever decides *which* stand (if any) is currently eligible and drives
 * its highlight (via ZoneIdentity) and the on-screen interaction prompt.
 */
export class StationStands
{
    constructor()
    {
        this.game = Game.getInstance()

        this.active = false
        this.nearestStationId = null

        this.buildPrompt()

        this.game.ticker.events.on('tick', () => this.update(), 8)
    }

    buildPrompt()
    {
        this.promptElement = document.createElement('div')
        this.promptElement.className = 'station-prompt'
        this.promptElement.innerHTML = `
            <span class="station-prompt__key">E</span>
            <span class="station-prompt__label">Präsentation öffnen</span>
        `
        document.body.appendChild(this.promptElement)
    }

    /**
     * Enabled only while the player is free to walk (exploration) - the
     * controller turns this off while a station or the automated tour is
     * active, so the prompt/highlight never linger behind a camera cut.
     */
    setActive(active)
    {
        this.active = active

        if(!active)
            this.setNearest(null)
    }

    update()
    {
        if(!this.active)
            return

        // Player.position2 stores (x, z) as Vector2(x, y) - see Player.js.
        const position = this.game.player.position2
        const id = findNearestStation(position.x, position.y, INTERACTION_RADIUS)

        if(id !== this.nearestStationId)
            this.setNearest(id)
    }

    setNearest(id)
    {
        if(this.nearestStationId)
            this.game.world.zoneIdentity.setStandHighlight(this.nearestStationId, false)

        this.nearestStationId = id
        this.promptElement.classList.toggle('is-visible', !!id)

        if(id)
        {
            this.game.world.zoneIdentity.setStandHighlight(id, true)
            this.promptElement.style.setProperty('--accent', STATIONS[id].accent)
        }
    }
}
