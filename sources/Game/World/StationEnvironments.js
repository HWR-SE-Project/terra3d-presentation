import * as THREE from 'three/webgpu'
import { color, uniform } from 'three/tsl'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { alea } from 'seedrandom'
import { Game } from '../Game.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'
import { Foliage } from './Foliage.js'
import { Trees } from './Trees.js'
import { STATIONS } from '../Presentation/PresentationStations.js'

/**
 * Hand-authored environmental "set dressing" for the four presentation
 * stations (Phase 10) - benches, lanterns, trees, bushes, rocks, ground
 * markings, a direction signpost and a small thematic hero piece + easter
 * egg per station. Pure decoration: nothing here is read by
 * PresentationController/CameraDirector/StationStands, so station
 * positions, the walk-up interaction radius and routes (PresentationStations.js)
 * are untouched.
 *
 * Every new prop's height comes from sampleHeight() - a JS re-implementation
 * of Floor.js::setPhysical()'s heightfield extraction (same source geometry,
 * same indexing), so new content sits on the exact ground the player's
 * physics capsule walks on without needing live browser probing (see the
 * Phase 9 technical report for why that probing was otherwise necessary).
 *
 * All world-space authoring is expressed in a per-station (right, forward)
 * frame - forward points from that station's standPoint towards its
 * landmark (STATIONS[id]), right is perpendicular - rather than raw world
 * XZ, so symmetric layouts (e.g. two benches flanking the approach) read
 * the same way regardless of each station's absolute orientation.
 */

const PALETTE = {
    cream: '#fbf7ee',
    stone: '#999c9e',
    stoneDark: '#767a7d',
    wood: '#8a5a34',
    woodDark: '#5e3b22',
    leafA: '#b4b536',
    leafB: '#d8cf3b',
}

const ACCENT_MATERIAL = {
    konzept: 'emissiveLimeRadialGradient',
    gameplay: 'emissiveBlueRadialGradient',
    engineering: 'emissiveOrangeRadialGradient',
    qualitaet: 'emissiveLimeRadialGradient',
}

const TREE_SPECIES = {
    cherry: { colorA: '#ff6d6d', colorB: '#ff9990' },
    birch: { colorA: '#ff4f2b', colorB: '#ff903f' },
    oak: { colorA: '#b4b536', colorB: '#d8cf3b' },
}

// Tour order (PresentationStations.STATION_ORDER), looped back from the
// last to the first - used only for the wayfinding signpost's arrow label.
const NEXT_STATION = {
    konzept: 'gameplay',
    gameplay: 'engineering',
    engineering: 'qualitaet',
    qualitaet: 'konzept',
}

export class StationEnvironments
{
    constructor()
    {
        this.game = Game.getInstance()
        this.spinners = []
        this.rng = new alea('station-environments')

        this.buildHeightSampler()

        this.setKonzept()
        this.setGameplay()
        this.setEngineering()
        this.setQualitaet()

        this.game.ticker.events.on('tick', () =>
        {
            const delta = this.game.ticker.delta
            const elapsed = this.game.ticker.elapsed
            for(const spinner of this.spinners)
                spinner(delta, elapsed)
        })
    }

    /**
     * Re-extracts the same heights grid Floor.js::setPhysical() builds for
     * the Rapier heightfield collider, from the same source geometry
     * (game.resources.terrainModel), so any (x, z) can be sampled for its
     * real ground height without a physics raycast.
     */
    buildHeightSampler()
    {
        const geometry = this.game.resources.terrainModel.scene.children[0].geometry
        const positionAttribute = geometry.attributes.position
        const totalCount = positionAttribute.count
        const rowsCount = Math.round(Math.sqrt(totalCount))
        const halfExtent = this.game.terrain.size / 2
        const heights = new Float32Array(totalCount)

        for(let i = 0; i < totalCount; i++)
        {
            const x = positionAttribute.array[i * 3 + 0]
            const y = positionAttribute.array[i * 3 + 1]
            const z = positionAttribute.array[i * 3 + 2]
            const indexX = Math.round(((x / (halfExtent * 2)) + 0.5) * (rowsCount - 1))
            const indexZ = Math.round(((z / (halfExtent * 2)) + 0.5) * (rowsCount - 1))
            heights[indexZ + indexX * rowsCount] = y
        }

        this.terrain = { heights, rowsCount, halfExtent }
    }

