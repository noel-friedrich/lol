import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

class SceneManager {

    constructor(domManager) {
        this.domManager = domManager
        this.objectsOfInterest = new Set()
        this.previousCameraPosition = new THREE.Vector3(0, 2.5, 0)

        this.pathBuilder = new PathBuilder()
        this.currFloorId = 646n
        this.currFloor = null

        this.searchInfo = null

        this.blockInputs = true
    }

    get roomId() {
        return this.pathBuilder.roomId
    }

    async changeFloor(newFloorId, {animationDuration=2000}={}) {
        return new Promise(resolve => {
            if (newFloorId == this.currFloorId) {
                return
            }
    
            const differenceSign = parseInt(this.currFloorId - newFloorId) * -1
            this.blockInputs = true
            const startFloorId = parseInt(this.currFloorId)
    
            const originalY = this.camera.position.y
            animationManager.startAnimation(new CustomAnimation({
                duration: animationDuration,
                easing: Easing.easeInOut,
                endFunc: () => {
                    this.camera.position.y = originalY
                    this.blockInputs = false
                    
                    this.currFloorId = newFloorId
                    this.pathBuilder = new PathBuilder()
                    this.currFloor.updateRooms()
                    RoomIndicator.update(this)

                    updateFloorChoice()

                    resolve()
                },
                updateFunc: (t) => {
                    let y = (originalY + t * 5 * differenceSign) % 5
                    console.log()
                    this.currFloorId = BigInt(Math.floor(startFloorId + differenceSign * t))
                    while (y < 0) y += 5
                    this.camera.position.y = y
                    RoomIndicator.update(this)
                }
            }))
        })
    }

    teleportToSearchEnd() {
        if (this.searchInfo == null) {
            return
        }

        this.pathBuilder = new PathBuilder(
            this.searchInfo.naivePath.slice(),
            this.searchInfo.path.slice(),
            this.searchInfo.roomId
        )

        this.currFloorId = this.searchInfo.floorId
        
        this.currFloor.updateRooms()
        RoomIndicator.update(this)
    }

    startSearch(searchInfo) {
        this.searchInfo = searchInfo
        this.currFloor.updateRooms()
    }

    stopSearch() {
        this.searchInfo = null
        this.currFloor.updateRooms()
    }

    initVR() {
        renderer.xr.enabled = true
    }

    makeRenderer() {
        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        return renderer
    }

    makeScene() {
        const scene = new THREE.Scene()
        scene.background = new THREE.Color().setRGB(1.0, 1.0, 1.0)
        scene.fog = new THREE.Fog(scene.background, 1, 500)
        return scene
    }

