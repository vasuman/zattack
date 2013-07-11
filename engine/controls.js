define([], function() {
    var self = this,
    mouseQueue = false,
    lastMousePos = {x:0, y:0},
    eventMap = {},
    keyState = { null: false };
    
    function listenForKeyboardEvents (element) {
        function keyUpCallback (ev) {
            keyState[ev.keyCode] = false;
        }
        
        function keyDownCallback (ev) {
            keyState[ev.keyCode] = true;
        }
        
        element.addEventListener('keydown', keyDownCallback);
        element.addEventListener('keyup', keyUpCallback);
    }

    function registerEvent (ev_name, key) {
        eventMap[ev_name] = key;
        keyState[key] = false;
    }

    function unregisterEvent (ev_name) {
        eventMap[ev_name] = null;
    }

    function clearAll() {
        eventMap = {};
    }
    
    function qEv(eventName) {
        return keyState[eventMap[eventName]];
    }

    return {
        listenForKeyboardEvents: listenForKeyboardEvents,
        registerEvent: registerEvent,
        unregisterEvent: unregisterEvent,
        ev: qEv
    }
});
