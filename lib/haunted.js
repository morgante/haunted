var Spooky = require('spooky'),
	_ = require('underscore'),
	util = require('util')

var Page = require('./page')

function Haunted(definition, describer, tester) {
	var self = this;
	this.definition = definition;
	this.base = definition.base;
	this.pages = [];
	this.queries = definition.queries || {};
	
	// attach our built-in datastores
	this.MongoHouse = require('./datastores/mongo');
	
	_.each(definition.pages, function(page) {
		self.buildPage(page, describer, tester);
	});
	
	// by default, use the always-passing storage
	this._storage = null;
}

// set the datastroe
Haunted.prototype.setStorage = function(storage) {
    this._storage = storage;
}

// run the actual test
Haunted.prototype.run = function() {
    var self = this;
    
    // actually init the datastore, if we have one set
    if (this._storage != null) {
        this.storage = new this._storage(this.definition.storage, function() {
        });
    }
            
    _.each(self.pages, function(page) {
        page.run();
    });
}

// build a page from its definition and add into pages
Haunted.prototype.buildPage = function(def, describer, tester) {
	var self = this;

	var expectations = {};

	_.each(def.sets, function(multiplier, set) {
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
			expectations[uri].expected += multiplier;
		});
	});
	
	var actions = def.actions;

	self.pages.push(new Page({
		'uri': this.base + def.uri,
		'relative': def.uri, 
		'timeout': def.timeout,
		'expectations': expectations,
		'actions': actions,
		'describer': describer,
		'tester': tester,
		'haunted': self,
		'queries': def.queries,
		'authentication': self.definition.authentication
	}));
}

module.exports = Haunted;