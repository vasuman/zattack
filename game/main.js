requestAnimationFrame = (window.requestAnimationFrame===undefined)?
    (window.mozRequestAnimationFrame):(window.requestAnimationFrame);

function init() {
    require
}
function initGame() {
    var canvas_el=document.getElementById('game-canvas');
    //TODO: Make it adaptable
    canvas_el.width=1030;
    canvas_el.height=500;
    var ctxt=canvas_el.getContext('2d');
    //Controls
    controlEngine.listenForKeyboardEvents(document.getElementById('main-body'));
    //Add all draw shit here
    drawManager.initCanvas(ctxt, canvas_el.width, canvas_el.height);
    drawManager.setCanvasSegmentSize(canvas_el.width/2, canvas_el.height/2);
    //Viewport limits!!
    drawManager.setViewportLimits(-10000, 10240, -10000, 10240)
    sceneManager.init();
    requestAnimationFrame(sceneManager.update);
};

window.onload=initGame;
