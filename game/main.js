require(['engine/resources','engine/physics', 'engine/level', 'engine/controls', 'engine/draw', 'engine/manager', 'game/ent', 'game/defn'], 
function(res, physics, level, controls, draw, manager, c, d) {
    var _done = false,
        maxSpawn = 10,
        infi = true,
        time = {
            lapse: 1/30,
            min: 1/120,
            max: 1/30,
            acc: 1/200,
        },
        zombies = [];

    var canvas = document.getElementById('game-canvas');

    function setupControls(element){
        controls.listenForMouseEvents(canvas);
        controls.listenForKeyboardEvents(element);
        controls.registerEvent('melee',      70);
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

    function gameUpdate() {
        if (c.ref.player) {
            var health = c.ref.player.$.health.toFixed(1),
            ammo = c.ref.player.def.weapon.$.ammo.toFixed(1),
            stamina = c.ref.player.$.stamina.toFixed(1);
            draw.drawOSD('❤ '+health+'🔫 ' +ammo+'⚡ '+stamina, 'Sans', 12);
            if (controls.mousePressed(0)) {
                time.lapse = Math.max(time.min, time.lapse-time.acc);
            } else {
                time.lapse = Math.min(time.max, time.lapse+time.acc);
            }
        }
    }

    function update() {
        if (!_done) {
            physics.update(time.lapse);
            manager.updateAll(time.lapse/time.max);
            gameUpdate();
            controls.reset();
            requestAnimationFrame(update);
        }
        else {
            draw.clearScreen();
        }
    }

    function reset() {
    
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
                w: 32,
                h: 32,
                speed: 40,
                damage: 0,
                normalAnim: d.okB,
                suckAnim: d.madB,
                deathTrigger: spawnXomB,
            })
            spawnXomB.numSpawn += 1;
        }
        else if (!infi && spawnXomB.numSpawn == spawnXomB.numKilled) {
            breakItDown();
        }
    }

    function loadEntities() {
        var spawnPoint = level.getSpawn('Player');
        new c.playerObject({
            x: spawnPoint.x,
            y: spawnPoint.y,
            w:10,
            h:10,
            speed: 35,
            deathTrigger: breakItDown,
            sound: 100,
            weapon: d.testGun,
            stamina: 400,
            melee: 100,
        });
        for (var i = 0; i < 30; i+=1) {
            spawnXomB();
        }
    }

    function startLevel(level_json, cback) {
        _done = false;
        level.loadLevel(level_json, cback);
        update();
    }

    function contactCallbacks() {
        function bulletContact(bullet, object) {
            if (object.type != 'player'){
                bullet.ent.$.dead = true;
            }
            if (object.type == 'zombie') {
                object.ent.damage(bullet.ent.def.damage);
                object.ent.alert(bullet.ent.def.vec.pos);
            }
            //TODO got's to get GOT
        }
        function xomBContact(xomB, object) {
            if(object.type == 'player') {
                object.ent.attach(xomB.ent);
                xomB.ent.suck(object.ent);
            }
        }
        function pUpContact(pUp, object) {
            if(object.type == 'player') {
                object.ent.powerUp(object.ent);
                object.ent.$.dead = true;
            }
        }
        physics.contactListener('bullet', bulletContact)
        physics.contactListener('zombie', xomBContact)
    }

    function initManager() {
        draw.init(canvas, 800, 400);
        draw.setCanvasSegmentSize(600, 300);
        physics.init(0, 25, 60);
        setupControls(window);
        contactCallbacks();
        startLevel('data/level_n.json', loadEntities);
    }

    initManager();
})
