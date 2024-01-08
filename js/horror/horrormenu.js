class HorrorMenu {

    static container = document.getElementById("horror-menu-container")

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

    static open(sectionName="start") {
        Menu.close()
        BookViewer.close()

        this.hideAllSections()
        this.getSection(sectionName).style.display = "block"
        this.container.style.display = "flex"
    }

    static close() {
        this.container.style.display = "none"
    }

}

window.HorrorMenu = HorrorMenu