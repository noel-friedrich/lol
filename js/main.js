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
}

init3d()