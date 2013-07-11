define(['engine/entities', 'engine/physics', 'engine/controls', 'engine/draw', 'engine/vector'], 
function(e, physics, controls, draw, vec) {
    console.log(arguments);
    function getPlayerMovement() {
        return {
            x: controls.ev('pl-right') - controls.ev('pl-left'),
            y: controls.ev('pl-down') - controls.ev('pl-up')
        }
    }
    
    //TODO implement
    function keyFire() {
        return {
            x: 0,
            y: 0
        }
    }

    //TODO implement
    function mouseFire() {
        return {
            x: 0,
            y: 0
        }
    }

    var firingVector = keyFire;

    function mortalObject (mortalDefn) {
        e.physicalObject.call(this, mortalDefn);
        var health = 100;
        function damage (amt) {
            health -= amt;
            if (health<0) {
                this._dead = true;
            }
        }
        this.hurt = damage;
    }

    mortalObject.prototype.__proto__ = e.physicalObject.prototype;

    mortalObject.prototype.update = function() {};


    function playerObject (playerDefn) {
            playerDefn.userData = 'player';
            playerDefn.filterGroup = -1;
            mortalObject.call(this, playerDefn);
            this.accel = playerDefn.acceleration;
            this.weapon = playerDefn.weapon;
    };

    playerObject.prototype.__proto__ = mortalObject.prototype;

    playerObject.prototype.update=function () {

        //VIEWPORT CENTER
        draw.snapViewport(this.pos)
        
        //WEAPON UPDATE
        // this.weapon.update();
        
        //MOVEMENT
        var mVec = getPlayerMovement(),
            scale = this.accel;
        if (mVec.x || mVec.y) {
            // Diagonal scaling
            if (mVec.x && mVec.y) {
                scale/=Math.SQRT2;
            }
            physics.pushBody(this.pBody, vec.sc(mVec, scale));
        }
        
        //FIRING
        /* var fVec = firingVector();
         * if (fVec.x || fVec.y ) {
         *     var cPos = vMath.multAdd(this.pos, this.dim.w, fVec);
         *     var cVel = this.pBody.GetLinearVelocity();
         *     this.weapon.fire({
         *         x: cPos.x,
         *         y: cPos.y,
         *         dx: fVec.x,
         *         dy: fVec.y,
         *         sx: cVel.x,
         *         sy: cVel.y
         *     });
         * } */
    };

    function bulletObject (bulletData) {
        bulletData.userData = 'bullet';
        e.physicalObject.call(this, bulletData);
        this.timeout = bulletData.timeout;
        this.pBody.SetLinearVelocity({
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
    }
});
