import * as THREE from 'three/webgpu'
import { parse as parseFont } from 'opentype.js'
import { Game } from '../Game.js'
import { STATIONS } from '../Presentation/PresentationStations.js'

/**
 * Per-station team member signage, replacing the original "Bruno Simon"
 * name lettering (it was baked letter-by-letter into static/areas/areas.glb's
 * landing zone and filtered out in Area.js::setObjects()).
 *
 * Same typographic language as that original lettering: solid extruded,
 * beveled capital letters sampling the shared 'palette' material (so they
 * get the exact same lighting/core-shadow/drop-shadow/fog treatment as every
 * other low-poly prop in the scene - see Materials.js::createPalette()).
 * Built at runtime from the project's own Pally-Bold display font (opentype.js
 * -> THREE.ShapePath -> THREE.ExtrudeGeometry) rather than hand-modeled,
 * since the four names need letters the original ten-letter "BRUNOSIMON"
 * glyph set never covered.
 *
 * Positions follow the same local-offset convention as ZoneIdentity.js
 * (area.model.position + a hand-picked local offset, added straight to
 * game.scene - no physics body, matching the sign/landmark props so a name
 * can never be pushed into a driving path or a station's interaction point).
 */

// Same color every original letter sampled from the shared palette texture
// (static/palette.png, column 92-95 of 128).
const LETTER_UV = [ 0.7356297969818115, 0.5 ]

// Depth/cap-height ratio and bevel proportions lifted from the original
// lettering geometry baked in areas.glb (Text.002 "B": bbox height 1.447,
// depth 0.46 -> ratio 0.318), expressed in the same unit space as the font
// outlines (fontSize 100) so they scale cleanly with capHeight below.
const FONT_SIZE = 100
const EXTRUDE_DEPTH = 24
const BEVEL_THICKNESS = 4
const BEVEL_SIZE = 3

const STATION_SIGNAGE = {
    // Local offsets are relative to area.model.position (same space as every
    // ZoneIdentity.js local[] array). y is the zone's authored ground level
    // (unchanged from the original placement - it was never the problem);
    // x/z were re-derived (Phase 10) on a circle around the landmark, sized
    // to clear the glow disc's own radius plus this name's half-diagonal,
    // at a bearing near the presentation camera's framing angle (so the name
    // reads in the main establishing shot instead of hiding behind the
    // landmark) while staying angularly clear of both the sign and the
    // standPoint/character circle - verified via a bearing sweep that
    // maximizes the smaller of those two clearances, then ground-truthed by
    // teleporting the physics character onto each spot (settles in place,
    // no collider push-out - see [[project-terraguessr-phase9-spacing]]'s
    // castShape/moveTo technique). mesh.rotation.y (below, in build()) still
    // auto-faces each name at its station's standPoint, so the short
    // extrude-depth axis - not the wide letter-spread axis - is what points
    // at the character/camera side, which is what keeps these clearances
    // from needing to be as large as a naive bounding-circle check implies.
    konzept: {
        text: 'MAKSYM',
        local: [ -1.73, -3.19, 10.21 ],
        capHeight: 0.58,
    },
    gameplay: {
        text: 'ISABEL',
        local: [ -3.30, -3.20, -4.44 ],
        capHeight: 0.40,
    },
    engineering: {
        text: 'YEVHEN',
        local: [ -0.15, -3.20, -2.95 ],
        capHeight: 0.50,
    },
    qualitaet: {
        text: 'LINUS',
        local: [ -3.56, -2.75, 0.40 ],
        capHeight: 0.50,
    },
}

export class NameLettering
{
    constructor()
    {
        this.game = Game.getInstance()
        this.names = {}

        this.load()
    }

    async load()
    {
        const response = await fetch('fonts/Pally-Bold.ttf')
        const buffer = await response.arrayBuffer()
        this.font = parseFont(buffer)

        for(const id of Object.keys(STATION_SIGNAGE))
            this.build(id)
    }

