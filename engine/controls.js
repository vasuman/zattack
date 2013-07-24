define([], function() {
    var self = this,
    mouseQueue = false,
    lastMouse = {
        pos: {},
        press: false,
        click: false,
    },
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

    function listenForMouseEvents (element) {
        var el_rect = element.getBoundingClientRect(),
            el_pos = {
                x: el_rect.left,
                y: el_rect.top,
            };
        function mouseDown (ev) {
            lastMouse.pos = {
                x: ev.clientX - el_pos.x,
                y: ev.clientY - el_pos.y,
            }
            lastMouse.press = true;
        }
        function mouseUp (ev) {
            lastMouse.pos = {
                x: ev.clientX - el_pos.x,
                y: ev.clientY - el_pos.y,
            }
            lastMouse.press = false;
            lastMouse.click = true;
        }
        function mouseMove (ev) {
            lastMouse.pos = {
                x: ev.clientX - el_pos.x,
                y: ev.clientY - el_pos.y,
            }
        }
        element.addEventListener('mousemove', mouseMove);
        element.addEventListener('mousedown', mouseDown);
        element.addEventListener('mouseup', mouseUp);
    }

    function getMouseClickPos() {
         if (lastMouse.click) {
            lastMouse.click = false;
            return lastMouse.pos;
         }
         else {
            return false;
         }
    }
    
    function getMousePress() {
        if (lastMouse.press) {
            return lastMouse.pos;
         }
         else {
            return false;
         }
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

    function tap(eventName) {
        var t = keyState[eventMap[eventName]];
        keyState[eventMap[eventName]] = false;
        return t;
    }

    return {
        listenForKeyboardEvents: listenForKeyboardEvents,
        listenForMouseEvents: listenForMouseEvents,
        registerEvent: registerEvent,
        unregisterEvent: unregisterEvent,
        ev: qEv,
        tap: tap,
        getMousePress: getMousePress,
        getMouseClickPos: getMouseClickPos,
    }
});
