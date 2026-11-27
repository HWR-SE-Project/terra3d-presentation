import * as THREE from 'three/webgpu'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/**
 * Self-contained 3D renderer for Slide 1's rising origami Earth horizon.
 * Reuses the already-loaded `earth-origami.glb` resource, merged by material
 * (~7 draw calls), lit with crisp cosmic studio lighting so the faceted ocean,
 * lime continents, snow-capped mountains, trees and white flowers pop against
 * the starry deep-indigo sky.
 *
 * Only runs its animation frame loop while Slide 1 is actively mounted and
 * visible — zero GPU cost on all other slides and during 3D exploration.
 */
export class TitleGlobe
{
    constructor(game)
    {
        this.game = game
        this.canvas = document.createElement('canvas')
        this.canvas.className = 'hero__globe-canvas'
        this.canvas.setAttribute('aria-hidden', 'true')

        this.host = null
        this.active = false
        this.rafId = null
        this.lastTime = 0
        this.initialized = false
        this.initPromise = null
        this.resizeObserver = null
        this.reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

        this.scene = null
        this.camera = null
        this.renderer = null
        this.globePivot = null
        this.globeMeshGroup = null
    }

    setReducedMotion(reduced)
    {
        this.reducedMotion = !!reduced
        if(this.reducedMotion)
        {
            this._stopLoop()
            this.renderOnce()
        }
        else if(this.active && this.initialized)
        {
            this._startLoop()
        }
    }

    mount(hostElement)
    {
        if(!hostElement)
            return

        this.host = hostElement
        if(this.canvas.parentElement !== hostElement)
            hostElement.appendChild(this.canvas)

        if(this.resizeObserver)
            this.resizeObserver.disconnect()

        this.resizeObserver = new ResizeObserver(() => this._syncSize())
        this.resizeObserver.observe(hostElement)

        this._ensureInit()
        this._syncSize()
        this.setActive(true)
    }

    unmount()
    {
        this.setActive(false)
        if(this.resizeObserver)
        {
            this.resizeObserver.disconnect()
            this.resizeObserver = null
        }
        if(this.canvas.parentElement)
            this.canvas.parentElement.removeChild(this.canvas)
        this.host = null
    }

    setActive(active)
    {
        this.active = !!active && !!this.host

        if(!this.active)
        {
            this._stopLoop()
            return
        }

        if(!this.initialized)
            return

        this._syncSize()
        this.renderOnce()

        if(!this.reducedMotion)
            this._startLoop()
    }

    _ensureInit()
    {
        if(this.initPromise)
            return this.initPromise

        this.initPromise = this._init()
        return this.initPromise
    }

    async _init()
    {
        const sourceScene = this.game?.resources?.earthOrigamiModel?.scene
        if(!sourceScene)
            return

        this.scene = new THREE.Scene()

        // Perspective camera tuned so the full unit-radius origami planet plus
        // its trees and mountain peaks (~1.34x ocean radius) sit cleanly inside
        // the square stage with comfortable breathing room on every side.
        this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30)
        this.camera.position.set(0, 0, 5.45)
        this.camera.lookAt(0, 0, 0)

        // Natural tactile studio lighting so the faceted origami planet reads
        // like a crafted miniature rather than a neon-lit render.
        const hemiLight = new THREE.HemisphereLight(0xf6f5f0, 0x1b2033, 1.15)
        this.scene.add(hemiLight)

        const keyLight = new THREE.DirectionalLight(0xfffcf5, 2.35)
        keyLight.position.set(-4.4, 5.0, 4.8)
        this.scene.add(keyLight)

        const fillLight = new THREE.DirectionalLight(0xc2d3e8, 0.65)
        fillLight.position.set(4.6, 1.4, 3.6)
        this.scene.add(fillLight)

        const rimLight = new THREE.DirectionalLight(0xdbe5d2, 0.52)
        rimLight.position.set(2.4, 3.8, -4.8)
        this.scene.add(rimLight)

