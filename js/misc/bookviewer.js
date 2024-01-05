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