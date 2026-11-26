import { Game } from '../../Game.js'
import { Area } from './Area.js'
import { STATIONS } from '../../Presentation/PresentationStations.js'

export class Areas
{
    constructor()
    {
        this.game = Game.getInstance()

        const model = [...this.game.resources.areasModel.scene.children]

        for(const child of model)
        {
            // PresentationStations.js is the single source of truth for where
            // each of the four station zones actually sits in the world - it
            // no longer mirrors the as-authored areas.glb transform. Moving
            // the zone root here (before Area's constructor reads it) drags
            // every one of its baked props/fences/colliders along rigidly,
            // since Area.setObjects() positions each child as
            // child.position + this.model.position.
            const station = STATIONS[child.name]
            if(station)
            {
                child.position.x = station.center.x
                child.position.z = station.center.z
            }

            const area = new Area(child)
            this[child.name] = area
        }
    }
}
