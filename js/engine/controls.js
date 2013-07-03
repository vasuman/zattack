var keyMap={
    09:'tab',
    16:'shift',
    17:'ctrl',
    18:'alt',
    32:'space',
    37:'left',
    38:'up',
    39:'right',
    40:'down',
    65:'a',
    67:'c',
    68:'d',
    69:'e',
    81:'q',
    83:'s',
    86:'v',
    87:'w',
    88:'x',
    90:'z',
};
var controlEngine= (function() {
    mouseQueue = false,
    lastMousePos = {x:0, y:0},
    eventMap = {
        'up':,
        'down':
        'left':
        'right'
        'fire'
        'action'
        'sp-1'
        'sp-2'
    },
    keyState = {};
    function getMovementVector () {
        return {
            x:keyState['right']-keyState['left'],
            y:keyState['down']-keyState['up']
        };
    };
    function getFiringVector () {
        return {
            x:keyState['d']-keyState['a'],
            y:keyState['s']-keyState['w']
        };
    };
    function keyUpCallback () {
        keyState[keyMap[ev.keyCode]] = 0;
    }
    function keyDownCallback () {
        keyState[keyMap[ev.keyCode]] = 1;
    }
    function listenForKeyboardEvents (el) {
        element.addEventListener('keydown', keyDownCallback);
        element.addEventListener('keyup', keyUpCallback);
    }
    function registerEvent (ev_name, key) {
        eventMap[ev_name] = key;
    }
    function unregisterEvent (ev_name) {
        eventMap[ev_name] = 
    }
});


function listenForMouseEvents (element) {
    //TODO IMPLEMENT 
    //Also change getFiringVector function
}