    makeCamera() {
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000)
        camera.position.set(0, new URLSearchParams(window.location.search).has("elevated") ? 12.8 : 1.8, 0)
        camera.roomPosition = new THREE.Vector2(0, 0)
        return camera
    }

    makeGltfLoader() {
        const gltfLoader = new GLTFLoader()
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")
        gltfLoader.setDRACOLoader(dracoLoader)
        return gltfLoader
    }
    
    addAmbientLight() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 3.3) // soft white light
        this.scene.add(ambientLight)
    }

    addLights() {
        this.addAmbientLight()
    }

    initControllers() {
        this.keyboardMouseControls = new FirstPersonControls(this.camera, this.renderer.domElement)
        this.orientationControls = new DeviceOrientationControls(this.camera, this.renderer.domElement)
        this.touchDragControls = new TouchDragControls(this.camera, this.renderer.domElement, this.domManager.toggleDragModeButton)
    }

    initRaycasting() {
        this.raycaster = new THREE.Raycaster()
        this.zeroVector = new THREE.Vector2()
    }

    makeOutlinePass() {
        const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera)
        outlinePass.visibleEdgeColor.set(new THREE.Color(0xccccff))
        outlinePass.edgeStrength = 10.0
        outlinePass.edgeThickness = 4.0
        outlinePass.edgeGlow = 1.0
        return outlinePass
    }

    makeRenderPass() {
        return new RenderPass(this.scene, this.camera)
    }

    makeComposer() {
        const composer = new EffectComposer(this.renderer)
        composer.addPass(this.renderPass)
        composer.addPass(this.outlinePass)
        return composer
    }

    init() {
        this.renderer = this.makeRenderer()
        this.scene = this.makeScene()
        this.camera = this.makeCamera()
        this.gltfLoader = this.makeGltfLoader()

        this.renderPass = this.makeRenderPass()
        this.outlinePass = this.makeOutlinePass()
        this.composer = this.makeComposer()

        this.addLights()
        this.initControllers()
        this.initRaycasting()

        this.currFloor = new LibraryFloor(6, this)
        this.currFloor.updateRooms()
    }
    
    get canvas() {
        if (this.renderer) {
            return this.renderer.domElement
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) {
            return
        }

        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
    
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    updateRaycasting() {
        this.raycaster.setFromCamera(this.zeroVector, this.camera)
        const intersects = this.raycaster.intersectObjects(Array.from(this.objectsOfInterest), false)

        if (intersects.length > 0) {
            const intersect = intersects[0]
            const object = intersect.object
            //this.outlinePass.selectedObjects = [object]
            
            if (object.visible) {
                this.domManager.crosshair.size = 0.5
                let clicked = !!(this.keyboardMouseControls.pressedClick)
                if (clicked && "action" in object) {
                    object.action(object, intersect)
                }
            }
        } else {
            this.domManager.crosshair.size = 1
            this.outlinePass.selectedObjects = []
        }
    }

    updateControls() {
        if (this.touchDragControls.active) {
            this.touchDragControls.update()
        } else if (this.orientationControls.enabled) {
            this.orientationControls.update()

            // to make joystick still update
            this.touchDragControls.update()
        }

        this.keyboardMouseControls.update()
    }

    exitControls() {
        this.keyboardMouseControls._removePointerLock()
    }

    update() {
        this.updateRaycasting()

        this.updateControls()

        for (let [x, z] of [["x", "z"], ["z", "x"]]) {
            if (this.camera.position[x] < -6.6 && Math.abs(this.camera.position[z]) > 0.7) {
                this.camera.position[x] = -6.6
            }
            if (this.camera.position[x] > 6.6 && Math.abs(this.camera.position[z]) > 0.7) {
                this.camera.position[x] = 6.6
            }
        }

        const changeRoom = (x, y, changeId) => {
            this.pathBuilder.addStop(changeId)
            RoomIndicator.update(this)

            this.camera.position.x -= x * 14
            this.camera.position.z -= y * 14
            this.camera.roomPosition.x += x
            this.camera.roomPosition.y += y

            this.currFloor.updateRooms()
        }

        const testOpenDoor = (x, y, changeId) => {
            const testBuilder = this.pathBuilder.copy()
            testBuilder.addStop(changeId)

            if (!BookGenerator.roomExists(testBuilder.roomId, this.currFloorId)) {
                if (x != 0) {
                    this.camera.position.x = 6.6 * x
                } else {
                    this.camera.position.z = 6.6 * y
                }
            }
        }

        for (let i = 0; i < 2; i++) {
            const maxDistance = i == 0 ? 7 : 6.6
            const func = i == 0 ? changeRoom : testOpenDoor
            
            if (this.camera.position.z < -maxDistance) func(0, -1, 0)
            if (this.camera.position.z > maxDistance) func(0, 1, 3)
            if (this.camera.position.x < -maxDistance) func(-1, 0, 1)
            if (this.camera.position.x > maxDistance) func(1, 0, 2)
        }

        this.previousCameraPosition.copy(this.camera.position)
    }

    render() {
        this.composer.render()
    }

    setLoop(loopingFunc) {
        this.renderer.setAnimationLoop(loopingFunc)
    }

}