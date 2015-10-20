/* jshint esnext: true */

global.Promise = require('bluebird').Promise;

var mongoConnect = require('./mongoConnect');
var co = require('co');

var cloneMongoDb;
var activeCursor = null;

function cleanup() {
    if (activeCursor) {
        console.log("Closing active cursors...");
        activeCursor.close();
    }
    if (cloneMongoDb) {
        console.log("Closing database connection...");
        cloneMongoDb.close();
    }

    process.exit(1);
}

process.on('SIGINT', cleanup);

function runProcess(config) { co(function*() {
    'use strict';
    if (!config) {
        throw new Error("No config found");
    } else if (!config.mongodb) {
        throw new Error("No mongodb config found");
    }

    // Connect to mongo
    var db = yield mongoConnect(config.mongodb.server, {
        mongodb: config.mongodb,
        mongos: !!Object.keys(config.mongodb.shards).length
    });
    cloneMongoDb = db;

    if (!config.databases[db.databaseName]) {
        throw new Error("No configuration found for database " + db.databaseName);
    }
    var dbConfig = config.databases[db.databaseName];

    for (let c in dbConfig.collections) {
        let cfg = dbConfig.collections[c];
        let collection = db.collection(c);

        // Find out how much there is to do
        let total = yield collection.find({}).count(true);

        // Fetch all items in the collection, but stream it one at a time
        let cursor = collection.find({})
            .batchSize(100)
            .snapshot(true)
            .addCursorFlag('noCursorTimeout', true)
            .comment('initial fetch for mongo_to_sql');

        activeCursor = cursor;
        let count = 0;
        let batch = [];
        let statusText = "Cloning " + c + ": ";
        process.stdout.write(statusText + "0");
        while (yield cursor.hasNext()) {
            ++count;
            let n = yield cursor.next();
            batch.push(n);
            if (batch.length >= 100) {
                // process batch
                batch = [];
                process.stdout.cursorTo(statusText.length);
                process.stdout.write(count+" / " + total +
                                     " (" + (Math.round(count/total * 1000)/10).toFixed(1) + "%)");
            }
        }
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log("Cloned", count, c);
        cursor.close();
        activeCursor = null;
    }

}).catch(err => {
    console.warn("Error processing: ", err, err.stack);
}).finally(() => {
    cleanup();
}); }


module.exports = {
    run: runProcess
};
