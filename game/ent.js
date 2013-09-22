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
            return vec.mad(draw.offsetCenter(controls.mousePosition()), -1, ref.player.pos);
    }

    //TODO allow change scheme
    var firingVector = mouseFire,
        ref = {
            player: null,
        };

    function bulletImage(radius) {
        var c = document.createElement('canvas'),
        hd = c.getContext('2d'),
        gr = hd.createRadialGradient(radius, radius, radius/2, 
                radius, radius, radius*2);
        c.width = radius*2;
        c.height = radius*2;
        gr.addColorStop(0, 'red');
        gr.addColorStop(1, 'black');
        hd.arc(radius, radius, radius, 0, 2 * Math.PI, false);
        hd.fillStyle = gr;
        hd.fill();
        var name = 'bullet'+radius;
        resources.registerCanvas(name, c);
        return name;
    }

    function useMouse(s) {
        firingVector = (s) ? mouseFire : keyFire;
    }

    function mortalObject (mortalDefn) {
        e.physicalObject.call(this, mortalDefn);
        this.$.health = mortalDefn.health || 100;
    }

    mortalObject.prototype.__proto__ = e.physicalObject.prototype;

    mortalObject.prototype.heal = function(amt) {
        this.$.health = Math.min((this.def.health || 100), this.$.health+amt);
    };

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
        if(this.def.weapon.bTAction && this.def.weapon.bTAction()) {
            return true;
        }
        return false;
    }

    playerObject.prototype.update=function (lapse) {
        this.$.color = 'blue';
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
                    scale*=this.def.run;
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
            if (this.$.stamina > this.def.stamina/3) {
                this.$.tired = false;
            }
        }
        physics.pushBody(this.pBody, vec.sc(mVec, scale));
        //FIRING
        if (this.def.weapon.fireAction()) {
            var fVec = vec.norm(firingVector());
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
            this.$.color = 'red';
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
        this.loadReel(bulletData.img);
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
         this.loadReel(this.def.normalAnim, true);
    }

    zombieObject.prototype.__proto__ = mortalObject.prototype;

    zombieObject.prototype.update = function (lapse) {
        //TODO again...
        if(this.$.qVec) {
            physics.moveBody(this.pBody, this.$.qVec);
            this.$.qVec = null;
        }
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
            this.$.qVec = vec.eq(difV, this.def.speed*2);
        }
    }

    zombieObject.prototype.suck = function(src) {
        this.$.state = -1;
        this.$.source = src;
        // this.loadReel(this.def.suckAnim, true)
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
        e.animation.call(this, rDat);
        this.$.count = 0;
        this.loadReel([{
            image: {
                name: rDat.canvas,
                canvas: true
            },
            n: 1
        }]);
        soundSource(this.pos, rDat.radius)
    }

    ripple.prototype.__proto__ = e.animation.prototype

    ripple.prototype.update = function(lapse) {
        this.$.count += lapse;
        this.reel[0].image.alpha = 1-this.$.count/this.def.timeout;
        if (this.$.count >= this.def.timeout-1) {
            this.$.dead = true;
        }
    }

    function healthPack(sensDat) {
        sensDat.userData = 'pickup';
        sensDat.sensor = true;
        sensDat.zLow = true;
        e.physicalObject.call(this, sensDat);
        this.loadReel([{
            image: {
                name: 'otile.png',
                x: 0,
                y: 0,
                w: 24,
                h: 24
            },
            n: 1,
        }])
    }

    healthPack.prototype.__proto__ = e.physicalObject.prototype;

    healthPack.prototype.apply = function(player) {
        player.heal(this.def.restore);
    }

    function ammoCrate(amDat) {
        amDat.userData = 'pickup';
        amDat.sensor = true;
        amDat.zLow = true;
        e.physicalObject.call(this, amDat);
        this.loadReel([{
            image: {
                name: 'otile.png',
                x: 24,
                y: 0,
                w: 24,
                h: 24
            },
            n: 1,
        }])
    }

    ammoCrate.prototype.__proto__ = e.physicalObject.prototype;

    ammoCrate.prototype.apply = function(player) {
        var wp = player.def.weapon;
        wp.$.ammo += wp.arg.amic;
    }

    // Abstract objects are glorified containers
    function abstractWeapon(weaponData) {
        this.arg = weaponData;
        this.$ = {};
        this.arg.ripple = {
            radius: weaponData.sound,
            timeout: 35,
            canvas: drawRipple(weaponData.sound),
        }
        this.$.ammo = this.arg.ammo;
        this.$.block = 0;
    }

    abstractWeapon.prototype.fire = function(vDat) {
        if(this.$.block > 0) {
            return;
        }
        if(this.$.ammo<=0) {
            return;
        }
        this.arg.ripple.x = vDat.pos.x;
        this.arg.ripple.y = vDat.pos.y;
        new ripple(this.arg.ripple);
        this.arg.bParam.vec = vDat
        new bulletObject(this.arg.bParam);
        this.$.block = this.arg.cooldown;
        this.$.ammo -= 1;
    }

    abstractWeapon.prototype.update = function() {
        if (this.$.block > 0) {
            this.$.block -= 1;
        }
    }

    abstractWeapon.prototype.reset = function() {
        this.$.block = 0;
        this.$.ammo = this.arg.ammo;
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

    var silencePistol = new abstractWeapon({
        name: 'Silenced Pistol',
        cooldown: 20,
        amic: 18,
        ammo: 42,
        bParam: {
            img: [{
                image: {
                    name: bulletImage(2),
                    canvas: true,
                },
                n: 1
            }],
            timeout: 500,
            w: 3,
            h: 3,
            speed: 200,
            damage: 40,
        },
        sound: 50,
    });

    silencePistol.fireAction = function() {
        return controls.poll('mouse-up');
    }

    var sniperRifle = new abstractWeapon({
        name: 'Rifle',
        cooldown: 10,
        amic: 10,
        ammo: 20,
        bParam: {
            img: [{
                image: {
                    name: bulletImage(3),
                    canvas: true,
                },
                n: 1
            }],
            timeout: 500,
            w: 6,
            h: 6,
            speed: 290,
            damage: 120,
        },
        sound: 150,
    });

    sniperRifle.fireAction = function() {
        return controls.poll('mouse-up');
    }

    sniperRifle.bTAction = function() {
        return controls.mousePressed(0);
    }

    var machineGun = new abstractWeapon({
        name: 'Machine Gun',
        cooldown: 10,
        amic: 100,
        ammo: 200,
        bParam: {
            img: [{
                image: {
                    name: bulletImage(3),
                    canvas: true,
                },
                n: 1
            }],
            timeout: 500,
            w: 4,
            h: 4,
            speed: 240,
            damage: 20,
        },
        sound: 150,
    });

    machineGun.fireAction = function() {
        return controls.mousePressed(0);
    }

    return {
        playerObject: playerObject,
        machineGun: machineGun,
        silencePistol: silencePistol,
        sniperRifle: sniperRifle,
        bulletObject: bulletObject,
        zombieObject: zombieObject,
        ammoCrate: ammoCrate,
        healthPack: healthPack,
        ref: ref,
    }
});