    sampleHeight(x, z)
    {
        const { heights, rowsCount, halfExtent } = this.terrain

        const fx = THREE.MathUtils.clamp(((x / (halfExtent * 2)) + 0.5) * (rowsCount - 1), 0, rowsCount - 1)
        const fz = THREE.MathUtils.clamp(((z / (halfExtent * 2)) + 0.5) * (rowsCount - 1), 0, rowsCount - 1)

        const x0 = Math.floor(fx)
        const z0 = Math.floor(fz)
        const x1 = Math.min(x0 + 1, rowsCount - 1)
        const z1 = Math.min(z0 + 1, rowsCount - 1)
        const tx = fx - x0
        const tz = fz - z0

        const h00 = heights[z0 + x0 * rowsCount]
        const h10 = heights[z0 + x1 * rowsCount]
        const h01 = heights[z1 + x0 * rowsCount]
        const h11 = heights[z1 + x1 * rowsCount]

        return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz
    }

    /**
     * forward: unit vector from this station's standPoint towards its
     * landmark ("into" the station). right: perpendicular. Lets every
     * per-station layout below be authored as "2m right of the path,
     * 1.5m before the landmark" instead of raw world XZ.
     */
    getFrame(station)
    {
        const fx = station.landmark.x - station.standPoint.x
        const fz = station.landmark.z - station.standPoint.z
        const length = Math.hypot(fx, fz) || 1
        const forward = { x: fx / length, z: fz / length }
        const right = { x: forward.z, z: -forward.x }
        return { forward, right }
    }

    /**
     * World-space point `forward` units beyond the landmark (0 = at the
     * landmark, negative = towards the approach/standPoint side) and
     * `right` units to the side, ground-height sampled. Returns null (and
     * skips the prop) if the sampled ground is underwater - a defensive
     * guard since these positions were never live-verified in a browser
     * the way the station points themselves were (see Phase 9 report).
     */
    place(station, right, forward, extraY = 0)
    {
        const { forward: f, right: r } = this.getFrame(station)
        const x = station.landmark.x + r.x * right + f.x * forward
        const z = station.landmark.z + r.z * right + f.z * forward
        const groundY = this.sampleHeight(x, z)

        if(groundY < this.game.water.surfaceElevation + 0.15)
        {
            console.warn(`StationEnvironments > skipped a prop near ${station.id} at (${x.toFixed(1)}, ${z.toFixed(1)}) - sampled ground is underwater`)
            return null
        }

        return { x, y: groundY + extraY, z, facingY: Math.atan2(station.landmark.x - x, station.landmark.z - z) }
    }

    faceTowards(mesh, from, to)
    {
        mesh.rotation.y = Math.atan2(to.x - from.x, to.z - from.z)
    }

    // ---------------------------------------------------------------- props

    addBench(point, facing)
    {
        if(!point)
            return null

        const source = this.game.resources.benchesModel.scene.children[0]
        const mesh = source.clone()
        mesh.position.set(point.x, point.y, point.z)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.game.materials.updateObject(mesh)
        if(facing)
            this.faceTowards(mesh, point, facing)
        this.game.scene.add(mesh)
        return mesh
    }

    addLantern(point, accentMaterialName)
    {
        if(!point)
            return null

        const group = this.game.resources.lanternsModel.scene.children[0].clone()
        group.position.set(point.x, point.y, point.z)
        group.rotation.y = this.rng() * Math.PI * 2
        group.traverse((child) =>
        {
            if(!child.isMesh)
                return

            child.castShadow = true
            child.receiveShadow = true
        })
        this.game.materials.updateObject(group)

        // Always-on accent-coloured glow, independent of the global
        // day/night-tied PoleLights system - these sit off the main paths
        // purely as station-identity lighting.
        const glass = group.getObjectByName('glass') ?? group.children.find((child) => child.name.includes('lass'))
        if(glass)
            glass.material = this.game.materials.list.get(accentMaterialName)

        this.game.scene.add(group)
        return group
    }

