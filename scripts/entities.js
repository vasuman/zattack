var globalEntityIndex = 0;

var baseObject = function (objDat) {
        this.pos={
            x:objDat.x, 
            y:objDat.y
        };
        this.dim={
            w:objDat.w,
            h:objDat.h
        };
        this.entID=globalEntityIndex++;
        if(objDat.hide) {
            this.visible=true;
        };
        this.sprite=objDat.sprite;
        entityManager.registerEntity(this);
        this._dead=false;
};

baseObject.prototype.getDrawData = function() {
    return {
        x:this.pos.x-this.dim.w/2,
        y:this.pos.y-this.dim.h/2,
        w:this.dim.w,
        h:this.dim.h,
        sprite:this.sprite,
    };
};

baseObject.prototype.update = function () {};

baseObject.prototype.updateChain = function () {
    for(var i = this.__proto__; i.update; i = i.__proto__){
        i.update.call(this);
    }
};


var physicalObject = function (physDefn) {
        baseObject.call(this, physDefn);
        //Create a Box2D box!!
        this.pBody=physicsEngine.makeBody(physDefn, this);
        this.skipUpdate=(physDefn.isStatic)?true:false;
};

physicalObject.prototype.__proto__ = baseObject.prototype;

physicalObject.prototype.update=function () {
    //Update positions from Box2D
    if(!this.skipUpdate) {
        var coord = this.pBody.GetPosition(); 
        this.pos.x=coord.x*_scale;
        this.pos.y=coord.y*_scale;
    };
};

physicalObject.prototype.stall = function() {
    this.pBody.SetLinearVelocity({x:0, y:0});
}



var mortalObject = function (mortalDefn) {
    physicalObject.call(this, mortalDefn);
    var health = 100;
    this.hurt = function(amt) {
        health-=amt;
        if (health<0) {
            this._dead=true;
            console.log('destroyed');
        }
    }
}

mortalObject.prototype.__proto__ = physicalObject.prototype;

mortalObject.prototype.update = function() {};

/*
*   playerObjects are for use in top-view games
*   moves with same velocity in all directions
*   Also has support for firing using keyboard.
*   
*   Change the keyState keys in the controlEngine
*   needed to whatever you like 
*
* */
var playerObject = function (playerDefn) {
        playerDefn.userData = 'player';
        mortalObject.call(this, playerDefn);
        this.moveAcc = playerDefn.acceleration;
        this.pBody.SetLinearDamping(playerDefn.damping);
        this.weapon = playerDefn.weapon;
};

playerObject.prototype.__proto__ = mortalObject.prototype;

playerObject.prototype.update=function () {

    //VIEWPORT CENTER
    drawManager.snapViewport(this.pos)
    
    //WEAPON UPDATE
    this.weapon.update();
    
    //MOVEMENT
    var mVec = controlEngine.getMovementVector();
    if (mVec.x || mVec.y) {
        this.pBody.ApplyForce(
            vMath.magnify(vMath.normalize(mVec), this.moveAcc), 
            this.pBody.GetWorldCenter()
        );
    }
    
    //FIRING
    var fVec = vMath.normalize(controlEngine.getFiringVector());
    if (fVec.x || fVec.y ) {
        var cPos = vMath.multAdd(this.pos, this.dim.w, fVec);
        var cVel = this.pBody.GetLinearVelocity();
        this.weapon.fire({
            x:cPos.x,
            y:cPos.y,
            dx:fVec.x,
            dy:fVec.y,
            sx:cVel.x,
            sy:cVel.y
        });
    }
};

var bulletObject = function (bulletData) {
    bulletData.userData = 'bullet';
    physicalObject.call(this, bulletData);
    this.timeout = bulletData.timeout;
    this.pBody.SetLinearVelocity({
        x:bulletData.dx*bulletData.speed+bulletData.sx, 
        y:bulletData.dy*bulletData.speed+bulletData.sy
    });
    this.hitDamage = bulletData.hitDamage;
};

bulletObject.prototype.__proto__ = physicalObject.prototype;

bulletObject.prototype.update = function() {
    if (!this.timeout--) {
        this._dead=true;
    };
};

var zombieObject = function (zombieData) {
    zombieData.userData = 'zombie';
    mortalObject.call(this, zombieData);
    this.moveSpeed = zombieData.moveSpeed;
    this.step=60;
}

zombieObject.prototype.__proto__ = mortalObject.prototype;

zombieObject.prototype.update = function () {
    if((this.step--)<0) {
        var mVec = levelManager.getConvergenceVector(this.pos);
        this.pBody.SetLinearVelocity(vMath.magnify(vMath.normalize(mVec), this.moveSpeed));
        this.step=60+Math.random()*300;
    }
};
