class Joystick {

    constructor(container, thumb) {
        this.container = container
        this.thumb = thumb

        this.thumbX = 0
        this.thumbY = 0

        this._initListeners()
    }

    get angle() {
        return Math.atan2(this.thumbY, this.thumbX)
    }

    get magnitude() {
        return Math.sqrt(this.thumbX ** 2 + this.thumbY ** 2)
    }

    normalize() {
        let factor = 1 / this.magnitude
        this.thumbX *= factor
        this.thumbY *= factor
    }

    _onTouchMove(event) {
        let rect = this.container.getBoundingClientRect()
        let x = (event.touches[0].clientX - rect.left) / rect.width
        let y = (event.touches[0].clientY - rect.top) / rect.height

        this.thumbX = (x - 0.5) * 2
        this.thumbY = (y - 0.5) * 2

        if (this.magnitude > 1) {
            this.normalize()
        }

        this.updateThumbPos()
    }

    _onTouchEnd(event) {
        this.thumbX = 0
        this.thumbY = 0
        this.updateThumbPos()
    }

    updateThumbPos() {
        this.thumb.style.left = `${(this.thumbX + 1) / 2 * this.container.clientWidth}px`
        this.thumb.style.top = `${(this.thumbY + 1) / 2 * this.container.clientHeight}px`
    }

    _initListeners() {
        this.container.addEventListener("touchmove", e => this._onTouchMove(e))
        this.container.addEventListener("touchend", e => this._onTouchEnd(e))
    }

    show() {
        this.container.style.display = "block"
    }

    hide() {
        this.container.style.display = "none"
    }

}