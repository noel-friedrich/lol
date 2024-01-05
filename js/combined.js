

// -------- js/controls/deviceorientationcontrols.js --------

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

// -------- js/controls/firstpersoncontrols.js --------

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

// -------- js/controls/touchdragcontrols.js --------

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

// -------- js/controls/joystick.js --------

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

// -------- js/misc/pathbuilder.js --------

class PathBuilder {

    constructor(naivePath=[], path=[], roomId=undefined, currSum=undefined) {
        this.naivePath = naivePath
        this.path = path

        if (roomId === undefined) {
            this.cachedRoomId = RoomIndicator.generateId(this.path)
        } else {
            this.cachedRoomId = roomId
        }

        if (currSum === undefined) {
            this._currSum = this.cachedRoomId
            if (this.path.length > 0) {
                this._currSum -= 1n
            }
            if (this.path.length > 1) {
                this._currSum -= RoomIndicator.roomsAtDistance(BigInt(this.path.length - 1))
            }
        } else {
            this._currSum = currSum
        }
    }

    getPathId(move, lastmove) {
        if (lastmove === undefined) {
            return move
        } else {
            // will never return 3
            return (move + lastmove) % 4
        }
    }

    get roomId() {
        return this.cachedRoomId
    }

    copy() {
        return new PathBuilder(this.naivePath.slice(), this.path.slice(), this.cachedRoomId, this._currSum)
    }

    addStop(moveId) {
        const lastChangeId = this.naivePath.slice(-1)[0]

        if (moveId + lastChangeId == 3) {
            this.naivePath.pop()
            this.path.pop()
            this._currSum /= 3n
            
            if (this.path.length == 0) {
                this._currSum = 0n
                this.cachedRoomId = 0n
            } else {
                this.cachedRoomId = this._currSum + 1n
            }
            
            if (this.path.length > 1) {
                this.cachedRoomId += RoomIndicator.roomsAtDistance(BigInt(this.path.length - 1))
            }
        } else {
            this.naivePath.push(moveId)
            const newMoveId = this.getPathId(moveId, lastChangeId)
            this.path.push(newMoveId)

            const pathLengthMinus1 = BigInt(this.path.length - 1)
            this._currSum *= 3n
            this._currSum += BigInt(newMoveId)

            this.cachedRoomId = this._currSum + 1n
            if (this.path.length > 1) {
                this.cachedRoomId += RoomIndicator.roomsAtDistance(pathLengthMinus1)
            }
        }
    }

    static naiveToMod(naivePath) {
        const builder = new PathBuilder()
        for (let move of naivePath) {
            builder.addStop(move)
        }
        return builder.path
    }

    static toNaivePath(path) {
        let naivePath = []
        for (let i = 0; i < path.length; i++) {
            const last = naivePath[i - 1]
            if (last === undefined) {
                naivePath.push(path[i])
            } else {
                // 0,0 -> 0   0,1 -> 1   0,2 -> 2
                // 1,0 -> 3   1,1 -> 0   1,2 -> 1
                // 2,0 -> 2   2,1 -> 3   2,2 -> 0
                // 3,0 -> 1   3,1 -> 2   3,2 -> 3
                naivePath.push([
                    [0, 1, 2],
                    [3, 0, 1],
                    [2, 3, 0],
                    [1, 2, 3]
                ][last][path[i]])
            }
        }
        return naivePath
    }

    static compressPath(path) {
        let newPath = null
        for (let j = 0; j < path.length; j++) {
            newPath = []
            for (let i = 0; i < path.length; i++) {
                if (i < path.length - 1 && path[i] + path[i + 1] == 3) {
                    i++
                } else {
                    newPath.push(path[i])
                }
            }
            path = newPath
        }
        return path
    }

}

window.PathBuilder = PathBuilder

// -------- js/misc/crosshair.js --------

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

// -------- js/misc/roomindicator.js --------

class RoomIndicator {

    static element = document.getElementById("room-id")
    static moves = [
        new THREE.Vector2(0, -1),
        new THREE.Vector2(-1, 0),
        new THREE.Vector2(1, 0),
        new THREE.Vector2(0, 1)
    ]

    static roomsAtDistanceCache = new Map()

    static roomsAtDistance(n) {
        if (this.roomsAtDistanceCache.has(n)) {
            return this.roomsAtDistanceCache.get(n)
        }

        let sum = 0n
        let adder = 1n
        for (let i = 0 ; i < n; i++) {
            sum += adder
            adder *= 3n
        }

        const result = sum * 4n
        this.roomsAtDistanceCache.set(n, result)
        return result
    }

    static moveFromPathId(id) {
        return this.moves[id]
    }

    static pathIdFromMove(move) {
        if (move[0] ==  0 && move[1] == -1) return 0
        if (move[0] == -1 && move[1] ==  0) return 1
        if (move[0] ==  1 && move[1] ==  0) return 2
        if (move[0] ==  0 && move[1] ==  1) return 3
    }

    static generateId(path) {
        const pathLength = BigInt(path.length)
        let sum = 0n
        let factor = 1n
        for (let i = 0n; i < pathLength; i++) {
            const coefficient = BigInt(path[pathLength - 1n - i])
            sum += coefficient * factor 
            factor *= 3n
        }

        if (pathLength > 0n) {
            sum += 1n
        }

        if (pathLength > 1n) {
            sum += this.roomsAtDistance(pathLength - 1n)
        }

        return sum
    }

    static async generatePath(roomId) {
        if (roomId == 0n) {
            return []
        } else if (roomId <= 4n) {
            return [parseInt(roomId) - 1]
        } else {
            roomId -= 1n
        }

        const path = []

        let roomsAtShorterPath = null
        let steps = 0n

        ;{
            let sum = 0n
            let adder = 1n
            let prev = 1n
            while (true) {
                prev = roomsAtShorterPath
                sum += adder
                adder *= 3n
                roomsAtShorterPath = sum * 4n
                if (roomsAtShorterPath > roomId) {
                    roomsAtShorterPath = prev
                    break
                }
                steps++

                if (steps % 3000n == 0n) {
                    if (BookGenerator.stopCalculationFlag) {
                        throw new Error("Stopped Calculation")
                    }
                    await new Promise(resolve => setTimeout(resolve, 0))
                }
            }
        }

        roomId -= roomsAtShorterPath

        path.push(parseInt(roomId / (3n ** steps)))

        let addedPath = []
        for (let i = 0; i < steps; i++) {
            var moveId = roomId % 3n
            roomId /= 3n

            addedPath.push(parseInt(moveId))

            if (i % 3000 == 0) {
                if (BookGenerator.stopCalculationFlag) {
                    throw new Error("Stopped Calculation")
                }
                await new Promise(resolve => setTimeout(resolve, 0))
            }
        }

        return path.concat(addedPath.reverse())
    }

