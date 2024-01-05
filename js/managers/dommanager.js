import { VRButton } from 'three/addons/webxr/VRButton.js'

class DomManager {

    _isTouchDeviceF() {
        return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0))
    }

    constructor() {
        this.toggleDragModeButton = document.getElementById("toggle-drag-mode-button")

        this.isTouchDevice = this._isTouchDeviceF()
    }

    init() {
        if (this.isTouchDevice) {
            this.toggleDragModeButton.style.display = "block"
            setTimeout(() => this.toggleDragModeButton.click(), 0)
        }

        this.crosshair = new Crosshair()
    }

    initVR(sceneManager) {
        document.body.appendChild(VRButton.createButton(sceneManager.renderer))
    }

    addToBody(element) {
        document.body.appendChild(element)
    }

    update(sceneManager) {
        if (this.isTouchDevice) {
            if (sceneManager.orientationControls.enabled) {
                this.toggleDragModeButton.style.display = "block"
            } else {
                this.toggleDragModeButton.style.display = "none"
            }
        }

        this.crosshair.update()
    }
    
}