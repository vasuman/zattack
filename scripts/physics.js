//GLOABL CONSTANTS DEFINED HERE !!!
var _scale=30;
var _gravity=0;
var _fps=120;

// Insert Box2D shorthands here!!
var Vec2 = Box2D.Common.Math.b2Vec2;
var Body = Box2D.Dynamics.b2Body;
var Shapes = Box2D.Collision.Shapes;

var physicsEngine = (function () {
    world = new Box2D.Dynamics.b2World(new Vec2(0, _gravity), false);
    function update() {
        world.Step(1/_fps, 10, 10);
        world.ClearForces();
    };
    var ctListen = new Box2D.Dynamics.b2ContactListener();
    ctListen.PostSolve = function (contact, impulse) {
        var bodyA = contact.GetFixtureA().GetBody(),
            bodyB = contact.GetFixtureB().GetBody(),
            udA = bodyA.GetUserData(),
            udB = bodyB.GetUserData();
        if (udA['class'] in physicsEngine.ctCallbacks) {
            physicsEngine.ctCallbacks[udA['class']](udA, udB, impulse);
        }
        if (udB['class'] in physicsEngine.ctCallbacks) {
            physicsEngine.ctCallbacks[udB['class']](udB, udA, impulse);
        }
    };
    world.SetContactListener(ctListen);
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
    function destroyBody(physBody) {
        world.DestroyBody(physBody); 
    };
    function solveListener(className, callback) {
        this.ctCallbacks[className] = callback;
    };
    function refreshWorld() {
        //TODO add code
        // delete world;
        world = new Box2D.Dynamics.b2World(new Vec2(0, _gravity), false);
        world.SetContactListener(ctListen);
        this.ctCallbacks = {};
    };
    function queryAggregateVector(obj, qClass, attract, repulse, maxMagn, food, predator) {
        var objCenter = obj.GetPosition(),
            colAB = new Box2D.Collision.b2AABB,
            agVec = new Vec2,
            vVec = new Vec2,
            sepVec = new Vec2,
            fVec = new Vec2,
            pVec = new Vec2,
            numA = 0,
            numV = 0,
            numF = 0,
            numP = 0,
            range = {x:attract/_scale, y:attract/_scale};
        colAB.upperBound = vMath.multAdd(objCenter, 1, range);
        colAB.lowerBound = vMath.multAdd(objCenter, -1, range);
        function queryCallback(fixture) {
            var body = fixture.GetBody(),
                oClass = body.GetUserData()['class'],
                dVec = vMath.multAdd(body.GetPosition(), -1, objCenter),
                distance = vMath.magnitude(dVec);
            if (body != obj && oClass == qClass) {
                if (distance < attract/_scale) {
                    if( distance < repulse/_scale ) {
                        sepVec.Add(vMath.magnify(vMath.invert(dVec), -1));
                        numA+=1;
                    } else {
                        agVec.Add(dVec);
                    }
                    vVec.Add(vMath.multAdd(body.GetLinearVelocity(), -1, obj.GetLinearVelocity()));
                    numV+=1;
                }
            }
            else if (distance < attract/_scale && oClass == food) {
                    fVec.Add(dVec);
                    numF+=1;
            }
            else if (distance < repulse/_scale && oClass == predator) {
                    pVec.Add(vMath.magnify(vMath.invert(dVec), -1));
                    numP+=1;
            }
            return true;
        }
        world.QueryAABB(queryCallback, colAB);
        if(numA) {
            sepVec.Multiply(1/numA);
            sepVec = vMath.limit(sepVec, maxMagn);
        }
        if (numF) {
            fVec.Multiply(1/numF);
            fVec = vMath.limit(fVec, maxMagn);
            fVec.Multiply(3);
            fVec = vMath.assure(fVec, maxMagn/2);
        }
        if (numP) {
            pVec.Multiply(1/numP);
            pVec = vMath.limit(pVec, maxMagn);
        }
        if (numV) {
            vVec.Multiply(1/numV);
            vVec = vMath.limit(vVec, maxMagn);
        }
        if (numV != numA) {
            agVec.Multiply(1/(numV-numA));
            agVec = vMath.limit(agVec, maxMagn);
        }
        return [agVec, vVec, sepVec, fVec, pVec];
    } 
    return {
        ctCallbacks: {},
        solveListener: solveListener,
        refreshWorld: refreshWorld,
        destroyBody: destroyBody,
        update: update,
        makeBody: makeBody,
        queryAggregateVector: queryAggregateVector
    };
})();