    addTreeCluster(speciesKey, points)
    {
        const valid = points.filter(Boolean)
        if(!valid.length)
            return

        const species = TREE_SPECIES[speciesKey]
        const visualKey = `${speciesKey === 'oak' ? 'oak' : speciesKey}TreesVisualModel`
        const visual = this.game.resources[visualKey].scene

        const references = valid.map((point) =>
        {
            const object = new THREE.Object3D()
            object.position.set(point.x, point.y, point.z)
            object.rotation.y = this.rng() * Math.PI * 2
            object.scale.setScalar(0.85 + this.rng() * 0.35)
            object.updateMatrixWorld(true)
            return object
        })

        new Trees(`Station ${speciesKey}`, visual, references, species.colorA, species.colorB)
    }

    addFoliageCluster(points)
    {
        const valid = points.filter(Boolean)
        if(!valid.length)
            return

        const references = valid.map((point) =>
        {
            const object = new THREE.Object3D()
            object.position.set(point.x, point.y, point.z)
            object.scale.setScalar(0.6 + this.rng() * 0.4)
            return object
        })

        const colorANode = uniform(color(PALETTE.leafA))
        const colorBNode = uniform(color(PALETTE.leafB))
        new Foliage(references, colorANode, colorBNode)
    }

    createRockGeometry(radius)
    {
        const geometry = new THREE.IcosahedronGeometry(radius, 0)
        const position = geometry.attributes.position
        for(let i = 0; i < position.count; i++)
        {
            const jitter = 1 + (this.rng() - 0.5) * 0.4
            position.setXYZ(i, position.getX(i) * jitter, position.getY(i) * jitter, position.getZ(i) * jitter)
        }
        geometry.scale(1, 0.72, 1)
        geometry.computeVertexNormals()
        return geometry
    }

