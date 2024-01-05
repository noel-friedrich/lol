const joystickContainer = document.getElementById("joystick-container")
const joystickThumb = document.getElementById("joystick-thumb")

class TouchDragControls {

    constructor(camera, element, toggleDragModeButton) {
        this.active = false
        this.camera = camera
        this.element = element
        this.toggleDragModeButton = toggleDragModeButton
        this.sensitivity = 1

        this.joystick = new Joystick(joystickContainer, joystickThumb)
        
        this.startX = null
        this.startY = null

        this.maxDistance = null

        this.originalX = null
        this.originalY = null

        this._moveDirection = new THREE.Vector3()
        this._sideAxis = new THREE.Vector3(0, 1, 0)
        this.moveSpeed = 2

        this._initListeners()
    }

    _onTouchStart(event) {
        this.startX = event.touches[0].clientX
        this.startY = event.touches[0].clientY
        this.maxDistance = 0
        this.originalX = this.camera.rotation.x
        this.originalY = this.camera.rotation.y
    }

    _onTouchMove(event) {
        const dx = event.touches[0].clientX - this.startX
        const dy = event.touches[0].clientY - this.startY

        let distance = Math.sqrt(dx * dx + dy * dy)
        if (distance > this.maxDistance) {
            this.maxDistance = distance
        }

        if (!this.active || this.startX === null) return

        if (sceneManager.blockInputs) {
            return
        }

        this.camera.rotation.order = "YXZ"
        this.camera.rotation.y = this.originalY - dx * 0.005 * this.sensitivity
        this.camera.rotation.x = this.originalX - dy * 0.005 * this.sensitivity

        if (this.camera.rotation.x > Math.PI / 2 - 0.001) {
            this.camera.rotation.x = Math.PI / 2 - 0.001
        } else if (this.camera.rotation.x < -Math.PI / 2 + 0.001) {
            this.camera.rotation.x = -Math.PI / 2 + 0.001
        }
    }

    _onTouchEnd(event) {
        if (this.maxDistance <= 10) {
            sceneManager.keyboardMouseControls.pressedClick = true
        }

        if (!this.active) return

        this.startX = null
        this.startY = null
        this.maxDistance = null
        this.originalX = null
        this.originalY = null
    }

    _initListeners() {
        this.toggleDragModeButton.addEventListener("click", () => {
            this.active = !this.active
            if (this.active) {
                this.toggleDragModeButton.classList.remove("active")

                // remove camera roll
                DeviceOrientationControls.setObjectQuaternion(this.camera.quaternion, 0, Math.PI / 2, 0, 0)

                this.joystick.show()
            } else {
                this.toggleDragModeButton.classList.add("active")
            }
        })

        this.element.addEventListener("touchstart", e => this._onTouchStart(e))
        this.element.addEventListener("touchmove", e => this._onTouchMove(e))
        this.element.addEventListener("touchend", e => this._onTouchEnd(e))
    }

    update() {
        if (sceneManager.blockInputs) {
            return
        }

        this.camera.getWorldDirection(this._moveDirection)
        this._moveDirection.y = 0
        this._moveDirection.normalize()

        this._moveDirection.applyAxisAngle(this._sideAxis, -this.joystick.angle - Math.PI / 2)

        this._moveDirection.multiplyScalar(this.moveSpeed * 0.05 * this.joystick.magnitude)
        this.camera.position.add(this._moveDirection)
    }

}