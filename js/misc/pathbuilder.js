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