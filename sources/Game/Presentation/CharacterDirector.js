import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from '../Game.js'
import { smallestAngle } from '../utilities/maths.js'

/**
 * Automated character movement between presentation stations.
 *
 * Reuses PhysicsCharacter as-is: every tick it feeds `moveInput`/
 * `moveMagnitude`/`sprinting` towards the next waypoint, exactly the way
 * Player.js does from keyboard/gamepad input (see Player.js::
 * updatePrePhysics()). The capsule still accelerates, turns, collides with
 * the world and drives the walk/run animation through the normal physics
 * and VisualCharacter pipeline - this class never teleports the character
 * mid-walk, it only ever *steers* it, so routes are collision-safe for
 * free.
 *
 * Player.js must be put in STATE_LOCKED while a station walk is active
 * (done by PresentationController), otherwise manual input would fight
 * this steering on the very same fields.
 */
export class CharacterDirector
{
    constructor()
    {
        this.game = Game.getInstance()

        this.arrivalRadius = 0.18
        this.waypointRadius = 0.5
        this.slowRadius = 1.4

        this.tickHandler = null
        this.rotationTween = null
        this.resolveWalk = null
    }

    get character()
    {
        return this.game.physicalCharacter
    }

    /**
     * Walk through a polyline of world-space {x,z} waypoints (the first
     * waypoint is assumed to be roughly where the character already is),
     * then ease the final facing to `facingYRotation`. Resolves once
     * arrived (or once skip() forces an early resolution).
     */
    walkRoute(waypoints, facingYRotation)
    {
        this.cancel()

        return new Promise((resolve) =>
        {
            this.resolveWalk = resolve

            const character = this.character
            let waypointIndex = waypoints.length > 1 ? 1 : 0

            this.tickHandler = () =>
            {
                const target = waypoints[waypointIndex]
                const dx = target.x - character.position.x
                const dz = target.z - character.position.z
                const distance = Math.hypot(dx, dz)
                const isLastWaypoint = waypointIndex === waypoints.length - 1

                if(distance < (isLastWaypoint ? this.arrivalRadius : this.waypointRadius))
                {
                    if(!isLastWaypoint)
                    {
                        waypointIndex++
                        return
                    }

                    this.finishWalk(facingYRotation)
                    return
                }

                const direction = new THREE.Vector2(dx, dz)
                if(direction.lengthSq() > 0.0001)
                    direction.normalize()

                character.moveInput.copy(direction)
                character.moveMagnitude = isLastWaypoint ? Math.max(0.15, Math.min(1, distance / this.slowRadius)) : 1
                character.sprinting = false
            }

            this.game.ticker.events.on('tick', this.tickHandler, 1)
        })
    }

    finishWalk(facingYRotation)
    {
        this.stopTicking()

        const character = this.character
        character.moveInput.set(0, 0)
        character.moveMagnitude = 0
        character.sprinting = false

        if(typeof facingYRotation !== 'number')
        {
            this.settleWalk()
            return
        }

        const proxy = { angle: character.yRotation }
        const delta = smallestAngle(proxy.angle, facingYRotation)

        this.rotationTween = gsap.to(proxy, {
            angle: proxy.angle + delta,
            duration: 0.6,
            ease: 'power2.out',
            onUpdate: () =>
            {
                character.yRotation = proxy.angle
                character.updateOrientation()
            },
            onComplete: () =>
            {
                this.rotationTween = null
                this.settleWalk()
            }
        })
    }

    settleWalk()
    {
        const resolve = this.resolveWalk
        this.resolveWalk = null
        resolve?.()
    }

    stopTicking()
    {
        if(this.tickHandler)
        {
            this.game.ticker.events.off('tick', this.tickHandler)
            this.tickHandler = null
        }
    }

    /**
     * Silently abort whatever is in flight without resolving the pending
     * promise (internal use only - walkRoute()/teleportTo() call this to
     * defensively reset state before starting fresh).
     */
    cancel()
    {
        this.stopTicking()

        if(this.rotationTween)
        {
            this.rotationTween.kill()
            this.rotationTween = null
        }
    }

    /**
     * Cancel any in-flight walk, snap straight to a position/facing, and
     * resolve whatever walkRoute() promise was pending - used when a
     * transition is skipped/interrupted so the caller's `await` unblocks
     * immediately.
     */
    skip(point, facingYRotation)
    {
        this.cancel()

        const character = this.character
        character.moveInput.set(0, 0)
        character.moveMagnitude = 0
        character.sprinting = false
        const rotation = typeof facingYRotation === 'number' ? facingYRotation : character.yRotation
        character.moveTo(new THREE.Vector3(point.x, character.position.y + 0.2, point.z), rotation)

        this.settleWalk()
    }

    get isActive()
    {
        return !!this.tickHandler || !!this.rotationTween
    }
}
