function initSearch() {

    function filterText(value) {
        if (searchMode == "content") {
            const lowerCaseAlphabet = "abcdefghijklmnopqrstuvwxyz"
            const upperCaseAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            for (let i = 0; i < 26; i++) {
                if (!BookGenerator.alphabet.includes(upperCaseAlphabet[i])) {
                    value = value.replaceAll(upperCaseAlphabet[i], lowerCaseAlphabet[i])
                }
            }

            if (!BookGenerator.alphabet.includes("ä")) value = value.replaceAll("ä", "ae")
            if (!BookGenerator.alphabet.includes("ö")) value = value.replaceAll("ö", "oe")
            if (!BookGenerator.alphabet.includes("ü")) value = value.replaceAll("ü", "ue")
            if (!BookGenerator.alphabet.includes("ß")) value = value.replaceAll("ß", "ss")
            if (!BookGenerator.alphabet.includes("!")) value = value.replaceAll("!", ".")
            if (!BookGenerator.alphabet.includes("?")) value = value.replaceAll("?", ".")

            return value.split("").filter(c => BookGenerator.alphabet.includes(c)).join("")
        } else if (searchMode == "bookid") {
            return value.split("").filter(c => "0123456789".includes(c)).join("")
        } else {
            throw new Error(`Searchmode "${searchMode}" is not implemented.`)
        }
    }

    async function upgradeSearchResult() {
        if (!searchResult) {
            return false
        }

        if (searchResult.path != undefined) {
            return true
        }

        try {
            calculatingShow.style.display = "block"
            await new Promise(resolve => setTimeout(resolve, 50))
            searchResult = await BookGenerator.searchBookById(searchResult.bookId, searchResult.floorId)
            calculatingShow.style.display = "none"
        } catch (e) {
            calculatingShow.style.display = "none"
            return false
        }

        return true
    }

    async function jumpToFloor() {
        if (!await upgradeSearchResult()) {
            return
        }

        Menu.close()
        sceneManager.stopSearch()

        if (sceneManager.currFloorId == searchResult.floorId) {
            await sceneManager.changeFloor(searchResult.floorId + 1n)
        }

        await sceneManager.changeFloor(searchResult.floorId)
        sceneManager.startSearch(searchResult)
    }

    async function teleportToRoom() {
        if (!await upgradeSearchResult()) {
            return
        }

        sceneManager.startSearch(searchResult)
        sceneManager.teleportToSearchEnd()
        Menu.close()
    }

    window.jumpToFloor = jumpToFloor
    window.teleportToRoom = teleportToRoom
    
    let timeout = null
    let searchTimeout = null

    let searchResult = null
    
    const searchElement = document.getElementById("search-input")
    const searchContainer = document.getElementById("search-container")
    const resultContainer = document.getElementById("results-container")
    const calculatingShow = document.getElementById("calculating-show")
    const modeSelector = document.getElementById("mode-selector")
    const modeButtons = modeSelector.querySelectorAll("button")

    let searchMode = "content"

    function chooseMode(mode) {
        for (let button of modeButtons) {
            const selected = button.dataset.mode == mode
            button.dataset.selected = selected
            if (selected) {
                searchElement.placeholder = button.dataset.description
                searchMode = button.dataset.mode
            }
        }
        searchElement.oninput()
    }

    for (let modeButton of modeButtons) {
        modeButton.onclick = () => chooseMode(modeButton.dataset.mode)
    }
    
    async function search(query) {
        if (query.length == 0) {
            resultContainer.style.display = "none"
            return
        }
        
        calculatingShow.style.display = "block"
        await new Promise(resolve => setTimeout(resolve, 50))

        let result = null
    
        if (searchMode == "content") {
            result = await BookGenerator.searchBook(query, {generatePaths: false})
        } else if (searchMode == "bookid") {
            const bookId = BigInt(query)
            result = await BookGenerator.searchBookByOnlyId(bookId, {generatePaths: false})
        } else {
            throw new Error(`Searchmode "${searchMode}" is not implemented.`)
        }

        resultContainer.style.display = "grid"

        searchResult = result
    
        const bookId = result.bookId.toString()
        const roomId = result.roomId.toString()
    
        document.getElementById("bookid-out").textContent = RoomIndicator.shortenId(bookId, 20)
        document.getElementById("bookid-out").title = RoomIndicator.shortenId(bookId, 200)
    
        document.getElementById("roomid-out").textContent = RoomIndicator.shortenId(roomId, 20)
        document.getElementById("roomid-out").title = RoomIndicator.shortenId(roomId, 200)
    
        document.getElementById("floorid-out").textContent = result.floorId.toString()
        document.getElementById("floorid-out").title = result.floorId.toString()
    
        document.getElementById("shelfid-out").textContent = result.shelfId.toString()
        document.getElementById("shelfid-out").title = result.shelfId.toString()
    
        document.getElementById("rowid-out").textContent = result.rowId.toString()
        document.getElementById("rowid-out").title = result.rowId.toString()
    
        document.getElementById("columnid-out").textContent = result.columnId.toString()
        document.getElementById("columnid-out").title = result.columnId.toString()
    
        searchContainer.scrollIntoView({
            behavior: "smooth"
        })
        calculatingShow.style.display = "none"
    }
    
    searchElement.oninput = () => {
        let value = searchElement.value
        let cleaned = filterText(value)
        const lines = value.split("\n").length
        searchElement.rows = Math.min(Math.max(lines, 3), 10)
    
        if (timeout) {
            clearTimeout(timeout)
        }
    
        if (searchTimeout) {
            clearTimeout(searchTimeout)
        }
    
        timeout = setTimeout(() => {
            searchElement.value = cleaned
        }, 100)
    
        searchTimeout = setTimeout(async () => {
            try {
                await search(cleaned)
            } catch {
                calculatingShow.style.display = "none"
                resultContainer.style.display = "none"
            }
        }, 1000)
    }
    
    calculatingShow.onclick = () => {
        BookGenerator.stopCalculation()
    }

    function scrollToSearch() {
        searchElement.scrollIntoView({
            behavior: "smooth"
        })

        searchElement.animate([
            {outline: "0px solid yellow"},
            {outline: "9px solid yellow"},
            {outline: "0px solid yellow"},
        ], {
            duration: 1500,
            easing: "ease-in"
        })
    }

    window.scrollToSearch = scrollToSearch
    
    window.searchStarterBook = function() {
        const bookId = "1585735209919233288729956182793682303396300295191941117219256247982759740045543778086538805678333522684227270240256675377434716418243760248053035239535300035239480177009263728543029996772515469141397618457150928864491882002038925495197923231867515541335889936710551820034978673148606384806981851363163973480237991815952585433152440843958412944089331831183070145239583529924552079718986570066996407425587881255713156775967168427514655613520843113636884994594030520026850192184258833723823721729090882894351388157910303979037225068635380928310575292973073147619668420245879061570061255387868041594872303801953358733654621221086460870814721932197681390838626737279915826560698699820034633838709940438339819315845150825912245721540774072351811284934949725539871873726796977194647391981197115706570350345622709608125228949800636437208233751752465411285036688531102860426411413976964594474136983379899908787121357324774267831313988195954170108521627639739004042"
        chooseMode("bookid")
        searchElement.value = bookId
        searchElement.oninput()
    }

    function randomBigInt(max) {
        const maxAsString = max.toString()
        let randomString = ""
        for (let i = 0; i < maxAsString.length; i++) {
            let randomDigit = Math.floor(Math.random() * 10)
            randomString = randomDigit.toString() + randomString
    
            if (i == maxAsString.length - 1) {
                if (BigInt(randomString) >= max) {
                    randomString = randomString.slice(1)
                    i--
                }
            }
        }
        return BigInt(randomString)
    }

    window.openRandomBook = async function() {
        const maxBookId = BookGenerator.getMaxBookId(sceneManager.currFloorId)
        const bookId = randomBigInt(maxBookId)
        Menu.close()
        BookViewer.openBook(bookId)
    }

    const alphabetInput = document.getElementById("alphabet-input")
    alphabetInput.value = BookGenerator.alphabet.replaceAll("\n", "\\n")
    const originalValue = BookGenerator.alphabet
    alphabetInput.oninput = () => {
        let newAlphabet = alphabetInput.value.replaceAll("\\n", "\n")
        if (newAlphabet.length == 0) {
            newAlphabet = originalValue
            alphabetInput.value = originalValue
        }

        BookGenerator.changeAlphabet(newAlphabet)
        sceneManager.currFloor.updateRooms()
    }
}