import * as THREE from 'three/webgpu'
import { color } from 'three/tsl'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { Game } from '../Game.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

/**
 * TerraGuessr brand palette, sourced from the real app
 * (frontend/src/styles/index.css in the terraguessr repo).
 */
const PALETTE = {
    space: '#14112a',
    cream: '#fbf7ee',
    lime: '#c0f66b',
    limeLight: '#d7ff96',
    limeDark: '#86c334',
    sky: '#57c4e8',
    amber: '#ffb45e',
}

export class ZoneIdentity
{
    constructor()
    {
        this.game = Game.getInstance()
        this.spinners = []

        this.setKonzept()
        this.setGameplay()
        this.setEngineering()
        this.setQualitaet()

        this.game.ticker.events.on('tick', () =>
        {
            const delta = this.game.ticker.delta
            for(const spinner of this.spinners)
                spinner(delta)
        })
    }

    /**
     * area.model is only ever a detached data template - Area.js reads
     * positions off it and hands each child to Objects.addFromModel(), which
     * defaults to parenting visuals straight onto game.scene in world space
     * (see Objects.js::add() - parent: this.game.scene). model itself is
     * never attached to the scene, so new content has to go through this
     * same path: compute world position from area.model.position + a local
     * offset, then add directly to game.scene.
     */
    worldPosition(area, local)
    {
        return [
            area.model.position.x + local[0],
            area.model.position.y + local[1],
            area.model.position.z + local[2],
        ]
    }

    /**
     * Canvas-baked sign texture, following the same runtime-canvas-texture
     * pattern already used by Materials.js::setGradient().
     */
    createSignTexture(number, title, accentHex)
    {
        const width = 512
        const height = 160
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')

        const texture = new THREE.Texture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace

        const draw = () =>
        {
            context.clearRect(0, 0, width, height)

            context.fillStyle = PALETTE.space
            context.beginPath()
            context.roundRect(4, 4, width - 8, height - 8, 28)
            context.fill()
            context.lineWidth = 5
            context.strokeStyle = accentHex
            context.stroke()

            context.textBaseline = 'middle'
            context.fillStyle = accentHex
            context.font = '700 72px Fredoka, ui-rounded, system-ui, sans-serif'
            context.fillText(number, 36, height / 2)

            context.fillStyle = PALETTE.cream
            context.font = '600 44px Fredoka, ui-rounded, system-ui, sans-serif'
            context.fillText(title, 176, height / 2)

            texture.needsUpdate = true
            for(const linked of texture.userData.linkedTextures ?? [])
                linked.needsUpdate = true
        }

        draw()

        // First paint uses the rounded-sans fallback; reflow with the real
        // brand font once it's actually loaded.
        if(document.fonts?.load)
            document.fonts.load('700 72px Fredoka').then(draw).catch(() => {})

        return texture
    }

    placeSign(area, number, title, accentHex, local)
    {
        const position = this.worldPosition(area, local)
        const texture = this.createSignTexture(number, title, accentHex)
        const geometry = new THREE.PlaneGeometry(1.8, 0.5625)
        const group = new THREE.Group()
        group.position.set(position[0], position[1], position[2])
        // Zones are approached from multiple directions (bridges, open
        // paths), so rather than guess one "correct" facing, build the sign
        // as two single-sided planes back to back - the second with a
        // horizontally mirrored UV - so it reads correctly from either side.
        const front = new THREE.Mesh(geometry, new THREE.MeshBasicNodeMaterial({ map: texture, transparent: true, side: THREE.FrontSide }))
        group.add(front)

        const backTexture = texture.clone()
        backTexture.wrapS = THREE.RepeatWrapping
        backTexture.repeat.x = -1
        backTexture.offset.x = 1
        backTexture.needsUpdate = true
        texture.userData.linkedTextures = [ backTexture ]
        const back = new THREE.Mesh(geometry, new THREE.MeshBasicNodeMaterial({ map: backTexture, transparent: true, side: THREE.BackSide }))
        group.add(back)

        group.lookAt(area.model.position.x, position[1], area.model.position.z)
        this.game.scene.add(group)
        return group
    }

