import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { Events } from '../Events.js'
import { clamp, smallestAngle } from '../utilities/maths.js'

/**
 * Third-person character controller built on a dynamic Rapier capsule body.
 *
 * It exposes the same kind of state the rest of the game used to read from the
 * vehicle (`position`, `velocity`, `forward`, `speed`, `xzSpeed`,
 * `forwardSpeed`, `yRotation`, `moveTo`, `activate`/`deactivate` and a
 * `chassis.physical.body` reference) so that world systems (camera, foliage,
 * leaves, tornado, explosions, areas, title) keep working unchanged.
 *
 * The physics body stays upright (rotations locked) and only translates. The
 * facing direction (`yRotation`) is computed from the movement input and is
 * applied to the visual model, not to the physical capsule.
 */
export class PhysicsCharacter
{
    constructor()
    {
        this.game = Game.getInstance()

        this.events = new Events()

        // Dimensions (total height ≈ 1.9, matching the puppet-kid model)
        this.radius = 0.3
        this.halfHeight = 0.65
        this.centerOffsetY = this.halfHeight + this.radius

        // Locomotion parameters (game units / game second)
        this.walkSpeed = 3.2
        this.runSpeed = 7.5
        this.acceleration = 26
        this.deceleration = 40
        this.turnSpeed = 11
        this.jumpVelocity = 8.5
        this.groundProbe = this.halfHeight + this.radius + 0.2

        // State vectors (mirrors the old vehicle API)
        this.position = new THREE.Vector3()
        this.quaternion = new THREE.Quaternion()
        this.velocity = new THREE.Vector3()
        this.direction = new THREE.Vector3(0, 0, 1)
        this.forward = new THREE.Vector3(0, 0, 1)
        this.sideward = new THREE.Vector3(1, 0, 0)
        this.upward = new THREE.Vector3(0, 1, 0)
        this.speed = 0
        this.xzSpeed = 0
        this.forwardSpeed = 0
        this.forwardRatio = 1
        this.goingForward = true
        this.yRotation = 0

        // Input intent, consumed from Player each frame
        this.moveInput = new THREE.Vector2()
        this.moveMagnitude = 0
        this.sprinting = false
        this.jumpQueued = false

        // Internal motion state
        this.currentSpeed = 0
        this.movementDirection = new THREE.Vector2(0, 1)
        this.grounded = false
        this.wasGrounded = true
        this.fallVelocity = 0

        this.setBody()

        if(this.game.debug.active)
            this.setDebug()

        this.game.ticker.events.on('tick', () =>
        {
            this.updatePrePhysics()
        }, 2)

        this.game.ticker.events.on('tick', () =>
        {
            this.updatePostPhysics()
        }, 5)
    }

    setBody()
    {
        this.chassis = {}

        const object = this.game.objects.add(
            null,
            {
                type: 'dynamic',
                position: new THREE.Vector3(0, this.centerOffsetY + 4, 0),
                friction: 0.2,
                restitution: 0,
                linearDamping: 0,
                angularDamping: 0,
                canSleep: false,
                waterGravityMultiplier: 0,
                colliders:
                [
                    { shape: 'capsule', mass: 1.5, parameters: [ this.halfHeight, this.radius ], category: 'object' },
                ],
                onCollision: (force, position) =>
                {
                    this.game.audio.groups.get('hitDefault').playRandomNext(force, position)
                }
            }
        )

        this.chassis.physical = object.physical
        this.chassis.mass = this.chassis.physical.body.mass()

        // Keep the capsule upright at all times
        this.chassis.physical.body.setEnabledRotations(false, false, false, true)
    }

    setDebug()
    {
        this.debugPanel = this.game.physics.debugPanel.addFolder({
            title: 'Character',
            expanded: true,
        })

        this.debugPanel.addBinding(this, 'walkSpeed', { min: 0.5, max: 10, step: 0.1 })
        this.debugPanel.addBinding(this, 'runSpeed', { min: 1, max: 20, step: 0.1 })
        this.debugPanel.addBinding(this, 'acceleration', { min: 1, max: 100, step: 1 })
        this.debugPanel.addBinding(this, 'deceleration', { min: 1, max: 100, step: 1 })
        this.debugPanel.addBinding(this, 'turnSpeed', { min: 1, max: 30, step: 0.5 })
        this.debugPanel.addBinding(this, 'jumpVelocity', { min: 1, max: 20, step: 0.5 })
    }

