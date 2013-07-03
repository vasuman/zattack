//TODO Add a METAmanager

var entityManager = (function () {
    //REMOVE on deployment; only for debugging
    //-----------------------
    entities = [];
    //-----------------------
    function registerEntity(ent){
        return entities.push(ent);
    }
    function clearAll() {
        entities = [];
    }
    function updateAll() {
        var killAfter = [], numKilled = 0;
        for(var i = 0; i < entities.length; i+=1) {
            if (entities[i]._dead) {
                killAfter.push(i);
                continue;
            };
            if (entities[i].noUpdate) {
                continue;
            }
            entities[i].updateChain();
        }
        for(var j = 0; j < killAfter.length; j+=1) {
            var i = killAfter[j];
            if (entities[i-numKilled].pBody){
                physicsEngine.destroyBody(entities[i-numKilled].pBody)
            }
            entities.splice(i-numKilled, 1);
            numKilled+=1;
        }
        drawManager.drawAll(entities);
    }
    return {
        updateAll: updateAll,
        clearAll: clearAll,
        registerEntity: registerEntity
    }
})();
