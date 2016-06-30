var APromise = require('../lib/index.js').default;

var promisesAplusTests = require("promises-aplus-tests");

var adapter = {

    resolved: APromise.resolved,

    rejected: APromise.rejected,

    deferred: APromise.deferred

};


var SPEC_TESTER = true

if (SPEC_TESTER) {
    promisesAplusTests(adapter, function (err) {
        // All done; output is in the console. Or check `err` for number of failures.
        if (err) {
            console.log(err)
        }
        else {
            console.log('success')
        }
    })
}

else {

    var dummy = {dummy: 'dummy'}
    var resolved = adapter.resolved
    var rejected = adapter.rejected
    var adapter = adapter
    
    var promise = resolved(dummy).then(value => {

        console.log('1', value)

        return resolved({
            then: onFulfilled => onFulfilled(2333)
        })

    })

    promise.then(value => {
        console.log(2, value)
    })
}
