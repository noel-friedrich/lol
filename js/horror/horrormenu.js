class HorrorMenu {

    static container = document.getElementById("horror-menu-container")
    static highscoresContainer = document.getElementById("highscores-container")
    static scoreOutput = document.getElementById("score-output")
    static highscoreNameInput = document.getElementById("highscore-name-input")

    static getSections() {
        return this.container.querySelectorAll("section[data-name]")
    }
    
    static hideAllSections() {
        for (let section of this.getSections()) {
            section.style.display = "none"
        }
    }

    static getSection(name) {
        return Array.from(this.container.querySelectorAll("section[data-name]")).find(p => p.dataset.name == name)
    }

    static async getHighscores() {
        const response = await fetch("../../terminal/api/get_highscores.php?game=lol")
        const scores = await response.json()

        scores.sort((a, b) => a.score - b.score)
        let place = 0
        let currScore = Infinity
        for (let score of scores) {
            if (score.score != currScore) {
                place++
            }

            score.place = place

            currScore = score.score
        }

        return scores
    }

    static updateScoreOutput(score) {
        this.scoreOutput.textContent = score
    }

    static async updateHighscores() {
        this.highscoresContainer.innerHTML = "Loading..."
        const highscores = await this.getHighscores()
        this.highscoresContainer.innerHTML = ""

        for (let highscore of highscores) {
            const element = document.createElement("div")
            const place = document.createElement("div")
            const name = document.createElement("div")
            const score = document.createElement("div")
            const time = document.createElement("div")

            place.dataset.name = "place"
            name.dataset.name = "name"
            score.dataset.name = "score"
            time.dataset.name = "time"

            place.textContent = highscore.place
            name.textContent = highscore.name
            score.textContent = highscore.score
            time.textContent = highscore.time

            element.appendChild(place)
            element.appendChild(name)
            element.appendChild(score)
            element.appendChild(time)

            this.highscoresContainer.appendChild(element)
        }
    }

    static getHighscoreName() {
        return Comments.replaceWithAlphabet(this.highscoreNameInput.value).slice(0, 32)
    }

    static sendingButtonBusy = false
    static async sendHighscore() {
        if (this.sendingButtonBusy) {
            return
        }

        this.sendingButtonBusy = true

        const name = this.getHighscoreName()
        if (name.length == 0) {
            return
        }

        const params = {
            game: "lol", name,
            score: HorrorManager.score,
        }

        let url = "../../terminal/api/upload_highscore.php?"
        for (let [paramName, paramValue] of Object.entries(params)) {
            url += `${paramName}=${encodeURIComponent(paramValue)}&`
        }

        await fetch(url)
        await new Promise(resolve => setTimeout(resolve, 500))
        this.sendingButtonBusy = false

        this.open("highscores")
    }

    static open(sectionName="start") {
        Menu.close()
        BookViewer.close()

        this.hideAllSections()
        this.getSection(sectionName).style.display = "block"
        this.container.style.display = "flex"

        if (sectionName == "highscores") {
            this.updateHighscores()
        }

        sceneManager.blockInputs = true
    }

    static close() {
        this.container.style.display = "none"
        sceneManager.blockInputs = false
    }

    static init() {
        this.highscoreNameInput.oninput = () => {
            this.highscoreNameInput.value = this.getHighscoreName()
        }
    }

}

window.HorrorMenu = HorrorMenu