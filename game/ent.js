define(['engine/entities', 'engine/physics', 'engine/controls', 'engine/draw', 'engine/vector'], 
function(e, physics, controls, draw, vec) {
    function getPlayerMovement() {
        return {
            x: controls.ev('pl-right') - controls.ev('pl-left'),
            y: controls.ev('pl-down') - controls.ev('pl-up')
        }
    }
    
    function keyFire() {
        return {
            x: controls.ev('f-right') - controls.ev('f-left'),
            y: controls.ev('f-down') - controls.ev('f-up')
        }
    }

    //TODO implement
    function mouseFire() {
        return {
            x: 0,
            y: 0
        }
    }

    //TODO allow change scheme
    var firingVector = keyFire;

    function useMouse(s) {
        firingVector = (s) ? mouseFire : keyFire;
    }

    function mortalObject (mortalDefn) {
        e.physicalObject.call(this, mortalDefn);
        this.health = mortalDefn.health || 100;
    }

    mortalObject.prototype.__proto__ = e.physicalObject.prototype;

    mortalObject.prototype.update = function() {};

    mortalObject.prototype.damage = function(amt) {
        this.health -= amt;
        if (this.health<0) {
            this._dead = true;
        }
    }

    function playerObject (playerDefn) {
            playerDefn.userData = 'player';
            playerDefn.filterGroup = -1;
            mortalObject.call(this, playerDefn);
            this.speed = playerDefn.speed;
            this.weapon = playerDefn.weapon;
    };

    playerObject.prototype.__proto__ = mortalObject.prototype;

    playerObject.prototype.update=function () {
        //VIEWPORT CENTER
        draw.snapViewport(this.pos)
        //WEAPON UPDATE
        this.weapon.update();
        //MOVEMENT
        var mVec = getPlayerMovement(),
            scale = this.speed;
        // Diagonal scaling
        if (mVec.x || mVec.y) {
            if (mVec.x && mVec.y) {
                scale/=Math.SQRT2;
            }
            physics.moveBody(this.pBody, vec.sc(mVec, scale));
        }
        //FIRING
        var fVec = firingVector();
        if (fVec.x || fVec.y ) {
            var curPos = vec.mad(this.pos, this.dim.w, fVec);
            var curVel = physics.getVelocity(this.pBody);
            this.weapon.fire({
                x: curPos.x,
                y: curPos.y,
                dx: fVec.x,
                dy: fVec.y,
                sx: curVel.x,
                sy: curVel.y
            });
        } 
    };

    function bulletObject (bulletData) {
        bulletData.userData = 'bullet';
        bulletData.filterGroup = -1;
        e.physicalObject.call(this, bulletData);
        this.timeout = bulletData.timeout;
        physics.moveBody(this.pBody, {
            x: bulletData.dx*bulletData.speed+bulletData.sx, 
            y: bulletData.dy*bulletData.speed+bulletData.sy
        });
        this.hitDamage = bulletData.hitDamage;
    }

    bulletObject.prototype.__proto__ = e.physicalObject.prototype;

    bulletObject.prototype.update = function() {
        if (!--this.timeout) {
            this._dead = true;
        }
    }

    function zombieObject (zombieData) {
        zombieData.userData = 'zombie';
        mortalObject.call(this, zombieData);
        this.acc = zombieData.acceleration;
    }

    zombieObject.prototype.__proto__ = mortalObject.prototype;

    zombieObject.prototype.update = function () {
        //TODO again...
    }

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

    return {
        playerObject: playerObject,
        abstractWeapon: abstractWeapon,
        bulletObject: bulletObject,
    }
});
