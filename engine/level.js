define(['engine/physics', 'engine/resources', 'engine/draw'], 
    function (physics, res, draw) {
        var levelComplete = false,
            characters = {},
            loaded = false;
       
        function initObstacles(map_url) {
            var level = res.json_data[map_url],
                map = {};
            // Select correct layer with 'solid' property
            for(var i = 0; i < level.layers.length; i+=1) {
                map = level.layers[i];
                if (map properties && map.properties.solid) {
                    break;
                }
            }
            // If no 'solid' layer
            if (i == level.layers.length) {
                return;
            }
            var selected = new Array(map.height),
            gridH = level.tileheight,
            gridW = level.tilewidth;
            // Selected array intialization
            for(var i = 0; i < map.height; i+=1) {
                selected[i] = new Array(map.width);
                for(var j = 0; j < map.width; j+=1) {
                    selected[i][j] = false;
                }
            }
            for(var m = 0; m < map.data.length; m+=1) {
                var i = m % map.width,
                    j = Math.floor(m/map.width);
                if (map.data[m]>0 && !selected[j][i]) {
                    for(var k = i; map.data[j*map.width+k] > 0; k+=1) {
                        selected[j][k] = true;
                    }
                    for(var l = j; l < map.height; l+=1) {
                        var tileSection = map.data.slice(l*map.width+i, l*map.width+k);
                        var isSolid = tileSection.reduce(function (pv, a) {
                            return (a>0) && pv; }, true);
                        if(!isSolid) {
                            break;
                        }
                        for(var m = i; m < k; m+=1) {
                            selected[l][m] = true;
                        }
                    }
                    addObstacle([(i+k)/2*gridW, (j+l)/2*gridH, 
                                (k-i)*gridW, (l-j)*gridH]);
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

        function loadLevel(level_url, callback) {
            res.loadJSON([level_url], 
                function (llA, iO, url){
                    return function() {
                        llA(url, callback);
                        iO(url);
                    }
                }(draw.loadLevelAssets, initObstacles, level_url));
        }
        
        return {
            loadLevel: loadLevel
        }
});