    static shortenId(id, length=30) {
        const halfMinus1 = Math.floor(length / 2 - 1)
        if (id.length > length) {
            id = id.slice(0, halfMinus1) + ".." + id.slice(id.length - halfMinus1, id.length)
        }
        return id
    }

    static update(sceneManager) {
        let roomId = sceneManager.roomId
        let stringId = roomId.toString(10)
        this.element.title = this.shortenId(stringId, 200)

        const shortId = this.shortenId(stringId, 20)
        const s = sceneManager.currFloorId.toString()
        const floorSuffix = s.endsWith("1") ? "st" : s.endsWith("2") ? "nd" : "th"
        this.element.innerHTML = `${sceneManager.currFloorId}${floorSuffix} Floor<br>Room#${shortId}`
        return roomId
    }

}

window.RoomIndicator = RoomIndicator

// -------- js/misc/bookgenerator.js --------

class BookGenerator {

    static alphabet = "abcdefghijklmnopqrstuvwxyz ,.\n"
    static stopCalculationFlag = false

    static numRoomsCacheAlphabetLength = -1
    static numRoomsCache = new Map()

    static getMaxBookId(floorId) {
        if (this.numRoomsCacheAlphabetLength == this.alphabet.length && this.numRoomsCache.has(floorId)) {
            return this.numRoomsCache.get(floorId)
        } else {
            if (this.numRoomsCacheAlphabetLength != this.alphabet.length) {
                this.numRoomsCache.clear()
                this.numRoomsCacheAlphabetLength = this.alphabet.length
            }

            // this potentially takes a long time to compute! that's why we're caching
            const numBooks = this.alphabetLength ** floorId
            this.numRoomsCache.set(floorId, numBooks)

            return numBooks
        }
    }

    static roomExists(roomId, floorId) {
        if (floorId < 1) {
            throw new Error("Floor cannot be smaller than 1")
        }

        const bookId = this.bookIdFromLocation(roomId, 0n, 0n, 0n)
        const numBooks = this.getMaxBookId(floorId)
        return bookId <= numBooks
    }

    static getMaxInstanceIdOnShelf(roomId, floorId, shelfId) {
        const delta = this.getMaxBookId(floorId) - this.bookIdFromLocation(roomId, shelfId, 0n, 0n)

        if (delta > 208n) {
            return 208n
        } else if (delta < 0n) {
            return 0n
        } else {
            return delta
        }
    }

    static stopCalculation() {
        this.stopCalculationFlag = true
    }

    static get alphabetLength() {
        return BigInt(this.alphabet.length)
    }

    static generateBook(bookId, length) {
        let bookContent = ""

        for (let i = 0n; i < length; i++) {
            let alphabetIndex = bookId % this.alphabetLength
            bookContent += this.alphabet[alphabetIndex]
            bookId -= alphabetIndex
            bookId /= this.alphabetLength
        }

        return bookContent
    }

    static bookIdFromLocation(roomId, shelfId, rowId, columnId) {
        // 26 books / column
        // 8 columns / shelf >>> 26*8 = 208 books / shelf
        // 8 shelves / room  >>> 26*8*8 = 1664 books / room
        return roomId * 1664n + shelfId * 208n + rowId * 26n + columnId
    }

    static bookFromLocation(roomId, shelfId, rowId, columnId, floorId) {
        if (!this.roomExists(roomId, floorId)) {
            throw new Error(`Room#${roomId} doesn't exist on floor ${floorId}`)
        }

        const bookId = this.bookIdFromLocation(roomId, shelfId, rowId, columnId)
        return this.generateBook(bookId, floorId)
    }

    static async bookIdFromContent(bookContent) {
        const floorId = BigInt(bookContent.length)

        let bookId = 0n
        let factor = 1n
        const factorFactor = this.alphabetLength
        for (let i = 0; i < bookContent.length; i++) {
            const letterIndex = i
            const letter = bookContent[letterIndex]
            const alphabetIndex = this.alphabet.indexOf(letter)
            if (alphabetIndex == -1) {
                throw new Error(`Unknown letter "${letter}" at index ${letterIndex}`)
            }

            bookId += factor * BigInt(alphabetIndex)
            factor *= factorFactor

            if (i % 1000 == 0) {
                await new Promise(resolve => setTimeout(resolve, 0))
                if (this.stopCalculationFlag) {
                    throw new Error("Stopped Calculation")
                }
            }
        }
        
        return {bookId, floorId}
    }

    static async searchBookById(bookId, floorId, {generatePaths = true}={}) {
        this.stopCalculationFlag = false
        const roomId = bookId / 1664n
        let remainder = bookId % 1664n

        const shelfId = remainder / 208n
        remainder = remainder % 208n

        const rowId = remainder / 26n
        remainder = remainder % 26n

        const columnId = remainder

        if (generatePaths) {
            const path = await RoomIndicator.generatePath(roomId)
            const naivePath = PathBuilder.toNaivePath(path)
            return {bookId, floorId, roomId, shelfId, rowId, columnId, path, naivePath}
        }

        return {bookId, floorId, roomId, shelfId, rowId, columnId}
    }

    static async searchBook(bookContent, {generatePaths = true}={}) {
        this.stopCalculationFlag = false
        const {bookId, floorId} = await this.bookIdFromContent(bookContent)
        return await this.searchBookById(bookId, floorId, {generatePaths})
    }

}

window.BookGenerator = BookGenerator

// -------- js/misc/comments.js --------

class Comments {

    static numCommentsOutput = document.getElementById("num-comments-output")
    static loadingCommentsDisplay = document.getElementById("loading-comments-display")
    static commentsContainer = document.getElementById("comments-container")

    static commentAuthorInput = document.getElementById("comment-author-input")
    static commentContentInput = document.getElementById("comment-content-input")
    static commentSubmitButton = document.getElementById("comment-submit-button")
    static commentErrorOutput = document.getElementById("comment-error-output")

    static currHash = null

