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
    magnify: function(va, fct) {
        return {
            x:va.x*fct,
            y:va.y*fct
        }
    },
}