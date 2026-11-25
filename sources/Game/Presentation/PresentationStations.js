/**
 * Pure data module: the four presentation stations, derived from the real
 * world geometry authored in ZoneIdentity.js (zone root position + landmark
 * local offset, read from static/areas/areas.glb). No game/runtime logic
 * lives here - CameraDirector/CharacterDirector/PresentationController read
 * this data, they never write it.
 */

function vec2(x, z)
{
    return { x, z }
}

function subtract(a, b)
{
    return vec2(a.x - b.x, a.z - b.z)
}

function normalize(v)
{
    const length = Math.hypot(v.x, v.z) || 1
    return vec2(v.x / length, v.z / length)
}

/**
 * Where the character stands to present a station: a fixed distance beyond
 * the landmark, along the ray from the zone's own root/pivot through the
 * landmark (the same anchor ZoneIdentity.js uses for every prop in that
 * zone). Keeps the character just outside its station's "magic circle"
 * glow disc, facing back in towards it.
 */
function deriveStandPoint(center, landmark, offset)
{
    const direction = normalize(subtract(landmark, center))
    return vec2(landmark.x + direction.x * offset, landmark.z + direction.z * offset)
}

function facingAngle(from, to)
{
    return Math.atan2(to.x - from.x, to.z - from.z)
}

/**
 * A camera placed perpendicular to the character->landmark axis, elevated,
 * looking at the midpoint between the two - a three-quarter composition
 * that keeps both the presenter and the station's landmark in frame.
 */
function cameraFraming(stand, landmark, { distance = 7, height = 4.2, side = 1, targetHeight = 1.3 } = {})
{
    const direction = subtract(landmark, stand)
    const length = Math.hypot(direction.x, direction.z) || 1
    const perpendicular = vec2(-direction.z / length, direction.x / length)
    const mid = vec2((stand.x + landmark.x) * 0.5, (stand.z + landmark.z) * 0.5)

    return {
        position: { x: mid.x + perpendicular.x * distance * side, y: height, z: mid.z + perpendicular.z * distance * side },
        target: { x: mid.x, y: targetHeight, z: mid.z },
    }
}

const STAND_OFFSET = 3

// How close the character needs to be to a station's landmark (world-space,
// flat XZ distance) for that stand to become the "nearest eligible stand"
// for walk-up interaction (Phase 4.1). Comfortably inside cameraFraming()'s
// own distance=7 shot, so the cinematic framing still reads well no matter
// where within the radius the player actually pressed E.
export const INTERACTION_RADIUS = 3.2

// Zone root position (area.model.position) and landmark local offset, both
// read directly from static/areas/areas.glb and ZoneIdentity.js.
const RAW = {
    konzept: {
        title: 'Konzept',
        slideRange: [ 1, 5 ],
        center: vec2(25.84, -0.90),
        landmark: vec2(23.03, 6.53), // faceted gem stack
        accent: '#c0f66b',
    },
    gameplay: {
        title: 'Gameplay',
        slideRange: [ 6, 10 ],
        center: vec2(35.76, 13.41),
        landmark: vec2(34.80, 9.94), // origami Earth globe
        accent: '#57c4e8',
    },
    engineering: {
        title: 'Engineering',
        slideRange: [ 11, 16 ],
        center: vec2(13.14, 17.68),
        landmark: vec2(11.84, 17.08), // pulsing core
        accent: '#ffb45e',
        // The generic center->landmark offset lands inside a physical
        // fence collider guarding this zone's forge clearing (found via
        // live Rapier castShape probing in the browser - see Phase 4
        // technical report). This point sits on the open, hub-facing side
        // of that fence instead.
        standPointOverride: vec2(14.79, 17.6),
    },
    qualitaet: {
        title: 'Qualität',
        slideRange: [ 17, 21 ],
        center: vec2(12.25, 35.25),
        landmark: vec2(10.43, 34.00), // ring + checkmark
        accent: '#c0f66b',
    },
}

export const STATION_ORDER = [ 'konzept', 'gameplay', 'engineering', 'qualitaet' ]

export const STATIONS = {}

for(const [ index, id ] of STATION_ORDER.entries())
{
    const raw = RAW[id]
    const standPoint = raw.standPointOverride ?? deriveStandPoint(raw.center, raw.landmark, STAND_OFFSET)

    STATIONS[id] = {
        id,
        index,
        title: raw.title,
        accent: raw.accent,
        slideRange: raw.slideRange,
        center: raw.center,
        landmark: raw.landmark,
        standPoint,
        facingYRotation: facingAngle(standPoint, raw.landmark),
        camera: cameraFraming(standPoint, raw.landmark),
        onArrive: null,
        onDepart: null,
    }
}

// Manual waypoint overrides for specific station-to-station legs, keyed
// "fromId>toId", for the pairs where a straight line between two stand
// points clips a physical collider (fences/props) - found via live Rapier
// castShape probing in the browser, see Phase 4 technical report.
const ROUTE_OVERRIDES = {
    'konzept>engineering': [ STATIONS.konzept.standPoint, vec2(20, 14), STATIONS.engineering.standPoint ],
    'engineering>qualitaet': [ STATIONS.engineering.standPoint, vec2(12, 26), STATIONS.qualitaet.standPoint ],
}

export function getStation(id)
{
    return STATIONS[id]
}

export function getStationForSlide(slideId)
{
    for(const id of STATION_ORDER)
    {
        const station = STATIONS[id]
        if(slideId >= station.slideRange[0] && slideId <= station.slideRange[1])
            return station
    }

    return null
}

export function getAdjacentStationId(id, direction)
{
    const index = STATIONS[id].index + direction
    return STATION_ORDER[index] ?? null
}

export function getRoute(fromId, toId)
{
    const override = ROUTE_OVERRIDES[`${fromId}>${toId}`]
    if(override)
        return override

    const reverseOverride = ROUTE_OVERRIDES[`${toId}>${fromId}`]
    if(reverseOverride)
        return [ ...reverseOverride ].reverse()

    return [ STATIONS[fromId].standPoint, STATIONS[toId].standPoint ]
}

/**
 * Which station (if any) is eligible for walk-up interaction from a given
 * world-space XZ position - the closest landmark within radius, so that
 * overlapping radii (not the case today, but kept correct regardless) never
 * offer two stands at once.
 */
export function findNearestStation(x, z, radius = INTERACTION_RADIUS)
{
    let nearestId = null
    let nearestDistance = Infinity

    for(const id of STATION_ORDER)
    {
        const station = STATIONS[id]
        const distance = Math.hypot(station.landmark.x - x, station.landmark.z - z)

        if(distance <= radius && distance < nearestDistance)
        {
            nearestDistance = distance
            nearestId = id
        }
    }

    return nearestId
}
