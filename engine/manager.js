define(['engine/draw', 'engine/physics'], function (draw, physics) {
    //FIXME "put var here"
    entities = [];

    function registerEntity(ent){
        return entities.push(ent);
    }

    function clearAll() {
        for(var i = 0; i < entities.length; i+=1) {
            // 'Coz cleanup() may deathTrigger
            if (entities[i].pBody) {
                physics.destroyBody(entities[i].pBody)
            }
        }
        entities = [];
    }

    function updateAll(lapse) {
        var killAfter = [];
        for(var i = 0; i < entities.length; i+=1) {
            if (entities[i].$.dead) {
                killAfter.push(i);
                continue;
            }
            if (entities[i].skipUpdate) {
                continue;
            }
            entities[i].updateChain(lapse);
        }
        killItems(killAfter);
        draw.drawAll(entities);
    }

    function killItems(indexes) {
        var numKilled = 0;
        for(var j = 0; j < indexes.length; j+=1) {
            var i = indexes[j]-numKilled;
            // TODO Use mutex as clearAll also deletes elements
            if (entities[i]){
                entities[i].cleanup();
                entities.splice(i, 1);
                numKilled+=1;
            }
        }
    }

    return {
        updateAll: updateAll,
        clearAll: clearAll,
        registerEntity: registerEntity
    }
});
