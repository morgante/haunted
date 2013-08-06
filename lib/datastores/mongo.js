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
    }
    
    MongoClient.connect(self.connection, function(err, db) {
        if(err) throw err;
        
        self.db = db;
        
        done();
    });
}

// given a query, apply the query
MongoHouse.prototype.getValue = function(query, callback) {
    
    this.db.collection(query.collection).find(query.query, {limit: 1, sort: query.sort}, function(err, document) {
        console.log(document);
    });
    
    console.log(query.query);
}

module.exports = MongoHouse;