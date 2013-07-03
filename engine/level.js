var levelManager = (function () {
    var levelComplete = false,
        characters = {},
        gridSize = 0,
        obstacles = [],
        flags = {
            'CharactersInit':false
        },
        loaded = false;
    function initObstacles(map_url) {
        var map = resourceManager.json_data[map_url],
            selected = new Array(map.height);
        gridSize = map.tileSize;
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
    function registerUpdate(fn) {
        levelManager.update = fn;
    }
    function init(level_url) {
        registerUpdate(updateLoadingScreen);
        resourceManager.loadJSON([level_url], 
            function (llA, iO, iC, url){
                return function() {
                    llA(url);
                    iO(url);
                    iC();
                }
        }(drawManager.loadLevelAssets, initObstacles, initChar, level_url));
    }
    function addObstacle(physDat) {
        obstacles.push(new physicalObject({
            x:physDat[0],
            y:physDat[1],
            w:physDat[2],
            h:physDat[3],
            isStatic: true,
            fixtureType: 0,
            userData: 'wall'
        }));
    }
    function initChar() {
        registerUpdate(updateGameState);
        characters.player = new playerObject({
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
                damping: .5,
                maxVel: 12
            }));
        }
    }
    function updateLoadingScreen() {
        
    }
    function updateGameState() {
        physicsEngine.update();
        entityManager.updateAll();
        //CHECK the state of **player** and **zombies**
        if (characters.player) {
            
        }
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
        update: function(){},
        getConvergenceVector: getConvergenceVector,
        init: init,
        initChar: initChar,
        initObstacles: initObstacles
    };
})();

