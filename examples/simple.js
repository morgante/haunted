var Haunted = require('../lib/haunted'),
    util    = require('util')

var definition = require('./definition.json');

// initiate a test runner on our definition
haunted = new Haunted(
	// pass in the definition, as an object
	definition,
	
	// the describer function, which should get your ready to run tests (ex. by starting a test suite)
	function(page, setup, suite) {
    	setup(function() {
    		suite(this);
    	});
    },
	
	// the tester function, which actually tests a certain expectation
	function(expectation) {
    	if (expectation.occurred != expectation.expected) {
    		console.log(util.format('%s expected %d, received %d on %s', expectation.name, expectation.expected, expectation.occurred, expectation.page.url));
    	} else {
    		console.log(util.format('passed %s on %s', expectation.name, expectation.page.url));
    	}
    }
);

haunted.run();