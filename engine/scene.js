require([], function () {
    var currentState = 0,
        stateUpdate = {};

    function init() {
        fireSlot(currentState);
        requestAnimationFrame(update);
    }

    function update() {
        (stateUpdate[currentState] || function(){})()
        this.r_id = requestAnimationFrame(update);
    }
    
    function fireSlot(state, update) {
        currentState = state;
        if(update) {
            stateUpdate[state] = update;
        }
    }

    return {
        init: init,
        fireSlot: fireSlot,
    }
})

