require(['engine/physics', 'engine/level', 'engine/controls', 'engine/draw', 'engine/manager', 'game/ent', 'game/defn'], 
function(physics, level, controls, draw, manager, c, d) {
    var _done = false,
        maxSpawn = 10;
    console.log(d);
    function initManager() {
        var canvas = document.getElementById('game-canvas');
        draw.init(canvas, 800, 400);
        draw.setCanvasSegmentSize(600, 300);
        draw.setFont('Sans', 34); 
        physics.init(0, 25, 60);
    }

    function setupControls(element){
        controls.listenForKeyboardEvents(element);
        controls.registerEvent('f-up',      87);
        controls.registerEvent('f-down',    83);
        controls.registerEvent('f-left',    65);
        controls.registerEvent('f-right',   68);
        controls.registerEvent('pl-up',     38);
        controls.registerEvent('pl-down',   40);
        controls.registerEvent('pl-left',   37);
        controls.registerEvent('pl-right',  39);
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
        physics.clearListeners();
    }

    function spawnXomB(start) {
        spawnXomB.numSpawn = spawnXomB.numSpawn || 0;
        if (!start) {
            spawnXomB.numKilled = spawnXomB.numKilled || 0;
            spawnXomB.numKilled += 1;
        }
        if(spawnXomB.numSpawn < maxSpawn) {
            var spawnPoint = level.getSpawn('XomB');
            new c.zombieObject({
                x: spawnPoint.x,
                y: spawnPoint.y,
                w: 10,
                h: 10,
                speed: 20,
                deathTrigger: spawnXomB,
            })
            spawnXomB.numSpawn += 1;
        }
        else if (spawnXomB.numSpawn == spawnXomB.numKilled) {
            breakItDown();
        }
    }

    sp = spawnXomB;
    function loadPlayer() {
        var spawnPoint = level.getSpawn('Player');
        new c.playerObject({
            x: spawnPoint.x,
            y: spawnPoint.y,
            w:10,
            h:10,
            speed: 50,
            deathTrigger: breakItDown,
            weapon: d.testGun,
        });
        
        for (var i = 0; i < 10; i+=1) {
            spawnXomB(true);
        }
    }

    function startLevel() {
        _done = false;
        level.loadLevel('data/level_n.json', loadPlayer);
        update();
    }

    function contactCallbacks() {
        function bulletContact(bullet, object) {
            bullet.ent._dead = true;
            if (object['class'] == 'zombie') {
                console.log('hurt')
                object.ent.damage(bullet.ent.hitDamage);
            }
        }
        physics.solveListener('bullet', bulletContact)
    }

    function setupGame() {
        contactCallbacks();
        startLevel();
    }

    setupControls(window);
    initManager();
    setupGame();
})
