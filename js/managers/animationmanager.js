class Easing {

    static easeInOut(t) {
        if ((t /= 1 / 2) < 1) return 1 / 2 * t * t
        return -1 / 2 * ((--t) * (t - 2) - 1)
    }

    static linear(t) {
        return t
    }

}

class CustomAnimation {

    constructor({
        duration = 1000,
        initFunc = undefined,
        updateFunc = undefined,
        easing = Easing.linear,
        endFunc = undefined,
        repeats = 0,
        repeating = false,
        backwards = false,
        alternateDirection = false,
        id = undefined
    }={}) {
        this.id = id
        this.duration = duration
        this.initFunc = initFunc
        this.updateFunc = updateFunc
        this.endFunc = endFunc
        this.easing = easing
        this.alternateDirection = alternateDirection
        this.backwards = backwards

        if (repeating) repeats = Infinity
        this.repeats = repeats

        this.startTime = null
        this.finished = false
        this.repeatsLeft = repeats
        this.goingBackwards = backwards
        this.calledInit = false
    }

    init() {
        this.startTime = Date.now()
        this.finished = false

        if (this.initFunc && !this.calledInit) {
            this.initFunc()
            this.calledInit = true
        }
    }

    end() {
        if (this.repeatsLeft > 0) {
            this.init()
            this.repeatsLeft--
            
            if (this.alternateDirection) {
                this.goingBackwards = !this.goingBackwards
            }

            return
        }

        this.finished = true
        this.startTime = null
        if (this.endFunc) {
            this.endFunc()
        }
    }

    update() {
        if (this.startTime === null || this.finished) {
            return
        }

        let t = (Date.now() - this.startTime) / this.duration
        if (this.goingBackwards) {
            t = (1 - t)
        }

        if (t > 1 || t < 0) {
            this.updateFunc(t > 1 ? 1 : 0)
            this.end()
        } else if (this.updateFunc) {
            t = this.easing ? this.easing(t) : t
            this.updateFunc(t)
        }
    }

}

class AnimationManager {

    constructor() {
        this.animations = []
    }

    get activeIds() {
        return this.animations.filter(a => !a.finished && a.id !== undefined).map(a => a.id)
    }

    removeFinishedAnimations() {
        this.animations = this.animations.filter(a => !a.finished)
    }

    update() {
        for (const animation of this.animations) {
            animation.update()
        }
        this.removeFinishedAnimations()
    }

    startAnimation(animation) {
        // if animation is already running, cancel
        if (animation.id && this.activeIds.includes(animation.id)) {
            return
        }

        this.animations.push(animation)
        window.a = this
        animation.init()
    }

}

const animationManager = new AnimationManager()