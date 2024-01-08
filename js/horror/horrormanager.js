class HorrorManager {

    static active = false
    static colorMode = "normal"
    static gameStartTime = null

    static heartbeat = null

    static paused = false

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
        this.pause()
        sceneManager.keyboardMouseControls._removePointerLock()
        HorrorManager.stop()

        await new Promise(resolve => setTimeout(resolve, 100))
        HorrorMenu.open("won")
    }

    static async lose() {
        this.pause()
        // TODO: lose animation
        sceneManager.keyboardMouseControls._removePointerLock()
        MusicPlayer.playFrequencies([800], {intervalMs: 800})

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