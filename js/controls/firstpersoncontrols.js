class FirstPersonControls {

    constructor(camera, element) {
        this.camera = camera
        this.element = element

        this.mouseSensitivity = 1
        this.moveSpeed = 2

        this._moveDirection = new THREE.Vector3()
        this._sideAxis = new THREE.Vector3(0, 1, 0)

        this._controlsActive = false

        this.pressedClick = false

        this._initListeners()
    }

    async _initPointerLock() {
        this.element.requestPointerLock = this.element.requestPointerLock ||
            this.element.mozRequestPointerLock ||
            this.element.webkitRequestPointerLock
        if (this.element.requestPointerLock) {
            this.lastPointerLockInitTime = Date.now()
            await this.element.requestPointerLock()
        }

    }

    get inPointerlock() {
        return document.pointerLockElement == this.element
    }

    _removePointerLock() {
        document.exitPointerLock = document.exitPointerLock ||
            document.mozExitPointerLock ||
            document.webkitExitPointerLock
        if (document.exitPointerLock) {
            document.exitPointerLock()
            this.lastPointerLockInitTime = null
        }
    }

    _onMouseMove(event) {
        if (!this._controlsActive) {
            return
        }

        this.camera.rotation.order = "YXZ"
        this.camera.rotation.y -= event.movementX * 0.001 * this.mouseSensitivity
        this.camera.rotation.x -= event.movementY * 0.001 * this.mouseSensitivity

        if (this.camera.rotation.x > Math.PI / 2 - 0.001) {
            this.camera.rotation.x = Math.PI / 2 - 0.001
        } else if (this.camera.rotation.x < -Math.PI / 2 + 0.001) {
            this.camera.rotation.x = -Math.PI / 2 + 0.001
        }
    }

    _onKeyDown(event) {
        if (!event.key) return

        if (event.key.toUpperCase() == "W" || event.key == "ArrowUp") {
            this.movingForwards = true
        }

        if (event.key.toUpperCase() == "S" || event.key == "ArrowDown") {
            this.movingBackwards = true
        }

        if (event.key.toUpperCase() == "A" || event.key == "ArrowLeft") {
            this.movingLeft = true
        }

        if (event.key.toUpperCase() == "D" || event.key == "ArrowRight") {
            this.movingRight = true
        }
    }

    _onKeyUp(event) {
        if (!event.key) return

        if (event.key.toUpperCase() == "W" || event.key == "ArrowUp") {
            this.movingForwards = false
        }

        if (event.key.toUpperCase() == "S" || event.key == "ArrowDown") {
            this.movingBackwards = false
        }

        if (event.key.toUpperCase() == "A" || event.key == "ArrowLeft") {
            this.movingLeft = false
        }

        if (event.key.toUpperCase() == "D" || event.key == "ArrowRight") {
            this.movingRight = false
        }
    }

    cancelMovement() {
        this.movingForwards = false
        this.movingBackwards = false
        this.movingLeft = false
        this.movingRight = false
    }

    _onClick() {
        if (!this.inPointerlock) {
            return
        }

        if (this.lastPointerLockInitTime) {
            const timeDelta = Date.now() - this.lastPointerLockInitTime
            if (timeDelta < 1000) {
                return
            }
        }

        this.pressedClick = true
    }

    _initListeners() {
        window.camera = this.camera

        this.element.addEventListener("mousedown", () => {
            if (!this._controlsActive) {
                this._initPointerLock()
            }
        })

        this.element.addEventListener("click", event => this._onClick(event))   
        this.element.addEventListener("mousemove", event => this._onMouseMove(event))   
        addEventListener("keydown", event => this._onKeyDown(event))
        addEventListener("keyup", event => this._onKeyUp(event))

        const onLockChange = () => {
            if (document.pointerLockElement === this.element ||
                document.mozPointerLockElement === this.element ||
                document.webkitPointerLockElement === this.element) {

                this._controlsActive = true

            } else {
                this._controlsActive = false
                Menu.open()
            }
        }

        document.addEventListener("pointerlockchange", onLockChange)
        document.addEventListener("mozpointerlockchange", onLockChange)
        document.addEventListener("webkitpointerlockchange", onLockChange)
    }

    update() {
        this.pressedClick = false
        if (sceneManager.blockInputs) {
            return
        }

        this.camera.getWorldDirection(this._moveDirection)
        this._moveDirection.y = 0
        this._moveDirection.normalize()
        this._moveDirection.multiplyScalar(this.moveSpeed * 0.05)

        if (this.movingForwards) {
            this.camera.position.add(this._moveDirection)
        }

        this._moveDirection.applyAxisAngle(this._sideAxis, Math.PI)
        if (this.movingBackwards) {
            this.camera.position.add(this._moveDirection)
        }

        this._moveDirection.applyAxisAngle(this._sideAxis, -Math.PI / 2)
        if (this.movingLeft) {
            this.camera.position.add(this._moveDirection)
        }

        this._moveDirection.applyAxisAngle(this._sideAxis, Math.PI)
        if (this.movingRight) {
            this.camera.position.add(this._moveDirection)
        }
    }

}