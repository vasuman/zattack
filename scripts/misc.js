var defnAnimation = {
    personMove:[],
    personFire:[],
    testBullet:[],
}

var defnBullets = {
    testBullet: function(bulletData) {
            bulletData.timeout = 500;
            bulletData.w = 5;
            bulletData.h = 5;
            bulletData.speed = 20;
            bulletData.filterGroup = -1;
            bulletData.hitDamage = 10;
            return new bulletObject(bulletData);
    }
};

var defnWeapons = {
    testGun: new abstractWeapon({
        name: 'testGun',
        cooldown: 30,
        bullet: defnBullets.testBullet
    })
};

// Abstract objects are glorified containers
function abstractWeapon(weaponData) {
    this.name = weaponData.name;
    this.cooldown = weaponData.cooldown;
    this.blockFire = 0;
    this.bullet = weaponData.bullet;
    this.fire = function(vecDat) {
        if(this.blockFire>0)
            return;
        this.bullet(vecDat)
        this.blockFire = this.cooldown;
    };
    this.update = function() {
        if(this.blockFire>0)
            this.blockFire--;
    };
}

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
