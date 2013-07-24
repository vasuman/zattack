define(['engine/entities', 'engine/physics', 'engine/controls', 'engine/draw', 'engine/vector', 'engine/resources'], 
function(e, physics, controls, draw, vec, resources) {
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
        var mouse = controls.getMousePress()
        if (mouse) {
            return vec.mad(draw.offsetCenter(mouse), -1, curPlayer.ent.pos);
        }
        return {
            x: 0,
            y: 0
        }
    }

    //TODO allow change scheme
    var firingVector = mouseFire,
        curPlayer = {
            ent: {
                health: -1,
                weapon: {
                    ammo: -1
                }
            },
        };

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
        if (!curPlayer.ent._dead) {
            curPlayer.ent._dead = true;
        }
        playerDefn.userData = 'player';
        mortalObject.call(this, playerDefn);
        this.speed = playerDefn.speed;
        this.maxStamina = playerDefn.stamina;
        this.weapon = playerDefn.weapon;
        this.stamina = this.maxStamina;
        this.runInterval = 0;
        this.sound = playerDefn.sound;
        this.rippleData = {
            radius: this.sound,
            timeout: 50,
            canvas: makeRipple(this.sound),
        }
        this.leeches = [];
        curPlayer.ent = this;
    };

    playerObject.prototype.__proto__ = mortalObject.prototype;

    playerObject.prototype.attach = function (xomB) {
        physics.fixAttachBodies(this.pBody, xomB.pBody);
        this.leeches.push(xomB);
    }

    playerObject.prototype.update=function () {
        var ran = false;
        this.runInterval += 1;
        //VIEWPORT CENTER
        draw.snapViewport(this.pos)
        //WEAPON UPDATE
        this.weapon.update();
        //MOVEMENT
        var mVec = getPlayerMovement(),
            scale = this.speed;
        if ((mVec.x || mVec.y)) {
            if(controls.ev('run')) {
                if (!this.tired) {
                    this.stamina -= 1;
                    scale*=3;
                    if(this.runInterval > 20) {
                        this.rippleData.x = this.pos.x;
                        this.rippleData.y = this.pos.y;
                        soundSource(this.pos, this.sound);
                        new ripple(this.rippleData);
                        this.runInterval = 0;
                    }
                    ran = true;
                }
            }
            // Diagonal scaling
            if (mVec.x && mVec.y) {
                scale/=Math.SQRT2;
            }
        }
        if(this.stamina <= 0) {
            this.tired = true;
        }
        if(!ran) {
            this.stamina = Math.min(this.maxStamina, this.stamina+1);
            if (this.stamina > 120) {
                this.tired = false;
            }
        }
        physics.moveBody(this.pBody, vec.sc(mVec, scale));
        //FIRING
        var fVec = vec.norm(firingVector());
        if (fVec.x || fVec.y ) {
            //TODO emit sound
            var curPos = vec.mad(this.pos, this.dim.w, fVec);
            var curVel = physics.getVelocity(this.pBody);
            this.weapon.fire({
                pos: curPos,
                vel: curVel,
                dir: fVec,
            });
        } 
        //LEECH
        for (var i = this.leeches.length - 1; i >= 0; i-=1) {
            var leech = this.leeches[i];
            if(leech._dead) {
                this.leeches.splice(i,1);
            } else {
                if (controls.tap('melee')) {
                    leech.damage(33);
                }
            }
        }
    };

    function bulletObject (bulletData) {
        bulletData.userData = 'bullet';
        bulletData.sensor = true;
        bulletData.bullet = true;
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
        this.speed = zombieData.speed;
        this.lastSound = null;
        /* States:
         *     0 - move random
         *     1 - alerted
         */
         this._state = 0;
         this.timeout = 0;
         this.suckDamage = zombieData.damage;
         this.target = {
            step: -1,
         };
    }

    zombieObject.prototype.__proto__ = mortalObject.prototype;

    zombieObject.prototype.update = function () {
        //TODO again...
        if (this._state == 0) {
            this.timeout -= 1;
            if(this.timeout <= 0) {
                physics.moveBody(this.pBody, vec.eq({
                    x: Math.random() - 0.5,
                    y: Math.random() - 0.5,
                }, this.speed))
                this.timeout = 90 + Math.random()*90;
            }
        }
        else if (this._state == 1) {
            var difV = vec.mad(this.target.pos, -1, this.pos),
                m = vec.mag(difV);
            if (m < this.dim.w*1.2) {
                this._state = 0;
            } else {
                physics.moveBody(this.pBody, vec.eq(difV, this.speed*2));
            }
        }
        else if (this._state == -1) {
            this.pl.damage(this.suckDamage);
        }
    }

    zombieObject.prototype.alert = function(pos) {
        if (this._state != -1) {
            this._state = 1;
            this.target.pos = pos;
        }
    }

    zombieObject.prototype.suck = function(pl) {
        this._state = -1;
        this.pl = pl;
    }


    function makeRipple(radius) {
        var oc = document.createElement('canvas'),
            hd = oc.getContext('2d');
            gr = null;
        oc.width = 2*radius;
        oc.height = 2*radius;
        gr = hd.createRadialGradient(radius, radius, radius/10, radius, radius, radius*2);
        gr.addColorStop(1, 'rgba(0,0,0,0.8)');
        gr.addColorStop(0, 'rgba(0,0,0,0)');
        hd.beginPath();
        hd.arc(radius, radius, radius, 0, 2 * Math.PI, false);
        hd.fillStyle = gr;
        hd.fill();
        hd.closePath();
        hd.beginPath();
        hd.arc(radius, radius, 10, 0, 2 * Math.PI, false);
        hd.fillStyle = 'rgba(170,0,0,0.5)';
        hd.fill();
        hd.closePath();
        var name = 'ripple-'+radius;
        resources.registerCanvas(name, oc)
        return name;
    }

    function ripple(rDat) {
        rDat.loop = true;
        rDat.w = rDat.radius;
        rDat.h = rDat.radius;
        this.cImg = {
            image: {
                name: rDat.canvas,
                canvas: true
            },
            n: 1
        }
        rDat.reel = [this.cImg]
        e.animation.call(this, rDat);
        this.rCanvas = resources.canvas[rDat.canvas];
        this.timeout = rDat.timeout;
        this.count = 0;
        m = this;
    }

    ripple.prototype.__proto__ = e.animation.prototype

    ripple.prototype.update = function() {
        this.count += 1;
        this.cImg.image.alpha = 1-this.count/this.timeout;
        if (this.count >= this.timeout-1) {
            this._dead = true;
        }
    }

    // Abstract objects are glorified containers
    function abstractWeapon(weaponData) {
        this.name = weaponData.name;
        this.cooldown = weaponData.cooldown;
        this.blockFire = 0;
        this.bulletData = weaponData.bulletData;
        this.ammo = weaponData.ammo;
        this.sound = weaponData.sound;
        this.rippleData = {
            radius: weaponData.sound,
            timeout: 35,
            canvas: makeRipple(weaponData.sound),
        }
    }

    abstractWeapon.prototype.fire = function(vecDat) {
        if(this.blockFire > 0) {
            return;
        }
        if (this.ammo <= 0) {
            //CLICK
            return;
        }
        this.blockFire = this.cooldown;
        this.ammo-=1;
        // DIRTY initializations!
        this.bulletData.sx = vecDat.vel.x;
        this.bulletData.sy = vecDat.vel.y;
        this.bulletData.x = vecDat.pos.x;
        this.bulletData.y = vecDat.pos.y;
        this.bulletData.dx = vecDat.dir.x;
        this.bulletData.dy = vecDat.dir.y;
        this.rippleData.x = vecDat.pos.x;
        this.rippleData.y = vecDat.pos.y;
        new ripple(this.rippleData);
        soundSource(vecDat.pos, this.sound);
        return new bulletObject(this.bulletData);
    }

    abstractWeapon.prototype.update = function() {
        if(this.blockFire > 0) {
            this.blockFire--;
        }
    }

    abstractWeapon.prototype.loadAmmo = function(ammo) {
        this.ammo+=ammo;
    }

    function soundSource(position, pow) {
        function qCback(item) {
            if (item.type == 'zombie') {
                item.ent.alert(position);
            }
            return true;
        }
        physics.queryBox(position, pow, qCback);
    }

    function powerUpObject(powerUpData) {
        var pos = level.getSpawn('powerup');
        powerUpData.x = pos.x,
        powerUpData.y = pos.y;
    }

    return {
        playerObject: playerObject,
        abstractWeapon: abstractWeapon,
        bulletObject: bulletObject,
        zombieObject: zombieObject,
        curPlayer: curPlayer,
    }
});
