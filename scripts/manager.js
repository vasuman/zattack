function XHRGet(link_url, callback) {
    var xR = new XMLHttpRequest;
    xR.open('GET', link_url, true);
    xR.source = link_url;
    xR.onload = callback;
};

var entityManager = new (function entityScheme() {
    var entities = [];
    //REMOVE; only for debugging
    //-----------------------
    this.getEnitities = function () {
        return entities;
    };
    //-----------------------
    this.registerEntity = function (ent){
        entities.push(ent);
        return entities.length;
    }
    this.clearAll = function() {
        entities = [];
    }
    this.updateAll = function () {
        for(var i=0; i<entities.length; i++) {
            if(entities[i]._dead){
                if(entities[i].pBody) {
                    physicsEngine.destroyBody(entities[i].pBody);
                }
                entities.splice(i, 1);
                continue;
            };
            if(entities[i].noUpdate){
                continue;
            }
            entities[i].updateChain();
        }
        drawManager.drawAll(entities);
    }
});


var drawManager = new (function drawScheme() {
    this.viewport={x:0, y:0};
    this.frame = {w:0, h:0};
    this.limits = {
        minX:0,
        maxX:0,
        minY:0,
        maxY:0,
    };
    this.clearAll = function() {
        this.handle.clearRect(0, 0, this.frame.w, this.frame.h);
    };
    this.renderStartScreen = function() {
        //TODO Draw BG
        //TODO Draw Text??
        this.clearAll();
        this.handle.font = 'bold 68pt Calibri';
        this.handle.fillText('ZATTACK!!', 200, 150);
        // sceneManager.fireSlot(2);
    };
    this.registerHandle = function(drawHandle) {
        this.handle=drawHandle;
    }
    this.drawAll = function(entities) {
        this.handle.clearRect(0, 0, this.frame.w, this.frame.h);
        for(var i=0; i<entities.length; i++) {
            //TODO: Implement sprites!!
            var dDat = entities[i].getDrawData();
            this.handle.fillRect(dDat.x-this.viewport.x, dDat.y-this.viewport.y, dDat.w, dDat.h)
        }
    }
    this.snapViewport = function(pos) {
        this.viewport.x=Math.min(Math.max(this.limits.minX, pos.x-this.frame.w/2), this.limits.maxX);
        this.viewport.y=Math.min(Math.max(this.limits.minY, pos.y-this.frame.h/2), this.limits.maxY);
    }
});

var sceneManager = new (function sceneScheme () {
    this.states = {
        'start-screen': 0,
        'options-menu': 1,
        'game-play': 2,
        'pause-screen': 3
    };
    this.currentState = 0;
    this.init = function() {
        this.fireSlot(this.currentState);
        requestAnimationFrame(this.update);
    };
    this.update = function() {
        switch(this.currentState) {
            case 0: drawManager.renderStartScreen();
                    break;
            case 1: drawManager.renderOptionsMenu();
                    break;
            case 2: physicsEngine.update();
                    entityManager.updateAll();
                    levelManager.update();
                    break;
            case 3: break;
        }
        requestAnimationFrame(this.update);
    }
    this.fireSlot = function(state) {
        switch(state) {
            case 0: this.initStartScreen();
                    break;
            case 1: drawManager.clearAll();
                    break;
            case 2: HUDManager.clear();
                    entityManager.clearAll();
                    physicsEngine.refreshWorld();
                    levelManager.init();
                    contactManager.init();
                    break;
            case 3: drawManager.drawPauseOverlay();
                    break;
        }
        this.currentState = state;
    };
    this.initStartScreen = function () {
        HUDManager.addButton('start', function() {
            sceneManager.fireSlot(2);
        });
    };
});


var levelManager = new (function levelScheme () {
    this.availableLevels = ['data/lv1.json'];
    this.levelComplete = false;
    this.levelChars = {};
    this.loadMap = function () {
        //EDIT here
        var sLvl = this.availableLevels;
        XHRGet(sLvl, function () {
            
        });
    }
    this.init = function() {
        //TODO Add JSON parsing code
        this.levelComplete = false;
        new physicalObject({x:0, y:0, w:20, h:800, isStatic:true, userData:'floor'});  
        // new physicalObject({x:0, y:390, w:800, h:20, isStatic:true, userData:'floor'});  
        // new physicalObject({x:400, y:390, w:800, h:20, isStatic:true, userData:'floor'});  
        new physicalObject({x:400, y:390, w:800, h:20, isStatic:true, userData:'floor'});  
        this.levelChars.player = new playerObject({   
            x: 50, 
            y: 50, 
            w: 10, 
            h: 10, 
            userData: 'player', 
            acceleration: 9, 
            damping: 1.4,
            filterGroup: -1,
            weapon: defnWeapons.testGun
        });
        this.levelChars.zombies=[];
        for(var i=0; i<20; i++) {
            this.levelChars.zombies.push(new zombieObject({
                x:Math.random()*400, 
                y:Math.random()*400, 
                w:10, 
                h:10, 
                moveSpeed: 2
            }));
        }
    }
    this.update = function() {
    //CHECK the state of **player** and **zombies**
        if(this.levelComplete)
            return;
        if(this.levelChars.player._dead) {
            window.alert('DEAD MOFO!!!');
            this.levelComplete = true;
            sceneManager.fireSlot(0);
        }
    };
    this.getConvergenceVector = function (position) {
        var dPos = this.levelChars.player.pos;
        return vMath.multAdd(dPos, -1, position);
    };
    this.makePath = function(zombie) {
        
    };
});


var contactManager = new (function contactScheme () {
    this.init = function () {
        //CONTACT Handlers
        //Bullet Handler
        physicsEngine.solveListener('bullet', 
            function(bullet, object, imp) {
                bullet.ent._dead=true;
                if(object.ent.hurt) {
                    object.ent.hurt(bullet.ent.hitDamage);
                    object.ent.stall();
                }
        });
        //Zombie Handler
        physicsEngine.solveListener('zombie', 
            function(zom, object, imp) {
                //Find a better way!!
                console.log(object)
                if(object['class'] == 'player') {
                    object.ent.hurt(10);
                }
        });        
    };
});


var HUDManager = new (function HUDScheme () {
    this.controlDiv = document.getElementById('controls');
    this.addButton = function (buttonName, callback) {
        var button = document.createElement('button')
        button.innerHTML = buttonName;
        button.onclick = callback;
        this.controlDiv.appendChild(button);
    };
    this.clear = function () {
        this.controlDiv.innerHTML = '';
    };
});
