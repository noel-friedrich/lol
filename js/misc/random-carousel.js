{
    function randomFloor() {
        const x = Math.random()
        const a = 1.95
        const b = (1 - a) / a
        const c = 78.6
        const d = 1000
        return BigInt(Math.floor(Math.tan(Math.PI / 2 * a * (x + b)) * c + d))
    }

    let intervalId = null

    window.startRandomCarousel = () => {
        const f = async () => {
            BookViewer.close(false)
            Menu.close()
            await sceneManager.changeFloor(randomFloor(), {animationDuration: 1000})
            openRandomBook()
        }

        intervalId = setInterval(f, 10000)
        f()
    }

    window.stopRandomCarousel = () => {
        if (intervalId != null) {
            clearInterval(intervalId)
            intervalId = null
        }
    }
}