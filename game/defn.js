define(['game/ent'], function(e) {
    function testBullet(bulletData) {
            bulletData.timeout = 500;
            bulletData.w = 5;
            bulletData.h = 5;
            bulletData.speed = 500;
            bulletData.hitDamage = 10;
            return new e.bulletObject(bulletData);
    }
    
    var testGun = new e.abstractWeapon({
        name: 'testGun',
        cooldown: 5,
        bullet: testBullet
    })

    return {
        testGun: testGun,
    }
})
