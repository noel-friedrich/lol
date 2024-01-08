class BookViewer {

    static contentStartSlice = document.getElementById("book-content-start-slice")
    static contentEndSlice = document.getElementById("book-content-end-slice")
    static contentMarkSlice = document.getElementById("book-content-mark-slice")

    static markIndex = null

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

    static updateContent() {
        if (this.markIndex == null) {
            this.contentStartSlice.textContent = this.contentCache
            this.contentMarkSlice.textContent = ""
            this.contentEndSlice.textContent = ""
        } else {
            this.contentStartSlice.textContent = this.contentCache.slice(0, this.markIndex)
            this.contentMarkSlice.textContent = this.contentCache[this.markIndex]
            this.contentEndSlice.textContent = this.contentCache.slice(this.markIndex + 1, this.contentCache.length)
        }
    }

    static openBook(bookId) {
        if (HorrorManager.active && bookId == 11393922277440444n) {
            HorrorManager.win()
            return
        }

        this.idElement.textContent = `Book#${bookId}\non Floor#${sceneManager.currFloorId}`

        const bookContent = BookGenerator.generateBook(bookId, sceneManager.currFloorId)
        
        this.contentCache = bookContent
        this.bookIdCache = bookId
        this.updateContent()

        this.open()
        
        Comments.load(bookId)
    }

    static open() {
        if (this.isOpen || this.isAnimating) {
            return
        }

        this.markIndex = null

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

        MusicPlayer.reset()

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

        document.getElementById("share-book").onclick = () => {
            if (!this.isOpen || this.bookIdCache == null) {
                return
            }

            const url = ShareLink.generateUrl(this.bookIdCache, sceneManager.currFloorId)
            if (!url) {
                alert("BookId is too large to share. Sorry!")
            } else {
                try {
                    if (navigator.share) {
                        navigator.share({
                            url,
                            title: "Book in the Library of Léon"
                        })
                    } else {
                        throw new Error("User Agent does not support sharing")
                    }
                } catch (e) {
                    console.error(e)
                    window.open(url, '_blank')
                }
            }
        }
        
        const playBookButton = document.getElementById("play-book")
        playBookButton.onclick = async () => {
            if (!this.contentCache || !this.isOpen) {
                return
            }

            if (MusicPlayer.isRunning) {
                MusicPlayer.reset()
                this.markIndex = null
                this.updateContent()
            } else {
                MusicPlayer.reset()
                await MusicPlayer.playContent(this.contentCache, {
                    callback: index => {
                        this.markIndex = index
                        this.updateContent()
                    }
                })
                this.markIndex = null
                this.updateContent()
            }
        }
    }

}

window.BookViewer = BookViewer