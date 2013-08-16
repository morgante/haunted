var Spooky = require('spooky'),
	_ = require('underscore'),
	util = require('util'),
	async = require('async')

// page validates a single page
function PageValidator(definition) {
	var self = this;
	self.definition = definition;
	self.url = definition.uri;
	self.relative = definition.relative;
	self.expectations = definition.expectations;
	self.tests = {}; // contains the tests to be run
 	self.describer = definition.describer;
	self.tester = definition.tester;
	self.haunted = definition.haunted;
	self.queries = definition.queries || {};
	self.authentication = definition.authentication;
	self.finished = false;
	self.wait = self.haunted.definition.wait || 0;
	
	// set up our actions array
	if (self.definition.actions == undefined) {
		self.actions = [];
	} else {
		self.actions = definition.actions;
	}
}

// run the validation on this page
PageValidator.prototype.run = function() {
    var self = this;
	
	// certain replacement values
	var strReplacements = {
	    relative: self.relative,
	    time: '<%= time %>',
	    hour: '<%= hour %>',
	    day: '<%= day %>',
	    month: '<%= day %>',
	    fiveMin: '<%= fiveMin %>'
	}
	
	var now 		= new Date;
	var nowHour		= new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
	var nowDay		= new Date(now.getFullYear(), now.getMonth(), now.getDate());
	var nowMonth	= new Date(now.getFullYear(), now.getMonth(), now.getDate());
	
	var roundFive	= 1000 * 60 * 5; // round to five minutes
	var nowFive = new Date(Math.floor(now.getTime() / roundFive) * roundFive);
	
	var objReplacements = {
	    '<%= time %>': now,
	    '<%= hour %>': nowHour,
	    '<%= day %>': nowDay,
	    '<%= month %>': nowMonth,
	    '<%= fiveMin %>': nowFive
	}
	
	// set up our queries
	if (self.definition.queries == undefined || self.haunted.storage == undefined) {
	    self.queries = [];
	} else {
	    self.queries = [];
	    _.each(self.definition.queries, function(number, queryName) {
	        // replacement on the query
	        query = _.clone(self.haunted.queries[queryName]);
	        _.each(query, function(field, name) {
	            // turn it into a string so we can do templating, then pull it back out
	            field = JSON.stringify(field);
                field = _.template(field)(strReplacements);
	            field = JSON.parse(field);
	            
	            // additional parsing for non-string properties
	            if (typeof field == 'object') {
	                _.each(field, function(attr, key) {
	                    if (objReplacements[attr] != undefined) {
	                        field[key] = objReplacements[attr];
	                    }
    	            });
	            }
	            
	            query[name] = field;
	        });
	        	        
	        // add the test as well
            var test = {
                'page': self,
                'name': queryName,
                'expected': number,
                'occurred': null
            }
            self.tests[queryName] = test;
	             
	        self.queries.push({
                test: test,
                query: query,
                field: self.haunted.queries[queryName].field,
                before: null,
                after: null,
                increment: number 
	        });
	    });
	}
	
	// build the tests list
    _.each(self.expectations, function(expectation) {
        expectation.test = {
            'page': self,
            'name': expectation.uri,
            'expected': expectation.expected,
            'occurred': expectation.occurred
        }
        self.tests[expectation.uri] = expectation.test;
    });
		
	// time out on loading the page
	if (self.definition.timeout != undefined) {
		self.timeout = self.definition.timeout;
	} else {
		self.timeout = false;
	}
	    
    self.describer(self, function(done) {           
        // disable timeouts. if possible
        if (typeof this.timeout == 'function') {
            this.timeout(0);
        }        
                        
        // if we have storage, we need to start it
        if (self.haunted.storage != undefined) {
            // make sure our storage is initiated
            self.haunted.storage.init(function() {
                // set the initial values for all queries
                async.forEach(self.queries, function(query, done) {
                    self.haunted.storage.getValue(query.query, function(err, n) {
                        query.before = n;
                        query.test.expected += n; // increase expectation by existing value
                        done(err);
                    });
                }, function() {
                    self.spookyCreate(done);
                });
            });
        } else {
            // skip straight to making spooky
            self.spookyCreate(done);
        }

    }, function(suite) {
        self.checkExpectations();
    });
}

// create our spooky instanc
PageValidator.prototype.spookyCreate = function(done) {
    var self = this;
    
    self.spooky = new Spooky({
        casper: {
            logLevel: 'error',
            verbose: false
        }
    }, function(err) {
        self.finisher = done;

        self.spookySetup(err);
        self.spooky.run();
    });
}


// handle a received request
PageValidator.prototype.receiveResource = function(resource) {
    var self = this;
    
	// only handle when ended
	if (resource.stage != 'end') {
		return;
	}
	
	_.each(this.expectations, function(expect) {
		if (resource.url.replace(expect.uri, '') != resource.url) {
		    expect.test.occurred++;
			expect.occurred++;
		    
		}
	});
}

// check that our expectations match up
// note that this will be called immediately, so we need to declare tests in here
PageValidator.prototype.checkExpectations = function() {
    var self = this;
        
	_.each(this.tests, function(test) {	  
		self.tester(test);
	});
}

// finish it up
PageValidator.prototype.finish = function() {
	var self = this;
			
	if (self.finished) {
		return;
	}
		
	if (self.queries.length > 0) {
	    // use a timeout in case a couple scripts are still being waited on
    	setTimeout(function() {

    	    // set the final values for all queries
            async.forEach(self.queries, function(query, done) {
                self.haunted.storage.getValue(query.query, function(err, n) {
                    query.after = n;
                    query.test.occurred = n;
                    done(err);
                });
            }, function() {
        		self.finisher();
            });

    	}, self.wait)
	} else {
	    self.finisher();
	}
	
	self.finished = true;	
}

// set up our spooky instance properly (this is a callback for Spooky)
PageValidator.prototype.spookySetup = function(err) {
	var self = this;

	if (err) {
		e = new Error('Failed to initialize SpookyJS');
		e.details = err;
		throw e;
	}

	self.spooky.on('error', function(e) {
		console.error(e);
	});

	self.spooky.on('resource.received', function(resource) {
		self.receiveResource(resource);
	});
	
	self.spooky.on('finished', function() {
		self.finish();
	});
	
	self.spooky.on('console', function(line) {
        // console.log(line);
	});

	self.spooky.on('log', function(log) {
		if (log.space === 'remote') {
            // console.log(log.message.replace(/ \- .*/, ''));
		}
	});
		
	self.spooky.start();
	
	// authentication, if necessary
	if (self.authentication) {
	    self.spooky.then([{
			username: self.authentication.username,
			password: self.authentication.password
		}, function () {
			this.setHttpAuth(username, password);
		}]);
	}

	self.spooky.open(self.url);
	
	// append actions if necessary
	_.each(self.actions, function(action) {
		if(action.click != undefined) {
			self.spooky.then([{
				target: action.click
			}, function () {
				this.click(target);
			}]);
		}
	});
	
	self.spooky.then(function() {
		// emit an event from Casper context to Spooky
		this.emit('finished');
	});
	
	// if we have a timeout, finish then
	if (self.timeout) {
		setTimeout(function() {
			self.finish();
		}, self.timeout);
	}
	
}

module.exports = PageValidator;