    moveTo(position, rotation = 0)
    {
        this.yRotation = rotation

        const translation = {
            x: position.x,
            y: position.y + this.centerOffsetY,
            z: position.z
        }

        this.chassis.physical.body.setTranslation(translation)
        this.chassis.physical.body.setLinvel({ x: 0, y: 0, z: 0 })
        this.chassis.physical.body.setAngvel({ x: 0, y: 0, z: 0 })

        // Keep the reset position in sync (used when the character falls in water)
        this.chassis.physical.initialState.position = translation
        this.chassis.physical.initialState.rotation = { x: 0, y: 0, z: 0, w: 1 }

        this.currentSpeed = 0
        this.fallVelocity = 0
        this.grounded = false

        this.position.copy(position)
        this.velocity.set(0, 0, 0)
        this.updateOrientation()
    }

    activate()
    {
        this.chassis.physical.body.setLinvel({ x: 0, y: 0, z: 0 })
        this.chassis.physical.body.setAngvel({ x: 0, y: 0, z: 0 })
        this.chassis.physical.body.setEnabled(true)
        this.currentSpeed = 0
    }

    deactivate()
    {
        this.chassis.physical.body.setEnabled(false)
    }

    updateOrientation()
    {
        this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yRotation)
        this.forward.set(Math.sin(this.yRotation), 0, Math.cos(this.yRotation))
        this.sideward.set(Math.cos(this.yRotation), 0, - Math.sin(this.yRotation))
        this.upward.set(0, 1, 0)
    }

    updatePrePhysics()
    {
        const delta = this.game.ticker.deltaScaled

        // Smooth speed (acceleration / deceleration)
        const targetSpeed = (this.sprinting ? this.runSpeed : this.walkSpeed) * this.moveMagnitude
        const rate = targetSpeed > this.currentSpeed ? this.acceleration : this.deceleration
        this.currentSpeed += (targetSpeed - this.currentSpeed) * Math.min(1, rate * delta)

        if(this.currentSpeed < 0.001 && this.moveMagnitude === 0)
            this.currentSpeed = 0

        // Natural rotation toward movement direction (and remember the direction
        // so the character keeps sliding to a stop after the input is released)
        if(this.moveMagnitude > 0.05)
        {
            const direction = this.moveInput.length() > 0.0001 ? this.moveInput.clone().normalize() : this.movementDirection
            this.movementDirection.copy(direction)

            const targetYaw = Math.atan2(direction.x, direction.y)
            const angleDelta = smallestAngle(this.yRotation, targetYaw)
            const maxTurn = this.turnSpeed * delta
            this.yRotation += clamp(angleDelta, - maxTurn, maxTurn)
            this.updateOrientation()
        }

        // Read current vertical velocity (gravity is applied by the world)
        const currentLinvel = this.chassis.physical.body.linvel()
        let verticalVelocity = currentLinvel.y

        // Jump
        if(this.jumpQueued && this.grounded)
        {
            verticalVelocity = this.jumpVelocity
            this.grounded = false
        }
        this.jumpQueued = false

        // Apply horizontal velocity (in the movement direction), preserving vertical
        this.chassis.physical.body.setLinvel({
            x: this.movementDirection.x * this.currentSpeed,
            y: verticalVelocity,
            z: this.movementDirection.y * this.currentSpeed
        })
    }

    updatePostPhysics()
    {
        const body = this.chassis.physical.body
        const bodyPosition = body.translation()

        // Feet position (body center minus capsule half height)
        const newPosition = new THREE.Vector3(bodyPosition.x, bodyPosition.y - this.centerOffsetY, bodyPosition.z)

        this.velocity = newPosition.clone().sub(this.position)
        this.direction = this.velocity.clone()
        if(this.direction.lengthSq() > 0.000001)
            this.direction.normalize()
        this.position.copy(newPosition)

        this.speed = this.velocity.length() / this.game.ticker.deltaScaled
        this.xzSpeed = Math.hypot(this.velocity.x, this.velocity.z) / this.game.ticker.deltaScaled

        this.forwardRatio = this.direction.dot(this.forward)
        this.goingForward = this.forwardRatio > 0
        this.forwardSpeed = this.speed * this.forwardRatio

        this.fallVelocity = this.velocity.y / this.game.ticker.deltaScaled

        // Ground detection via a short downward ray (excluding our own capsule)
        this.grounded = this.testGround()

        // Landing event (for potential future use)
        if(this.grounded && !this.wasGrounded)
            this.events.trigger('land')

        this.wasGrounded = this.grounded
    }

    testGround()
    {
        const body = this.chassis.physical.body
        const bodyPosition = body.translation()

        const ray = new this.game.RAPIER.Ray(
            { x: bodyPosition.x, y: bodyPosition.y, z: bodyPosition.z },
            { x: 0, y: - 1, z: 0 }
        )

        const hit = this.game.physics.world.castRay(
            ray,
            this.groundProbe,
            true,
            undefined,
            undefined,
            this.chassis.physical.colliders[0]
        )

        return hit !== null
    }
}
