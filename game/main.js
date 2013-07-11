require(['engine/physics', 'engine/level', 'engine/controls', 'engine/draw', 'engine/manager', 'game/ent'], 
function(physics, level, controls, draw, manager, c) {
    var _done = false;
    function initManager() {
        var canvas = document.getElementById('game-canvas');
        draw.init(canvas, 800, 400);
        draw.setCanvasSegmentSize(600, 300);
        draw.setFont('Sans', 34); 
        physics.init(0, 25, 60);
    }

    function setupControls(element){
        controls.listenForKeyboardEvents(element);
        controls.registerEvent('pl-up', 38);
        controls.registerEvent('pl-down', 40);
        controls.registerEvent('pl-left', 37);
        controls.registerEvent('pl-right', 39);
    }

    function update() {
        if (!_done) {
            physics.update();
            manager.updateAll();
            requestAnimationFrame(update);
        }
        else {
            draw.clearScreen();
            draw.renderTextScreen('Game Over..', 330, 160)
        }
    }

    function breakItDown() {
        _done = true;
        manager.clearAll();
        physics.clearWorldObstacles();
    }

    function startLevel() {
        level.loadLevel('data/level_a.json');
        var player = new c.playerObject({
            x:50,
            y:50,
            w:10,
            h:10,
            acceleration: 50,
            deathTrigger: breakItDown
        });
    }

    setupControls(window);
    initManager();
    startLevel();
    update();
})
