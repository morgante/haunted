var Haunted = require('../lib/haunted'),
    util    = require('util')

var definition = require('./definition.json');

// initiate a test runner on our definition
haunted = new Haunted(
	// pass in the definition, as an object
	definition,
	
	// the describer function, which should create a new test suite
	function(page, setup, suite) {
		describe(util.format('Analytics calls on %s:', page.url), function() {
			before(setup);
			suite(this);
		});
	},
	
	// the tester function, which actually tests a certain expectation
	function(expectation) {
		it(expectation.uri, function() {
			expectation.expected.should.equal(expectation.occurred);
		});
	}
);

haunted.run();