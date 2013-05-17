
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
        for(var i = 0; i < entities.length; i+=1) {
            if (entities[i]._dead) {
                if (entities[i].pBody) {
                    physicsEngine.destroyBody(entities[i].pBody);
                }
                entities.splice(i, 1);
                continue;
            };
            if (entities[i].noUpdate) {
                continue;
            }
            entities[i].updateChain();
        }
        drawManager.drawAll(entities);
    }
});


var drawManager = new (function drawScheme() {
    this.viewport = {x:0, y:0};
    this.frame = {w:0, h:0};
    //Plural of canvas
    this.canvii = [];
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
        this.clearAll();
        this.handle.font = 'bold 68pt Calibri';
        this.handle.fillText('ZATTACK!!', 200, 150);
    };
    this.registerHandle = function(drawHandle) {
        this.handle = drawHandle;
    }
    this.drawAll = function(entities) {
        this.handle.clearRect(0, 0, this.frame.w, this.frame.h);
        this.renderLevel();
        for(var i=0; i<entities.length; i++) {
            //TODO: Implement sprites!!
            var dDat = entities[i].getDrawData();
            this.handle.fillRect(dDat.x-this.viewport.x, dDat.y-this.viewport.y, dDat.w, dDat.h)
        }
    }
    this.initLevel = function (level) {
        var reqImages = [];
        this.level = level;
        for(var tileNum in level.trCodes) {
            reqImages.push(level.trCodes[tileNum].image);
        }
        function exec_stage_2 () {
            drawManager.preDraw();
        };
        resorceManager.loadImages(reqImages, exec_stage_2);
    };
    this.preDraw = function () {
        var gridSize = this.level.tileSize;
        for(var i = 0; i < this.level.width; i+=1) {
            for(var j = 0; j < this.level.height; j+=1) {
                var x = j*gridSize, y = i*gridSize;
                var fl = Math.floor;
                var c_id = fl(x/this.frame.w) + fl(y/this.frame.h);
                if(!this.canvii[c_id]) {
                    this.canvii[c_id] = document.createElement('canvas');
                    this.canvii[c_id].width = this.frame.w + gridSize;
                    this.canvii[c_id].height = this.frame.h + gridSize;
                    //Need to alias values for inFrame
                    this.canvii[c_id].w = this.frame.w;
                    this.canvii[c_id].h = this.frame.h;
                    this.canvii[c_id].x = fl(x/this.frame.w)*this.frame.w;
                    this.canvii[c_id].y = fl(y/this.frame.h)*this.frame.h;
                }
                x -= this.canvii[c_id].x;
                y -= this.canvii[c_id].y;
                var tile = this.level.mapData[i][j];
                var ts = this.level.trCodes[tile];
                this.canvii[c_id].getContext('2d').drawImage(
                    resorceManager.images[ts.image],
                    ts.gridX*gridSize,
                    ts.gridY*gridSize,
                    gridSize, gridSize,
                    x, y,
                    gridSize, gridSize
                );
            }
        }
    }
    this.renderLevel = function () {
        for(var i=0; i<this.canvii.length; i+=1) {
            if(this.isInFrame(this.canvii[i])) {
                // console.log(i)
                // console.log('drawingat', this.canvii[i].x - this.viewport.x, this.canvii[i].y - this.viewport.y)
                this.handle.drawImage(this.canvii[i],
                                      this.canvii[i].x - this.viewport.x,
                                      this.canvii[i].y - this.viewport.y)
            }
        }
    
    };
    this.snapViewport = function(pos) {
        //Two lines!! Muah is GENIUS
        this.viewport.x = Math.min(Math.max(this.limits.minX, pos.x-this.frame.w/2), this.limits.maxX);
        this.viewport.y = Math.min(Math.max(this.limits.minY, pos.y-this.frame.h/2), this.limits.maxY);
    };

    this.isInFrame = function (pDat) {
        return ((pDat.x < this.viewport.x + this.frame.w) &&
                (pDat.x + pDat.w > this.viewport.x) &&
                (pDat.y < this.viewport.y + this.frame.h) &&
                (pDat.y + pDat.h > this.viewport.y));
    };
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


var resorceManager = new(function resourceScheme () {
    function XHRGet(link_url, callback) {
        var xR = new XMLHttpRequest;
        xR.open('GET', link_url, true);
        xR.source = link_url;
        xR.onload = callback;
        xR.send();
    };
    this.images = {};
    this.json_data = {};
    this.loadImages = function (image_names, callback) {
        var num_img = 0;
        function cCb() {
            num_img++;
            if(num_img >= image_names.length) {
                callback();
            }
        }
        for(var idx=0; idx < image_names.length; idx+=1) {
            var tmpImg = new Image();
            tmpImg.onload = cCb;
            tmpImg.src = image_names[idx];
            this.images[image_names[idx]] = tmpImg;
        }
    }
    this.loadJSON = function (json_list, callback) {
        var num_json = 0;
        function cCb() {
            resorceManager.json_data[this.source] = JSON.parse(this.response);
            num_json++;
            if(num_json >= json_list.length) {
                callback();
            }
        }
        for(var idx=0; idx < json_list.length; idx+=1) {
            XHRGet(json_list[idx], cCb)
        }
    }

});


var levelManager = new (function levelScheme () {
    this.levelComplete = false;
    this.levelChars = {};
    this.init = function() {
        resorceManager.loadJSON(['data/level_a.json'], function() {
            drawManager.initLevel(resorceManager.json_data['data/level_a.json']);
        })
        new playerObject({
            x:45,
            y:50,
            w:12,
            h:12,
            acceleration: 12,
            damping: 1,
            weapon: defnWeapons.testGun,
        }
        )
    }
    this.update = function() {
    //CHECK the state of **player** and **zombies**
        if(this.levelComplete)
            return;
    };
    this.getConvergenceVector = function (position) {
        var dPos = this.levelChars.player.pos;
        return vMath.multAdd(dPos, -1, position);
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