    static async getBookIdHash(bookId) {
        let hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bookId.toString()))
        let hashArray = Array.from(new Uint8Array(hash))
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
    }

    static async getComments(bookId) {
        const hash = await this.getBookIdHash(bookId)
        this.currHash = hash

        const rawResponse = await fetch(`api/get_comments.php?bookid_hash=${hash}`)
        const response = await rawResponse.json()
        if (response.ok) {
            return response.comments
        } else {
            throw new Error(response.error)
        }
    }

    static makeCommentElement(commentData) {
        const commentElement = document.createElement("div")
        const profilePicture = document.createElement("div")
        const author = document.createElement("div")
        const content = document.createElement("div")

        commentElement.classList.add("comment")
        profilePicture.classList.add("profile-picture")
        author.classList.add("author")
        content.classList.add("content")

        author.textContent = `"${commentData.author}" commented (${commentData.create_time}):`
        content.textContent = commentData.content

        commentElement.appendChild(profilePicture)
        commentElement.appendChild(author)
        commentElement.appendChild(content)

        return commentElement
    }

    static setLoading(newState) {
        if (newState == true) {
            this.loadingCommentsDisplay.textContent = "Loading Comments..."
            this.loadingCommentsDisplay.style.display = "block"
            this.numCommentsOutput.textContent = "?"
        } else if (newState == false) {
            this.loadingCommentsDisplay.style.display = "none"
        }
    }

    static async load(bookId) {
        this.commentErrorOutput.textContent = ""
        
        try {
            this.commentsContainer.innerHTML = ""
            this.setLoading(true)
    
            const comments = await this.getComments(bookId)
            this.numCommentsOutput.textContent = comments.length
    
            for (let commentData of comments) {
                const commentElement = this.makeCommentElement(commentData)
                this.commentsContainer.appendChild(commentElement)
            }
    
            this.setLoading(false)
        } catch (e) {
            this.loadingCommentsDisplay.textContent = e.message
            this.loadingCommentsDisplay.style.display = "block"
            this.commentsContainer.innerHTML = ""
        }
    }

    static init() {
        const error = msg => {
            this.commentErrorOutput.textContent = msg == "noshow" ? "" : msg

            if (msg) {
                this.commentSubmitButton.disabled = true
            } else {
                this.commentSubmitButton.disabled = false
            }

            return {author: null, content: null}
        }

        const checkInputs = () => {
            if (this.currHash == null) {
                return error("noshow")
            }

            const author = this.commentAuthorInput.value
            const content = this.commentContentInput.value

            if (author.length == 0) {
                return error("noshow")
            }

            if (!/^[a-zA-Z.,\s]{1,64}$/.test(author)) {
                return error("Invalid Name. Name may only consist of 64 letters, spaces, periods or commas.")
            }

            if (content.length == 0) {
                return error("noshow")
            }

            if (!/^[a-zA-Z.,\n\s]{1,512}$/.test(content)) {
                return error("Invalid Comment. Comment may only consist of 512 letters, spaces, periods or commas.")
            }

            error("")
            return {author, content}
        }

        this.commentAuthorInput.oninput = checkInputs
        this.commentContentInput.oninput = checkInputs

        this.commentSubmitButton.onclick = async () => {
            const {author, content} = checkInputs()
            if (author == null) return

            const formData = new FormData()
            formData.append("author", author)
            formData.append("content", content)
            formData.append("bookid_hash", this.currHash)
        
            const rawResponse = await fetch("api/write_comment.php", {
                method: "POST",
                body: formData
            })

            const response = await rawResponse.json()
            
            if (response.ok) {
                this.commentErrorOutput.textContent = "Comment sent. After an admin has confirmed it, it will appear here. Thank you!"
                this.commentAuthorInput.value = ""
                this.commentContentInput.value = ""
            } else {
                this.commentErrorOutput.textContent = response.error
            }
        }
    }

}

// -------- js/misc/bookviewer.js --------

class BookViewer {

    static contentElement = document.getElementById("book-content")
    static idElement = document.getElementById("book-id")
    static container = document.getElementById("book-container")
    static book = document.getElementById("book")

    static _onNextCloseListeners = []

    static onNextClose(f) {
        this._onNextCloseListeners.push(f)
    }

    static isOpen = false
    static isAnimating = false

    static contentCache = null
    static bookIdCache = null

    static openBook(bookId) {
        this.idElement.textContent = `Book#${bookId}\non Floor#${sceneManager.currFloorId}`

        const bookContent = BookGenerator.generateBook(bookId, sceneManager.currFloorId)
        
        this.contentCache = bookContent
        this.bookIdCache = bookId

        this.contentElement.textContent = bookContent

        this.open()
        
        Comments.load(bookId)
    }

    static open() {
        if (this.isOpen || this.isAnimating) {
            return
        }

        this.book.animate([
            {opacity: 0, transform: "scale(0)"},
            {opacity: 1, transform: "scale(1)"},
        ], {
            duration: 500,
            easing: "ease-in"
        })

        this.container.animate([
            {opacity: 0},
            {opacity: 1},
        ], {
            duration: 500,
            easing: "ease-in"
        })

        this.isAnimating = true
        sceneManager.blockInputs = true
        setTimeout(() => this.isAnimating = false, 500)

        this.container.style.display = "flex"
        this.isOpen = true
        sceneManager.exitControls()
    }

    static async close(manualClose=true) {
        if (!this.isOpen || this.isAnimating) {
            return
        }

        if (manualClose) {
            stopRandomCarousel()
        }

        this.isOpen = false

        for (let f of this._onNextCloseListeners) {
            f()
        }

        this._onNextCloseListeners = []

        this.book.animate([
            {opacity: 1, transform: "scale(1)"},
            {opacity: 0, transform: "scale(0)"}
        ], {
            duration: 500,
            easing: "ease-out"
        })

        this.container.animate([
            {opacity: 1},
            {opacity: 0},
        ], {
            duration: 500,
            easing: "ease-out"   
        })

        this.isAnimating = true
        sceneManager.blockInputs = false

        await new Promise(resolve => setTimeout(resolve, 500))
        this.isAnimating = false

        if (this.isOpen) {
            return
        }

        this.container.style.display = "none"
    }

    static init() {
        sceneManager.canvas.addEventListener("click", event => {
            this.close()
        })

        document.addEventListener("keydown", event => {
            if (event.key == "Escape") {
                this.close()
            }
        })

        document.getElementById("download-book").onclick = () => {
            if (!this.contentCache || !this.isOpen) {
                return
            }

            downloadBook(this.contentCache, this.bookIdCache, sceneManager.currFloorId)
        }
    }

}

window.BookViewer = BookViewer

// -------- js/misc/menu.js --------

class Menu {

    static isOpen = true
    static container = document.querySelector(".main-menu-container")
    static transitionMs = 500 // needs to match css .main-menu-container transition period

    static get isClosed() {
        return !this.isOpen
    }

    static open() {
        if (this.isOpen || BookViewer.isAnimating || BookViewer.isOpen) {
            return
        }

        this.container.style.display = "flex"
        sceneManager.blockInputs = true
        updateFloorChoice()

        // dirty hack; container style display needs to be processed
        // before transition animations may be initiated. timeout
        // will (hopefully) let renderer process in between
        setTimeout(() => {
            this.container.style.opacity = 1
        }, 10)

        this.isOpen = true
    }

