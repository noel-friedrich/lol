class Crosshair {

    get defaultSizePx() {
        return Math.min(window.innerWidth, window.innerHeight) * 0.03
    }

    constructor() {
        this.element = this._initElement()
        this.size = 1
        this._desiredSizePx = this.size * this.defaultSizePx
        this._sizePx = this._desiredSizePx
        this.adaptSpeed = 0.2
        this.updateElement()
    }

    _initElement() {
        const element = document.createElement("div")
        element.style.position = "fixed"
        element.style.zIndex = 49
        element.style.top = "50%"
        element.style.left = "50%"
        element.style.transform = "translate(-50%, -50%)"
        element.style.border = "1px solid gray"
        element.style.borderRadius = "100%"
        document.body.appendChild(element)
        return element
    }

    hide() {
        this.element.style.display = "none"
    }

    show() {
        this.element.style.display = "block"
    }

    updateElement() {
        this.element.style.width = `${this._sizePx}px`
        this.element.style.height = `${this._sizePx}px`
    }

    update() {
        this._desiredSizePx = this.size * this.defaultSizePx
        const sizeDelta = this._desiredSizePx - this._sizePx

        if (Math.floor(Math.abs(sizeDelta)) > 0) {
            this._sizePx += sizeDelta * this.adaptSpeed
            this.updateElement()
        }
    }

}