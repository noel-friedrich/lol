async function init3d() {

    const domManager = new DomManager()
    const sceneManager = new SceneManager(domManager)

    window.domManager = domManager
    window.sceneManager = sceneManager

    domManager.init()
    sceneManager.init()

    if (new URLSearchParams(location.search).has("vr")) {
        domManager.initVR()
        sceneManager.initVR()
    }
    
    domManager.addToBody(sceneManager.canvas)
    
    function loop() {
        HorrorManager.update()
        sceneManager.update()
        domManager.update(sceneManager)
        animationManager.update()

        sceneManager.render()
    }
    
    sceneManager.setLoop(loop)
    
    window.addEventListener("resize", () => sceneManager.onWindowResize())
    RoomIndicator.update(sceneManager)
    BookViewer.init()
    Menu.init()
    initSearch()
    updateFloorChoice()
    Comments.init()
    HorrorMenu.init()

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has("b") || urlParams.has("book")) {
        const bookCode = urlParams.get("b") || urlParams.get("book")
        try {
            const {bookId, floorId} = ShareLink.decodeBook(bookCode)
            Menu.close()
            await sceneManager.changeFloor(floorId, {animationDuration: 0})
            BookViewer.openBook(bookId)
        } catch (e) {
            // remove search params

            if (urlParams.has("debug")) {
                console.error(e)
                alert(e.message)
            } else {
                window.location.href = window.location.href.split("?")[0]
            }
        }
    }

    LoadingOverlay.hide()
}

init3d()