    static close() {
        if (this.isClosed) {
            return
        }

        this.container.style.opacity = 0
        sceneManager.blockInputs = false
        this.isOpen = false

        setTimeout(() => {
            this.container.style.display = "none"
        }, this.transitionMs)
    }

    static init() {
        sceneManager.canvas.addEventListener("click", event => {
            this.close()
        })
    }

}

window.Menu = Menu

// -------- js/misc/search.js --------

function initSearch() {

    function filterText(value) {
        if (searchMode == "content") {
            value = value.toLowerCase()
            value = value.replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue")
                .replaceAll("!", ".").replaceAll("?", ".").replaceAll("ß", "ss")
            return value.split("").filter(c => BookGenerator.alphabet.includes(c)).join("")
        } else if (searchMode == "bookid") {
            return value.split("").filter(c => "0123456789".includes(c)).join("")
        } else {
            throw new Error(`Searchmode "${searchMode}" is not implemented.`)
        }
    }

    async function upgradeSearchResult() {
        if (!searchResult) {
            return false
        }

        if (searchResult.path != undefined) {
            return true
        }

        try {
            calculatingShow.style.display = "block"
            await new Promise(resolve => setTimeout(resolve, 50))
            searchResult = await BookGenerator.searchBookById(searchResult.bookId, searchResult.floorId)
            calculatingShow.style.display = "none"
        } catch (e) {
            calculatingShow.style.display = "none"
            return false
        }

        return true
    }

    async function jumpToFloor() {
        if (!await upgradeSearchResult()) {
            return
        }

        Menu.close()
        sceneManager.stopSearch()

        if (sceneManager.currFloorId == searchResult.floorId) {
            await sceneManager.changeFloor(searchResult.floorId + 1n)
        }

        await sceneManager.changeFloor(searchResult.floorId)
        sceneManager.startSearch(searchResult)
    }

    async function teleportToRoom() {
        if (!await upgradeSearchResult()) {
            return
        }

        sceneManager.startSearch(searchResult)
        sceneManager.teleportToSearchEnd()
        Menu.close()
    }

    window.jumpToFloor = jumpToFloor
    window.teleportToRoom = teleportToRoom
    
    let timeout = null
    let searchTimeout = null

    let searchResult = null
    
    const searchElement = document.getElementById("search-input")
    const searchContainer = document.getElementById("search-container")
    const resultContainer = document.getElementById("results-container")
    const calculatingShow = document.getElementById("calculating-show")
    const modeSelector = document.getElementById("mode-selector")
    const modeButtons = modeSelector.querySelectorAll("button")

    let searchMode = "content"

    function chooseMode(mode) {
        for (let button of modeButtons) {
            const selected = button.dataset.mode == mode
            button.dataset.selected = selected
            if (selected) {
                searchElement.placeholder = button.dataset.description
                searchMode = button.dataset.mode
            }
        }
        searchElement.oninput()
    }

    for (let modeButton of modeButtons) {
        modeButton.onclick = () => chooseMode(modeButton.dataset.mode)
    }
    
    async function search(query) {
        if (query.length == 0) {
            resultContainer.style.display = "none"
            return
        }
        
        calculatingShow.style.display = "block"
        await new Promise(resolve => setTimeout(resolve, 50))

        let result = null
    
        if (searchMode == "content") {
            result = await BookGenerator.searchBook(query, {generatePaths: false})
        } else if (searchMode == "bookid") {
            const bookId = BigInt(query)
            result = await BookGenerator.searchBookById(bookId, sceneManager.currFloorId)
        } else {
            throw new Error(`Searchmode "${searchMode}" is not implemented.`)
        }

        resultContainer.style.display = "grid"

        searchResult = result
    
        const bookId = result.bookId.toString()
        const roomId = result.roomId.toString()
    
        document.getElementById("bookid-out").textContent = RoomIndicator.shortenId(bookId, 20)
        document.getElementById("bookid-out").title = RoomIndicator.shortenId(bookId, 200)
    
        document.getElementById("roomid-out").textContent = RoomIndicator.shortenId(roomId, 20)
        document.getElementById("roomid-out").title = RoomIndicator.shortenId(roomId, 200)
    
        document.getElementById("floorid-out").textContent = result.floorId.toString()
        document.getElementById("floorid-out").title = result.floorId.toString()
    
        document.getElementById("shelfid-out").textContent = result.shelfId.toString()
        document.getElementById("shelfid-out").title = result.shelfId.toString()
    
        document.getElementById("rowid-out").textContent = result.rowId.toString()
        document.getElementById("rowid-out").title = result.rowId.toString()
    
        document.getElementById("columnid-out").textContent = result.columnId.toString()
        document.getElementById("columnid-out").title = result.columnId.toString()
    
        searchContainer.scrollIntoView({
            behavior: "smooth"
        })
        calculatingShow.style.display = "none"
    }
    
    searchElement.oninput = () => {
        let value = searchElement.value
        let cleaned = filterText(value)
        const lines = value.split("\n").length
        searchElement.rows = Math.min(Math.max(lines, 3), 10)
    
        if (timeout) {
            clearTimeout(timeout)
        }
    
        if (searchTimeout) {
            clearTimeout(searchTimeout)
        }
    
        timeout = setTimeout(() => {
            searchElement.value = cleaned
        }, 100)
    
        searchTimeout = setTimeout(async () => {
            try {
                await search(cleaned)
            } catch {
                calculatingShow.style.display = "none"
                resultContainer.style.display = "none"
            }
        }, 1000)
    }
    
    calculatingShow.onclick = () => {
        BookGenerator.stopCalculation()
    }

    function scrollToSearch() {
        searchElement.scrollIntoView({
            behavior: "smooth"
        })

        searchElement.animate([
            {outline: "0px solid yellow"},
            {outline: "9px solid yellow"},
            {outline: "0px solid yellow"},
        ], {
            duration: 1500,
            easing: "ease-in"
        })
    }

    window.scrollToSearch = scrollToSearch
    
    window.searchStarterBook = function() {
        const bookId = "1585735209919233288729956182793682303396300295191941117219256247982759740045543778086538805678333522684227270240256675377434716418243760248053035239535300035239480177009263728543029996772515469141397618457150928864491882002038925495197923231867515541335889936710551820034978673148606384806981851363163973480237991815952585433152440843958412944089331831183070145239583529924552079718986570066996407425587881255713156775967168427514655613520843113636884994594030520026850192184258833723823721729090882894351388157910303979037225068635380928310575292973073147619668420245879061570061255387868041594872303801953358733654621221086460870814721932197681390838626737279915826560698699820034633838709940438339819315845150825912245721540774072351811284934949725539871873726796977194647391981197115706570350345622709608125228949800636437208233751752465411285036688531102860426411413976964594474136983379899908787121357324774267831313988195954170108521627639739004042"
        chooseMode("bookid")
        searchElement.value = bookId
        searchElement.oninput()
    }

    function randomBigInt(max) {
        const maxAsString = max.toString()
        let randomString = ""
        for (let i = 0; i < maxAsString.length; i++) {
            let randomDigit = Math.floor(Math.random() * 10)
            randomString = randomDigit.toString() + randomString
    
            if (i == maxAsString.length - 1) {
                if (BigInt(randomString) >= max) {
                    randomString = randomString.slice(1)
                    i--
                }
            }
        }
        return BigInt(randomString)
    }

    window.openRandomBook = async function() {
        const maxBookId = BookGenerator.getMaxBookId(sceneManager.currFloorId)
        const bookId = randomBigInt(maxBookId)
        Menu.close()
        BookViewer.openBook(bookId)
    }
}

