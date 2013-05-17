var nullFn=function (){};
var controlEngine= new (function controlScheme () {
    this.keyMap={
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
    this.mouseQueue = false;
    this.lastMousePos = {x:0, y:0};
    this.keyState = {};
    for (var iter in this.keyMap) {
        if (this.keyMap.hasOwnProperty(iter)){
            this.keyState[this.keyMap[iter]]=0;
        };
    };
    this.getMovementVector = function() {
        return {
            x:this.keyState['right']-this.keyState['left'],
            y:this.keyState['down']-this.keyState['up']
        };
    };
    this.getFiringVector = function() {
        return {
            x:this.keyState['d']-this.keyState['a'],
            y:this.keyState['s']-this.keyState['w']
        };
    };
    this.listenForKeyboardEvents = function(element) {
            element.addEventListener('keydown', function (ev) {
                controlEngine.keyState[controlEngine.keyMap[ev.keyCode]]=1;
            });
            element.addEventListener('keyup', function (ev) {
                controlEngine.keyState[controlEngine.keyMap[ev.keyCode]]=0;
            });
    };
});


function listenForMouseEvents (element) {
    //TODO IMPLEMENT 
    //Also change getFiringVector function
}
