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
        cooldown: 10,
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

