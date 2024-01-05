class Comments {

    static numCommentsOutput = document.getElementById("num-comments-output")
    static loadingCommentsDisplay = document.getElementById("loading-comments-display")
    static commentsContainer = document.getElementById("comments-container")

    static commentAuthorInput = document.getElementById("comment-author-input")
    static commentContentInput = document.getElementById("comment-content-input")
    static commentSubmitButton = document.getElementById("comment-submit-button")
    static commentErrorOutput = document.getElementById("comment-error-output")

    static currHash = null

    static async getBookIdHash(bookId) {
        let hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bookId.toString()))
        let hashArray = Array.from(new Uint8Array(hash))
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
    }

    static async getComments(bookId) {
        const hash = await this.getBookIdHash(bookId)
        this.currHash = hash

        const rawResponse = await fetch(`api/get_comments.php?bookid_hash=${hash}`)
        const response = await rawResponse.json()
        if (response.ok) {
            return response.comments
        } else {
            throw new Error(response.error)
        }
    }

    static makeCommentElement(commentData) {
        const commentElement = document.createElement("div")
        const profilePicture = document.createElement("div")
        const author = document.createElement("div")
        const content = document.createElement("div")

        commentElement.classList.add("comment")
        profilePicture.classList.add("profile-picture")
        author.classList.add("author")
        content.classList.add("content")

        author.textContent = `"${commentData.author}" commented (${commentData.create_time}):`
        content.textContent = commentData.content

        commentElement.appendChild(profilePicture)
        commentElement.appendChild(author)
        commentElement.appendChild(content)

        return commentElement
    }

    static setLoading(newState) {
        if (newState == true) {
            this.loadingCommentsDisplay.textContent = "Loading Comments..."
            this.loadingCommentsDisplay.style.display = "block"
            this.numCommentsOutput.textContent = "?"
        } else if (newState == false) {
            this.loadingCommentsDisplay.style.display = "none"
        }
    }

    static async load(bookId) {
        this.commentErrorOutput.textContent = ""
        
        try {
            this.commentsContainer.innerHTML = ""
            this.setLoading(true)
    
            const comments = await this.getComments(bookId)
            this.numCommentsOutput.textContent = comments.length
    
            for (let commentData of comments) {
                const commentElement = this.makeCommentElement(commentData)
                this.commentsContainer.appendChild(commentElement)
            }
    
            this.setLoading(false)
        } catch (e) {
            this.loadingCommentsDisplay.textContent = e.message
            this.loadingCommentsDisplay.style.display = "block"
            this.commentsContainer.innerHTML = ""
        }
    }

    static init() {
        const error = msg => {
            this.commentErrorOutput.textContent = msg == "noshow" ? "" : msg

            if (msg) {
                this.commentSubmitButton.disabled = true
            } else {
                this.commentSubmitButton.disabled = false
            }

            return {author: null, content: null}
        }

        const checkInputs = () => {
            if (this.currHash == null) {
                return error("noshow")
            }

            const author = this.commentAuthorInput.value
            const content = this.commentContentInput.value

            if (author.length == 0) {
                return error("noshow")
            }

            if (!/^[a-zA-Z.,\s]{1,64}$/.test(author)) {
                return error("Invalid Name. Name may only consist of 64 letters, spaces, periods or commas.")
            }

            if (content.length == 0) {
                return error("noshow")
            }

            if (!/^[a-zA-Z.,\n\s]{1,512}$/.test(content)) {
                return error("Invalid Comment. Comment may only consist of 512 letters, spaces, periods or commas.")
            }

            error("")
            return {author, content}
        }

        this.commentAuthorInput.oninput = checkInputs
        this.commentContentInput.oninput = checkInputs

        this.commentSubmitButton.onclick = async () => {
            const {author, content} = checkInputs()
            if (author == null) return

            const formData = new FormData()
            formData.append("author", author)
            formData.append("content", content)
            formData.append("bookid_hash", this.currHash)
        
            const rawResponse = await fetch("api/write_comment.php", {
                method: "POST",
                body: formData
            })

            const response = await rawResponse.json()
            
            if (response.ok) {
                this.commentErrorOutput.textContent = "Comment sent. After an admin has confirmed it, it will appear here. Thank you!"
                this.commentAuthorInput.value = ""
                this.commentContentInput.value = ""
            } else {
                this.commentErrorOutput.textContent = response.error
            }
        }
    }

}