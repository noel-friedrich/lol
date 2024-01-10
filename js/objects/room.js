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
                        
                        if (HorrorManager.active && bookId == 0x287ab641f1fbbcn) {
                            HorrorManager.win()
                            return
                        }

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