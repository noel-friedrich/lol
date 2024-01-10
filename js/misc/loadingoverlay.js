class LoadingOverlay {

    static container = document.getElementById("loading-overlay")

    static show() {
        this.container.animate([
            {transform: "translateY(-100%)"},
            {transform: "translateY(0px)"}
        ], {
            duration: 500,
            easing: "ease-in-out",
            fill: "forwards"
        })
    }

    static hide() {
        this.container.animate([
            {transform: "translateY(0px)"},
            {transform: "translateY(-100%)"}
        ], {
            duration: 500,
            easing: "ease-in-out",
            fill: "forwards"
        })
    }

}

window.LoadingOverlay = LoadingOverlay