// -------- js/misc/floorchoice.js --------

{
    const floorChoiceContainer = document.getElementById("floor-choice")
    const floorChoiceOutput = floorChoiceContainer.querySelector("input")
    const incrementButtons = floorChoiceContainer.querySelectorAll("button")
    let isAnimating = false

    function animationMsFromInc(inc) {
        inc = Math.abs(parseInt(inc))
        return Math.exp(-0.004 * (inc - 100)) * -500 + 1000
    }

    async function incremenetFloor(inc) {
        let newFloor = sceneManager.currFloorId + BigInt(inc)
        if (newFloor < 1n) {
            newFloor = 1n
        }

        
        isAnimating = true
        const animationMs = animationMsFromInc(sceneManager.currFloorId - newFloor)
        await sceneManager.changeFloor(newFloor, {animationDuration: animationMs})
        window.updateFloorChoice()
        isAnimating = false
    }

    for (let button of incrementButtons) {
        button.onclick = () => {
            if (isAnimating) {
                return
            }

            incremenetFloor(button.dataset.increment)
        }
    }

    window.updateFloorChoice = () => {
        floorChoiceOutput.value = `Current Floor: ${sceneManager.currFloorId}`
    }
}

// -------- js/misc/random-carousel.js --------

{
    function randomFloor() {
        const x = Math.random()
        const a = 1.95
        const b = (1 - a) / a
        const c = 78.6
        const d = 1000
        return BigInt(Math.floor(Math.tan(Math.PI / 2 * a * (x + b)) * c + d))
    }

    let intervalId = null

    window.startRandomCarousel = () => {
        const f = async () => {
            BookViewer.close(false)
            Menu.close()
            await sceneManager.changeFloor(randomFloor(), {animationDuration: 1000})
            openRandomBook()
        }

        intervalId = setInterval(f, 10000)
        f()
    }

    window.stopRandomCarousel = () => {
        if (intervalId != null) {
            clearInterval(intervalId)
            intervalId = null
        }
    }
}

// -------- js/misc/downloadbook.js --------

{
    window.downloadBook = async (content, bookId, floorId) => {
        if (!document.getElementById("img2pdfScript")) {
            await new Promise(resolve => {
                const script = document.createElement("script")
                script.addEventListener("load", resolve)
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.debug.js"
                script.id = "img2pdfScript"
                document.body.appendChild(script)
            })
        }

        const doc = new jsPDF()
        const pdfWidth = doc.internal.pageSize.getWidth()
        const pdfHeight = doc.internal.pageSize.getHeight()
        const pdfPadding = 20
        const pdfFontSize = 15

        doc.setFont("courier")
        doc.setFontSize(pdfFontSize)

        // draw top bar
        doc.setFontType("bold")
        doc.text(pdfPadding, pdfPadding, "Library of Léon")
        doc.text(pdfWidth - pdfPadding, pdfPadding, new Date().toLocaleDateString(), {align: "right"})

        doc.setFontType("normal")
        doc.textWithLink("noel-friedrich.de/lol", pdfPadding, pdfPadding + pdfFontSize / 2, {url: "https://noel-friedrich.de/lol/"})
        doc.text(pdfWidth - pdfPadding, pdfPadding + pdfFontSize / 2, `Floor#${floorId}`, {align: "right"})

        doc.setFontSize(12)
        const lines = doc.splitTextToSize(
            `${content}\n\nBook#${bookId}`, pdfWidth - pdfPadding * 2)
        
        let y = 35
        for (let line of lines) {
            y += 7
            if (y > pdfHeight - pdfPadding) {
                doc.addPage()
                y = pdfPadding + 5
            }
            doc.text(pdfPadding, y, line)
        }

        doc.save(`book${floorId}.pdf`)
    }   
}

// -------- js/objects/room.js --------

const normalBookColor = 0xeeeeee

class Room {

    constructor(pathBuilder, relativePos) {
        this.pathBuilder = pathBuilder
        this.relativePos = relativePos
        this.roomId = null
        this.doorCovers = [null, null, null, null]
        this.doorCoverLines = [null, null, null, null]
        this.booksMeshes = [null, null, null, null, null, null, null, null]

        this.floorPlane = null
        this.floorContext = null

        this.dummyColor = new THREE.Color()
        this.dummyObject = new THREE.Matrix4()
        this.prevColoredInstanceId = null
        this.prevColoredShelfId = null
    }

    openDoor(direction) {
        if (this.doorCovers[direction]) {
            this.doorCovers[direction].visible = false
            this.doorCoverLines[direction].visible = true
        }
    }

    closeDoor(direction) {
        if (this.doorCovers[direction]) {
            this.doorCovers[direction].visible = true
            this.doorCoverLines[direction].visible = false
        }
    }

