define(['engine/resources'], function(resources) {
    function randomSpots(radius, spotsize, number, style) {
        var c = document.createElement('canvas')
        h = c.getContext('2d');
        c.width = 2*radius;
        c.height = 2*radius;
        for(var i = 0; i<number; i+=1) {
            var xP = Math.random()*2*(radius-1),
            yP = Math.random()*2*(radius-1);
            h.fillStyle = style;
            h.fillRect(xP, yP, spotsize, spotsize)
        }
        return c;
    }
    
    function makeBeesCanvas(type) {
        var br = [];
        for(var i = 0; i<15; i+=1) {
            var name = 'bC'+type+i;
            resources.registerCanvas(name, randomSpots(16, 3, 8, type))
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
        madB: makeBeesCanvas('red'),
        okB: makeBeesCanvas('black'),
    }
})
