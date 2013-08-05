var Spooky = require('spooky'),
	_ = require('underscore'),
	util = require('util')

	var Page = require('./page')

function Haunted(definition, describer, tester) {
	var self = this;
	this.definition = definition;
	this.base = definition.base;
	this.pages = [];

	_.each(definition.pages, function(page) {
		self.buildPage(page, describer, tester);
	});
}

// run the actual test
Haunted.prototype.run = function() {
    _.each(this.pages, function(page) {
        page.run();
    });
}

// build a page from its definition and add into pages
Haunted.prototype.buildPage = function(def, describer, tester) {
	var self = this;

	var expectations = {};

	_.each(def.sets, function(set) {
		_.each(self.definition.sets[set], function(uri) {
			// create the expectation if it doesn't exist yet
			if (expectations[uri] == undefined) {
				expectations[uri] = {
					'uri': uri,
					'expected': 0,
					'occurred': 0
				}
			}
			// increment the expectation
			expectations[uri].expected++;
		});
	});
	
	var actions = def.actions;

	self.pages.push(new Page({
		'url': this.base + def.uri,
		'timeout': def.timeout,
		'expectations': expectations,
		'actions': actions,
		'describer': describer,
		'tester': tester
	}));
}

module.exports = Haunted;