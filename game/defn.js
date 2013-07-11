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
}

var defnWeapons = {
    testGun: new abstractWeapon({
        name: 'testGun',
        cooldown: 5,
        bullet: defnBullets.testBullet
    })
}
