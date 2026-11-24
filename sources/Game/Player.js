import { Game } from './Game.js'
import gsap from 'gsap'
import * as THREE from 'three/webgpu'
import { Inputs } from './Inputs/Inputs.js'

export class Player
{
    static STATE_DEFAULT = 1
    static STATE_LOCKED = 2

    constructor()
    {
        this.game = Game.getInstance()

        this.state = Player.STATE_DEFAULT

        // Position (feet) and facing
        this.position = new THREE.Vector3()
        this.position2 = new THREE.Vector2()
        this.rotationY = 0

        // Scratch vectors (camera-relative movement)
        this.cameraForward = new THREE.Vector3()
        this.cameraRight = new THREE.Vector3()
        this.moveDirection = new THREE.Vector3()

        this.setInputs()

        // Initial spawn
        const respawn = this.game.respawns.getDefault()
        this.position.copy(respawn.position)
        this.game.physicalCharacter.moveTo(respawn.position, respawn.rotation)

        this.game.ticker.events.on('tick', () =>
        {
            this.updatePrePhysics()
        }, 1)

        this.game.ticker.events.on('tick', () =>
        {
            this.updatePostPhysics()
        }, 6)
    }

    setInputs()
    {
        this.game.inputs.addActions([
            { name: 'forward',  categories: [ 'wandering', 'racing', 'cinematic' ], keys: [ 'Keyboard.ArrowUp', 'Keyboard.KeyW', 'Gamepad.up' ] },
            { name: 'right',    categories: [ 'wandering', 'racing', 'cinematic' ], keys: [ 'Keyboard.ArrowRight', 'Keyboard.KeyD', 'Gamepad.right' ] },
            { name: 'backward', categories: [ 'wandering', 'racing', 'cinematic' ], keys: [ 'Keyboard.ArrowDown', 'Keyboard.KeyS', 'Gamepad.down' ] },
            { name: 'left',     categories: [ 'wandering', 'racing', 'cinematic' ], keys: [ 'Keyboard.ArrowLeft', 'Keyboard.KeyA', 'Gamepad.left' ] },
            { name: 'sprint',   categories: [ 'wandering', 'racing', 'cinematic' ], keys: [ 'Keyboard.ShiftLeft', 'Keyboard.ShiftRight', 'Gamepad.circle' ] },
            { name: 'jump',     categories: [ 'wandering', 'racing', 'cinematic' ], keys: [ 'Keyboard.Space', 'Gamepad.triangle' ] },
            { name: 'respawn',  categories: [ 'wandering' ],                         keys: [ 'Keyboard.KeyR', 'Gamepad.select' ] },
            { name: 'interact', categories: [ 'wandering', 'racing', 'cinematic' ], keys: [ 'Keyboard.Enter', 'Keyboard.KeyE', 'Keyboard.KeyF', 'Gamepad.cross' ] },
        ])

        // Respawn
        this.game.inputs.events.on('respawn', (action) =>
        {
            if(this.state !== Player.STATE_DEFAULT)
                return

            if(action.active)
                this.respawn()
        })

        // Jump (edge triggered: one press = one jump)
        this.game.inputs.events.on('jump', (action) =>
        {
            if(this.state !== Player.STATE_DEFAULT)
                return

            if(action.active)
                this.game.physicalCharacter.jumpQueued = true
        })

        // Nipple tap jump (touch)
        this.game.inputs.nipple.events.on('tap', () =>
        {
            if(this.state === Player.STATE_DEFAULT)
                this.game.physicalCharacter.jumpQueued = true

            this.game.inputs.nipple.jump()
        })
    }

    respawn(respawnName = null, callback = null)
    {
        this.game.overlay.show(() =>
        {
            if(typeof callback === 'function')
                callback()

            // Find respawn
            const respawn = respawnName ? this.game.respawns.getByName(respawnName) : this.game.respawns.getClosest(this.position)

            // Move the character
            this.game.physicalCharacter.moveTo(respawn.position, respawn.rotation)

            this.state = Player.STATE_DEFAULT
            this.game.overlay.hide()
        })
    }

    die()
    {
        this.state = Player.STATE_LOCKED

        gsap.delayedCall(2, () =>
        {
            this.respawn(null, () =>
            {
                this.state = Player.STATE_DEFAULT
            })
        })
    }

    updatePrePhysics()
    {
        if(this.state !== Player.STATE_DEFAULT)
        {
            this.game.physicalCharacter.moveInput.set(0, 0)
            this.game.physicalCharacter.moveMagnitude = 0
            this.game.physicalCharacter.sprinting = false
            return
        }

        const inputs = this.game.inputs

        // Camera-relative basis (matches the orbit camera)
        const theta = this.game.view.spherical.theta
        this.cameraForward.set(Math.sin(theta), 0, Math.cos(theta)).negate()
        this.cameraRight.set(Math.cos(theta), 0, - Math.sin(theta))

        let moveMagnitude = 0
        this.moveDirection.set(0, 0, 0)

        // Keyboard
        {
            const forward = inputs.actions.get('forward').active ? 1 : 0
            const backward = inputs.actions.get('backward').active ? 1 : 0
            const right = inputs.actions.get('right').active ? 1 : 0
            const left = inputs.actions.get('left').active ? 1 : 0

            this.moveDirection.addScaledVector(this.cameraForward, forward - backward)
            this.moveDirection.addScaledVector(this.cameraRight, right - left)

            if(this.moveDirection.lengthSq() > 1)
                this.moveDirection.normalize()

            moveMagnitude = this.moveDirection.length()
        }

        // Gamepad left joystick (analog, overrides keyboard direction)
        if(inputs.gamepad.joysticks.left.active)
        {
            const joystick = inputs.gamepad.joysticks.left

            this.moveDirection.set(0, 0, 0)
            this.moveDirection.addScaledVector(this.cameraForward, - joystick.y)
            this.moveDirection.addScaledVector(this.cameraRight, joystick.x)

            if(this.moveDirection.lengthSq() > 1)
                this.moveDirection.normalize()

            moveMagnitude = joystick.safeRadius
        }

        // Touch nipple (world-space direction)
        if(inputs.nipple.active && inputs.nipple.progress > 0)
        {
            this.moveDirection.set(Math.cos(inputs.nipple.targetAngle), 0, Math.sin(inputs.nipple.targetAngle))
            moveMagnitude = inputs.nipple.progress
        }

        // Write intent to the physics character
        this.game.physicalCharacter.moveInput.set(this.moveDirection.x, this.moveDirection.z)
        this.game.physicalCharacter.moveMagnitude = Math.min(1, moveMagnitude)
        this.game.physicalCharacter.sprinting = inputs.actions.get('sprint').active
    }

    updatePostPhysics()
    {
        // Position
        this.position.copy(this.game.physicalCharacter.position)
        this.position2.set(this.position.x, this.position.z)

        this.rotationY = this.game.physicalCharacter.yRotation

        // View > Focus point (look at the character's torso)
        this.game.view.focusPoint.trackedPosition.copy(this.position)
        this.game.view.focusPoint.trackedPosition.y += 1.0

        // Tracks > Focus point
        this.game.tracks.focusPoint.set(this.position.x, this.position.z)

        // Inputs touch joystick
        this.game.inputs.nipple.setCoordinates(this.position.x, this.position.y, this.position.z, this.rotationY)
    }
}
