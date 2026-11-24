import { Game } from '../Game.js'

export class Boundary
{
    constructor()
    {
        this.game = Game.getInstance()

        // Bounding rectangle around the compact area cluster (landing, konzept, gameplay, engineering, qualitaet)
        this.min = { x: -15, z: -30 }
        this.max = { x: 75, z: 65 }

        this.halfHeight = 20
        this.centerY = 5
        this.thickness = 1

        this.setWalls()
    }

    setWalls()
    {
        const halfLengthX = (this.max.x - this.min.x) * 0.5
        const halfLengthZ = (this.max.z - this.min.z) * 0.5
        const centerX = (this.min.x + this.max.x) * 0.5
        const centerZ = (this.min.z + this.max.z) * 0.5

        const walls = [
            { position: { x: this.min.x, y: this.centerY, z: centerZ }, parameters: [ this.thickness, this.halfHeight, halfLengthZ ] },
            { position: { x: this.max.x, y: this.centerY, z: centerZ }, parameters: [ this.thickness, this.halfHeight, halfLengthZ ] },
            { position: { x: centerX, y: this.centerY, z: this.min.z }, parameters: [ halfLengthX, this.halfHeight, this.thickness ] },
            { position: { x: centerX, y: this.centerY, z: this.max.z }, parameters: [ halfLengthX, this.halfHeight, this.thickness ] },
        ]

        for(const wall of walls)
        {
            this.game.objects.add(
                null,
                {
                    type: 'fixed',
                    position: wall.position,
                    colliders: [
                        { shape: 'cuboid', parameters: wall.parameters, category: 'floor' }
                    ]
                }
            )
        }
    }
}
