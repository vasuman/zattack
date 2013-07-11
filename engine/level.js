define(['engine/physics', 'engine/resources', 'engine/draw'], 
    function (physics, res, draw) {
        var levelComplete = false,
            characters = {},
            loaded = false;
       
        function initObstacles(map_url) {
            var map = res.json_data[map_url],
                selected = new Array(map.height),
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
                        for(var k = i; map.data[j][k] > 0; k+=1) {
                            selected[j][k] = true;
                        }
                        for(var l = j; l < map.height; l+=1) {
                            var tileSection = map.data[l].slice(i, k);
                            var isSolid = tileSection.reduce(
                                function (pv, a) {
                                    return (a>0) && pv;
                                }, true);
                            if(!isSolid) {
                                break;
                            }
                            for(var m = i; m < k; m+=1) {
                                selected[l][m] = true;
                            }
                        }
                        addObstacle([(i+k)/2*gridSize, (j+l)/2*gridSize, 
                                    (k-i)*gridSize, (l-j)*gridSize]);
                    }
                }
            }
        }
        
        function addObstacle(physDat) {
            physics.addWorldObstacle({
                x:physDat[0],
                y:physDat[1],
                w:physDat[2],
                h:physDat[3],
            });
        }

        function loadLevel(level_url) {
            res.loadJSON([level_url], 
                function (llA, iO, url){
                    return function() {
                        llA(url);
                        iO(url);
                    }
                }(draw.loadLevelAssets, initObstacles, level_url));
        }
        
        return {
            loadLevel: loadLevel
        }
});

