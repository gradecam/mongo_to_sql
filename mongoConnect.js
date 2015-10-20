/* jshint esnext: true */

var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var bluebird = require('bluebird');

function mongoConnect(URI, opts) {
    var sslOpts = {}, dbOpts = {
        promiseLibrary: bluebird.Promise
    };

    if (opts.mongodb.sslKey) { sslOpts.sslKey = fs.readFileSync(opts.mongodb.sslKey); }
    if (opts.mongodb.sslCert) { sslOpts.sslCert = fs.readFileSync(opts.mongodb.sslCert); }
    if (opts.mongodb.sslCA) {
        sslOpts.sslCA = fs.readFileSync(opts.mongodb.sslCA);
        sslOpts.sslValidate = true;
    }
    if (opts.mongodb.sslPass) { sslOpts.sslPass = opts.mongodb.sslPass; }
    if (Object.keys(sslOpts).length) {
        sslOpts.ssl = true;
    }
    if (opts.mongos) {
        // This is a sharded replicaset
        dbOpts.mongos = sslOpts;
    }

    return MongoClient.connect(URI, dbOpts);
}

module.exports = mongoConnect;
