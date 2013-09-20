require(['engine/resources','engine/physics', 'engine/level', 'engine/controls', 'engine/draw', 'engine/manager', 'game/ent', 'game/defn'], 
function(res, physics, level, controls, draw, manager, c, d) {
    var _state = 0,
        /* 0: start screen
         * 1: game
         * 2: score page */
    maxSpawn = 10,
    infi = true,
    time = {
        lapse: 1/40,
        min: 1/120,
        max: 1/40,
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
            if (c.ref.player.bulletTime()) {
                time.lapse = Math.max(time.min, time.lapse-time.acc);
            } else {
                time.lapse = Math.min(time.max, time.lapse+time.acc);
            }
        }
    }

    function finalScoreScreen(handle) {
        
    }

    function update() {
        if (_state == 1) {
            physics.update(time.lapse);
            manager.updateAll(time.lapse/time.max);
            gameUpdate();
            controls.reset();
        } else if (_state == 0) {
            draw.clearScreen();
            var hd = draw.handle;
        } else {
            if(controls.ev('restart')) {
                reset();
            }
            draw.clearScreen();
            var hd = draw.core.handle;
            hd.textAlign = 'center';
            hd.font = '22pt Sans';
            hd.fillText('Score is:'+(spawnXomB.numKilled || 0), draw.core.frame.width/2,
                        draw.core.frame.height/2)
        }
        requestAnimationFrame(update);
    }

    function reset() {
    
    }

    function breakItDown() {
        console.log('player dead');
        _state = 2;
        manager.clearAll();
    }

    function spawnXomB(object) {
        spawnXomB.numSpawn = spawnXomB.numSpawn || 0;
        if (object) {
            spawnXomB.numKilled = spawnXomB.numKilled || 0;
            spawnXomB.numKilled += 1;
        }
        if(_state == 1){
            var spawnPoint = level.getSpawn('XomB');
            new c.zombieObject({
                x: spawnPoint.x,
                y: spawnPoint.y,
                w: 16,
                h: 16,
                speed: 40,
                damage: .3,
                normalAnim: d.okB,
                suckAnim: d.madB,
                deathTrigger: spawnXomB,
            });
        }
        spawnXomB.numSpawn += 1;
    }

    function loadEntities() {
        var spawnPoint = level.getSpawn('player');
        new c.playerObject({
            x: spawnPoint.x,
            y: spawnPoint.y,
            w: 8,
            h: 8,
            speed: 5,
            deathTrigger: breakItDown,
            sound: 100,
            weapon: c.silencePistol,
            stamina: 400,
            damping: 2,
            melee: 100,
        });
        for (var i = 0; i < 30; i+=1) {
            spawnXomB();
        }
    }

    function startLevel(level_json, cback) {
        _state = 0;
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
    }
    function startGame() {
        physics.init(0, 25, 60);
        setupControls(window);
        contactCallbacks();
        startLevel('data/level_n.json', loadEntities);
        _state = 1;
    }
    initManager();
    startGame();
    update();
})
