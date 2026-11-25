import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from '../Game.js'

/**
 * Drives the existing View.cinematic sub-system (View.js::setCinematic) for
 * presentation purposes. This is deliberately not a new camera system:
 * View already blends `defaultCamera` towards an arbitrary position/target
 * pair whenever `cinematic.progress` is above 0 (see View.js::update()).
 * cinematic.start()/end() only animate that progress (the "cut in"/"cut
 * out" relative to the live orbit-follow camera); once progress reaches 1,
 * CameraDirector is free to keep tweening cinematic.position/target
 * directly for as long as presentation mode needs, and View.js renders
 * whatever pose results every frame.
 */
export class CameraDirector
{
    constructor()
    {
        this.game = Game.getInstance()
        this.tween = null
        this.resolveTween = null
    }

    get cinematic()
    {
        return this.game.view.cinematic
    }

    /**
     * Cut into cinematic framing from the live orbit-follow camera.
     */
    enter(framing)
    {
        this.cinematic.start(
            new THREE.Vector3(framing.position.x, framing.position.y, framing.position.z),
            new THREE.Vector3(framing.target.x, framing.target.y, framing.target.z)
        )
    }

    /**
     * Smoothly move the cinematic camera to a new framing while staying in
     * cinematic mode (used for station-to-station transitions).
     * Returns a promise resolved once the move completes (or is skipped).
     */
    flyTo(framing, { duration = 3, ease = 'power2.inOut' } = {})
    {
        this.kill()

        return new Promise((resolve) =>
        {
            this.resolveTween = resolve

            this.tween = gsap.timeline({
                onComplete: () =>
                {
                    this.tween = null
                    this.resolveTween = null
                    resolve()
                }
            })

            this.tween.to(this.cinematic.position, { ...framing.position, duration, ease }, 0)
            this.tween.to(this.cinematic.target, { ...framing.target, duration, ease }, 0)
        })
    }

    /**
     * Cancel any in-flight move, snap straight to a framing, and resolve
     * whatever flyTo() promise was pending - used when a transition is
     * skipped/interrupted so the caller's `await` unblocks immediately.
     */
    skip(framing)
    {
        const resolve = this.resolveTween
        this.kill()
        this.cinematic.position.set(framing.position.x, framing.position.y, framing.position.z)
        this.cinematic.target.set(framing.target.x, framing.target.y, framing.target.z)
        resolve?.()
    }

    kill()
    {
        if(this.tween)
        {
            this.tween.kill()
            this.tween = null
        }
        this.resolveTween = null
    }

    get isMoving()
    {
        return !!this.tween
    }

    /**
     * Cut back out to the live orbit-follow camera (exploration mode).
     */
    exit()
    {
        this.kill()
        this.cinematic.end()
    }
}
