var MongoClient = require('mongodb').MongoClient

function MongoHouse(storageSettings) {
    this.connection = storageSettings;
    this.db = null;
}

// init the database
MongoHouse.prototype.init = function(done) {
    var self = this;

    if (self.db != null) {
        done();
        return;
    }
        
    MongoClient.connect(self.connection, function(err, db) {
        if (err) throw err;

        self.db = db;

        done();
    });
}

// given a query, apply the query
MongoHouse.prototype.getValue = function(query, callback) {
    
    var projection = {};
    projection[query.field] = 1;

    this.db.collection(query.collection).find(query.query, projection, {
        limit: 1,
        sort: query.sort
    }, function(err, cursor) {
        if (err) {
            callback(err, null);
        } else {
            // Fetch the first object off the cursor
            cursor.nextObject(function(err, item) {
                if (err) {
                    console.log( err );
                    callback(err, null);
                } else {
                    if (item == null) {
                        // a nonexistent value should be interpreted as a count of 0
                        callback(null, 0);
                    } else {
                        callback(null, item[query.field]);
                    }
                }
            });
        }
    });
}

module.exports = MongoHouse;