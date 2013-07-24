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
        cooldown: 20,
        ammo: 800,
        bulletData: {
            timeout: 500,
            w: 5,
            h: 5,
            speed: 500,
            hitDamage: 50,
        },
        sound: 100,
    });


    return {
        testGun: testGun,
    }
})
