class BookGenerator {

    static alphabet = "abcdefghijklmnopqrstuvwxyz ,.\n"
    static stopCalculationFlag = false

    static numRoomsCacheAlphabetLength = -1
    static numRoomsCache = new Map()

    static getMaxBookId(floorId) {
        if (this.numRoomsCacheAlphabetLength == this.alphabet.length && this.numRoomsCache.has(floorId)) {
            return this.numRoomsCache.get(floorId)
        } else {
            if (this.numRoomsCacheAlphabetLength != this.alphabet.length) {
                this.numRoomsCache.clear()
                this.numRoomsCacheAlphabetLength = this.alphabet.length
            }

            // this potentially takes a long time to compute! that's why we're caching
            const numBooks = this.alphabetLength ** floorId
            this.numRoomsCache.set(floorId, numBooks)

            return numBooks
        }
    }

    static roomExists(roomId, floorId) {
        if (floorId < 1) {
            throw new Error("Floor cannot be smaller than 1")
        }

        const bookId = this.bookIdFromLocation(roomId, 0n, 0n, 0n)
        const numBooks = this.getMaxBookId(floorId)
        return bookId <= numBooks
    }

    static getMaxInstanceIdOnShelf(roomId, floorId, shelfId) {
        const delta = this.getMaxBookId(floorId) - this.bookIdFromLocation(roomId, shelfId, 0n, 0n)

        if (delta > 208n) {
            return 208n
        } else if (delta < 0n) {
            return 0n
        } else {
            return delta
        }
    }

    static stopCalculation() {
        this.stopCalculationFlag = true
    }

    static get alphabetLength() {
        return BigInt(this.alphabet.length)
    }

    static generateBook(bookId, length) {
        let bookContent = ""

        for (let i = 0n; i < length; i++) {
            let alphabetIndex = bookId % this.alphabetLength
            bookContent += this.alphabet[alphabetIndex]
            bookId -= alphabetIndex
            bookId /= this.alphabetLength
        }

        return bookContent
    }

    static bookIdFromLocation(roomId, shelfId, rowId, columnId) {
        // 26 books / column
        // 8 columns / shelf >>> 26*8 = 208 books / shelf
        // 8 shelves / room  >>> 26*8*8 = 1664 books / room
        return roomId * 1664n + shelfId * 208n + rowId * 26n + columnId
    }

    static bookFromLocation(roomId, shelfId, rowId, columnId, floorId) {
        if (!this.roomExists(roomId, floorId)) {
            throw new Error(`Room#${roomId} doesn't exist on floor ${floorId}`)
        }

        const bookId = this.bookIdFromLocation(roomId, shelfId, rowId, columnId)
        return this.generateBook(bookId, floorId)
    }

    static async bookIdFromContent(bookContent) {
        const floorId = BigInt(bookContent.length)

        let bookId = 0n
        let factor = 1n
        const factorFactor = this.alphabetLength
        for (let i = 0; i < bookContent.length; i++) {
            const letterIndex = i
            const letter = bookContent[letterIndex]
            const alphabetIndex = this.alphabet.indexOf(letter)
            if (alphabetIndex == -1) {
                throw new Error(`Unknown letter "${letter}" at index ${letterIndex}`)
            }

            bookId += factor * BigInt(alphabetIndex)
            factor *= factorFactor

            if (i % 1000 == 0) {
                await new Promise(resolve => setTimeout(resolve, 0))
                if (this.stopCalculationFlag) {
                    throw new Error("Stopped Calculation")
                }
            }
        }
        
        return {bookId, floorId}
    }

    static async searchBookByOnlyId(bookId, {generatePaths = true}={}) {
        let floorId = 1n

        // use copy of variable in case js ever decides
        // to pass BigInt's by reference and break everything
        let a = bookId
        const divisor = this.alphabetLength

        while (a > 1n) {
            a /= divisor
            floorId++

            if (floorId % 1000n == 0n) {
                await new Promise(resolve => setTimeout(resolve, 0))
            }
        }

        return this.searchBookById(bookId, floorId, {generatePaths})
    }

    static async searchBookById(bookId, floorId, {generatePaths = true}={}) {
        this.stopCalculationFlag = false
        const roomId = bookId / 1664n
        let remainder = bookId % 1664n

        const shelfId = remainder / 208n
        remainder = remainder % 208n

        const rowId = remainder / 26n
        remainder = remainder % 26n

        const columnId = remainder

        if (generatePaths) {
            const path = await RoomIndicator.generatePath(roomId)
            const naivePath = PathBuilder.toNaivePath(path)
            return {bookId, floorId, roomId, shelfId, rowId, columnId, path, naivePath}
        }

        return {bookId, floorId, roomId, shelfId, rowId, columnId}
    }

    static async searchBook(bookContent, {generatePaths = true}={}) {
        this.stopCalculationFlag = false
        const {bookId, floorId} = await this.bookIdFromContent(bookContent)
        return await this.searchBookById(bookId, floorId, {generatePaths})
    }

}

window.BookGenerator = BookGenerator