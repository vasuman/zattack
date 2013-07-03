var vMath = {
    multAdd: function(va, fct, vb) {
        return {
            x:va.x+fct*vb.x,
            y:va.y+fct*vb.y
        };
    },
    normalize: function(va) {
        var m = Math.sqrt(va.x*va.x+va.y*va.y);
        return {
            x:va.x/m,
            y:va.y/m
        }
    },
    magnitude: function(va) {
        return Math.sqrt(va.x*va.x+va.y*va.y);
    },
    magnify: function(va, fct) {
        return {
            x:va.x*fct,
            y:va.y*fct
        }
    },
    invert: function(va) {
        if (!(va.x && va.y)) {
            return va;
        }
        return {
            x:1/va.x,
            y:1/va.y
        }
    },
    limit: function(va, value) {
        var m = this.magnitude(va);
        if(m > value) {
            return this.magnify(va, value/m);
        }
        return va;
    },
    assure: function(va, value) {
        var m = this.magnitude(va);
        if (m < value) {
            return this.magnify(va, value/m);
        }
        return va;
    }
}
