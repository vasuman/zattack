define(['engine/resources', 'engine/vector'], function(resource, vec) {
    //TODO move this to an appropriate place
    function ImageSection(image, gridSize, gridX, gridY, sizeX, sizeY) {
        this.image = image;
        this.tile = gridSize;
        this.sX = gridX * gridSize;
        this.sY = gridY * gridSize;
        this.sW = sizeX * gridSize;
        this.sH = sizeY * gridSize;
    }

    var viewport = { x:0, y:0 },
        ripples = [],
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
        handle = null;

    function initCanvas(canvas, w, h) {
        handle = canvas.getContext('2d');
        frame.width = w;
        frame.height = h;
        canvas.width = w;
        canvas.height = h;
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
    
    function drawOSD(text, family, size) {
        handle.font = size+'pt '+family;
        handle.textAlign = 'end';
        handle.fillText(text, frame.width, size);
    }

    function imageInFrame(imgDat) {
        return ((imgDat[1] < viewport.x + frame.width) &&
                (imgDat[1] + imgDat[3]> viewport.x) &&
                (imgDat[2] < viewport.y + frame.height) &&
                (imgDat[2] + imgDat[4]> viewport.y));
    }

    function drawAll(entities) {
        clearScreen();
        renderBG();
        for(var i=0; i<entities.length; i++) {
            var dDat = entities[i].getDrawData();
            if (isInFrame(dDat) && !entities[i].invisible) {
                if (entities[i].drawImage) {
                    handle.globalAlpha = (dDat.alpha || 1.0); 
                    if (dDat.canvas) {
                        handle.drawImage(dDat.canvas, 
                            Math.floor(dDat.x - viewport.x), 
                            Math.floor(dDat.y - viewport.y))
                    } else {
                        handle.drawImage(
                            dDat.image, 
                            Math.floor(dDat.x - viewport.x), 
                            Math.floor(dDat.y - viewport.y),
                            dDat.width, dDat.height,
                            dDat.sx, dDat.sy,
                            dDat.width, dDat.height);
                    }
                    handle.globalAlpha = 1.0; 
                } else {
                    handle.fillRect(
                        Math.floor(dDat.x - viewport.x), 
                        Math.floor(dDat.y - viewport.y), 
                        dDat.width, dDat.height);
                }
            }
        }
    }

    function offsetCenter(pos) {
        return {
            x: pos.x + viewport.x,
            y: pos.y + viewport.y,
        }
    }

    function drawRipple(ripple) {
        ripple.w = ripple.stage;
        ripple.h = ripple.stage;
        if (!isInFrame(ripple)) {
            return;
        }
        // handle.fi
    }

    function addRipple(pos, inc, end) {
        ripples.append({
            pos: pos,
            stage: 1,
            inc: inc,
            end: end,
        })
    }
    
    function _preDraw(level_url, callback) {
        var level = resource.json_data[level_url],
            gridW = level.tilewidth,
            gridH = level.tileheight,
            numX = Math.ceil((level.width*gridW)/subFrame.width), 
            numY = Math.ceil((level.height*gridH)/subFrame.height);
        canvii = [];
        for(var i = 0; i < numX*numY; i+=1) {
            canvii[i] = document.createElement('canvas');
            canvii[i].width =  subFrame.width + gridW;
            canvii[i].height = subFrame.height + gridH;
            //Need to alias values for inFrame
            canvii[i].x = (i % numX)*subFrame.width;
            canvii[i].y = Math.floor(i/numX)*subFrame.height;
        }
        for (var k = 0; k < level.layers.length; k+=1) {
            var layer = level.layers[k];
            if (layer.type = 'tilelayer' && layer.properties && layer.properties.predraw){
                for(var m = 0; m < layer.data.length; m+=1) {
                    var j = m%layer.width,
                        i = Math.floor(m/layer.width);
                    if(layer.data[m] == 0) {
                        continue;
                    }
                    var x = j*gridW,
                        y = i*gridH,
                        tile = getTile(level, layer.data[m]),
                    // Canvas ID
                    c_id = Math.floor(x/subFrame.width) + Math.floor(y/subFrame.height)*numX;
                    canvii[c_id].getContext('2d').drawImage(
                        resource.images[tile.image],
                        tile.sx, tile.sy,
                        tile.sw, tile.sh,
                        x - canvii[c_id].x,
                        y - canvii[c_id].y,
                        gridW, gridH
                    );
                }
            }
        }
        callback();
    }
   
    function getTile(map, gid) {
        var col, i = 0, ts;
        for(i = 0; i < map.tilesets.length; i+=1) {
            if (gid < map.tilesets[i].firstgid) {
                break;
            }
        }
        ts = map.tilesets[i-1];
        ts.margin = ts.margin || 0;
        ts.spacing = ts.spacing || 0;
        col = Math.floor(ts.imagewidth/ts.tilewidth)
        gid -= ts.firstgid;
        return {
            image: ts.image,
            sx: (gid%col)*(ts.spacing+ts.tilewidth)+ts.margin,
            sy: Math.floor(gid/col)*(ts.spacing+ts.tileheight)+ts.margin,
            sw: ts.tilewidth,
            sh: ts.tileheight
        }
    }

    function loadLevelAssets(map_url, callback) {
        var map = resource.json_data[map_url],
            reqImages = [];
        viewportLimits.maxX = Math.floor(map.width * map.tilewidth - frame.width);
        viewportLimits.maxY = Math.floor(map.height * map.tileheight - frame.height);
        for(var i = 0; i < map.tilesets.length; i+=1) {
            reqImages.push(map.tilesets[i].image);
        }
        resource.loadImages(reqImages, (function(pd, url, cb) { 
            return function() {
                pd(url, cb); 
            }
        }(_preDraw, map_url, callback)));
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
        viewport.x = Math.floor(Math.min(Math.max(viewportLimits.minX, pos.x-frame.width/2), viewportLimits.maxX));
        viewport.y = Math.floor(Math.min(Math.max(viewportLimits.minY, pos.y-frame.height/2), viewportLimits.maxY));
    }
    
    function isInFrame(pDat) {
        return ((pDat.x < viewport.x + frame.width) &&
                (pDat.x + pDat.width > viewport.x) &&
                (pDat.y < viewport.y + frame.height) &&
                (pDat.y + pDat.height > viewport.y));
    }
    
    return {
        init: initCanvas,
        setCanvasSegmentSize: setCanvasSegmentSize,
        setViewportLimits: setViewportLimits,
        clearScreen: clearScreen,
        drawAll: drawAll,
        loadLevelAssets: loadLevelAssets,
        snapViewport: snapViewport,
        drawOSD: drawOSD,
        offsetCenter: offsetCenter,
    }
});
