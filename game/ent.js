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
        if (controls.poll('mouse-up')) {
            return vec.mad(draw.offsetCenter(controls.mousePosition()), -1, ref.player.pos);
        }
        return {
            x: 0,
            y: 0
        }
    }

    //TODO allow change scheme
    var firingVector = mouseFire,
        ref = {
            player: null,
        };

    function useMouse(s) {
        firingVector = (s) ? mouseFire : keyFire;
    }

    function mortalObject (mortalDefn) {
        e.physicalObject.call(this, mortalDefn);
        this.$.health = mortalDefn.health || 100;
    }

    mortalObject.prototype.__proto__ = e.physicalObject.prototype;

    mortalObject.prototype.update = function() {};

    mortalObject.prototype.damage = function(amt) {
        this.$.health -= amt;
        if (this.$.health<0) {
            this.$.dead = true;
        }
    }

    function playerObject (playerDefn) {
        if (ref.player && !ref.player.$.dead) {
            ref.player.$.dead = true;
        }
        playerDefn.userData = 'player';
        mortalObject.call(this, playerDefn);
        this.$.stamina = this.def.stamina;
        this.$.interval = 0;
        this.$.ripple = {
            radius: this.def.sound,
            timeout: 50,
            canvas: drawRipple(this.def.sound),
        }
        this.$.leech = [];
        ref.player = this;
    };

    playerObject.prototype.__proto__ = mortalObject.prototype;

    playerObject.prototype.attach = function (xomB) {
        physics.fixAttachBodies(this.pBody, xomB.pBody, 10);
        this.$.leech.push(xomB);
    }

    playerObject.prototype.bulletTime = function() {
    }

    playerObject.prototype.update=function (lapse) {
        this.$.interval += lapse;
        var ran = false;
        //VIEWPORT CENTER
        draw.snapViewport(this.pos)
        //WEAPON UPDATE
        this.def.weapon.update();
        //MOVEMENT
        var mVec = getPlayerMovement(),
            scale = this.def.speed;
        if (mVec.x || mVec.y) {
            //RUN
            if(controls.ev('run')) {
                if (!this.$.tired) {
                    // Make some noise
                    if(this.$.interval > 20) {
                        this.$.ripple.x = this.pos.x;
                        this.$.ripple.y = this.pos.y;
                        new ripple(this.$.ripple);
                        this.$.interval = 0;
                    }
                    this.$.stamina -= lapse;
                    scale*=3;
                    ran = true;
                }
            }
            // Diagonal scaling
            if (mVec.x && mVec.y) {
                scale/=Math.SQRT2;
            }
        }
        if(this.$.stamina <= 0) {
            this.$.tired = true;
        }
        if(!ran) {
            this.$.stamina = Math.min(this.def.stamina, this.$.stamina+lapse);
            if (this.$.stamina > 120) {
                this.$.tired = false;
            }
        }
        physics.moveBody(this.pBody, vec.sc(mVec, scale));
        //FIRING
        var fVec = vec.norm(firingVector());
        if (fVec.x || fVec.y ) {
            this.$.interval = 0;
            var curPos = vec.mad(this.pos, this.dim.w, fVec);
            var curVel = physics.getVelocity(this.pBody);
            this.def.weapon.fire({
                pos: curPos,
                vel: curVel,
                dir: fVec,
            });
        } 
        //LEECH
        for (var i = this.$.leech.length - 1; i >= 0; i-=1) {
            var leech = this.$.leech[i];
            if(leech.$.dead) {
                this.$.leech.splice(i,1);
            } else {
                if (controls.tap('melee')) {
                    leech.damage(this.def.melee);
                }
            }
        }
    };

    function bulletObject (bulletData) {
        bulletData.userData = 'bullet';
        bulletData.x = bulletData.vec.pos.x;
        bulletData.y = bulletData.vec.pos.y;
        bulletData.bullet = true;
        e.physicalObject.call(this, bulletData);
        this.$.timeout = this.def.timeout;
        physics.moveBody(this.pBody, {
            x:  bulletData.vec.dir.x*
                bulletData.speed+bulletData.vec.vel.x, 
            y:  bulletData.vec.dir.y*
                bulletData.speed+bulletData.vec.vel.y
        });
    }

    bulletObject.prototype.__proto__ = e.physicalObject.prototype;

    bulletObject.prototype.update = function() {
        if (this.$.timeout < 0) {
            this.$.dead = true;
        }
    }

    function zombieObject (zombieData) {
        zombieData.userData = 'zombie';
        mortalObject.call(this, zombieData);
        /* States:
         *     0 - move random
         *     1 - alerted
         */
         this.$.state = 0;
         this.$.timeout = 0;
         this.$.target = {
            step: -1,
         };
    }

    zombieObject.prototype.__proto__ = mortalObject.prototype;

    zombieObject.prototype.update = function (lapse) {
        //TODO again...
        if (this.$.state == 0) {
            this.$.timeout -= lapse;
            if(this.$.timeout <= 0) {
                physics.moveBody(this.pBody, vec.eq({
                    x: Math.random() - 0.5,
                    y: Math.random() - 0.5,
                }, this.def.speed))
                this.$.timeout = 90 + Math.random()*90;
            }
        }
        else if (this.$.state == 1) {
            var difV = vec.mad(this.$.target.pos, -1, this.pos),
                m = vec.mag(difV);
            if (m < this.dim.w*2) {
                this.$.state = 0;
            } 
        }
        else if (this.$.state == -1) {
            this.$.source.damage(this.def.damage);
        }
    }

    zombieObject.prototype.alert = function(pos) {
        if (this.$.state != -1) {
            this.$.state = 1;
            this.$.target.pos = pos;
            var difV = vec.mad(this.$.target.pos, -1, this.pos);
            physics.moveBody(this.pBody, vec.eq(difV, this.def.speed*2));
        }
    }

    zombieObject.prototype.suck = function(src) {
        this.$.state = -1;
        this.$.source = src;
    }


    function drawRipple(radius) {
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
        hd.fillStyle = 'rgba(255,255,255,0.08)';
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
        rDat.reel = [{
            image: {
                name: rDat.canvas,
                canvas: true
            },
            n: 1
        }];
        e.animation.call(this, rDat);
        this.$.count = 0;
        soundSource(this.pos, rDat.radius)
    }

    ripple.prototype.__proto__ = e.animation.prototype

    ripple.prototype.update = function(lapse) {
        this.$.count += lapse;
        this.def.reel[0].image.alpha = 1-this.$.count/this.def.timeout;
        if (this.$.count >= this.def.timeout-1) {
            this.$.dead = true;
        }
    }

    function sensorObject(sensDat) {
        
    }

    // Abstract objects are glorified containers
    function abstractWeapon(weaponData) {
        this.def = weaponData;
        this.$ = {};
        this.def.ripple = {
            radius: weaponData.sound,
            timeout: 35,
            canvas: drawRipple(weaponData.sound),
        }
        this.$.ammo = this.def.ammo;
        this.$.block = 0;
    }

    abstractWeapon.prototype.fire = function(vecDat) {
        if(this.$.block > 0) {
            return;
        }
        if (this.$.ammo <= 0) {
            //CLICK
            return;
        }
        this.$.block = this.def.cooldown;
        this.$.ammo-=1;
        // DIRTY initializations!
        this.def.ripple.x = vecDat.pos.x;
        this.def.ripple.y = vecDat.pos.y;
        new ripple(this.def.ripple);
        this.def.bullet.vec = vecDat
        new bulletObject(this.def.bullet);
    }

    abstractWeapon.prototype.update = function() {
        if (this.$.block > 0) {
            this.$.block -= 1;
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

    return {
        playerObject: playerObject,
        abstractWeapon: abstractWeapon,
        bulletObject: bulletObject,
        zombieObject: zombieObject,
        ref: ref,
    }
});