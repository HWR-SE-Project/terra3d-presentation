import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Visual representation of the TerraGuessr "Puppet Kid" character.
 *
 * Reuses the original asset (puppet-kid.glb) as-is: same textures, materials,
 * rig and authored animations (Idle, Walk, Run, Jump). It only drives the
 * skeleton with those clips and moves the model to match the physics body.
 *
 * The asset ships with an extra "Outline_Material" (inverted-hull toon
 * outline). That shell is not compatible with the project's custom
 * node-material pipeline, so it is hidden and the body meshes are shaded with
 * the standard `MeshDefaultMaterial` (drop shadows, core shadows, reveal).
 *
 * Character asset: "Puppet Kid (Free Demo)" by joaobaltieri
 * (https://sketchfab.com/joaobaltieri), licensed under CC-BY-4.0
 * (http://creativecommons.org/licenses/by/4.0/).
 */
export class VisualCharacter
{
    constructor(gltf)
    {
        this.game = Game.getInstance()

        this.setModel(gltf.scene)
        this.setAnimations(gltf.animations)

        // State
        this.currentState = 'idle'
        this.wasGrounded = true
        this.everGrounded = false
        this.transitionSpeed = 9

        // Screen-space position (foliage see-through)
        this.screenPosition = new THREE.Vector2(0, 0)

        this.tickCallback = () =>
        {
            this.update()
        }
        this.game.ticker.events.on('tick', this.tickCallback, 8)
    }

    setModel(model)
    {
        this.model = model

        this.model.traverse((child) =>
        {
            if(child.isMesh)
            {
                // Hide the toon outline shell (single-sided inverted hull)
                if(child.material && child.material.name === 'Outline_Material')
                {
                    child.visible = false
                    return
                }

                child.castShadow = true
                child.receiveShadow = true
            }
        })

        // Convert the authored standard materials to the project's node materials
        this.game.materials.updateObject(this.model)

        this.game.scene.add(this.model)
    }

    setAnimations(clips)
    {
        this.mixer = new THREE.AnimationMixer(this.model)

        const findClip = (name) =>
        {
            return clips.find((clip) => clip.name.toLowerCase() === name) ?? null
        }

        this.actions = {}
        this.targetWeights = {}

        for(const name of [ 'idle', 'walk', 'run', 'jump' ])
        {
            const clip = findClip(name)

            if(!clip)
                continue

            const action = this.mixer.clipAction(clip)

            if(name === 'jump')
            {
                action.setLoop(THREE.LoopOnce, 1)
                action.clampWhenFinished = true
            }
            else
            {
                action.setLoop(THREE.LoopRepeat, Infinity)
            }

            action.setEffectiveWeight(0)
            action.play()

            this.actions[name] = action
            this.targetWeights[name] = 0
        }

        // Fall back to idle if any clip is missing
        if(!this.actions.idle && Object.keys(this.actions).length > 0)
            this.actions.idle = this.actions[Object.keys(this.actions)[0]]
    }

    play(state)
    {
        if(state === this.currentState)
            return

        this.currentState = state

        // Restart the one-shot jump clip
        if(state === 'jump' && this.actions.jump)
            this.actions.jump.reset()

        for(const name in this.targetWeights)
            this.targetWeights[name] = name === state ? 1 : 0
    }

    update()
    {
        const physicalCharacter = this.game.physicalCharacter

        if(!physicalCharacter)
            return

        const delta = this.game.ticker.deltaScaled
        const grounded = physicalCharacter.grounded
        const moving = physicalCharacter.moveMagnitude > 0.05 && physicalCharacter.currentSpeed > 0.1

        // Detect landing (to arm the jump/fall state machine after initial spawn)
        if(grounded && !this.wasGrounded)
            this.everGrounded = true

        // Determine desired state
        let desired

        if(!grounded && this.everGrounded)
            desired = 'jump'
        else if(moving)
            desired = physicalCharacter.sprinting ? 'run' : 'walk'
        else
            desired = 'idle'

        this.play(desired)

        // Smooth weights toward targets
        for(const name in this.actions)
        {
            const action = this.actions[name]
            const target = this.targetWeights[name]
            const weight = action.getEffectiveWeight()
            action.setEffectiveWeight(weight + (target - weight) * Math.min(1, delta * this.transitionSpeed))
        }

        // Apply animation speed so feet roughly match ground speed
        if(this.actions.walk)
            this.actions.walk.setEffectiveTimeScale(this.effectiveTimeScale('walk'))

        if(this.actions.run)
            this.actions.run.setEffectiveTimeScale(this.effectiveTimeScale('run'))

        // Update skeleton
        this.mixer.update(delta)

        // Place model at the feet position, facing the movement direction
        this.model.position.copy(physicalCharacter.position)
        this.model.rotation.set(0, physicalCharacter.yRotation, 0)

        // Screen position for foliage see-through
        const screen = new THREE.Vector3(
            physicalCharacter.position.x,
            physicalCharacter.position.y + 0.9,
            physicalCharacter.position.z
        ).project(this.game.view.camera)

        this.screenPosition.x = screen.x * 0.5 + 0.5
        this.screenPosition.y = screen.y * - 0.5 + 0.5

        this.wasGrounded = grounded
    }

    effectiveTimeScale(name)
    {
        const physicalCharacter = this.game.physicalCharacter
        const referenceSpeed = name === 'run' ? physicalCharacter.runSpeed : physicalCharacter.walkSpeed
        const ratio = referenceSpeed > 0 ? physicalCharacter.currentSpeed / referenceSpeed : 1

        return THREE.MathUtils.clamp(ratio, 0.6, 1.6)
    }
}
