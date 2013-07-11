define(['engine/physics', 'engine/manager'], function(physics, manager) {
    var globalEntityIndex = 0;
    function baseObject (objDat) {
        this.pos = {
            x: objDat.x, 
            y: objDat.y
        }
        this.dim = {
            w: objDat.w,
            h: objDat.h
        }
        this.entID = globalEntityIndex++;
        if (objDat.hide) {
            this.visible = true;
        }
        if (!objDat.animated) {
            this.getDrawData = function() {
                return {
                    x: this.pos.x - this.dim.w/2,
                    y: this.pos.y - this.dim.h/2,
                    width: this.dim.w,
                    height: this.dim.h,
                    image: null,
                }
            }
        } else {
            this.anim = {};
            this.getDrawData = function() {
                this.anim.frame++;
                if (this.anim.frame > this.reel[this.idx][1]) {
                    this.idx = (this.idx + 1) % this.reel.length;
                    this.animFrame = 0;
                }
                var img = this.reel[reelIdx][0];
                return {
                    x: this.pos.x - img.w / 2,
                    y: this.pos.y - img.h / 2,
                    width: img.w,
                    height: img.h,
                    image: img,

                }
            }
            this.loadReel = function(reel) {
                this.anim = {
                    frame: 0,
                    idx: 0,
                    reel: reel
                }
            }
        }
        this.deathTrigger = objDat.deathTrigger;
        manager.registerEntity(this);
        this._dead = false;
    }

    baseObject.prototype.update = function () {};

    baseObject.prototype.cleanup = function() {
        if(this.deathTrigger) {
            this.deathTrigger();
        }
    }

    baseObject.prototype.updateChain = function () {
        for(var i = this.__proto__; i.update; i = i.__proto__) {
            i.update.call(this);
        }
    }

    /* A physicalObject is an object with an attached Box2D body */
    function physicalObject (physDefn) {
            baseObject.call(this, physDefn);
            //Create a Box2D box!!
            this.pBody = physics.makeBody(physDefn, this);
            this.skipUpdate = (physDefn.isStatic)?true:false;
    }

    physicalObject.prototype.__proto__ = baseObject.prototype;

    physicalObject.prototype.update=function () {
        //Update positions from Box2D
        if (!this.skipUpdate) {
            this.pos = physics.getPosition(this.pBody); 
        }
    }

    physicalObject.prototype.cleanup = function() {
        if(this.deathTrigger) {
            this.deathTrigger();
        }
        physics.destroyBody(this.pBody);
    }
    return {
        baseObject: baseObject,
        physicalObject: physicalObject
    }
})
