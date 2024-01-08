class Menu {

    static isOpen = true
    static container = document.getElementById("main-menu-container")
    static transitionMs = 500 // needs to match css .main-menu-container transition period

    static get isClosed() {
        return !this.isOpen
    }

    static open() {
        if (HorrorManager.active) {
            HorrorManager.pause()
        }

        if (this.isOpen || BookViewer.isAnimating || BookViewer.isOpen || HorrorManager.active) {
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