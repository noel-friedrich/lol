class Slenderman {

    static invertedImgPath = "assets/images/scary-man_inverted.png"

    static mesh = null
    static hasInitted = false
    static visible = false

    static goalX = null
    static goalZ = null

    static moveSpeed = 0.15
    static minGoalDistance = 0.5
    static minPlayerDistance = 1
    static currMinDistance = null

    static teleportMinInterval = 3000
    static lastTeleportTime = null

    static frozenUpdateCount = 0

    static get timeSinceLastTeleport() {
        if (this.lastTeleportTime == null) {
            return Infinity
        }

        return Date.now() - this.lastTeleportTime
    }

    static async makeObject({
        height = 2.5,
    }={}) {
        const img = new Image()
        
        await new Promise(resolve => {
            img.onload = resolve
            img.src = this.invertedImgPath
        })

        const canvas = document.createElement("canvas")
        canvas.height = height * 300
        canvas.width = canvas.height * (img.naturalWidth / img.naturalHeight)
        const context = canvas.getContext("2d")
        
        context.drawImage(img, 0, 0, canvas.width, canvas.height)

        const geometry = new THREE.PlaneGeometry(height * (canvas.width / canvas.height), height)

        const material = new THREE.MeshLambertMaterial({map: new THREE.CanvasTexture(canvas), side: THREE.DoubleSide, transparent: true})
        const plane = new THREE.Mesh(geometry, material)
        plane.position.set(1, height / 2, 1)

        sceneManager.scene.add(plane)

        return plane
    }

    static get inSameRoomAsPlayer() {
        return Math.abs(this.position.x) < 7 && Math.abs(this.position.z) < 7
    }

    static updateVisibility() {
        let directionVisible = undefined
        ;{
            const x = (sceneManager.camera.rotation.y % (Math.PI * 2)) - Math.PI
            const y = ((Slenderman.mesh.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI
            const angle = Math.atan2(Math.sin(y-x),Math.cos(y-x))
            directionVisible = Math.abs(angle) > Math.PI / 2
        }

        let inSameRoom = this.inSameRoomAsPlayer

        let wallBetween = undefined
        ;{
            const x = sceneManager.camera.position.x
            const y = sceneManager.camera.position.z
            const angle = this.calcAngleToPlayer() + Math.PI
            const dx = Math.cos(angle)
            const dy = Math.sin(angle)

            // magic line intersection formulas between player and walls
            const tx1 = (7 - x) / dx
            const ty1 = (7 - y) / dy
            const tx2 = (-7 - x) / dx
            const ty2 = (-7 - y) / dy
        
            // choose correct result
            const tx = dx > 0 ? tx1 : tx2
            const ty = dy > 0 ? ty1 : ty2
            
            // calculate intersections
            const ix = Math.abs(x + dx * ty) / 7
            const iy = Math.abs(y + dy * tx) / 7

            // check if intersections lie in doorframe (with some error)
            if (ix > 1) {
                wallBetween = iy > 0.19
            } else {
                wallBetween = ix > 0.19
            }
        }

        this.visible = directionVisible && (inSameRoom || !wallBetween)
    }

    static get roomX() {
        return Math.floor((this.position.x + 7) / 14)
    }

    static get roomZ() {
        return Math.floor((this.position.z + 7) / 14)
    }

    static calcAngleToPlayer() {
        const dx = sceneManager.camera.position.x - this.mesh.position.x
        const dz = sceneManager.camera.position.z - this.mesh.position.z
        return Math.atan2(dz, dx)
    }

    static calcAngleToGoal() {
        const dx = this.goalX - this.mesh.position.x
        const dz = this.goalZ - this.mesh.position.z
        return Math.atan2(dz, dx)
    }

    static calcDistanceToPlayer() {
        const dx = sceneManager.camera.position.x - this.mesh.position.x
        const dz = sceneManager.camera.position.z - this.mesh.position.z
        return Math.sqrt(dx * dx + dz * dz)
    }

    static calcDistanceToGoal() {
        const dx = this.goalX - this.mesh.position.x
        const dz = this.goalZ - this.mesh.position.z
        return Math.sqrt(dx * dx + dz * dz)
    }

    static async spawn() {
        if (this.hasInitted) {
            this.mesh.visible = true
            return
        }

        this.mesh = await this.makeObject()

        animationManager.startAnimation(new CustomAnimation({
            duration: Infinity,
            updateFunc: () => {
                const dx = sceneManager.camera.position.x - this.mesh.position.x
                const dz = sceneManager.camera.position.z - this.mesh.position.z
                const angle = Math.atan2(dx, dz)
                this.mesh.rotation.y = angle
            }
        }))

        this.hasInitted = true

        this.position.x = 100
        this.position.z = 100
    }

    static hide() {
        if (this.hasInitted && this.mesh.visible) {
            this.mesh.visible = false
        }
    }

    static get position() {
        if (this.mesh) {
            return this.mesh.position
        }
    }

    static get rotation() {
        if (this.mesh) {
            return this.mesh.rotation
        }
    }

    static get hasGoal() {
        return this.goalX != null && this.goalZ != null
    }

    static generateNewGoal() {
        if (this.roomX == this.roomZ && this.roomX == 0) {
            this.goalX = sceneManager.camera.position.x
            this.goalZ = sceneManager.camera.position.z
            this.currMinDistance = this.minPlayerDistance
            return
        } else {
            this.currMinDistance = this.minGoalDistance
        }

        const sign = x => x > 0 ? 8 : -8

        let doorXOffset = 0
        let doorZOffset = 0

        if (Math.abs(this.roomX) == Math.abs(this.roomZ)) {
            // TODO: make random door choice
            if ((this.roomX + this.roomZ) % 2 == 0) {
                doorZOffset = sign(-this.roomZ)
            } else {
                doorXOffset = sign(-this.roomX)
            }
        } else if (this.roomX == 0 && this.roomZ != 0) {
            doorZOffset = sign(-this.roomZ)
        } else if (this.roomZ == 0 && this.roomX != 0) {
            doorXOffset = sign(-this.roomX)
        } else if (Math.abs(this.roomX) < Math.abs(this.roomZ)) {
            doorXOffset = sign(-this.roomX)
        } else if (Math.abs(this.roomZ) < Math.abs(this.roomX)) {
            doorZOffset = sign(-this.roomZ)
        }

        this.goalX = this.roomX * 14 + doorXOffset
        this.goalZ = this.roomZ * 14 + doorZOffset
    }

    static teleport(force) {
        if (!force && this.timeSinceLastTeleport < this.teleportMinInterval) {
            return
        }

        if (!force && this.inSameRoomAsPlayer) {
            return
        }

        // choose a random corner room and teleport to it
        const toRoom = (x, z) => {
            this.position.x = x * 14 * (1 + Math.random())
            this.position.z = z * 14 * (1 + Math.random())
            this.lastTeleportTime = Date.now()
        }

        const n = Math.floor(Math.random() * 4)
        if (n == 0) {
            toRoom(1, 1)
        } else if (n == 1) {
            toRoom(-1, 1)
        } else if (n == 2) {
            toRoom(1, -1)
        } else if (n == 3) {
            toRoom(-1, -1)
        }
    }

    static move() {
        this.updateVisibility()
        if (this.visible) {
            this.frozenUpdateCount++

            if (this.frozenUpdateCount > 60 && Math.random() < 0.008) {
                this.teleport()
                this.frozenUpdateCount = 0
            } else {
                return
            }
        } else {
            this.frozenUpdateCount = 0
        }

        if (this.calcDistanceToPlayer() > 30) {
            this.teleport()
        }

        this.generateNewGoal()

        const moveAngle = this.calcAngleToGoal()
        const goalDistance = this.calcDistanceToGoal()

        const prevX = this.position.x
        const prevZ = this.position.z
        if (goalDistance > this.currMinDistance) {
            this.position.x += Math.cos(moveAngle) * this.moveSpeed
            this.position.z += Math.sin(moveAngle) * this.moveSpeed
        }

        this.updateVisibility()
        if (this.visible) {
            this.position.x = prevX
            this.position.z = prevZ
            this.updateVisibility()
            this.teleport()
        }

        if (this.calcDistanceToPlayer() < this.minPlayerDistance && !HorrorManager.paused) {
            HorrorManager.lose()
        }
    }

}

window.Slenderman = Slenderman