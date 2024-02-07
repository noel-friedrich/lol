class HorrorManager {

    static active = false
    static colorMode = "normal"
    static gameStartTime = null

    static heartbeat = null

    static paused = false
    static score = null

    static updateColors() {
        if (this.active && this.colorMode == "normal") {
            sceneManager.canvas.animate([
                {filter: "invert(0%)"},
                {filter: "invert(100%)"}
            ], {duration: 500, fill: "forwards"})
            this.colorMode = "inverted"
        } else if (!this.active && this.colorMode == "inverted") {
            sceneManager.canvas.animate([
                {filter: "invert(100%)"},
                {filter: "invert(0%)"}
            ], {duration: 500, fill: "forwards"})
            this.colorMode = "normal"
        }
    }

    static async soundLoop() {
        HorrorSounds.playHeartbeat(2)
    }

    static async start() {
        if (this.active) {
            return
        }

        this.paused = false
        
        BookGenerator.resetAlphabet()
        const truth = "you made it"
        const searchInfo = await BookGenerator.searchBook(truth)
        sceneManager.teleportToMiddle()
        await sceneManager.changeFloor(searchInfo.floorId)
        sceneManager.startSearch(searchInfo)

        HorrorMenu.close()
        await Slenderman.spawn()
        Slenderman.teleport(true)

        this.active = true
        this.updateColors()
        this.gameStartTime = Date.now()

        Menu.close()
        BookViewer.close()

        this.heartbeat = new HeartBeat()
    }

    static async win() {
        const score = this.gameTime
        this.paused = true
        sceneManager.keyboardMouseControls._removePointerLock()
        HorrorManager.stop()

        this.score = score
        HorrorMenu.updateScoreOutput(this.score)

        await new Promise(resolve => setTimeout(resolve, 100))
        HorrorMenu.open("won")
    }

    static async turnCameraToSlenderman({
        animationDuration = 1000,
        seeFaceDuration = 1000
    }={}) {
        const facePos = new THREE.Vector3().copy(Slenderman.position).setY(2.1)

        const temp = new THREE.Euler().copy(sceneManager.camera.rotation)
        sceneManager.camera.lookAt(facePos)
        const goalQuaternion = new THREE.Quaternion().setFromEuler(sceneManager.camera.rotation)
        sceneManager.camera.rotation.copy(temp)

        const originalQuaternion = new THREE.Quaternion().setFromEuler(sceneManager.camera.rotation)
        const currQuaternion = new THREE.Quaternion()

        return new Promise(resolve => {
            sceneManager.blockInputs = true
            
            animationManager.startAnimation(new CustomAnimation({
                duration: animationDuration,
                easing: Easing.easeInOut,
                updateFunc: (t) => {
                    currQuaternion.slerpQuaternions(originalQuaternion, goalQuaternion, t)
                    sceneManager.camera.rotation.setFromQuaternion(currQuaternion)
                },
                endFunc: () => {
                    setTimeout(() => {
                        sceneManager.blockInputs = false
                        resolve()
                    }, seeFaceDuration)
                }
            }))
        })
    }

    static async lose() {
        this.score = 0
        this.paused = true

        MusicPlayer.playFrequencies([2000], {intervalMs: 1000})
        await this.turnCameraToSlenderman()

        // TODO: lose animation
        sceneManager.keyboardMouseControls._removePointerLock()

        await new Promise(resolve => setTimeout(resolve, 100))
        HorrorManager.stop()
        HorrorMenu.open("caught")
    }

    static async stop() {
        HorrorMenu.close()

        if (!this.active) {
            return
        }

        this.active = false
        this.updateColors()
        Slenderman.hide()
        this.score = null

        if (this.heartbeat) {
            this.heartbeat.stop()
        }

        sceneManager.stopSearch()
    }

    static get gameTime() {
        if (this.gameStartTime && this.active) {
            return Date.now() - this.gameStartTime
        } else {
            return null
        }
    }

    static updateHeartbeat() {
        if (this.gameTime > 1500 && !this.heartbeat.hasStarted) {
            this.heartbeat.start()
        }

        const x = Math.max(Slenderman.calcDistanceToPlayer(), 1)
        this.heartbeat.beatFrequency = Math.max(Math.exp(-0.1 * (x - 30)), 1)

        if (Slenderman.visible) {
            this.heartbeat.soundFrequency = 300
        } else {
            this.heartbeat.soundFrequency = 400
        }
    }

    static update() {
        if (!this.active || this.paused) {
            return
        }

        if (this.gameTime > 3000) {
            Slenderman.move()
        } else {
            Slenderman.teleport(true)
        }

        this.updateHeartbeat()
    }

    static pause() {
        this.paused = true
        HorrorMenu.open("ingame")
    }

    static continue() {
        this.paused = false
        HorrorMenu.close()
    }

}

window.HorrorManager = HorrorManager