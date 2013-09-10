define(['engine/physics', 'engine/resources', 'engine/draw'], 
    function (physics, res, draw) {
        var levelComplete = false,
            loaded = false,
            path = {
                grid:[],
            },
            spawnAreas = {};

        function randInt(b, r) {
            return b+Math.floor(r*Math.random());
        }

        function getSpawn(type) {
            var areas = spawnAreas[type] || spawnAreas['generic'],
                area = areas[randInt(0, areas.length)];
            return {
                x: randInt(area.x, area.w),
                y: randInt(area.y, area.h)
            }
        }

        function initMap(map_url, callback) {
            var map = res.json_data[map_url],
                layers = map.layers,
                maxW = 0,
                maxH = 0;
            for (var i = 0; i < layers.length; i+=1) {
                maxW = Math.max((layers[i].width || 0), maxW);
                maxH = Math.max((layers[i].height || 0), maxH);
            }
            initGrid(maxW, maxH, map.tilewidth, map.tileheight);
            for (var i = 0; i < layers.length; i+=1) {
                maxW = Math.max((layers[i].width || 0), maxW);
                maxH = Math.max((layers[i].height || 0), maxH);
                if (layers[i].type = 'objectgroup' && layers[i].objects) {
                    if (layers[i].properties) {
                        if (layers[i].properties.obstacles) {
                            solidify(layers[i]);
                        } 
                        else if (layers[i].properties.spawn) {
                            spawnify(layers[i]);
                        }
                    }
                }
            }
            callback();
        }

        function spawnify(layer) {
            for (var i = 0; i < layer.objects.length; i+=1) {
                var object = layer.objects[i],
                    id = (object.type || 'generic');
                spawnAreas[id] = spawnAreas[id] || [];
                spawnAreas[id].push({
                    x: object.x,
                    y: object.y,
                    w: object.width,
                    h: object.height,
                });
            }
        }

        function solidify(layer) {
            for (var i = 0; i < layer.objects.length; i+=1) {
                var object = layer.objects[i];
                var dat = {
                    x: object.x + object.width/2,
                    y: object.y + object.height/2,
                    w: object.width,
                    h: object.height
                };
                physics.addWorldObstacle(dat);
                gridObstacle(object);
            }
        }

        function mkGrid(sizeW, sizeH) {
            var tmp = [];
            for(var i = 0; i < sizeX; i+=1) {
                var line = [];
                for(var j = 0; j < sizeY; j+=1) {
                    line.push(0);
                }
                tmp.grid.push(line);
            }
            return tmp;
        }
        function initGrid(sizeX, sizeY, width, height) {
            path.grid = [];
            path.tilewidth = width;
            path.tileheight = height;
            for(var i = 0; i < sizeX; i+=1) {
                var line = [];
                for(var j = 0; j < sizeY; j+=1) {
                    line.push(0);
                }
                path.grid.push(line);
            }
        }

        function gridObstacle(obstacle) {
            beginX = Math.floor(obstacle.x/path.tilewidth),
            endX = Math.ceil((obstacle.x+obstacle.width)/path.tilewidth);
            beginY = Math.floor(obstacle.y/path.tileheight),
            endY = Math.ceil((obstacle.y+obstacle.height)/path.tileheight);
            for(var i = beginY; i < endY; i+=1) {
                for(var j = beginX; j < endX; j+=1) {
                    path.grid[j][i] = 1;
                }
            } 
        }

        function snapToGrid(pos) {
            return [Math.floor(pos.x/grid.tilewidth), Math.floor(pos.y/grid.tileheight)];
        }

        function getAllPaths(point, radius) {
            var coord = snapToGrid(point);
        }

        function djikstra(pos, grid, radius) {
            var queue = [];
            var neighbours = getNeighbours(pos, radius)
        }

        function getNeighbours(pos, limitX, limitY) {
            return [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1,1]].forEach(
                function(inc) {
                    return [inc[0]+pos[0], inc[1]+pos[1]];
                }).filter(function(pos) {
                    return (pos[0]>0) && (pos[0]<limitX) && (pos[1]>0) && (pos[1]<limitY);
                });
        }

        function loadLevel(level_url, callback) {
            res.loadJSON([level_url], 
                function (llA, iO){
                    return function() {
                        llA(level_url, function() {
                            iO(level_url, callback);
                        });
                    }
                }(draw.loadLevelAssets, initMap));
        }
        
        return {
            loadLevel: loadLevel,
            getSpawn: getSpawn,
        }
});

