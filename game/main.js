require(['engine/physics', 'engine/level', 'engine/controls', 'engine/draw', 'engine/manager', 'game/ent', 'game/defn'], 
function(physics, level, controls, draw, manager, c, d) {
    var _done = false,
        maxSpawn = 10,
        infi = true,
        zombies = [];

    var canvas = document.getElementById('game-canvas');
    function initManager() {
        draw.init(canvas, 800, 400);
        draw.setCanvasSegmentSize(600, 300);
        physics.init(0, 25, 60);
    }

    function setupControls(element){
        controls.listenForMouseEvents(canvas);
        controls.listenForKeyboardEvents(element);
        controls.registerEvent('melee',      90);
        controls.registerEvent('run',        16);
        controls.registerEvent('pl-up',      87);
        controls.registerEvent('pl-down',    83);
        controls.registerEvent('pl-left',    65);
        controls.registerEvent('pl-right',   68);
        controls.registerEvent('f-up',       38);
        controls.registerEvent('f-down',     40);
        controls.registerEvent('f-left',     37);
        controls.registerEvent('f-right',    39);
    }

    function update() {
        if (!_done) {
            physics.update(1/30);
            manager.updateAll();
            requestAnimationFrame(update);
            draw.drawOSD('❤ '+c.curPlayer.ent.health.toFixed(1)+'🔫 ' + 
                         c.curPlayer.ent.weapon.ammo+'⚡ '+c.curPlayer.ent.stamina, 'Sans', 12);
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

    function spawnXomB(object) {
        spawnXomB.numSpawn = spawnXomB.numSpawn || 0;
        if (object) {
            spawnXomB.numKilled = spawnXomB.numKilled || 0;
            spawnXomB.numKilled += 1;
        }
        if(spawnXomB.numSpawn < maxSpawn || infi) {
            var spawnPoint = level.getSpawn('XomB');
            new c.zombieObject({
                x: spawnPoint.x,
                y: spawnPoint.y,
                w: 10,
                h: 10,
                speed: 40,
                deathTrigger: spawnXomB,
            })
            spawnXomB.numSpawn += 1;
        }
        else if (!infi && spawnXomB.numSpawn == spawnXomB.numKilled) {
            breakItDown();
        }
    }

    function loadPlayer() {
        var spawnPoint = level.getSpawn('Player');
        new c.playerObject({
            x: spawnPoint.x,
            y: spawnPoint.y,
            w:10,
            h:10,
            speed: 20,
            deathTrigger: breakItDown,
            weapon: d.testGun,
            stamina: 400,
            regen: 1,
        });
        for (var i = 0; i < 30; i+=1) {
            spawnXomB();
        }
    }

    function startLevel() {
        _done = false;
        level.loadLevel('data/level_n.json', loadPlayer);
        update();
    }

    function contactCallbacks() {
        function bulletContact(bullet, object) {
            if (object.type != 'player'){
                bullet.ent._dead = true;
            }
            if (object.type == 'zombie') {
                object.ent.damage(bullet.ent.hitDamage);
                object.ent.alert(bullet.ent.pos)
            }
            //TODO got's to get GOT
        }
        function xomBContact(xomB, object) {
            if(object.type == 'player') {
                object.ent.attach(xomB.ent);
                xomB.ent.suck(object.ent);
            }
        }
        physics.contactListener('bullet', bulletContact)
        physics.solveListener('zombie', xomBContact)
    }

    function setupGame() {
        contactCallbacks();
        startLevel();
    }

    setupControls(window);
    initManager();
    setupGame();
})