    update(sceneManager) {
        const cameraPathBuilder = sceneManager.pathBuilder.copy()
        for (let moveId of this.pathBuilder.naivePath) {
            cameraPathBuilder.addStop(moveId)
        }

        this.roomId = cameraPathBuilder.roomId
        for (let direction = 0; direction < 4; direction++) {
            const pathBuilder = cameraPathBuilder.copy()
            pathBuilder.addStop(direction)
            const thatRoomId = pathBuilder.roomId
            if (BookGenerator.roomExists(thatRoomId, sceneManager.currFloorId)) {
                this.openDoor(direction)
            } else {
                this.closeDoor(direction)
            }
        }

        for (let i = 0; i < this.booksMeshes.length; i++) {
            if (!this.booksMeshes[i]) {
                continue
            }
            
            const maxInstanceId = BookGenerator.getMaxInstanceIdOnShelf(this.roomId, sceneManager.currFloorId, BigInt(i))
            this.booksMeshes[i].count = parseInt(maxInstanceId)
            this.booksMeshes[i].frustumCulled = false
        }

        if (!this.floorContext) {
            return
        }

        let liesOnSearch = false
        let isSearchEnd = false
        let searchDirection = null
        if (sceneManager.searchInfo && sceneManager.searchInfo.floorId == sceneManager.currFloorId) {
            liesOnSearch = true
            for (let i = 0; i < cameraPathBuilder.path.length; i++) {
                if (cameraPathBuilder.path[i] != sceneManager.searchInfo.path[i]) {
                    liesOnSearch = false
                }
            }
            
            if (liesOnSearch) {
                if (cameraPathBuilder.path.length == sceneManager.searchInfo.path.length) {
                    isSearchEnd = true
                } else if (cameraPathBuilder.path.length > sceneManager.searchInfo.path.length) {
                    liesOnSearch = false
                } else { // cameraPathBuilder.path.length < sceneManager.searchInfo.path.length
                    searchDirection = sceneManager.searchInfo.naivePath[cameraPathBuilder.path.length]
                }
            }
        }

        const canvas = this.floorContext.canvas
        this.floorContext.fillStyle = "white"
        this.floorContext.fillRect(0, 0, canvas.width, canvas.height)

        this.floorContext.save()
        this.floorContext.translate(canvas.width / 2, canvas.height / 2)
        this.floorContext.rotate(Math.PI / 4)

        if (this.prevColoredInstanceId !== null) {
            const shelf = this.booksMeshes[this.prevColoredShelfId]
            if (shelf) {
                this.dummyColor.setHex(normalBookColor)
                shelf.setColorAt(this.prevColoredInstanceId, this.dummyColor)
                this.prevColoredInstanceId = null
                this.prevColoredShelfId = null
                shelf.instanceColor.needsUpdate = true
            }
        }

        if (liesOnSearch) {
            this.floorContext.strokeStyle = "black"
            this.floorContext.fillStyle = "black"
            this.floorContext.lineWidth = 3

            const s = canvas.width
            if (!isSearchEnd) {
                this.floorContext.rotate(-Math.PI / 4)
                this.floorContext.rotate([
                    Math.PI / 2 * 2,
                    Math.PI / 2 * 1,
                    Math.PI / 2 * 3,
                    Math.PI / 2 * 0,
                ][searchDirection])

                this.floorContext.beginPath()
                this.floorContext.moveTo(-s * 0.03, -s * 0.15)
                this.floorContext.lineTo(s * 0.03, -s * 0.15)
                this.floorContext.lineTo(s * 0.03, s * 0.01)
                this.floorContext.lineTo(s * 0.1, s * 0.01)
                this.floorContext.lineTo(0, s * 0.15)
                this.floorContext.lineTo(-s * 0.1, s * 0.01)
                this.floorContext.lineTo(-s * 0.03, s * 0.01)
                this.floorContext.closePath()
                this.floorContext.stroke()

                const text = `${sceneManager.searchInfo.path.length - cameraPathBuilder.path.length}`
                this.floorContext.fillText(text, 0, -s * 0.2, canvas.width * 0.8)
            } else {
                this.floorContext.beginPath()
                this.floorContext.arc(0, 0, s * 0.1, 0, 2 * Math.PI)
                this.floorContext.stroke()

                if (this.booksMeshes) {
                    const shelf = this.booksMeshes[sceneManager.searchInfo.shelfId]
                    if (shelf) {
                        const instanceId = sceneManager.searchInfo.rowId * 26n + sceneManager.searchInfo.columnId
                        this.dummyColor.setHex(0x000000)
                        shelf.setColorAt(parseInt(instanceId), this.dummyColor)
                        shelf.instanceColor.needsUpdate = true
    
                        this.prevColoredInstanceId = parseInt(instanceId)
                        this.prevColoredShelfId = parseInt(sceneManager.searchInfo.shelfId)
                    }
                }
            }
        }

        /*
        this.floorContext.fillStyle = "#c0c0c0"
        this.floorContext.lineWidth = 0.1
        const stringId = RoomIndicator.shortenId(this.roomId.toString())
        const text = `${stringId}`
        this.floorContext.fillText(text, 0, 0, canvas.width * 0.8)
        */

        this.floorContext.restore()

        this.floorPlane.material.map.needsUpdate = true
    }

}

class WorldBuilder {

    static buildLine(scene, points) {
        const material = new THREE.LineBasicMaterial({color: 0x000000})
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(geometry, material)
        scene.add(line)
        return line
    }

    static buildWallSurface(scene, cornerLowerLeft, cornerUpperRight, {
        padding = 0, color = 0xfcfcfc
    }={}) {
        const geometry = new THREE.PlaneGeometry(
            Math.max(
                Math.abs(cornerLowerLeft.x - cornerUpperRight.x),
                Math.abs(cornerLowerLeft.z - cornerUpperRight.z),
            ) - padding,
            Math.abs(cornerLowerLeft.y - cornerUpperRight.y) - padding,
        )
        const material = new THREE.MeshBasicMaterial({color, side: THREE.DoubleSide})
        const plane = new THREE.Mesh(geometry, material)
        plane.position.set(
            (cornerUpperRight.x + cornerLowerLeft.x) / 2,
            (cornerUpperRight.y + cornerLowerLeft.y) / 2,
            (cornerUpperRight.z + cornerLowerLeft.z) / 2,
        )
        plane.rotateY(Math.atan2(
            cornerUpperRight.z - cornerLowerLeft.z,
            cornerUpperRight.x - cornerLowerLeft.x,
        ))
        scene.add(plane)
        return plane
    }

