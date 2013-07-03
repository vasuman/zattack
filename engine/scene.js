var sceneManager = (function () {
    var states = {
        'start-screen': 0,
        'options-menu': 1,
        'game-play': 2,
        'pause-screen': 3
    };
    var currentState = 0;
    function init() {
        fireSlot(currentState);
        requestAnimationFrame(update);
    };
    function update() {
        switch(currentState) {
            case 0: break;
            case 1: //TODO
                    break;
            case 2: levelManager.update();
                    break;
            case 3: break;
        }
        this.r_id = requestAnimationFrame(sceneManager.update);
    }
    //TODO MOVE??
    function initStartScreen() {
        drawManager.renderTextScreen('ZATTACK', '48pt', 200, 200);
        HUDManager.addButton('start', function() {
            sceneManager.fireSlot(2);
        });
    };
    function fireSlot(state) {
        drawManager.clearScreen();
        HUDManager.clear();
        switch(state) {
            case 0: initStartScreen();
                    break;
            case 1: break;
            case 2: levelManager.init('data/level_a.json');
                    contactManager.init();
                    break;
            case 3: drawManager.drawPauseOverlay();
                    break;
        }
        currentState = state;
    };
    return {
        init: init,
        states: states,
        fireSlot: fireSlot,
        update: update
    }
})();