    /**
     * Flat glow disc on the ground - the shared "magic circle" motif tying
     * each zone's landmark back to the same TerraGuessr identity. Uses a flat
     * circle (not a sphere) because the emissive gradient materials in
     * Materials.js are UV-radial, built for flat/disc geometry.
     */
    placeGlowDisc(area, materialName, radius, local)
    {
        const position = this.worldPosition(area, local)
        const geometry = new THREE.CircleGeometry(radius, 32)
        const material = this.game.materials.list.get(materialName)
        const mesh = new THREE.Mesh(geometry, material)
        mesh.rotation.x = -Math.PI / 2
        mesh.position.set(position[0], position[1], position[2])
        this.game.scene.add(mesh)
        return mesh
    }

    createFacetedGem(radius, hex)
    {
        const geometry = new THREE.IcosahedronGeometry(radius, 0)
        const material = new MeshDefaultMaterial({ colorNode: color(hex) })
        return new THREE.Mesh(geometry, material)
    }

    setKonzept()
    {
        const area = this.game.world.areas.konzept
        if(!area)
            return

        const base = { x: -2.81, y: -3.19, z: 7.43 }

        this.placeGlowDisc(area, 'emissiveLimeRadialGradient', 1.1, [ base.x, base.y + 0.02, base.z ])

        const gemBottom = this.createFacetedGem(0.42, PALETTE.cream)
        gemBottom.position.fromArray(this.worldPosition(area, [ base.x, base.y + 0.5, base.z ]))
        this.game.scene.add(gemBottom)

        const gemMiddle = this.createFacetedGem(0.3, PALETTE.lime)
        gemMiddle.position.fromArray(this.worldPosition(area, [ base.x, base.y + 1.15, base.z ]))
        gemMiddle.rotation.y = Math.PI / 5
        this.game.scene.add(gemMiddle)

        const gemTop = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.2, 0),
            this.game.materials.list.get('emissiveLimeRadialGradient')
        )
        gemTop.position.fromArray(this.worldPosition(area, [ base.x, base.y + 1.7, base.z ]))
        this.game.scene.add(gemTop)

        this.spinners.push((delta) => { gemTop.rotation.y += delta * 0.6 })

        this.placeSign(area, '01', 'KONZEPT', PALETTE.lime, [ 1.22, -1.7, 7.44 ])
    }

    setGameplay()
    {
        const area = this.game.world.areas.gameplay
        if(!area)
            return

        const landmarkLocal = [ -0.96, -1.2, -3.47 ]
        const landmarkWorld = this.worldPosition(area, landmarkLocal)

        this.placeGlowDisc(area, 'emissiveBlueRadialGradient', 1.3, [ landmarkLocal[0], -3.2, landmarkLocal[2] ])

        const globeResource = this.game.resources.earthOrigamiModel?.scene
        if(globeResource)
        {
            const merged = this.mergeByMaterial(globeResource)

            let anchor = null
            merged.traverse((child) =>
            {
                if(child.isMesh && child.material?.name === 'Blue')
                    anchor = child
            })

            const anchorBox = new THREE.Box3()
            if(anchor)
                anchorBox.setFromObject(anchor)
            else
                anchorBox.setFromObject(merged)
            const anchorSphere = anchorBox.getBoundingSphere(new THREE.Sphere())

            const targetRadius = 0.9
            const scale = anchorSphere.radius > 0 ? targetRadius / anchorSphere.radius : 1

            merged.scale.setScalar(scale)
            merged.position.set(
                -anchorSphere.center.x * scale,
                -anchorSphere.center.y * scale,
                -anchorSphere.center.z * scale
            )

            const pivot = new THREE.Group()
            pivot.add(merged)
            pivot.position.set(landmarkWorld[0], landmarkWorld[1], landmarkWorld[2])
            this.game.scene.add(pivot)

            this.spinners.push((delta) => { merged.rotation.y += delta * (2 * Math.PI / 75) })
        }

        this.placeSign(area, '02', 'GAMEPLAY', PALETTE.sky, [ -4.12, -1.3, -0.87 ])
    }

    setEngineering()
    {
        const area = this.game.world.areas.engineering
        if(!area)
            return

        // Anchored beside cauldronPhysicalDynamic (-2.00,-2.62,-0.38) - the
        // open paved clearing, not the gear/chain cluster further back
        // (0.1-1.3, 0.77-1.05, -3.8 to -5), which sits buried in the dense
        // procedural grass covering that part of the terrain and would make
        // an easy-to-reach landmark effectively invisible.
        this.placeGlowDisc(area, 'emissiveOrangeRadialGradient', 1.0, [ -1.3, -3.2, -0.6 ])

        const core = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.16, 1),
            this.game.materials.list.get('emissiveOrangeRadialGradient')
        )
        core.position.fromArray(this.worldPosition(area, [ -1.3, -1.8, -0.6 ]))
        this.game.scene.add(core)

        let pulse = 0
        this.spinners.push((delta) =>
        {
            pulse += delta
            core.scale.setScalar(1 + Math.sin(pulse * 2) * 0.12)
        })

        this.placeSign(area, '03', 'ENGINEERING', PALETTE.amber, [ -4.14, -1.3, 0.04 ])
    }

    setQualitaet()
    {
        const area = this.game.world.areas.qualitaet
        if(!area)
            return

        // XZ reused from the now-removed cookie prop (an already-clear, open
        // spot); Y re-anchored to the zone's actual floor level (matching
        // blowerPhysicalDynamic.001/tablePhysicalDynamic) since that prop's
        // own counter/pedestal was removed along with it.
        const base = { x: -1.82, y: -2.75, z: -1.25 }

        // emissiveWhiteRadialGradient is tuned very bright/non-normalized for
        // its original use elsewhere - looks blown-out as a calm ground
        // disc, so reuse the lime gradient here too (proven contained look
        // in Konzept); the ring + checkmark carry this zone's own identity.
        this.placeGlowDisc(area, 'emissiveLimeRadialGradient', 1.1, [ base.x, base.y, base.z ])

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.55, 0.12, 6, 12),
            new MeshDefaultMaterial({ colorNode: color(PALETTE.cream) })
        )
        ring.position.fromArray(this.worldPosition(area, [ base.x, base.y + 0.9, base.z ]))
        ring.lookAt(area.model.position.x, ring.position.y, area.model.position.z)
        this.game.scene.add(ring)

        // Checkmark tick, built from two short faceted boxes
        const tickMaterial = this.game.materials.list.get('emissiveLimeRadialGradient')
        const tickShort = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.12), tickMaterial)
        tickShort.position.fromArray(this.worldPosition(area, [ base.x - 0.12, base.y + 0.78, base.z + 0.12 ]))
        tickShort.rotation.z = Math.PI / 4
        this.game.scene.add(tickShort)

        const tickLong = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.56, 0.12), tickMaterial)
        tickLong.position.fromArray(this.worldPosition(area, [ base.x + 0.08, base.y + 0.95, base.z + 0.12 ]))
        tickLong.rotation.z = -Math.PI / 4
        this.game.scene.add(tickLong)

        this.spinners.push((delta) => { ring.rotation.y += delta * 0.3 })

        this.placeSign(area, '04', 'QUALITÄT', PALETTE.lime, [ base.x + 0.7, base.y + 1.3, base.z ])
    }

    /**
     * Merge a loaded scene's meshes by material (same optimization the real
     * TerraGuessr app applies to this exact model: ~214 authored facets down
     * to ~7 draw calls) so one landmark doesn't blow the world's draw-call
     * budget.
     */
    mergeByMaterial(sourceScene)
    {
        const source = sourceScene.clone(true)
        source.updateMatrixWorld(true)

        const groups = new Map()
        source.traverse((child) =>
        {
            if(!child.isMesh)
                return

            const key = child.material?.name || child.material?.uuid || 'default'
            if(!groups.has(key))
                groups.set(key, { material: child.material, geometries: [] })

            const geometry = child.geometry.clone()
            geometry.applyMatrix4(child.matrixWorld)

            // Some facets are flat-colored with no "uv" attribute - mergeGeometries
            // requires identical attribute sets across a group, so pad it with zeros.
            if(!geometry.getAttribute('uv'))
            {
                const count = geometry.getAttribute('position').count
                geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2))
            }

            groups.get(key).geometries.push(geometry)
        })

        const merged = new THREE.Group()
        for(const { material, geometries } of groups.values())
        {
            const mergedGeometry = mergeGeometries(geometries, false)
            for(const geometry of geometries)
                geometry.dispose()

            if(!mergedGeometry)
                continue

            merged.add(new THREE.Mesh(mergedGeometry, material))
        }

        return merged
    }
}
