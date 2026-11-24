import { Game } from '../../Game.js'
import { Area } from './Area.js'

export class Areas
{
    constructor()
    {
        this.game = Game.getInstance()

        const model = [...this.game.resources.areasModel.scene.children]

        for(const child of model)
        {
            const area = new Area(child)
            this[child.name] = area
        }
    }
}
