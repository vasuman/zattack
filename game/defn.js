define(['game/ent'], function(e) {
    var testGun = new e.abstractWeapon({
        name: 'testGun',
        cooldown: 20,
        ammo: 800,
        bullet: {
            timeout: 500,
            w: 5,
            h: 5,
            speed: 500,
            damage: 150,
        },
        sound: 175,
    });


    return {
        testGun: testGun,
    }
})
