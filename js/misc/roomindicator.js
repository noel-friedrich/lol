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