        const merged = this._mergeByMaterial(sourceScene)

        // Center on the ocean sphere ("Blue") and compute its TRUE sphere radius
        // from the AABB half-extents (Box3.getBoundingSphere returns sqrt(3)*R).
        let anchor = null
        merged.traverse((child) =>
        {
            if(child.isMesh && child.material?.name === 'Blue')
                anchor = child
        })

        const anchorBox = new THREE.Box3()
        anchorBox.setFromObject(anchor ?? merged)
        const anchorCenter = anchorBox.getCenter(new THREE.Vector3())
        const anchorSize = anchorBox.getSize(new THREE.Vector3())
        const oceanRadius = Math.max(anchorSize.x, anchorSize.y, anchorSize.z) * 0.5

        const scale = oceanRadius > 0 ? 1 / oceanRadius : 1
        merged.scale.setScalar(scale)
        merged.position.set(
            -anchorCenter.x * scale,
            -anchorCenter.y * scale,
            -anchorCenter.z * scale
        )

        this.globeMeshGroup = new THREE.Group()
        this.globeMeshGroup.add(merged)

        // Frame the iconic continents & mountain peaks at a calm editorial angle.
        this.globePivot = new THREE.Group()
        this.globePivot.add(this.globeMeshGroup)
        this.globePivot.rotation.set(-0.22, 0.0, 0.08)
        this.globeMeshGroup.rotation.y = 3.18
        this.scene.add(this.globePivot)

        // Use WebGL2 backend on this secondary overlay canvas so it never
        // contends with the main world's WebGPU device while staying 100% on
        // the same three/webgpu module graph.
        this.renderer = new THREE.WebGPURenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            forceWebGL: true,
        })
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        this.renderer.outputColorSpace = THREE.SRGBColorSpace
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 1.15
        this.renderer.setClearColor(0x000000, 0)

        await this.renderer.init()

        this.initialized = true
        this._syncSize()
        this.renderOnce()

        if(this.active && !this.reducedMotion)
            this._startLoop()
    }

    _syncSize()
    {
        if(!this.host || !this.renderer || !this.camera)
            return

        const rect = this.host.getBoundingClientRect()
        const width = Math.max(1, Math.round(rect.width))
        const height = Math.max(1, Math.round(rect.height))

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(width, height, false)

        if(this.initialized)
            this.renderOnce()
    }

    renderOnce()
    {
        if(!this.initialized || !this.renderer || !this.scene || !this.camera)
            return

        this.renderer.render(this.scene, this.camera)
    }

    _startLoop()
    {
        if(this.rafId !== null)
            return

        this.lastTime = performance.now()
        const tick = (now) =>
        {
            if(!this.active)
            {
                this.rafId = null
                return
            }

            const delta = Math.min((now - this.lastTime) / 1000, 0.1)
            this.lastTime = now

            if(this.globeMeshGroup)
                this.globeMeshGroup.rotation.y += delta * 0.018

            this.renderOnce()
            this.rafId = requestAnimationFrame(tick)
        }

        this.rafId = requestAnimationFrame(tick)
    }

    _stopLoop()
    {
        if(this.rafId !== null)
        {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
    }

    _mergeByMaterial(sourceScene)
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
            {
                const mat = child.material.clone()
                mat.flatShading = true
                // Keep TerraGuessr's tactile low-poly palette balanced and natural
                if(mat.name === 'Green')
                    mat.color.setHex(0x7ac94c)
                else if(mat.name === 'Blue')
                    mat.color.setHex(0x2a5bc2)
                else if(mat.name === 'White')
                    mat.color.setHex(0xf4f3ee)
                mat.needsUpdate = true
                groups.set(key, { material: mat, geometries: [] })
            }

            const geometry = child.geometry.clone()
            geometry.applyMatrix4(child.matrixWorld)

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
