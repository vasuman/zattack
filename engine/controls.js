define([], function() {
    var self = this,
    mouseQueue = false,
    mouse = {
        pos: {},
        0: false,
        1: false,
        2: false,
    },
    queueEvents = {},
    eventMap = {},
    keyState = { null: false };
    
    function queue(event_name) {
        queueEvents[event_name] = true;
    }

    function poll(event_name) {
        return queueEvents[event_name];
    }

    function reset() {
        queueEvents = {};
    }

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
            mouse[ev.button] = true;
            queue('mouse-down');
        }
        function mouseUp (ev) {
            mouse[ev.button] = false;
            queue('mouse-up');
        }
        function mouseMove (ev) {
            mouse.pos = {
                x: ev.clientX - el_pos.x,
                y: ev.clientY - el_pos.y,
            }
        }
        element.addEventListener('mousemove', mouseMove);
        element.addEventListener('mousedown', mouseDown);
        element.addEventListener('mouseup', mouseUp);
    }

    function mousePosition() {
        return mouse.pos;
    }

    function mousePressed(button) {
        return mouse[button];
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
        poll: poll,
        reset: reset,
        mousePosition: mousePosition,
        mousePressed: mousePressed,
    }
});
