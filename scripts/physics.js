//GLOABL CONSTANTS DEFINED HERE !!!
var _scale=30;
var _gravity=0;
var _fps=120;

// Insert Box2D shorthands here!!
var Vec2 = Box2D.Common.Math.b2Vec2;
var Body = Box2D.Dynamics.b2Body;
var Shapes = Box2D.Collision.Shapes;

var physicsEngine = new (function physicsScheme(){
    world = new Box2D.Dynamics.b2World(new Vec2(0, _gravity), false);
    this.update = function () {
        world.Step(1/_fps, 10, 10);
        world.ClearForces();
    };
    this.ctCallbacks = {};
    var ctListen = new Box2D.Dynamics.b2ContactListener();
    ctListen.PostSolve = function(contact, impulse) {
        var bodyA = contact.GetFixtureA().GetBody();
        var bodyB = contact.GetFixtureB().GetBody();
        var udA = bodyA.GetUserData();
        var udB = bodyB.GetUserData();
        if (udA['class'] in physicsEngine.ctCallbacks) {
            physicsEngine.ctCallbacks[udA['class']](udA, udB, impulse);
        }
        if (udB['class'] in physicsEngine.ctCallbacks) {
            physicsEngine.ctCallbacks[udB['class']](udB, udA, impulse);
        }
    };
    world.SetContactListener(ctListen);
    this.makeBody = function (physData, refObj) {
        /* Fixture Types
         * 1 : Slippy and Bouncy
         * 2 : Bouncy
         * 3 : Slippy
         * 4 : Custom -- also specify "friction" and "restitution"  */
        var bDef = new Box2D.Dynamics.b2BodyDef();
        bDef.type = (physData.isStatic)?Body.b2_staticBody:Body.b2_dynamicBody;
        bDef.position.Set(physData.x/_scale, physData.y/_scale);
        var fixDef = new Box2D.Dynamics.b2FixtureDef();
        switch(physData.fixtureType) {
            case 0: fixDef.friction = 0;
            case 1: fixDef.restitution = 1;
                    break;
            case 2: fixDef.friction = 0;
                    break;
            case 3: fixDef.friction = physData.friction;
                    fixDef.restitution = physData.restitution;
                    break;
            default:break;
        };
        switch(physData.shape) {
            case 0 :
            default:fixDef.shape = new Shapes.b2PolygonShape();
                    fixDef.shape.SetAsBox(physData.w/(2*_scale), physData.h/(2*_scale));
                    break;
            case 1 :fixDef.shape = new Shapes.b2CircleShape();
                    fixDef.shape.SetRadius(physData.r/_scale);
                    break;
        };
        if(physData.filterGroup) {
            fixDef.filter.groupIndex = physData.filterGroup;
        }
        var createdBody = world.CreateBody(bDef);
        createdBody.CreateFixture(fixDef);
        if(physData.userData) {
            createdBody.SetUserData({
                'class':physData.userData,
                'ent':refObj,
            });
        }
        else {
            createdBody.SetUserData({
                'ent':refObj,
            });
        }
        return createdBody;
    };
    this.destroyBody = function(physBody) {
        world.DestroyBody(physBody); 
    };
    this.solveListener = function (className, callback) {
        this.ctCallbacks[className] = callback;
    };
    this.refreshWorld = function () {
        //TODO add code
        world = new Box2D.Dynamics.b2World(new Vec2(0, _gravity), false);
        world.SetContactListener(ctListen);
        this.ctCallbacks = {};
    };
})();
