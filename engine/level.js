define(['engine/physics', 'engine/resources', 'engine/draw'], 
    function (physics, res, draw) {
        var levelComplete = false,
            loaded = false,
            spawnAreas = {};

        function randInt(b, r) {
            return b+Math.floor(r*Math.random())
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
            var layers = res.json_data[map_url].layers;
            for (var i = 0; i < layers.length; i+=1) {
                if (layers[i].type = 'objectgroup' && layers[i].objects) {
                    if (layers[i].properties) {
                        if (layers[i].properties.obstacles) {
                            solidify(layers[i]);
                        } 
                        else if (layers[i].properties.spawn) {
                            spawnify(layers[i])
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
                physics.addWorldObstacle({
                    x: object.x + object.width/2,
                    y: object.y + object.height/2,
                    w: object.width,
                    h: object.height
                })
            }
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

