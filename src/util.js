const toString = Object.prototype.toString

export const isFunction = (obj) => obj && toString.call(obj) === '[object Function]'

/**
 * ensure the function be called only once
 * if more than one functions passed in, only the first function will be called once
 */
export const ensureOnceCalled = (...args) => {

    let isCalled = false
    let ret = []

    let wrapper = func => (...params) => {
        if (isCalled) {
            return false
        }
        ret.isCalled = isCalled = true
        func.apply(null, params)
    }

    ret = args.map(func => {
        return wrapper(func)
    })
    
    return ret
}

/**
 * simulate nextTick in browser environment
 * */
export const nextTick = (() => {

    if (process && process.nextTick) {
        return (fn) => process.nextTick(fn)
    }

    let canPost = typeof window !== 'undefined' && window.postMessage && window.addEventListener

    if (canPost) {
        let queue = []

        window.addEventListener('message', (event) => {
            let source = event.source
            if ((source === window || source == null) && event.data === 'process-tick') {
                ev.stopPropagation()
                if (queue.length > 0) {
                    let fn = queue.shift()
                    fn()
                }
            }
        }, true)

        return (fn) => {
            queue.push(fn)
            window.postMessage('process-tick', '*')
        }
    }
    else {
        return (fn) => setTimeout(fn, 0)
    }

})()

export default {isFunction, ensureOnceCalled, nextTick}