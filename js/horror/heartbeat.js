class HeartBeat {

    constructor() {
        this.context = new AudioContext()
        this.osc = this.context.createOscillator()
        this.gain = this.context.createGain()

        this.osc.connect(this.gain)
        this.gain.connect(this.context.destination)

        this.running = false
        this.calledStart = false

        this.beatFrequency = 1
        this.soundFrequency = 400
    }

    get hasStarted() {
        return this.calledStart
    }

    async playHeartBeat() {
        if (HorrorManager.paused) {
            return
        }
        
        this.osc.frequency.value = this.soundFrequency

        this.gain.gain.setValueAtTime(1, this.context.currentTime)
        this.gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1 / (this.beatFrequency + 1))
    }

    async loop() {
        while (this.running) {
            this.playHeartBeat()
            await new Promise(resolve => setTimeout(resolve, 1000 / this.beatFrequency))
        }
    }

    start() {
        if (this.calledStart) {
            return
        }
        this.calledStart = true

        this.running = true
        this.gain.gain.setValueAtTime(0, this.context.currentTime)
        this.osc.start()
        this.osc.frequency.value = this.soundFrequency
        this.loop()
    }

    stop() {
        this.osc.stop()
        this.running = false
    }

}

window.HeartBeat = HeartBeat