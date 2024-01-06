class ShareLink {

    // a-z, A-Z and 0-9
    static encodeAlphabet = "B6r9uWS8mYbIoXOh4EHUsGLnxkjZi05lCA2Dftzya7TRvFgKNdw1VeJqc3PpMQ"
    static maxUrlLength = 1000

    static generateUrl(bookId, floorId) {
        let baseUrl = window.location.href
        if (!baseUrl.endsWith("/")) {
            baseUrl += "/"
        }

        const url = `${baseUrl}?b=${this.encodeBook(bookId, floorId)}`

        if (url.length > this.maxUrlLength) {
            return false
        } else {
            return url
        }
    }

    static encodeNum(n) {
        if (n == 0n) {
            return this.encodeAlphabet[0]
        }

        let outputString = ""
        const alphabetLength = BigInt(this.encodeAlphabet.length)

        while (n > 0n) {
            const index = n % alphabetLength
            n /= alphabetLength
            outputString = this.encodeAlphabet[index] + outputString
        }

        return outputString
    }

    static decodeNum(encodedString) {
        if (encodedString.length == 0) {
            throw new Error("Invalid Encoded String (Empty)")
        }
 
        let sum = 0n
        let factor = 1n
        const alphabetLength = BigInt(this.encodeAlphabet.length)

        for (let i = 0; i < encodedString.length; i++) {
            const char = encodedString[encodedString.length - 1 - i]
            const index = this.encodeAlphabet.indexOf(char)

            if (index == -1) {
                throw new Error(`Invalid Encoded String (Unknown Character "${char}")`)
            }

            sum += BigInt(index) * factor
            factor *= alphabetLength
        }

        return sum
    }

    static encodeBook(bookId, floorId) {
        return `${this.encodeNum(bookId)}-${this.encodeNum(floorId)}`
    }

    static decodeBook(encodedString) {
        const parts = encodedString.split("-")
        if (parts.length != 2) {
            throw new Error(`Invalid Encoded String (Invalid Number of Parts: ${parts.length})`)
        }

        const [bookId, floorId] = parts.map(e => this.decodeNum(e))
        return {bookId, floorId}
    }

}

window.ShareLink = ShareLink