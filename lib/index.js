'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _util = require('./util');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// save APromise private variables
var PRIVATE = Symbol('private variables');

var STATUS_PENDING = Symbol('pending');

var STATUS_FULFILLED = Symbol('fulfilled');

var STATUS_REJECTED = Symbol('rejected');

var NOOP = function NOOP() {};

/**
 * generate fulfill method.
 * when fulfill method called, the promise status turn to fulfilled,
 * and execute onFulfilled callbacks when next tick
 */
var getFulfill = function getFulfill(aPromise) {

    var privates = aPromise[PRIVATE];

    if (privates.status !== STATUS_PENDING) {
        return NOOP;
    }

    return function (value) {
        privates.status = STATUS_FULFILLED;
        privates.value = value;
        (0, _util.nextTick)(executeContextQueue(aPromise));
    };
};

/**
 * generate reject method.
 * when reject method called, the promise status turn to rejected,
 * and execute onRejected callbacks when next tick
 */
var getReject = function getReject(aPromise) {

    var privates = aPromise[PRIVATE];

    if (privates.status !== STATUS_PENDING) {
        return NOOP;
    }

    return function (reason) {
        privates.status = STATUS_REJECTED;
        privates.reason = reason;
        (0, _util.nextTick)(executeContextQueue(aPromise));
    };
};

/**
 * promise A+ spec 2.3: The Promise Resolution Procedure
 */
var resolve = function resolve(aPromise, x) {

    // promise A+ spec 2.3.1:
    // if promise and x refer to the same object,
    // reject promise with a TypeError as the reason
    if (aPromise === x) {
        getReject(aPromise)(new TypeError('the returned value cannot be the same with current promise'));
    }
    // promise A+ spec 2.3.2:
    // If x is a promise, adopt its state
    else if (x instanceof APromise) {
            var privates = x[PRIVATE];

            // If x is pending, promise must remain pending until x is fulfilled or rejected.
            if (privates.status === STATUS_PENDING) {
                x.then(getFulfill(aPromise), getReject(aPromise));
            }
            // If/when x is fulfilled, fulfill promise with the same value.
            else if (privates.status === STATUS_FULFILLED) {
                    getFulfill(aPromise)(privates.value);
                }
                // If/when x is rejected, reject promise with the same reason.
                else if (privates.status === STATUS_REJECTED) {
                        getReject(aPromise)(privates.reason);
                    }
        }
        // promise A+ spec 2.3.3:
        // Otherwise, if x is an object or function
        else if (x !== null && (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object' || (0, _util.isFunction)(x)) {
                var then = void 0;
                try {
                    then = x.then;
                }
                // If retrieving the property x.then results in a thrown exception e,
                // reject promise with e as the reason.
                catch (ex) {
                    return getReject(aPromise)(ex);
                }
                // If then is a function, call it with x as this,
                // first argument resolvePromise, and second argument rejectPromise, where:
                if ((0, _util.isFunction)(then)) {

                    // If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).
                    var resolvePromise = function resolvePromise(y) {
                        // if (y !== undefined) {
                        resolve(aPromise, y);
                        // }
                    };
                    // If/when rejectPromise is called with a reason r, reject promise with r.
                    var rejectPromise = function rejectPromise(r) {
                        getReject(aPromise)(r);
                    };
                    // If both resolvePromise and rejectPromise are called,
                    // or multiple calls to the same argument are made,
                    // the first call takes precedence, and any further calls are ignored.
                    var onceCallArray = (0, _util.ensureOnceCalled)(resolvePromise, rejectPromise);

                    try {
                        then.call(x, onceCallArray[0], onceCallArray[1]);
                    }
                    // If calling then throws an exception e,
                    catch (ex) {
                        // If resolvePromise or rejectPromise have been called, ignore it.
                        // Otherwise, reject promise with e as the reason.
                        if (!onceCallArray.isCalled) {
                            getReject(aPromise)(ex);
                        }
                    }
                }
                // If then is not a function, fulfill promise with x.
                else {
                        getFulfill(aPromise)(x);
                    }
            }
            // If x is not an object or function, fulfill promise with x.
            else {
                    getFulfill(aPromise)(x);
                }
};

/**
 * execute onFulfilled or onRejected callbacks according to promise status
 */
var executeContextQueue = function executeContextQueue(aPromise) {

    var privates = aPromise[PRIVATE];

    return function () {
        var status = privates.status;
        var value = privates.value;
        var reason = privates.reason;
        var thenContextQueue = privates.thenContextQueue;


        console.log('src-148:len:', thenContextQueue.length);

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = thenContextQueue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var context = _step.value;
                var onFulfilled = context.onFulfilled;
                var onRejected = context.onRejected;
                var returnedPromise = context.returnedPromise;

                var x = void 0;

                if (status === STATUS_FULFILLED) {
                    if (onFulfilled) {
                        try {
                            // promise A+ spec 2.2.7.1:
                            // If either onFulfilled or onRejected returns a value x,
                            // run the Promise Resolution Procedure [[Resolve]](promise2, x).
                            if ((x = onFulfilled(value)) !== undefined) {
                                resolve(returnedPromise, x);
                            }
                        } catch (ex) {
                            // promise A+ spec 2.2.7.2:
                            // If either onFulfilled or onRejected throws an exception e,
                            // promise2 must be rejected with e as the reason.
                            getReject(returnedPromise)(ex);
                        }
                    } else {
                        // promise A+ spec 2.2.7.3:
                        // If onFulfilled is not a function and promise1 is fulfilled,
                        // promise2 must be fulfilled with the same value as promise1.
                        getFulfill(returnedPromise)(value);
                    }
                } else if (status === STATUS_REJECTED) {
                    if (onRejected) {
                        try {
                            if ((x = onRejected(reason)) !== undefined) {
                                resolve(returnedPromise, x);
                            }
                        } catch (ex) {
                            getReject(returnedPromise)(ex);
                        }
                    } else {
                        // promise A+ spec 2.2.7.4:
                        // If onRejected is not a function and promise1 is rejected,
                        // promise2 must be rejected with the same reason as promise1.
                        getReject(returnedPromise)(reason);
                    }
                }
            }

            // reset thenContextQueue
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        privates.thenContextQueue = [];
    };
};

