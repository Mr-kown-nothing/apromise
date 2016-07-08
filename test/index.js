var APromise = require('../lib/index.js').default
var promisesAplusTests = require('promises-aplus-tests')
var adapter = {
    resolved: APromise.resolved,
    rejected: APromise.rejected,
    deferred: APromise.deferred
}

promisesAplusTests(adapter, function (err) {
    // All done; output is in the console. Or check `err` for number of failures.
    if (err) {
        console.log(err)
    }
    else {
        console.log('success')
    }
})
