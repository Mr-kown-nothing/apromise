import {isFunction, ensureOnceCalled, nextTick} from './util'

// save APromise private variables
const PRIVATE = Symbol('private variables')

const STATUS_PENDING = Symbol('pending')

const STATUS_FULFILLED = Symbol('fulfilled')

const STATUS_REJECTED = Symbol('rejected')

const NOOP = () => {}

/**
 * generate fulfill method.
 * when fulfill method called, the promise status turn to fulfilled,
 * and execute onFulfilled callbacks when next tick
 */
const getFulfill = aPromise => {

    let privates = aPromise[PRIVATE]

    if (privates.status !== STATUS_PENDING) {
        return NOOP
    }

    return value => {
        privates.status = STATUS_FULFILLED
        privates.value = value
        nextTick(executeContextQueue(aPromise))
    }
}

/**
 * generate reject method.
 * when reject method called, the promise status turn to rejected,
 * and execute onRejected callbacks when next tick
 */
const getReject = (aPromise) => {

    let privates = aPromise[PRIVATE]

    if (privates.status !== STATUS_PENDING) {
        return NOOP
    }

    return (reason) => {
        privates.status = STATUS_REJECTED
        privates.reason = reason
        nextTick(executeContextQueue(aPromise))
    }
}

/**
 * promise A+ spec 2.3: The Promise Resolution Procedure
 */
const resolve = (aPromise, x) => {

    // promise A+ spec 2.3.1:
    // if promise and x refer to the same object,
    // reject promise with a TypeError as the reason
    if (aPromise === x) {
        getReject(aPromise)(new TypeError('the returned value cannot be the same with current promise'))
    }
    // promise A+ spec 2.3.2:
    // If x is a promise, adopt its state
    else if (x instanceof APromise) {
        let privates = x[PRIVATE]

        // If x is pending, promise must remain pending until x is fulfilled or rejected.
        if (privates.status === STATUS_PENDING) {
            x.then(getFulfill(aPromise), getReject(aPromise))
        }
        // If/when x is fulfilled, fulfill promise with the same value.
        else if (privates.status === STATUS_FULFILLED) {
            getFulfill(aPromise)(privates.value)
        }
        // If/when x is rejected, reject promise with the same reason.
        else if (privates.status === STATUS_REJECTED) {
            getReject(aPromise)(privates.reason)
        }
    }
    // promise A+ spec 2.3.3:
    // Otherwise, if x is an object or function
    else if ((x !== null && typeof x === 'object') || isFunction(x)) {
        let then
        try {
            then = x.then
        }
        // If retrieving the property x.then results in a thrown exception e,
        // reject promise with e as the reason.
        catch (ex) {
            return getReject(aPromise)(ex)
        }
        // If then is a function, call it with x as this,
        // first argument resolvePromise, and second argument rejectPromise, where:
        if (isFunction(then)) {

            // If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).
            let resolvePromise = (y) => {
                // if (y !== undefined) {
                    resolve(aPromise, y)
                // }
            }
            // If/when rejectPromise is called with a reason r, reject promise with r.
            let rejectPromise = (r) => {
                getReject(aPromise)(r)
            }
            // If both resolvePromise and rejectPromise are called,
            // or multiple calls to the same argument are made,
            // the first call takes precedence, and any further calls are ignored.
            let onceCallArray = ensureOnceCalled(resolvePromise, rejectPromise)

            try {
                then.call(x, onceCallArray[0], onceCallArray[1])
            }
            // If calling then throws an exception e,
            catch (ex) {
                // If resolvePromise or rejectPromise have been called, ignore it.
                // Otherwise, reject promise with e as the reason.
                if (!onceCallArray.isCalled) {
                    getReject(aPromise)(ex)
                }
            }
        }
        // If then is not a function, fulfill promise with x.
        else {
            getFulfill(aPromise)(x)
        }
    }
    // If x is not an object or function, fulfill promise with x.
    else {
        getFulfill(aPromise)(x)
    }
}

/**
 * execute onFulfilled or onRejected callbacks according to promise status
 */
const executeContextQueue = (aPromise) => {

    let privates = aPromise[PRIVATE]

    return () => {

        let {status, value, reason, thenContextQueue} = privates

        console.log('src-148:len:', thenContextQueue.length)

        for (let context of thenContextQueue) {

            let {onFulfilled, onRejected, returnedPromise} = context
            let x

            if (status === STATUS_FULFILLED) {
                if (onFulfilled) {
                    try {
                        // promise A+ spec 2.2.7.1:
                        // If either onFulfilled or onRejected returns a value x,
                        // run the Promise Resolution Procedure [[Resolve]](promise2, x).
                        if ((x = onFulfilled(value)) !== undefined) {
                            resolve(returnedPromise, x)
                        }
                    }
                    catch (ex) {
                        // promise A+ spec 2.2.7.2:
                        // If either onFulfilled or onRejected throws an exception e,
                        // promise2 must be rejected with e as the reason.
                        getReject(returnedPromise)(ex)
                    }
                }
                else {
                    // promise A+ spec 2.2.7.3:
                    // If onFulfilled is not a function and promise1 is fulfilled,
                    // promise2 must be fulfilled with the same value as promise1.
                    getFulfill(returnedPromise)(value)
                }
            }

            else if (status === STATUS_REJECTED) {
                if (onRejected) {
                    try {
                        if ((x = onRejected(reason)) !== undefined) {
                            resolve(returnedPromise, x)
                        }
                    }
                    catch (ex) {
                        getReject(returnedPromise)(ex)
                    }
                }
                else {
                    // promise A+ spec 2.2.7.4:
                    // If onRejected is not a function and promise1 is rejected,
                    // promise2 must be rejected with the same reason as promise1.
                    getReject(returnedPromise)(reason)
                }
            }
        }

        // reset thenContextQueue
        privates.thenContextQueue = []
    }
}

export default class APromise {

    constructor (resolver) {

        if (!isFunction(resolver)) {
            throw new Error('APromise resolver must be a function')
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
            thenContextQueue: [],
        }

        resolver(getFulfill(this), getReject(this))
    }

    then (onFulfilled, onRejected) {
        let privates = this[PRIVATE]
        let isValidOnFulfilled = isFunction(onFulfilled)
        let isValidOnRejected = isFunction(onRejected)
        let context = {}
        // promise A+ spec 2.2.7:
        // then must return a promise
        let returnedPromise = new APromise(() => {})

        // promise A+ spec 2.2.6:
        // If/when promise is fulfilled(rejected),
        // all respective onFulfilled(onRejected) callbacks must execute
        // in the order of their originating calls to then
        if (privates.status !== STATUS_PENDING) {
            nextTick(executeContextQueue(this))
        }

        // save the context for next tick usage
        context.onFulfilled = isValidOnFulfilled && onFulfilled
        context.onRejected = isValidOnRejected && onRejected
        context.returnedPromise = returnedPromise
        privates.thenContextQueue.push(context)
        return returnedPromise
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
    static resolved (value) {
        return new APromise(fulfill => fulfill(value))
    }

    /**
     * quickly get a rejected promise
     */
    static rejected (reason) {
        return new APromise((fulfill, reject) => reject(reason))
    }

    static deferred () {
        let promise = new APromise(() => {})
        return {
            promise,
            resolve (value) {
                getFulfill(promise)(value)
            },
            reject (reason) {
                getReject(promise)(reason)
            }
        }
    }
}