    static buildBox(scene, pos, size, {
        color = 0xccccff
    }={}) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z) 
        const material = new THREE.MeshBasicMaterial({color}) 
        const cube = new THREE.Mesh(geometry, material) 
        cube.position.set(pos.x, pos.y, pos.z)
        scene.add(cube)
        return cube
    }

    static buildBookWall(sceneManager, cornerLowerLeft, cornerUpperRight, {
        buildBooks = false, isMiddle = false, wallIndex = undefined
    }={}) {
        const cornerLowerRight = new THREE.Vector3(cornerUpperRight.x,
            cornerLowerLeft.y, cornerUpperRight.z)
    
        const delta1 = new THREE.Vector3().subVectors(cornerUpperRight, cornerLowerRight)
        const delta2 = new THREE.Vector3().subVectors(cornerLowerLeft, cornerLowerRight)
        const normalVector = new THREE.Vector3().crossVectors(delta1, delta2).normalize()
        const wallVector = new THREE.Vector3().copy(delta2).normalize()

        function posOnPlane(x, y, z=0) {
            // x, y € [0, 1]
            const v = new THREE.Vector3()
            v.lerpVectors(cornerLowerLeft, cornerLowerRight, x)
            v.y = cornerLowerLeft.y + (cornerUpperRight.y - cornerLowerLeft.y) * y
            v.addScaledVector(normalVector, -z)
            return v
        }
    
        const doorCoverLine = this.buildLine(sceneManager.scene, [
            posOnPlane(0.43, 0.0,  0.1),
            posOnPlane(0.43, 0.65, 0.1),
            posOnPlane(0.57, 0.65, 0.1),
            posOnPlane(0.57, 0.0,  0.1),
        ])
    
        this.buildWallSurface(sceneManager.scene, posOnPlane(0, 0), posOnPlane(0.43, 1))
        this.buildWallSurface(sceneManager.scene, posOnPlane(1, 0), posOnPlane(0.57, 1))
        this.buildWallSurface(sceneManager.scene, posOnPlane(0, 0.65), posOnPlane(1, 1))

        const bookDimensions = new THREE.Vector3().copy(normalVector)
            .multiplyScalar(0.25).addScaledVector(wallVector, 0.1)
        bookDimensions.y = 0.3

        let booksMeshes = []

        if (buildBooks) {
            const offsets = [0.1, 0.6]
            for (let offsetIndex = 0; offsetIndex < offsets.length; offsetIndex++) {
                const offset = offsets[offsetIndex]
                const numRows = 8
                const numColumns = 26
                const numBooks = numRows * numColumns

                const bookGeometry = new THREE.BoxGeometry(bookDimensions.x, bookDimensions.y, bookDimensions.z)
                const bookMaterial = new THREE.MeshBasicMaterial()
                const booksMesh = new THREE.InstancedMesh(bookGeometry, bookMaterial, numBooks)
                booksMeshes.push(booksMesh)

                sceneManager.scene.add(booksMesh)

                const dummy = new THREE.Object3D()
                const dummyColor = new THREE.Color()

                const posFromId = (id, zOffset=0) => {
                    const row = Math.floor(id / numColumns)
                    const column = id % numColumns
                    return posOnPlane(
                        offset + column / 26 * 0.3,
                        row / 8 * 0.7 + 0.135,
                        0.3 + zOffset
                    )
                }

                for (let i = 0; i < numBooks; i++) {
                    dummy.position.copy(posFromId(i))
                    dummy.updateMatrix()
                    booksMesh.setMatrixAt(i, dummy.matrix)

                    dummyColor.setHex(normalBookColor)
                    booksMesh.setColorAt(i, dummyColor)
                }

                booksMesh.instanceMatrix.needsUpdate = true
                booksMesh.instanceColor.needsUpdate = true

                if (isMiddle) {
                    sceneManager.objectsOfInterest.add(booksMesh)

                    booksMesh.action = (_, intersect) => {
                        if (BookViewer.isOpen || BookViewer.isAnimating) {
                            return
                        }

                        const rowId = Math.floor(intersect.instanceId / numColumns)
                        const columnId = intersect.instanceId % numColumns
                        const shelfId = wallIndex * offsets.length + offsetIndex

                        const bookId = BookGenerator.bookIdFromLocation(
                            sceneManager.roomId,
                            BigInt(shelfId),
                            BigInt(rowId),
                            BigInt(columnId)
                        )

                        dummy.position.copy(posFromId(intersect.instanceId))
                        
                        const goal = new THREE.Object3D()
                        const goalQuaternion = new THREE.Quaternion()
                        const currQuaternion = new THREE.Quaternion()
                        const originalQuaternion = new THREE.Quaternion().setFromEuler(dummy.rotation)

                        animationManager.startAnimation(new CustomAnimation({
                            duration: 500,
                            updateFunc: () => {
                                goal.position.copy(sceneManager.camera.position)
                                goal.rotation.copy(sceneManager.camera.rotation)
                                goal.translateZ(-1)

                                goalQuaternion.setFromEuler(goal.rotation)
                                currQuaternion.setFromEuler(dummy.rotation)
                                currQuaternion.slerp(goalQuaternion, 0.1)

                                dummy.position.lerp(goal.position, 0.1)
                                dummy.rotation.setFromQuaternion(currQuaternion)
                                dummy.updateMatrix()
                                booksMesh.setMatrixAt(intersect.instanceId, dummy.matrix)
                                booksMesh.instanceMatrix.needsUpdate = true
                            }
                        }))

                        BookViewer.openBook(bookId)
                        BookViewer.onNextClose(() => {
                            goal.position.copy(posFromId(intersect.instanceId))
                            const startPosition = new THREE.Vector3().copy(dummy.position)
                            goalQuaternion.copy(currQuaternion)

                            animationManager.startAnimation(new CustomAnimation({
                                duration: 500,
                                updateFunc: t => {
                                    currQuaternion.slerpQuaternions(goalQuaternion, originalQuaternion, t)
                                    dummy.rotation.setFromQuaternion(currQuaternion)

                                    dummy.position.lerpVectors(startPosition, goal.position, t)
                                    dummy.updateMatrix()
                                    booksMesh.setMatrixAt(intersect.instanceId, dummy.matrix)
                                    booksMesh.instanceMatrix.needsUpdate = true
                                }
                            }))
                        })
                    }
                }

            }
        }

        const doorCover = this.buildWallSurface(sceneManager.scene, posOnPlane(0.43, 0), posOnPlane(0.57, 0.65))
        doorCover.visible = false
        return {doorCover, booksMeshes, doorCoverLine}
    }

    static buildRoomFloor(scene, cornerLowerLeft, cornerUpperRight) {
        const canvas = document.createElement("canvas")
        canvas.width = 500
        canvas.height = canvas.width
        const context = canvas.getContext("2d")
        
        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, canvas.width, canvas.height)

        context.font = `bold ${canvas.height * 0.05}px monospace`

        context.textBaseline = "middle"
        context.textAlign = "center"

        const geometry = new THREE.PlaneGeometry(
            Math.abs(cornerLowerLeft.x - cornerUpperRight.x),
            Math.abs(cornerLowerLeft.z - cornerUpperRight.z),
        )

        const material = new THREE.MeshLambertMaterial({map: new THREE.CanvasTexture(canvas)})
        const plane = new THREE.Mesh(geometry, material)
        plane.position.set(
            (cornerUpperRight.x + cornerLowerLeft.x) / 2,
            -0.1,
            (cornerUpperRight.z + cornerLowerLeft.z) / 2,
        )

        plane.rotateX(-Math.PI / 2)
        scene.add(plane)

        return {floorContext: context, floorPlane: plane}
    }

    static buildRoom(pathBuilder, roomX, roomY, sceneManager, {
        isMiddle = false,
        wallIndeces = [0, 1, 2, 3],
        bookWallIndeces = [0, 1, 2, 3]
    }={}) {
        const room = new Room(pathBuilder, new THREE.Vector2(roomX, roomY))

        const roomOrigin = new THREE.Vector3(roomX * 14, 0, roomY * 14)

        const makeCorners = offset => {
            return [
                new THREE.Vector3(roomOrigin.x - offset, roomOrigin.y, roomOrigin.z - offset),
                new THREE.Vector3(roomOrigin.x - offset, roomOrigin.y, roomOrigin.z + offset),
                new THREE.Vector3(roomOrigin.x + offset, roomOrigin.y, roomOrigin.z + offset),
                new THREE.Vector3(roomOrigin.x + offset, roomOrigin.y, roomOrigin.z - offset),
            ]
        }
    
        const lowerCorners = makeCorners(7)
        const lowerCornersInner = makeCorners(6.9)
    
        const upperCorners = lowerCorners.map(v => new THREE.Vector3(v.x, v.y + 5, v.z))
        const upperCornersInner = lowerCornersInner.map(v => new THREE.Vector3(v.x, v.y + 4.9, v.z))
    
        this.buildLine(sceneManager.scene, lowerCornersInner.concat(lowerCornersInner[0]))
        this.buildLine(sceneManager.scene, upperCornersInner.concat(upperCornersInner[0]))

        const roomDistOrigin = Math.abs(roomX) + Math.abs(roomY)
        const buildBooksGeneral = roomDistOrigin <= 3
    
        const moveIndeces = [1, 3, 2, 0]
        for (let i = 0; i < 4; i++) {
            const moveIndex = moveIndeces[i]
            if (!wallIndeces.includes(moveIndex)) {
                continue
            }

            const buildBooks = buildBooksGeneral && bookWallIndeces.includes(moveIndex)
            const {doorCover, booksMeshes, doorCoverLine} = this.buildBookWall(sceneManager, lowerCorners[i], upperCorners[(i + 1) % 4], {
                buildBooks, isMiddle, wallIndex: i})

            room.doorCovers[moveIndex] = doorCover
            room.doorCoverLines[moveIndex] = doorCoverLine

            if (booksMeshes.length > 0) {
                room.booksMeshes[i * 2 + 0] = booksMeshes[0]
                room.booksMeshes[i * 2 + 1] = booksMeshes[1]
            }

            this.buildLine(sceneManager.scene, [lowerCornersInner[i], upperCornersInner[i]])
        }

        if (roomDistOrigin <= 2) {
            const {floorContext, floorPlane} = this.buildRoomFloor(sceneManager.scene, lowerCorners[0], lowerCorners[2])
            room.floorContext = floorContext
            room.floorPlane = floorPlane
        }

        return room
    }

}

