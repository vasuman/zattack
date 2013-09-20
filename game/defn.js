define(['game/ent', 'engine/resources'], function(e, resources) {
    var testGun = new e.abstractWeapon({
        name: 'testGun',
        cooldown: 20,
        ammo: 800,
        bullet: {
            timeout: 500,
            w: 3,
            h: 3,
            speed: 500,
            damage: 150,
        },
        sound: 175,
    });
    
    function randomSpots(radius, spotsize, number, style) {
        var c = document.createElement('canvas')
        h = c.getContext('2d');
        c.width = 2*radius;
        c.height = 2*radius;
        for(var i = 0; i<number; i+=1) {
            var xP = Math.random()*2*radius,
            yP = Math.random()*2*radius;
            h.fillStyle = style;
            h.fillRect(xP, yP, spotsize, spotsize)
        }
        return c;
    }
    
    function makeBeesCanvas(type) {
        var br = [];
        for(var i = 0; i<15; i+=1) {
            var name = 'bC'+type+i;
            resources.registerCanvas(name, randomSpots(16, 2, 5, type))
            var x = {};
            x.image = {
                name: name,
                canvas: true,
            };
            x.n = ~~(Math.random()*6);
            br.push(x);
        }
        return br;
    }

    return {
        testGun: testGun,
        madB: makeBeesCanvas('red'),
        okB: makeBeesCanvas('black'),
    }
})