    addRockCluster(points)
    {
        const valid = points.filter(Boolean)
        if(!valid.length)
            return

        const material = new MeshDefaultMaterial({ colorNode: color(PALETTE.stone) })
        const geometries = []

        for(const point of valid)
        {
            const geometry = this.createRockGeometry(0.22 + this.rng() * 0.22)
            geometry.rotateY(this.rng() * Math.PI * 2)
            geometry.translate(point.x, point.y + 0.08, point.z)
            geometries.push(geometry)
        }

        const merged = mergeGeometries(geometries)
        for(const geometry of geometries)
            geometry.dispose()

        const mesh = new THREE.Mesh(merged, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.game.scene.add(mesh)
    }

    /**
     * A dotted "breadcrumb" trail of small glow discs along the approach,
     * sharing the station's own accent material (same emissive gradient
     * singleton the landmark/sign already use) - merged into one mesh.
     */
    addPathDots(station, count = 6)
    {
        const { forward } = this.getFrame(station)
        const material = this.game.materials.list.get(ACCENT_MATERIAL[station.id])
        const geometries = []

        for(let i = 1; i <= count; i++)
        {
            const t = i / (count + 1)
            const forwardOffset = -3.6 * t
            const point = this.place(station, 0, forwardOffset, 0.015)
            if(!point)
                continue

            const geometry = new THREE.CircleGeometry(0.1 - t * 0.04, 10)
            geometry.rotateX(-Math.PI / 2)
            geometry.translate(point.x, point.y, point.z)
            geometries.push(geometry)
        }

        if(!geometries.length)
            return

        const merged = mergeGeometries(geometries)
        for(const geometry of geometries)
            geometry.dispose()

        const mesh = new THREE.Mesh(merged, material)
        this.game.scene.add(mesh)
    }

    /**
     * Small wayfinding signpost (reuses ZoneIdentity's sign-texture canvas
     * technique) pointing to the next stop on the tour order.
     */
    addDirectionSign(station, right, forward)
    {
        const point = this.place(station, right, forward)
        if(!point)
            return

        const nextId = NEXT_STATION[station.id]
        const nextStation = STATIONS[nextId]

        const postGeometry = new THREE.CylinderGeometry(0.05, 0.06, 1.3, 6)
        const post = new THREE.Mesh(postGeometry, new MeshDefaultMaterial({ colorNode: color(PALETTE.woodDark) }))
        post.position.set(point.x, point.y + 0.65, point.z)
        post.castShadow = true
        this.game.scene.add(post)

        const identity = this.game.world.zoneIdentity
        const texture = identity.createSignTexture('→', nextStation.title.toUpperCase(), station.accent)
        const geometry = new THREE.PlaneGeometry(0.9, 0.28125)
        const plane = new THREE.Mesh(geometry, new THREE.MeshBasicNodeMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }))
        plane.position.set(point.x, point.y + 1.2, point.z)
        this.faceTowards(plane, point, station.standPoint)
        this.game.scene.add(plane)
    }

    // ------------------------------------------------------------ Konzept

    setKonzept()
    {
        const station = STATIONS.konzept
        if(!this.game.world.areas.konzept)
            return

        this.addBench(this.place(station, -2.0, -2.2), station.landmark)
        this.addBench(this.place(station, 2.0, -2.2), station.landmark)

        this.addLantern(this.place(station, -2.6, -3.0), ACCENT_MATERIAL.konzept)
        this.addLantern(this.place(station, 2.6, -3.0), ACCENT_MATERIAL.konzept)
        this.addLantern(this.place(station, -2.6, 1.8), ACCENT_MATERIAL.konzept)
        this.addLantern(this.place(station, 2.6, 1.8), ACCENT_MATERIAL.konzept)

        this.addTreeCluster('cherry', [
            this.place(station, -3.8, -0.5),
            this.place(station, 3.6, -1.2),
            this.place(station, -2.6, 2.6),
        ])

        this.addFoliageCluster([
            this.place(station, 0.6, 1.9),
            this.place(station, -0.6, 2.1),
            this.place(station, 1.4, 1.5),
            this.place(station, -1.6, 1.3),
            this.place(station, 2.4, -2.6),
            this.place(station, -2.4, -2.4),
            this.place(station, 1.0, -3.2),
        ])

        this.addRockCluster([
            this.place(station, 1.1, -1.0),
            this.place(station, 1.3, -1.3),
            this.place(station, -3.0, 1.0),
        ])

        this.addPathDots(station)
        this.addDirectionSign(station, 2.2, -3.8)

        // Hero: two tilted "orbit" rings around the gem stack, plus three
        // small faceted shapes slowly bobbing nearby - ideas crystallising
        // into the central landmark.
        const center = this.place(station, 0, 0, 1.1)
        if(center)
        {
            const ringMaterial = this.game.materials.list.get(ACCENT_MATERIAL.konzept)

            const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.02, 6, 24), ringMaterial)
            ringA.position.set(center.x, center.y, center.z)
            ringA.rotation.x = Math.PI / 2.4
            this.game.scene.add(ringA)

            const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.018, 6, 24), ringMaterial)
            ringB.position.set(center.x, center.y, center.z)
            ringB.rotation.x = -Math.PI / 3.1
            ringB.rotation.z = Math.PI / 5
            this.game.scene.add(ringB)

            this.spinners.push((delta) =>
            {
                ringA.rotation.y += delta * 0.5
                ringB.rotation.y -= delta * 0.35
            })

            const shapeGeometries = [
                new THREE.TetrahedronGeometry(0.1),
                new THREE.BoxGeometry(0.13, 0.13, 0.13),
                new THREE.OctahedronGeometry(0.11),
            ]
            const shapeMaterial = new MeshDefaultMaterial({ colorNode: color(PALETTE.cream) })
            const floaters = shapeGeometries.map((geometry, i) =>
            {
                const mesh = new THREE.Mesh(geometry, shapeMaterial)
                const angle = (i / shapeGeometries.length) * Math.PI * 2
                mesh.userData.angle = angle
                mesh.userData.radius = 1.25
                mesh.userData.phase = this.rng() * Math.PI * 2
                mesh.position.set(center.x + Math.cos(angle) * 1.25, center.y + 1.1, center.z + Math.sin(angle) * 1.25)
                this.game.scene.add(mesh)
                return mesh
            })

            this.spinners.push((delta, elapsed) =>
            {
                for(const mesh of floaters)
                {
                    mesh.userData.angle += delta * 0.22
                    mesh.position.x = center.x + Math.cos(mesh.userData.angle) * mesh.userData.radius
                    mesh.position.z = center.z + Math.sin(mesh.userData.angle) * mesh.userData.radius
                    mesh.position.y = center.y + 1.1 + Math.sin(elapsed * 0.9 + mesh.userData.phase) * 0.12
                    mesh.rotation.x += delta * 0.6
                    mesh.rotation.y += delta * 0.4
                }
            })

            // Easter egg: a tiny "eureka" bulb tucked just behind the bushes,
            // pulsing on its own independent rhythm.
            const eggPoint = this.place(station, -1.9, 1.7, 0.18)
            if(eggPoint)
            {
                const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 1), ringMaterial)
                bulb.position.set(eggPoint.x, eggPoint.y, eggPoint.z)
                this.game.scene.add(bulb)
                this.spinners.push((delta, elapsed) =>
                {
                    bulb.scale.setScalar(1 + Math.sin(elapsed * 2.4) * 0.22)
                })
            }
        }
    }

    // ----------------------------------------------------------- Gameplay

    setGameplay()
    {
        const station = STATIONS.gameplay
        if(!this.game.world.areas.gameplay)
            return

        const arc = [ -3.2, -1.6, 0, 1.6, 3.2 ]
        for(const right of arc)
            this.addBench(this.place(station, right, -2.9), station.landmark)

        this.addLantern(this.place(station, -3.6, -1.0), ACCENT_MATERIAL.gameplay)
        this.addLantern(this.place(station, 3.6, -1.0), ACCENT_MATERIAL.gameplay)
        this.addLantern(this.place(station, -3.6, 2.4), ACCENT_MATERIAL.gameplay)
        this.addLantern(this.place(station, 3.6, 2.4), ACCENT_MATERIAL.gameplay)

        this.addTreeCluster('birch', [
            this.place(station, -4.6, -0.8),
            this.place(station, 4.6, -0.8),
            this.place(station, -4.0, 2.8),
            this.place(station, 4.0, 2.8),
        ])

        this.addFoliageCluster([
            this.place(station, -4.8, 0.6),
            this.place(station, 4.8, 0.6),
            this.place(station, -3.4, 3.4),
            this.place(station, 3.4, 3.4),
            this.place(station, 0, 3.6),
        ])

        this.addRockCluster([
            this.place(station, -3.6, -2.6),
            this.place(station, 3.6, -2.6),
        ])

        this.addPathDots(station)
        this.addDirectionSign(station, 2.4, -3.9)

        // Hero: two faceted "moons" orbiting the origami Earth, plus a
        // couple of thin flattened rings extending the glow disc into a
        // subtle world-grid motif.
        const center = this.place(station, 0, 0, 0.9)
        if(center)
        {
            const moonMaterialA = new MeshDefaultMaterial({ colorNode: color(station.accent) })
            const moonMaterialB = new MeshDefaultMaterial({ colorNode: color(PALETTE.cream) })

            const moonA = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), moonMaterialA)
            const moonB = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), moonMaterialB)
            this.game.scene.add(moonA, moonB)

            const orbits = [
                { mesh: moonA, radius: 1.5, speed: 0.5, tilt: 0.35, phase: 0 },
                { mesh: moonB, radius: 1.9, speed: -0.33, tilt: -0.5, phase: Math.PI },
            ]

            this.spinners.push((delta, elapsed) =>
            {
                for(const orbit of orbits)
                {
                    const angle = elapsed * orbit.speed + orbit.phase
                    orbit.mesh.position.set(
                        center.x + Math.cos(angle) * orbit.radius,
                        center.y + 0.9 + Math.sin(angle * 1.7) * orbit.tilt * 0.3,
                        center.z + Math.sin(angle) * orbit.radius
                    )
                    orbit.mesh.rotation.y += delta * 1.2
                }
            })

            const gridMaterial = this.game.materials.list.get(ACCENT_MATERIAL.gameplay)
            const gridA = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.73, 32), gridMaterial)
            gridA.rotation.x = -Math.PI / 2
            gridA.position.set(center.x, center.y - 0.78, center.z)
            const gridB = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.13, 32), gridMaterial)
            gridB.rotation.x = -Math.PI / 2
            gridB.position.set(center.x, center.y - 0.78, center.z)
            this.game.scene.add(gridA, gridB)

            // Easter egg: an abstract "controller" sculpture tucked beside
            // one end of the amphitheater.
            const eggPoint = this.place(station, 4.1, -2.2, 0.16)
            if(eggPoint)
            {
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.14), moonMaterialB)
                const buttonA = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 10), moonMaterialA)
                const buttonB = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 10), moonMaterialA)
                body.position.set(eggPoint.x, eggPoint.y + 0.06, eggPoint.z)
                buttonA.position.set(eggPoint.x - 0.07, eggPoint.y + 0.11, eggPoint.z)
                buttonB.position.set(eggPoint.x + 0.07, eggPoint.y + 0.11, eggPoint.z)
                this.game.scene.add(body, buttonA, buttonB)
            }
        }
    }

    // -------------------------------------------------------- Engineering

    setEngineering()
    {
        const station = STATIONS.engineering
        if(!this.game.world.areas.engineering)
            return

        // Kept tight and biased towards the approach side - the far side of
        // this landmark sits against a physical fence guarding the forge
        // clearing (see PresentationStations.js's standPointOverride note).
        this.addBench(this.place(station, -1.8, -1.6), station.landmark)
        this.addBench(this.place(station, 1.8, -1.6), station.landmark)

        this.addLantern(this.place(station, -2.2, -2.3), ACCENT_MATERIAL.engineering)
        this.addLantern(this.place(station, 2.2, -2.3), ACCENT_MATERIAL.engineering)

        this.addTreeCluster('oak', [
            this.place(station, -3.2, -2.0),
            this.place(station, 3.0, -2.3),
        ])

        this.addFoliageCluster([
            this.place(station, -2.6, -0.6),
            this.place(station, 2.4, -0.4),
            this.place(station, -1.8, -2.6),
        ])

        this.addRockCluster([
            this.place(station, -3.0, -0.9),
            this.place(station, 2.8, -1.1),
        ])

        this.addPathDots(station)
        this.addDirectionSign(station, -1.6, -2.6)

        // Hero: a small stacked "gear" cluster beside the pulsing core, an
        // anvil silhouette, and a couple of crates - a workshop corner.
        const material = new MeshDefaultMaterial({ colorNode: color(station.accent) })

        const gearPoint = this.place(station, 1.3, 0.6, 0.18)
        if(gearPoint)
        {
            const gearA = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 8), material)
            const gearB = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 7), material)
            gearA.position.set(gearPoint.x, gearPoint.y + 0.04, gearPoint.z)
            gearB.position.set(gearPoint.x + 0.05, gearPoint.y + 0.14, gearPoint.z - 0.03)
            gearB.rotation.x = Math.PI / 2
            gearA.rotation.x = Math.PI / 2
            this.game.scene.add(gearA, gearB)
            this.spinners.push((delta) =>
            {
                gearA.rotation.z += delta * 0.6
                gearB.rotation.z -= delta * 0.9
            })
        }

        const anvilPoint = this.place(station, -1.2, 0.4)
        if(anvilPoint)
        {
            const darkMaterial = new MeshDefaultMaterial({ colorNode: color(PALETTE.stoneDark) })
            const base = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), darkMaterial)
            const top = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.18), darkMaterial)
            base.position.set(anvilPoint.x, anvilPoint.y + 0.11, anvilPoint.z)
            top.position.set(anvilPoint.x, anvilPoint.y + 0.27, anvilPoint.z)
            this.game.scene.add(base, top)

            // A few small embers drifting above the anvil.
            const emberMaterial = this.game.materials.list.get(ACCENT_MATERIAL.engineering)
            const embers = Array.from({ length: 4 }, (_, i) =>
            {
                const ember = new THREE.Mesh(new THREE.CircleGeometry(0.025, 6), emberMaterial)
                ember.userData.phase = this.rng() * Math.PI * 2
                ember.userData.offset = i
                ember.position.set(anvilPoint.x + (this.rng() - 0.5) * 0.2, anvilPoint.y + 0.4, anvilPoint.z + (this.rng() - 0.5) * 0.2)
                this.game.scene.add(ember)
                return ember
            })
            this.spinners.push((delta, elapsed) =>
            {
                for(const ember of embers)
                    ember.position.y = anvilPoint.y + 0.4 + Math.sin(elapsed * 1.6 + ember.userData.phase) * 0.08 + ember.userData.offset * 0.01
            })
        }

        const cratePoint = this.place(station, -1.7, -0.8)
        if(cratePoint)
        {
            const woodMaterial = new MeshDefaultMaterial({ colorNode: color(PALETTE.wood) })
            const crateA = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), woodMaterial)
            const crateB = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), woodMaterial)
            crateA.position.set(cratePoint.x, cratePoint.y + 0.15, cratePoint.z)
            crateB.position.set(cratePoint.x + 0.05, cratePoint.y + 0.42, cratePoint.z - 0.04)
            crateB.rotation.y = 0.3
            crateA.castShadow = true
            crateB.castShadow = true
            this.game.scene.add(crateA, crateB)

            // Easter egg: a rubber duck perched on the top crate - a nod to
            // rubber-duck debugging.
            const duckYellow = new MeshDefaultMaterial({ colorNode: color('#ffd23f') })
            const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), duckYellow)
            const duckBeak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 6), new MeshDefaultMaterial({ colorNode: color('#ff8c1a') }))
            duckBody.position.set(crateB.position.x, crateB.position.y + 0.16, crateB.position.z)
            duckBeak.position.set(crateB.position.x, crateB.position.y + 0.16, crateB.position.z + 0.07)
            duckBeak.rotation.x = Math.PI / 2
            this.game.scene.add(duckBody, duckBeak)
        }
    }

    // ---------------------------------------------------------- Qualität

    setQualitaet()
    {
        const station = STATIONS.qualitaet
        if(!this.game.world.areas.qualitaet)
            return

        this.addBench(this.place(station, -2.4, -2.0), station.landmark)
        this.addBench(this.place(station, 2.4, -2.0), station.landmark)

        this.addLantern(this.place(station, -2.6, -2.8), ACCENT_MATERIAL.qualitaet)
        this.addLantern(this.place(station, 2.6, -2.8), ACCENT_MATERIAL.qualitaet)
        this.addLantern(this.place(station, -2.6, 1.6), ACCENT_MATERIAL.qualitaet)
        this.addLantern(this.place(station, 2.6, 1.6), ACCENT_MATERIAL.qualitaet)

        this.addTreeCluster('birch', [
            this.place(station, -3.6, -1.0),
            this.place(station, 3.6, -1.0),
        ])

        // Orderly hedge rows flanking the approach, rather than organic
        // scatter - the "precision" of this station's theme.
        const hedgeRight = []
        for(const forward of [ -1.0, -1.8, -2.6 ])
        {
            hedgeRight.push(this.place(station, 1.6, forward))
            hedgeRight.push(this.place(station, -1.6, forward))
        }
        this.addFoliageCluster(hedgeRight)

        this.addPathDots(station)
        this.addDirectionSign(station, -2.2, -3.6)

        // Hero: a neat checkerboard plaza under the ring, and a small
        // balance-scale sculpture that gently sways.
        const plazaMaterialCream = new MeshDefaultMaterial({ colorNode: color(PALETTE.cream) })
        const plazaMaterialLime = new MeshDefaultMaterial({ colorNode: color(station.accent) })
        const geometriesCream = []
        const geometriesLime = []
        const tile = 0.5
        const gridRadius = 4

        for(let ix = -gridRadius; ix <= gridRadius; ix++)
        {
            for(let iz = -gridRadius; iz <= gridRadius; iz++)
            {
                if(Math.hypot(ix, iz) > gridRadius + 0.2)
                    continue

                const point = this.place(station, ix * tile, iz * tile, 0.008)
                if(!point)
                    continue

                const geometry = new THREE.BoxGeometry(tile * 0.96, 0.02, tile * 0.96)
                geometry.translate(point.x, point.y, point.z)

                if((ix + iz) % 2 === 0)
                    geometriesCream.push(geometry)
                else
                    geometriesLime.push(geometry)
            }
        }

        for(const [ geometries, material ] of [ [ geometriesCream, plazaMaterialCream ], [ geometriesLime, plazaMaterialLime ] ])
        {
            if(!geometries.length)
                continue
            const merged = mergeGeometries(geometries)
            for(const geometry of geometries)
                geometry.dispose()
            const mesh = new THREE.Mesh(merged, material)
            mesh.receiveShadow = true
            this.game.scene.add(mesh)
        }

        const scalePoint = this.place(station, 0, 1.7, 0)
        if(scalePoint)
        {
            const standMaterial = new MeshDefaultMaterial({ colorNode: color(PALETTE.stoneDark) })
            const beamMaterial = new MeshDefaultMaterial({ colorNode: color(PALETTE.cream) })
            const panMaterial = this.game.materials.list.get(ACCENT_MATERIAL.qualitaet)

            const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.85, 8), standMaterial)
            stand.position.set(scalePoint.x, scalePoint.y + 0.425, scalePoint.z)
            this.game.scene.add(stand)

            const beam = new THREE.Group()
            beam.position.set(scalePoint.x, scalePoint.y + 0.85, scalePoint.z)
            const beamBar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.03), beamMaterial)
            beam.add(beamBar)

            const panA = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.03, 10), panMaterial)
            const panB = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.03, 10), panMaterial)
            const linkA = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 4), standMaterial)
            const linkB = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 4), standMaterial)
            panA.position.set(-0.33, -0.1, 0)
            panB.position.set(0.33, -0.1, 0)
            linkA.position.set(-0.33, -0.1, 0)
            linkB.position.set(0.33, -0.1, 0)
            beam.add(panA, panB, linkA, linkB)

            this.game.scene.add(beam)
            this.spinners.push((delta, elapsed) =>
            {
                beam.rotation.z = Math.sin(elapsed * 0.7) * 0.07
            })

            // Easter egg: a tiny trophy beside the ring - a "100% quality" nod.
            const trophyPoint = this.place(station, 1.1, 1.3, 0)
            if(trophyPoint)
            {
                const trophyMaterial = this.game.materials.list.get(ACCENT_MATERIAL.qualitaet)
                const cupStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.12, 8), standMaterial)
                const cup = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), trophyMaterial)
                cupStand.position.set(trophyPoint.x, trophyPoint.y + 0.06, trophyPoint.z)
                cup.position.set(trophyPoint.x, trophyPoint.y + 0.15, trophyPoint.z)
                this.game.scene.add(cupStand, cup)
                this.spinners.push((delta) => { cup.rotation.y += delta * 0.4 })
            }
        }
    }
}