class LibraryFloor {

    constructor(renderDistance, sceneManager) {
        this.renderDistance = renderDistance
        this.sceneManager = sceneManager

        this.rooms = []
        this.addRooms()
    }

    addRooms() {
        {
            const pathBuilder = new PathBuilder()
            this.rooms.push(WorldBuilder.buildRoom(pathBuilder, 0, 0, this.sceneManager, {isMiddle: true}))
        }

        for (let i = 1; i <= this.renderDistance; i++) {
            for (let j = 0; j < 4; j++) {
                const move = RoomIndicator.moveFromPathId(j)
                const x = move.x * i
                const y = move.y * i

                const pathBuilder = new PathBuilder()
                for (let k = 0; k < i; k++) {
                    pathBuilder.addStop(j)
                }

                this.rooms.push(WorldBuilder.buildRoom(pathBuilder, x, y, this.sceneManager, {
                    wallIndeces: i > 1 ? [j] : [0, 1, 2, 3]
                }))
            }

            if (i == this.renderDistance) {
                continue
            }

            for (let movePair of [
                [0, 1], [1, 0],
                [0, 2], [2, 0],
                [2, 3], [3, 2],
                [1, 3], [3, 1]
            ]) {
                for (let p = 0; p < 2; p++) {
                    const move1 = RoomIndicator.moveFromPathId(movePair[0])
                    const move2 = RoomIndicator.moveFromPathId(movePair[1])

                    let l = i
                    if (p == 1) {
                        l += 1
                    }

                    const x = move1.x * l + move2.x * i
                    const y = move1.y * l + move2.y * i
    
                    const pathBuilder = new PathBuilder()
                    for (let k = 0; k < i; k++) {
                        pathBuilder.addStop(movePair[0])
                        pathBuilder.addStop(movePair[1])
                        if (p == 1) {
                            pathBuilder.addStop(movePair[0])
                        }
                    }
    
                    this.rooms.push(WorldBuilder.buildRoom(pathBuilder, x, y, this.sceneManager, {
                        wallIndeces: p == 0 ? [movePair[0], 3 - movePair[1]] : [3 - movePair[0], movePair[1]]
                    }))
                }
            }
        }
    
        const outerDistance = this.renderDistance * 14 + 7.1
        const outerCorners = [
            new THREE.Vector3(outerDistance, 0, outerDistance),
            new THREE.Vector3(-outerDistance, 5, outerDistance),
            new THREE.Vector3(-outerDistance, 0, -outerDistance),
            new THREE.Vector3(outerDistance, 5, -outerDistance),
        ]
    
        // draw four sorrounding black walls to block views
        for (let i = 0; i < 4; i++) {
            WorldBuilder.buildWallSurface(this.sceneManager.scene, outerCorners[i], outerCorners[(i + 1) % 4], {color: 0x000000})
        }
    
        console.log("constructed", this.rooms.length, "rooms")
    }

    updateRooms() {
        for (let room of this.rooms) {
            room.update(this.sceneManager)
        }
    }

}

// -------- js/managers/animationmanager.js --------

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

// -------- js/managers/dommanager.js --------

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

// -------- js/managers/scenemanager.js --------

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

// -------- js/main.js --------

async function init3d() {

    const domManager = new DomManager()
    const sceneManager = new SceneManager(domManager)

    window.domManager = domManager
    window.sceneManager = sceneManager

    domManager.init()
    sceneManager.init()

    if (new URLSearchParams(location.search).has("vr")) {
        domManager.initVR()
        sceneManager.initVR()
    }
    
    domManager.addToBody(sceneManager.canvas)
    
    function loop() {
        sceneManager.update()
        domManager.update(sceneManager)
        animationManager.update()

        sceneManager.render()
    }
    
    sceneManager.setLoop(loop)
    
    window.addEventListener("resize", () => sceneManager.onWindowResize())
    RoomIndicator.update(sceneManager)
    BookViewer.init()
    Menu.init()
    initSearch()
    updateFloorChoice()
    Comments.init()
}

init3d()