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

    ctListen = new Box2D.Dynamics.b2ContactListener(),
        callbacks = {
            ct: {},
            sl: {}
        },
        obstacles= [];

    function solveCallback(contact) {
        var bodyA = contact.GetFixtureA().GetBody(),
            bodyB = contact.GetFixtureB().GetBody(),
            udA = bodyA.GetUserData(),
            udB = bodyB.GetUserData();
        if (udA.type in callbacks.sl) {
            callbacks.sl[udA.type](udA, udB);
        }
        if (udB.type in callbacks.sl) {
            callbacks.sl[udB.type](udB, udA);
        }
    }
    function contactCallback(contact) {
        var bodyA = contact.GetFixtureA().GetBody(),
            bodyB = contact.GetFixtureB().GetBody(),
            udA = bodyA.GetUserData(),
            udB = bodyB.GetUserData();
        if (udA.type in callbacks.ct) {
            callbacks.ct[udA.type](udA, udB);
        }
        if (udB.type in callbacks.ct) {
            callbacks.ct[udB.type](udB, udA);
        }
    }

    ctListen.BeginContact = contactCallback;
    ctListen.PostSolve = solveCallback;

    function init(grav, factor, framerate) {
        _gravity = grav;
        _fps = framerate;
        _scale = factor;
        world = new Box2D.Dynamics.b2World(new Vec2(0, _gravity), false);
        world.SetContactListener(ctListen);
    }

    function update(amt) {
        world.Step(amt, 10, 10);
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
        bDef.isBullet = (physData.bullet) || false;
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
        fixDef.isSensor = (physData.sensor) || false;
        var createdBody = world.CreateBody(bDef);
        createdBody.CreateFixture(fixDef);
        if(physData.userData) {
            createdBody.SetUserData({
                'type':physData.userData,
                'ent':refObj,
            });
        }
        else {
            createdBody.SetUserData({
                'ent':refObj,
            });
        }
        return createdBody;
    }

    function addWorldObstacle(physData) {
        physData.userData = 'wall';
        physData.isStatic = true;
        physData.fixtureType = 0;
        var body = makeBody(physData);
        obstacles.push(body);
        return body;
    }

    function qCallbackWrapper(funct, pos, pow) {
        return function(fixture) {
            if (vec.mag(vec.mad(fixture.GetBody().GetPosition(), -1, pos)) < pow) {
                return funct(fixture.GetBody().GetUserData())
            } else {
                return true;
            }
        }
    }
    
    function fixAttachBodies(bodyA, bodyB) {
        j = new Box2D.Dynamics.Joints.b2DistanceJointDef;
        j.Initialize(bodyA, bodyB, bodyA.GetWorldCenter(), bodyB.GetWorldCenter());
        world.CreateJoint(j);
    }
    function queryBox(point, pow, callback) {
        var point = vec.sc(point, 1/_scale),
            qAB = new Box2D.Collision.b2AABB(point),
            area = vec.make(2*pow/_scale);
        qAB.lowerBound = vec.mad(point, -0.5, area);
        qAB.upperBound = vec.mad(point, +0.5, area);
        world.QueryAABB(qCallbackWrapper(callback, point, pow), qAB);
    }
    function clearWorldObstacles() {
        for(var i = 0; i<obstacles.length; i++) {
            destroyBody(obstacles[i])
        }
        obstacles = [];
    }

    function destroyBody(physBody) {
        world.DestroyBody(physBody); 
    }

    function contactListener(className, callback) {
        self.callbacks.ct[className] = callback;
    }

    function solveListener(className, callback) {
        self.callbacks.sl[className] = callback;
    }

    function moveBody(body, vector) {
        body.SetLinearVelocity(vec.sc(vector, 1/_scale));
    }

    function getVelocity(body) {
        return vec.sc(body.GetLinearVelocity(), _scale)
    }

    function pushBody(body, vector) {
        body.ApplyForce(vector, body.GetWorldCenter());
    }

    function getPosition(body) {
        return vec.sc(body.GetPosition(), _scale);
    }
    
    function clearListeners() {
        callbacks = {
            ct: {},
            sl: {},
        };
    }

    return {
        init: init,
        addWorldObstacle: addWorldObstacle,
        clearListeners: clearListeners,
        contactListener: contactListener,
        solveListener: solveListener,
        destroyBody: destroyBody,
        getPosition: getPosition,
        getVelocity: getVelocity,
        moveBody: moveBody,
        update: update,
        makeBody: makeBody,
        applyForce: pushBody,
        clearWorldObstacles: clearWorldObstacles,
        queryBox: queryBox,
        fixAttachBodies: fixAttachBodies,
    }

});
