import { Game } from '../Game.js'

export class Boundary
{
    constructor()
    {
        this.game = Game.getInstance()

        // Bounding rectangle around the spread-out area cluster (landing,
        // konzept, gameplay, engineering, qualitaet - see Phase 9/
        // PresentationStations.js), with ~15 units of margin beyond the
        // outermost station centers. Terrain/physics (Floor.js, Terrain.js)
        // only cover world-space [-96, 96] on each axis, with a kinematic
        // "bedrock" slab (not real terrain) taking over past ±90 - this
        // rectangle stays safely inside that.
        this.min = { x: -25, z: -56 }
        this.max = { x: 83, z: 86 }

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
