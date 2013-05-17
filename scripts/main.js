requestAnimationFrame = (window.requestAnimationFrame===undefined)?
    (window.mozRequestAnimationFrame):(window.requestAnimationFrame);
function initGame() {
    var canvas_el=document.getElementById('game-canvas');
    //TODO: Make it adaptable
    canvas_el.width=1030;
    canvas_el.height=500;
    var ctxt=canvas_el.getContext('2d');
    //Controls
    controlEngine.listenForKeyboardEvents(document.getElementById('main-body'));
    //Add all draw shit here
    drawManager.registerHandle(ctxt);
    drawManager.frame = {
        w:canvas_el.width, 
        h:canvas_el.height
    };
    //Viewport limits!!
    drawManager.limits = {
        minX:-1700,
        maxX:1700,
        minY:-1500,
        maxY:1500,
    };
    sceneManager.init();
    requestAnimationFrame(update);
};

function update() {
    sceneManager.update();
};
window.onload=initGame;
