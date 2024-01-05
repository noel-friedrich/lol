class DeviceOrientationControls {

    static zee = new THREE.Vector3(0, 0, 1)
    static euler = new THREE.Euler()
    static q0 = new THREE.Quaternion()
    static q1 = new THREE.Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5))

    static setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {
        this.euler.set(beta, alpha, -gamma, 'YXZ')
        quaternion.setFromEuler(DeviceOrientationControls.euler)
        quaternion.multiply(this.q1)
        quaternion.multiply(this.q0.setFromAxisAngle(this.zee, -orient))
    }

    constructor(object, element) {
        this.object = object
        this.element = element
        this.object.rotation.reorder("YXZ")
    
        this.enabled = false
        this.pressingElement = false
    
        this.deviceOrientation = {}
        this.screenOrientation = 0
    
        this.alphaOffsetAngle = 0
        this.betaOffsetAngle = 0
        this.gammaOffsetAngle = 0

        this.currAlpha = 0
        this.currBeta = 0
        this.currGamma = 0

        this._initListeners()
    }

    enable() {
        this.enabled = true
    }

	_onDeviceOrientationChange(event) {
        if (event.gamma) {
            if (!this.enabled) {
                this.enable()
            }
            this.deviceOrientation = event
        }
	}

	_onScreenOrientationChange() {
		this.screenOrientation = window.orientation || 0
	}

    _onTouchStart(event) {
        this.pressingElement = true
        event.preventDefault()
	}

    _onTouchEnd(event) {
        this.pressingElement = false
	}

	_initListeners() {
		this._onScreenOrientationChange()
		window.addEventListener("orientationchange", (event) => this._onScreenOrientationChange(event), false)
		window.addEventListener("deviceorientation", (event) => this._onDeviceOrientationChange(event), false)

        this.element.addEventListener("touchstart", (event) => this._onTouchStart(event))
        this.element.addEventListener("touchend", (event) => this._onTouchEnd(event))
        this.element.addEventListener("contextmenu", (event) => event.preventDefault())
	}

	update() {
        if (sceneManager.blockInputs) {
            return
        }
        
        const degToRad = (deg) => deg / 180 * Math.PI
        let alpha = this.deviceOrientation.alpha ? degToRad(this.deviceOrientation.alpha) + this.alphaOffsetAngle : 0
        let beta = this.deviceOrientation.beta ? degToRad(this.deviceOrientation.beta) + this.betaOffsetAngle : 0
        let gamma = this.deviceOrientation.gamma ? degToRad(this.deviceOrientation.gamma) + this.gammaOffsetAngle : 0
        const orient = this.screenOrientation ? degToRad(this.screenOrientation) : 0

        this.currAlpha = alpha
        this.currBeta = beta
        this.currGamma = gamma

        DeviceOrientationControls.setObjectQuaternion(this.object.quaternion, alpha, beta, gamma, orient)
	}
}