    /**
     * One opentype.js glyph outline -> one THREE.ShapePath. Glyph commands
     * are M/L/Q/C in font units already scaled to fontSize by getPath();
     * Y is negated because opentype's path convention has ascenders go
     * negative (screen/canvas style), and we want normal Y-up shapes.
     */
    glyphToShapePath(char, offsetX)
    {
        const path = this.font.getPath(char, offsetX, 0, FONT_SIZE)
        const shapePath = new THREE.ShapePath()

        for(const command of path.commands)
        {
            switch(command.type)
            {
                case 'M':
                    shapePath.moveTo(command.x, -command.y)
                    break
                case 'L':
                    shapePath.lineTo(command.x, -command.y)
                    break
                case 'Q':
                    shapePath.quadraticCurveTo(command.x1, -command.y1, command.x, -command.y)
                    break
                case 'C':
                    shapePath.bezierCurveTo(command.x1, -command.y1, command.x2, -command.y2, command.x, -command.y)
                    break
            }
        }

        return shapePath
    }

    textToShapes(text)
    {
        const shapes = []
        let offsetX = 0
        const scale = FONT_SIZE / this.font.unitsPerEm
        const tracking = FONT_SIZE * 0.04

        for(const char of text)
        {
            shapes.push(...this.glyphToShapePath(char, offsetX).toShapes())
            offsetX += this.font.charToGlyph(char).advanceWidth * scale + tracking
        }

        return shapes
    }

    buildGeometry(text, capHeight)
    {
        const shapes = this.textToShapes(text)

        const geometry = new THREE.ExtrudeGeometry(shapes, {
            depth: EXTRUDE_DEPTH,
            bevelEnabled: true,
            bevelThickness: BEVEL_THICKNESS,
            bevelSize: BEVEL_SIZE,
            bevelSegments: 3,
            curveSegments: 8,
        })

        geometry.computeBoundingBox()
        const box = geometry.boundingBox
        const height = box.max.y - box.min.y
        const centerX = (box.min.x + box.max.x) * 0.5
        const centerZ = EXTRUDE_DEPTH * 0.5

        // Center horizontally and in depth, sit the baseline on y = 0, so the
        // local offset table above can treat each position as "ground point,
        // name centered above it" rather than needing per-letter bookkeeping.
        geometry.translate(-centerX, -box.min.y, -centerZ)

        const scale = capHeight / height
        geometry.scale(scale, scale, scale)

        // Every original letter sampled one constant texel of the shared
        // palette strip (see LETTER_UV) rather than a proper UV unwrap -
        // reproduce that exactly so new letters share the exact same color.
        const count = geometry.attributes.position.count
        const uv = new Float32Array(count * 2)
        for(let i = 0; i < count; i++)
        {
            uv[i * 2] = LETTER_UV[0]
            uv[i * 2 + 1] = LETTER_UV[1]
        }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))

        return geometry
    }

    build(id)
    {
        const config = STATION_SIGNAGE[id]
        const area = this.game.world.areas[id]
        const station = STATIONS[id]
        if(!config || !area || !station)
            return

        const geometry = this.buildGeometry(config.text, config.capHeight)
        const material = this.game.materials.list.get('palette')

        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true

        const worldX = area.model.position.x + config.local[0]
        const worldY = area.model.position.y + config.local[1]
        const worldZ = area.model.position.z + config.local[2]
        mesh.position.set(worldX, worldY, worldZ)

        // Face the station's standPoint, the same approach direction the
        // character/camera use to present this zone (PresentationStations.js)
        // - local +Z (the extrusion's front cap normal) points at the viewer.
        mesh.rotation.y = Math.atan2(
            station.standPoint.x - worldX,
            station.standPoint.z - worldZ,
        )

        this.game.scene.add(mesh)
        this.names[id] = mesh
    }
}
