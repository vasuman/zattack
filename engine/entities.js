define(['engine/physics', 'engine/manager', 'engine/resources'], function(physics, manager, resources) {
    var globalEntityIndex = 0;
    function baseObject (objDat) {
        this.skipUpdate = objDat.noUpdate;
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

    baseObject.prototype.getDrawData = function() {
        return {
            x: this.pos.x - this.dim.w/2,
            y: this.pos.y - this.dim.h/2,
            width: this.dim.w,
            height: this.dim.h,
            image: null,
        }
    }

    baseObject.prototype.updateChain = function () {
        for(var i = this.__proto__; i.update; i = i.__proto__) {
            i.update.call(this);
        }
    }

    function animation (animDefn) {
        baseObject.call(this, animDefn);
        this.anim = {
            frame: 0,
            idx: 0,
            reel: animDefn.reel
        }
        this.loop = animDefn.loop;
        this.drawImage = true;
        console.log(this.anim);
    }

    animation.prototype.__proto__ = baseObject.prototype;

    animation.prototype.getDrawData = function() {
        this.anim.frame+=1;
        if (this.anim.frame > this.anim.reel[this.anim.idx].n) {
            if (!this.loop && this.anim.idx == this.anim.reel.length-1) {
                this._dead = true;
            }
            this.anim.idx = (this.anim.idx + 1) % this.anim.reel.length;
            this.anim.frame = 0;
        }
        var imgDat = this.anim.reel[this.anim.idx].image;
        if (imgDat.canvas) {
            var canvas = resources.canvas[imgDat.name];
            return {
                canvas: canvas,
                x: this.pos.x - canvas.width / 2,
                y: this.pos.y - canvas.height / 2,
                width: canvas.width,
                height: canvas.height,
                alpha: imgDat.alpha
            }
        }
        var img = resources.images[imgDat.name];
        return {
            image: img,
            x: this.pos.x - imgDat.w / 2,
            y: this.pos.y - imgDat.h / 2,
            width: imgDat.w, 
            height: imgDat.h, 
            sx: imgDat.x, 
            sy: imgDat.y,
            alpha: imgDat.alpha
        }
    }

    animation.prototype.loadReel = function(reel) {
        this.anim = {
            frame: 0,
            idx: 0,
            reel: reel
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
            this.deathTrigger(this);
        }
        physics.destroyBody(this.pBody);
    }

    return {
        baseObject: baseObject,
        physicalObject: physicalObject,
        animation: animation,
    }
})
