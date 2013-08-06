var Spooky = require('spooky'),
	_ = require('underscore'),
	util = require('util')

// page validates a single page
function PageValidator(definition) {
	var self = this;
	self.url = definition.uri;
	self.relative = definition.relative;
	self.expectations = definition.expectations;
	self.describer = definition.describer;
	self.tester = definition.tester;
	self.haunted = definition.haunted;
	self.queries = definition.queries || {};
	self.finished = false;
	
	// set up our actions array
	if (definition.actions == undefined) {
		self.actions = [];
	} else {
		self.actions = definition.actions;
	}
	
	// set up our queries
	if (definition.queries == undefined) {
	    self.queries = [];
	} else {
	    self.queries = [];
	    _.each(definition.queries, function(number, queryName) {
	        // replacement on the query
	        query = self.haunted.queries[queryName];
	        _.each(query, function(field, name) {
	            // turn it into a string so we can do templating, then pull it back out
	            field = JSON.stringify(field);
                field = _.template(field)({relative: self.relative});
	            query[name] = JSON.parse(field);
	        });
	        	        
	        self.queries.push({
	           query: query,
	           before: null,
	           after: null,
	           increment: number 
	        });
	    });
	}

	// time out on loading the page
	if (definition.timeout != undefined) {
		self.timeout = definition.timeout;
	} else {
		self.timeout = false;
	}
}

// run the validation on this page
PageValidator.prototype.run = function() {
    var self = this;
        
    self.describer(self, function(done) {
		// disable timeouts. if possible
		if (typeof this.timeout == 'function') {
			this.timeout(0);
		}
		
		// make sure our storage is initiated
		self.haunted.storage.init(function() {
		    // set the initial values for all queries
            _.each(self.queries, function(query) {
              self.haunted.storage.getValue(query.query, function(err, n) {
                  console.log('dsadfw', n);
              });
           });
		    
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
		});
		
		
	}, function(suite) {
		self.checkExpectations();
	});
}

// handle a received request
PageValidator.prototype.receiveResource = function(resource) {
	// only handle when ended
	if (resource.stage != 'end') {
		return;
	}

	_.each(this.expectations, function(expect) {
		if (resource.url.replace(expect.uri, '') != resource.url) {
			expect.occurred++;
		}
	});
}

// check that our expectations match up
// note that this will be called immediately, so we need to declare tests in here
PageValidator.prototype.checkExpectations = function() {
	var self = this;
	_.each(this.expectations, function(expectation) {
		expectation.page = self;
		self.tester(expectation);
	});
}

// finish it up
PageValidator.prototype.finish = function() {
	var self = this;
			
	if (self.finished) {
		return;
	}
	
	// use a 1s timeout in case a couple scripts are still being waited on
	setTimeout(function() {
		self.finisher();
	}, 1000)

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
		// console.log(resource.url);
		self.receiveResource(resource);
	});
	
	self.spooky.on('finished', function() {
		self.finish();
	});
	
	self.spooky.on('console', function(line) {
		console.log(line);
	});

	self.spooky.on('log', function(log) {
		if (log.space === 'remote') {
			console.log(log.message.replace(/ \- .*/, ''));
		}
	});
	
	self.spooky.start();

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