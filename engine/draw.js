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
        handle = null;
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
    function _preDraw(level_url) {
        var level = resourceManager.json_data[level_url],
            gridSize = level.tileSize,
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
                    resourceManager.images[ts.image],
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
    function loadLevelAssets(map_url) {
        var map = resourceManager.json_data[map_url],
            reqImages = [];
        for(var tileNum in map.tiles) {
            reqImages.push(map.tiles[tileNum].image);
        }
        resourceManager.loadImages(reqImages, function(pd, url) { 
            return function() {
                pd(url) 
            }
        }(_preDraw, map_url));
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
        initCanvas: initCanvas,
        setCanvasSegmentSize: setCanvasSegmentSize,
        setViewportLimits: setViewportLimits,
        renderTextScreen: renderTextScreen,
        clearScreen: clearScreen,
        drawAll: drawAll,
        loadLevelAssets: loadLevelAssets,
        snapViewport: snapViewport,
    }
}());


