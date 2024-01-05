{
    const floorChoiceContainer = document.getElementById("floor-choice")
    const floorChoiceOutput = floorChoiceContainer.querySelector("input")
    const incrementButtons = floorChoiceContainer.querySelectorAll("button")
    let isAnimating = false

    function animationMsFromInc(inc) {
        inc = Math.abs(parseInt(inc))
        return Math.exp(-0.004 * (inc - 100)) * -500 + 1000
    }

    async function incremenetFloor(inc) {
        let newFloor = sceneManager.currFloorId + BigInt(inc)
        if (newFloor < 1n) {
            newFloor = 1n
        }

        
        isAnimating = true
        const animationMs = animationMsFromInc(sceneManager.currFloorId - newFloor)
        await sceneManager.changeFloor(newFloor, {animationDuration: animationMs})
        window.updateFloorChoice()
        isAnimating = false
    }

    for (let button of incrementButtons) {
        button.onclick = () => {
            if (isAnimating) {
                return
            }

            incremenetFloor(button.dataset.increment)
        }
    }

    window.updateFloorChoice = () => {
        floorChoiceOutput.value = `Current Floor: ${sceneManager.currFloorId}`
    }
}