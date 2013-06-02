//TODO Add a METAmanager


var entityManager = (function () {
    //REMOVE on deployment; only for debugging
    //-----------------------
    entities = [];
    //-----------------------
    function registerEntity(ent){
        return entities.push(ent);
    }
    function clearAll() {
        entities = [];
    }
    function updateAll() {
        var killAfter = [], numKilled = 0;
        for(var i = 0; i < entities.length; i+=1) {
            if (entities[i]._dead) {
                killAfter.push(i);
                continue;
            };
            if (entities[i].noUpdate) {
                continue;
            }
            entities[i].updateChain();
        }
        for(var j = 0; j < killAfter.length; j+=1) {
            var i = killAfter[j];
            if (entities[i-numKilled].pBody){
                physicsEngine.destroyBody(entities[i-numKilled].pBody)
            }
            entities.splice(i,1);
            numKilled+=1;
        }
        drawManager.drawAll(entities);
    }
    return {
        updateAll: updateAll,
        clearAll: clearAll,
        registerEntity: registerEntity
    }
})();


var drawManager = (function (){
    var viewport = { x:0, y:0 },
        frame = { 
            width: 0, 
            height: 0  
        },
        subFrame = { 
            width: 0, 
            height: 0 
        },
        //Plural of canvas
        canvii = [],
        viewportLimits = {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0,
        },
        handle = null,
        level = {};
    function initCanvas(drawHandle, w, h) {
        handle = drawHandle;
        frame.width = w;
        frame.height = h;
    }
    function setCanvasSegmentSize(w, h) {
        subFrame.width = w;
        subFrame.height = h;
    }
    function setViewportLimits(minX, maxX, minY, maxY) {
        viewportLimits = {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY
        }
    }
    function clearScreen() {
        handle.clearRect(0, 0, frame.width, frame.height);
    }
    //Somewhere else??
    function renderTextScreen(text, font, pX, pY) {
        //TODO Draw BG
        clearScreen();
        handle.font = font;
        handle.fillText(text, pX, pY);
    }
    function drawAll(entities) {
        clearScreen();
        renderBG();
        for(var i=0; i<entities.length; i++) {
            var dDat = entities[i].getDrawData();
            if (isInFrame(dDat)) {
                //TODO: Implement sprites!!
                handle.fillRect(
                    dDat.x - viewport.x, 
                    dDat.y - viewport.y, 
                    dDat.width, dDat.height);
            }
        }
    }
    function loadLevel(lvl) {
        var reqImages = [];
        for(var tileNum in lvl.tiles) {
            reqImages.push(lvl.tiles[tileNum].image);
        }
        level = lvl;
        resorceManager.loadImages(reqImages, drawManager._preDraw);
    }
    function _preDraw() {
        var gridSize = level.tileSize,
            numX = Math.ceil((level.width*gridSize)/subFrame.width), 
            numY = Math.ceil((level.height*gridSize)/subFrame.height);
        console.log(numX, numY)
        for(var i = 0; i < numX*numY; i+=1) {
            canvii[i] = document.createElement('canvas');
            canvii[i].width =  subFrame.width + gridSize;
            canvii[i].height = subFrame.height + gridSize;
            //Need to alias values for inFrame
            canvii[i].x = (i % numX)*subFrame.width;
            canvii[i].y = Math.floor(i/numX)*subFrame.height;
        }
        for(var i = 0; i < level.width; i+=1) {
            for(var j = 0; j < level.height; j+=1) {
                var x = j*gridSize, y = i*gridSize,
                    c_id = Math.floor(x/subFrame.width) + Math.floor(y/subFrame.height)*numX,
                    tile = level.data[i][j], ts = level.tiles[tile];
                canvii[c_id].getContext('2d').drawImage(
                    resorceManager.images[ts.image],
                    ts.gridX*gridSize,
                    ts.gridY*gridSize,
                    gridSize, gridSize,
                    x - canvii[c_id].x,
                    y - canvii[c_id].y,
                    gridSize, gridSize
                );
            }
        }
    }
    function renderBG() {
        for(var i = 0; i < canvii.length; i+=1) {
            if(isInFrame(canvii[i])) {
                handle.drawImage(canvii[i],
                    canvii[i].x - viewport.x,
                    canvii[i].y - viewport.y
                );
            }
        }
    }
    function snapViewport(pos) {
        //Two lines!! Muah is GENIUS
        viewport.x = Math.min(Math.max(viewportLimits.minX, pos.x-frame.width/2), viewportLimits.maxX);
        viewport.y = Math.min(Math.max(viewportLimits.minY, pos.y-frame.height/2), viewportLimits.maxY);
    }
    function isInFrame(pDat) {
        return ((pDat.x < viewport.x + frame.width) &&
                (pDat.x + pDat.width > viewport.x) &&
                (pDat.y < viewport.y + frame.height) &&
                (pDat.y + pDat.height > viewport.y));
    }
    return {
        initCanvas: initCanvas,
        setCanvasSegmentSize: setCanvasSegmentSize,
        setViewportLimits: setViewportLimits,
        renderTextScreen: renderTextScreen,
        clearScreen: clearScreen,
        drawAll: drawAll,
        loadLevel: loadLevel,
        _preDraw: _preDraw,
        snapViewport: snapViewport,
    }
}());

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
            case 2: physicsEngine.update();
                    entityManager.updateAll();
                    levelManager.update();
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
        switch(state) {
            case 0: initStartScreen();
                    break;
            case 1: drawManager.clearAll();
                    break;
            case 2: HUDManager.clear();
                    entityManager.clearAll();
                    physicsEngine.refreshWorld();
                    levelManager.init('data/level_a.json');
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


var resorceManager = (function () {
    function XHRGet(link_url, callback) {
        var xR = new XMLHttpRequest;
        xR.open('GET', link_url, true);
        xR.source = link_url;
        xR.onload = callback;
        xR.send();
    }
    function loadImages(image_names, callback) {
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
    function loadJSON(json_list, callback) {
        var num_json = 0;
        function cCb() {
            resorceManager.json_data[this.source] = JSON.parse(this.response);
            num_json++;
            if(num_json >= json_list.length) {
                callback(this.source);
            }
        }
        for(var idx=0; idx < json_list.length; idx+=1) {
            XHRGet(json_list[idx], cCb)
        }
    }
    return {
        images: {},
        json_data: {},
        loadJSON: loadJSON,
        loadImages: loadImages
    };
}());


var levelManager = (function () {
    var levelComplete = false,
        characters = {},
        gridSize = 0,
        obstacles = [],
        loaded = false;
    function init(level_url) {
        resorceManager.loadJSON([level_url], function(last_loaded) {
            var lJ = resorceManager.json_data[last_loaded];
            drawManager.loadLevel(lJ);
            levelManager.initObstacles(lJ);
            levelManager.initChar();
        });
    }
    function initObstacles(map) {
        gridSize = map.tileSize;
        var selected = new Array(map.height);
        for(var i = 0; i < map.height; i+=1) {
            selected[i] = new Array(map.width);
            for(var j = 0; j < map.width; j+=1) {
                selected[i][j] = false;
            }
        }
        for(var i = 0; i < map.width; i+=1) {
            for(var j = 0; j < map.height; j+=1) {
                if (map.data[j][i]>0 && !selected[j][i]) {
                    //SEARCH SIDE
                    for(var k = i; map.data[j][k] > 0; k+=1) {
                        selected[j][k] = true;
                    }
                    //SEARCH DOWN
                    for(var l = j; l < map.height; l+=1) {
                        var tileSection = map.data[l].slice(i, k);
                        var isSolid = tileSection.reduce(function (pv, a) {
                            return (a>0) && pv;
                        }, true);
                        if(!isSolid) {
                            break;
                        }
                        for(var m = i; m < k; m+=1) {
                            selected[l][m] = true;
                        }
                    }
                    addObstacle([(i+k)/2*gridSize, (j+l)/2*gridSize, (k-i)*gridSize, (l-j)*gridSize]);
                }
            }
        }
        this.grid = new PF.Grid(map.width, map.height, map.data);
    }
    function addObstacle(physDat) {
        obstacles.push(new physicalObject({
            x:physDat[0],
            y:physDat[1],
            w:physDat[2],
            h:physDat[3],
            isStatic: true,
            fixtureType: 0
        }));
    }
    function initChar() {
        player = new playerObject({
            x:45,
            y:50,
            w:12,
            h:12,
            acceleration: 12,
            damping: 1,
            weapon: defnWeapons.testGun,
        });
        characters.zombies = [];
        for(var i = 0; i < 10; i+=1) {
            characters.zombies.push(new zombieObject({
                x: Math.random()*980+20,
                y: Math.random()*980+20,
                w: 12,
                h: 12,
                acceleration: 7,
                fixtureType: 1,
                maxVel: 12
            }));
        }
    }
    function update() {
    //CHECK the state of **player** and **zombies**
        if(levelComplete)
            return;
    };
    function getConvergenceVector(position) {
        var dPos = characters.player.pos;
        return vMath.multAdd(dPos, -1, position);
    };
    function getGridCoord(pos) {
        return {
            x: Math.floor(pos.x/gridSize),
            y: Math.floor(pos.y/gridSize)
        } 
    }
    return {
        update: update,
        getConvergenceVector: getConvergenceVector,
        init: init,
        initChar: initChar,
        initObstacles: initObstacles
    };
})();


var contactManager = (function () {
    init = function () {
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
        // Zombie Handler
        physicsEngine.solveListener('zombie', 
            function(zom, object, imp) {
                //Find a better way!!
                if(object['class'] == 'player') {
                    object.ent.hurt(10);
                }
        });         
    }
    return {
        init: init
    };
}());


var HUDManager = (function () {
    var controlDiv = document.getElementById('controls');
    function addButton(buttonName, callback) {
        var button = document.createElement('button')
        button.innerHTML = buttonName;
        button.onclick = callback;
        controlDiv.appendChild(button);
    };
    function clear() {
        controlDiv.innerHTML = '';
    };
    return {
        addButton: addButton,
        clear: clear
    };
}());


