class MusicPlayer {

    static osc = null
    static context = null
    static gain = null

    static hasInitted = false
    static processId = 0

    static isRunning = false

    static init() {
        if (this.hasInitted) {
            return
        }

        this.context = new AudioContext()
        this.osc = this.context.createOscillator()
        this.gain = this.context.createGain()

        this.osc.connect(this.gain)
        this.gain.connect(this.context.destination)

        this.hasInitted = true
    }

    static stop() {
        if (this.hasInitted) {
            this.osc.stop()
            this.isRunning = false
        }
    }

    static reset() {
        this.stop()
        this.hasInitted = false
        this.processId++
    }

    static async playContent(content, {
        intervalMs = "random",
        callback = null
    }={}) {
        function frequencyFromNoteOffset(n) {
            return 220.0 * 2 ** (n / 12)
        }

        const frequencies = []
        
        for (let letter of content) {
            if (!BookGenerator.alphabet.includes(letter)) {
                return
            }
            
            const indexInAlphabet = BookGenerator.alphabet.indexOf(letter)
            
            if (letter == " ") {
                frequencies.push(0)
            } else {
                frequencies.push(frequencyFromNoteOffset(indexInAlphabet))
            }
        }

        await this.playFrequencies(frequencies, {intervalMs, callback})
    }

    static async playFrequencies(frequencies, {
        intervalMs = "random",
        callback = null,
        rampEndValue = 0.1,
        noteMs = undefined,
        removeClicking = false
    }={}) {
        if (this.isRunning) {
            console.error("Warning: MusicPlayer already running")
            this.reset()
        }

        if (intervalMs == "random") {
            intervalMs = Math.floor(Math.random() * 400 + 100)
        }

        noteMs ??= intervalMs

        this.init()
        this.processId++
        let currProcessId = this.processId

        if (!window.AudioContext) {
            return
        }

        const sleep = ms => new Promise(r => setTimeout(r, ms))
        
        this.osc.start()
        this.isRunning = true
        
        for (let i = 0; i < frequencies.length; i++) {
            const freq = frequencies[i]

            if (callback) {
                callback(i, freq)
            }
            
            this.osc.frequency.value = freq
            
            if (freq != 0) {
                if (removeClicking) {
                    this.gain.gain.exponentialRampToValueAtTime(1, this.context.currentTime + 0.01)
                    this.gain.gain.exponentialRampToValueAtTime(rampEndValue, this.context.currentTime + noteMs / 1000 + 0.01)
                } else {
                    this.gain.gain.setValueAtTime(1, this.context.currentTime ) 
                    this.gain.gain.exponentialRampToValueAtTime(rampEndValue, this.context.currentTime + noteMs / 1000)
                }
            } else {
                this.gain.gain.exponentialRampToValueAtTime(0.000001, this.context.currentTime + noteMs / 1000)
            }
            
            await sleep(intervalMs)

            if (this.processId != currProcessId) {
                return
            }
        }

        if (removeClicking) {
            this.gain.gain.exponentialRampToValueAtTime(0.000001, this.context.currentTime + 0.015)
            await sleep(200)
        }
        
        this.reset()
    }

}

window.MusicPlayer = MusicPlayer