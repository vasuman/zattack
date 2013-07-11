define(['import/box2d', 'engine/vector'], function (_discard, vec) {
    //GLOABL CONSTANTS DEFINED HERE !!!
    var _scale,
        _fps,
        world,
        self = this;

    // Insert Box2D shorthands here!!
    var Vec2 = Box2D.Common.Math.b2Vec2,
        Body = Box2D.Dynamics.b2Body,
        Shapes = Box2D.Collision.Shapes;

    var ctListen = new Box2D.Dynamics.b2ContactListener(),
        ctCallbacks = {},
        obstacles= [];

    function contactCallback(contact) {
        var bodyA = contact.GetFixtureA().GetBody(),
            bodyB = contact.GetFixtureB().GetBody(),
            udA = bodyA.GetUserData(),
            udB = bodyB.GetUserData();
        if (udA['class'] in ctCallbacks) {
            ctCallbacks[udA['class']](udA, udB, impulse);
        }
        if (udB['class'] in ctCallbacks) {
            ctCallbacks[udB['class']](udB, udA, impulse);
        }
    }
    ctListen.BeginContact = contactCallback;

    function init(grav, factor, framerate) {
        _gravity = grav;
        _fps = framerate;
        _scale = factor;
        world = new Box2D.Dynamics.b2World(new Vec2(0, _gravity), false);
        world.SetContactListener(ctListen);
    }

    function update() {
        world.Step(1/_fps, 10, 10);
        world.ClearForces();
    }

    function makeBody(physData, refObj) {
        /* Fixture Types
         * 0 : Slippy and Bouncy
         * 1 : Bouncy
         * 2 : Slippy
         * 3 : Custom -- also specify "friction" and "restitution"  */
        var bDef = new Box2D.Dynamics.b2BodyDef();
        bDef.type = (physData.isStatic)?Body.b2_staticBody:Body.b2_dynamicBody;
        bDef.position.Set(physData.x/_scale, physData.y/_scale);
        if (physData.damping) {
            bDef.linearDamping = physData.damping;
        }
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

    function addWorldObstacle(physData) {
        physData.userData = 'wall';
        physData.isStatic = true;
        physData.fixtureType = 0;
        var body = makeBody(physData);
        obstacles.push(body);
        return body;
    }

    function clearWorldObstacles() {
        for(var i = 0; i<obstacles.length; i++) {
            destroyBody(obstacles[i])
        }
        obstacles = [];
    }

    function destroyBody(physBody) {
        world.DestroyBody(physBody); 
    };

    function solveListener(className, callback) {
        self.ctCallbacks[className] = callback;
    };

    function pushBody(body, vector) {
        body.ApplyForce(vector, body.GetWorldCenter())
    }

    function getPosition(body) {
        return vec.sc(body.GetPosition(), _scale)
    }
    return {
        init: init,
        addWorldObstacle: addWorldObstacle,
        solveListener: solveListener,
        destroyBody: destroyBody,
        getPosition: getPosition,
        update: update,
        makeBody: makeBody,
        pushBody: pushBody,
        clearWorldObstacles: clearWorldObstacles
    }

});