var APromise = function () {
    function APromise(resolver) {
        _classCallCheck(this, APromise);

        if (!(0, _util.isFunction)(resolver)) {
            throw new Error('APromise resolver must be a function');
        }

        this[PRIVATE] = {
            // save current status of promise
            status: STATUS_PENDING,
            // save the value when promise is fulfilled
            value: undefined,
            // save the exception when promise is rejected
            reason: undefined,
            // save the context when the then method is called,
            // a context is a object like {onFulfilled, onRejected, returnedPromise}
            thenContextQueue: []
        };

        resolver(getFulfill(this), getReject(this));
    }

    _createClass(APromise, [{
        key: 'then',
        value: function then(onFulfilled, onRejected) {
            var privates = this[PRIVATE];
            var isValidOnFulfilled = (0, _util.isFunction)(onFulfilled);
            var isValidOnRejected = (0, _util.isFunction)(onRejected);
            var context = {};
            // promise A+ spec 2.2.7:
            // then must return a promise
            var returnedPromise = new APromise(function () {});

            // promise A+ spec 2.2.6:
            // If/when promise is fulfilled(rejected),
            // all respective onFulfilled(onRejected) callbacks must execute
            // in the order of their originating calls to then
            if (privates.status !== STATUS_PENDING) {
                (0, _util.nextTick)(executeContextQueue(this));
            }

            // save the context for next tick usage
            context.onFulfilled = isValidOnFulfilled && onFulfilled;
            context.onRejected = isValidOnRejected && onRejected;
            context.returnedPromise = returnedPromise;
            privates.thenContextQueue.push(context);
            return returnedPromise;
        }

        /**
         * @TODO
         * implement some handy method that do not belong to the promise A+ spec
         * catch (ex) {}
         * finally () {}
         * static when (aPromiseArray, callback) {}
         * static race (aPromiseArray, callback) {}
         */

        /**
         * quickly get a resolved promise
         */

    }], [{
        key: 'resolved',
        value: function resolved(value) {
            return new APromise(function (fulfill) {
                return fulfill(value);
            });
        }

        /**
         * quickly get a rejected promise
         */

    }, {
        key: 'rejected',
        value: function rejected(reason) {
            return new APromise(function (fulfill, reject) {
                return reject(reason);
            });
        }
    }, {
        key: 'deferred',
        value: function deferred() {
            var promise = new APromise(function () {});
            return {
                promise: promise,
                resolve: function resolve(value) {
                    getFulfill(promise)(value);
                },
                reject: function reject(reason) {
                    getReject(promise)(reason);
                }
            };
        }
    }]);

    return APromise;
}();

exports.default = APromise;