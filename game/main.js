require(['engine/resources','engine/physics', 'engine/level', 'engine/controls', 'engine/draw', 'engine/manager', 'game/ent', 'game/defn'], 
function(res, physics, level, controls, draw, manager, c, d) {
    var _state = 0,
        /* 0: loading
         * 1: start screen
         * 2: game
         * 3: score page
         **/
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

    var cClass = {
        'sniper': {
            description: ['Makes noise while running and slower.',
                'Low health', 'Equipped with sniper rifle',
                'Time slows down on firing',
                'Does UBER damage', 'More stamina'],
            pArg: {
                speed: 5,
                sound: 100,
                weapon: c.sniperRifle,
                stamina: 650,
                melee: 70,
                run: 2
            }
        },
        'assault': {
            description: ['Makes LOADS of noise while running but faster.',
                'High health', 'Equipped with machinegun',
                'Full automatic burst fire',
                'Does average damage', 'Medium stamina'],
            pArg: {
                speed: 9,
                sound: 150,
                weapon: c.machineGun,
                stamina: 550,
                melee: 70,
                run: 2
            }
        },
        'stealth': {
            description: ['Makes lesser noise while running, but slower.',
                'Medium health', 'Equipped with silenced pistol',
                'Does lesser damage', 'Better melee', 'More stamina'],
            pArg: {
                speed: 6,
                sound: 50,
                weapon: c.silencePistol,
                stamina: 600,
                melee: 100,
                run: 2
            }
        },
    }
    function setupControls(element){
        controls.listenForMouseEvents(canvas);
        controls.listenForKeyboardEvents(element);
        controls.registerEvent('assault-ch',72);
        controls.registerEvent('stealth-ch',74);
        controls.registerEvent('sniper-ch', 75);
        controls.registerEvent('l',         76);
        controls.registerEvent('restart',   82);
        controls.registerEvent('start',     73);
        controls.registerEvent('melee',     70);
        controls.registerEvent('run',       16);
        controls.registerEvent('pl-up',     87);
        controls.registerEvent('pl-down',   83);
        controls.registerEvent('pl-left',   65);
        controls.registerEvent('pl-right',  68);
        controls.registerEvent('f-up',      38);
        controls.registerEvent('f-down',    40);
        controls.registerEvent('f-left',    37);
        controls.registerEvent('f-right',   39);
    }

    function gameControls() {
        
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

    function loadScreen(core) {
        loadScreen.idx = loadScreen.idx || 0;
        var hd = core.handle,
        prTxt = 'Loading';
        hd.fillStyle = 'black';
        hd.fillRect(0, 0, core.frame.width, core.frame.height);
        hd.textAlign = 'center';
        for(var  i = 0; i<loadScreen.idx/30; i+=1) {
            prTxt+='.';
        }
        loadScreen.idx = (loadScreen.idx+1)%100
        hd.fillStyle = 'yellow';
        hd.font = '22pt Calibri'
        hd.fillText(prTxt, core.frame.width/2, core.frame.height/2)
    }

    function scoreScreen(core) {
        var hd = core.handle;
        hd.textAlign = 'center';
        hd.font = '22pt Sans';
        hd.fillText('"r" - Restart. Score: '+(spawnXomB.numKilled || 0), core.frame.width/2,
                    core.frame.height/2)
    }

    function infoScreen(core) {
        var hd = core.handle;
        hd.fillStyle = 'black';
        hd.textAlign = 'center';
        hd.font = '18pt Terminus';
        hd.fillText('Press,\n"h"-assault\n"j"-stealth\n"k"-sniper',
                    core.frame.width/2, core.frame.height/2);
    }

    function update() {
        if (_state == 0) {
            draw.clearScreen();
            loadScreen(draw.core);
        } else if (_state == 1) {
            if(controls.ev('assault-ch')) {
                _state = 2;
                loadEntities(cClass.assault.pArg);
            }
            if(controls.ev('stealth-ch')) {
                _state = 2;
                loadEntities(cClass.stealth.pArg);
            }
            if(controls.ev('sniper-ch')) {
                _state = 2;
                loadEntities(cClass.sniper.pArg);
            }
            draw.clearScreen();
            infoScreen(draw.core);
        } else if (_state == 2) {
            physics.update(time.lapse);
            manager.updateAll(time.lapse/time.max);
            gameUpdate();
            controls.reset();
        } else if (_state == 3){
            if(controls.ev('restart')) {
                _state = 1;
            }
            draw.clearScreen();
            scoreScreen(draw.core);
        }
        requestAnimationFrame(update);
    }

    function breakItDown() {
        console.log('player dead');
        _state = 3;
        manager.clearAll();
    }

    function spawnXomB(object) {
        spawnXomB.numSpawn = spawnXomB.numSpawn || 0;
        if (object) {
            spawnXomB.numKilled = spawnXomB.numKilled || 0;
            spawnXomB.numKilled += 1;
            // Attached bees don't drop shit
            if(object.$.state != -1) {
                if(Math.random()*10<1.5) {
                    new c.ammoCrate({
                        x: object.pos.x,
                        y: object.pos.y,
                        w: 24,
                        h: 24,
                    });
                } else if(Math.random()*9 < 1) {
                    new c.healthPack({
                        x: object.pos.x,
                        y: object.pos.y,
                        w: 24,
                        h: 24,
                        restore: 40,
                    });
                }
            }
            // Reward spawn 1/10 -> ammo
            // 9/10*1/9 -> health
            
        }
        if(_state == 2){
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

    function loadEntities(pArg) {
        var spawnPoint = level.getSpawn('player');
        pArg.x = spawnPoint.x;
        pArg.y = spawnPoint.y;
        pArg.w = 11;
        pArg.h = 11;
        pArg.deathTrigger = breakItDown;
        pArg.damping = 2.1;
        new c.playerObject(pArg);
        for (var i = 0; i < 50; i+=1) {
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
            if (object.type != 'player' && object.type != 'pickup'){
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
                pUp.ent.apply(object.ent);
                pUp.ent.$.dead = true;
            }
        }
        physics.contactListener('bullet', bulletContact)
        physics.contactListener('zombie', xomBContact)
        physics.contactListener('pickup', pUpContact)
    }
    function setupGame(images, cback) {
        physics.init(0, 25, 60);
        setupControls(window);
        contactCallbacks();
        res.loadImages(images, cback);
    }
    function startGame() {
        startLevel('data/level_n.json', function() {
            _state = 1;
        });
    }
    draw.init(canvas, 1000, 600);
    draw.setCanvasSegmentSize(600, 300);
    setupGame(['otile.png'], startGame);
    update();
})
