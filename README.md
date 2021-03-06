# Haunted

This is node application for executing and validating analytic events.

## Installation

### Prerequisites

* [Node.js](http://nodejs.org) >= 0.8
* [PhantomJS](http://phantomjs.org/) >= 1.9
* [CasperJS](http://casperjs.org/) >= 1.0

Haunted is available from npm.

``` shell
$ npm install haunted
```

## Usage
To use Haunted, just instantiate a new Haunted object, passing it a definition, suite describer, and suite tester, and call run().

``` javascript
Haunted = require('haunted');
haunted = new Haunted(definition, describer, tester);
haunted.run();
```

### definition
The definition argument should be an object configuring your analytics definition, see [configuration](#configuration).

### describer(page, setup, suite)
The describer argument should be a function which, when called, creates a test suite for a particular page. It is passed 3 arguments:
* ```page```: an object representing the page currently being tested
* ```setup(done)```: a function which, when called, sets up the test suite (by loading the page in a headless browser); it's argument is a function to be called when the setup is done
* ```suite(this)```: a function which, when called, executes the test suite; it's argument should be the test context.

For example, this is a simple describer function:
``` javascript
function(page, setup, suite) {
	setup(function() {
		suite(this);
	});
}
```

### tester(expectation)
The tester argument should be a function which, when called, actually tests an expectation. It's one argument is an object with three properties:
* ```expectation.name```: the name of the expectation (ex. the URL of a resource which was expected)
* ```expectation.occurred```: the number of instances which actually occurred
* ```expectation.expected```: the number of instances which was expected

For example, here is a simple tester which outputs to the console:
``` javascript
function(expectation) {
	if (expectation.occurred != expectation.expected) {
		console.log(util.format('%s expected %d, received %d on %s', expectation.name, expectation.expected, expectation.occurred, expectation.page.url));
	} else {
		console.log(util.format('passed %s on %s', expectation.name, expectation.page.url));
	}
}
```

## Examples
Two examples are included, a simple one using console.log and an example using the [Mocha test framework](http://visionmedia.github.io/mocha/). To run the simple example, just execute this command: ```node examples/simple.js```

To use the Mocha example, you must install the mocha npm module.

```
npm install -g mocha
npm install should
```

To run the Mocha example, just use this command: ```mocha --reporter spec --ui bdd -r should example/mocha.js```

## Configuration
The definition used for validating your site is stored in a simple JavaScript object, which is passed as the first parameter for a new haunted object. This object can be easily loaded from a JSON file, and contains a number of properties. A sample definition is included in the examples directory.

``` javascript
var definition = require('./definition.json');
```

### base (required)
The base URL of your site. Ex. ```"http://google.com"```

### authentication (optional)
If your site is behind basic HTTP authentication, you can pass a username and password in your definition file to enable authentication.
``` javascript
"authentication": {
	"username": "YOURUSERNAMEHERE",
	"password": "YOURPASSWORDHERE"
}
```

### storage (optional)
This contains configuration information which is passed to the [datastore](#datastores).

### queries (optional)
An object of all queries which your pages would like to check. The key is the query name and the value is an object containing query properties which are passed along to the datastore.

``` javascript
"queries": {
	"page.hour": {
		"collection": "analytics.page.hour",
		"query": {"name": "<%= relative %>", "date": "<%= hour %>"},
		"field": "n",
		"sort": {"date": -1}
	}
}
```

#### collection (required)
The collection this query should reference.

#### query (required)
The actual query parameters to be passed. This format will often depend on the driver. Note that in field names certain properties will be replaced:

* ```<%= relative %>``` becomes the relative URL of the current page.
* ```<%= time %>``` becomes the current time, as a JavaScript date
* ```<%= hour %>``` becomes the current hour, rounded down, as a JavaScript date
* ```<%= day %>``` becomes the current day, rounded down, as a JavaScript date
* ```<%= month %>``` becomes the current month, rounded down, as a JavaScript date
* ```<%= fiveMin %>``` becomes the current five minute period, rounded down, as a JavaScript date

#### field (required)
The name of the field, in the fetched document, where the changing value can be found.

#### sort (optional)
An object parameter to pass for sorting the collection query, useful in the MongoDB datastore.

### wait (optional)
The number of milliseconds to wait before final (post-visit) check of datastore. Useful if you have delayed writes.

### sets (required)
In Haunted, a set is an array of URLs which are expected. You can define multiple sets (each of which has multiple URLs), and each page can reference multiple sets. Note that URLs will be naively partially matched, such that if a requested resource contains one of these URLs as a substring, it will be considered a match. For example:
``` javascript
"sets": {
	"google": [
		"http://www.google-analytics.com/__utm.gif"
	],
	"internal": [
		"track.gif"
	]
}
```

### pages (required)
The pages property contains an array of pages to be checked, each of which has a number of properties. Ex.
``` javascript
"pages": [
	{
		"uri": "/the-7-awesome-types-of-slideshows-2010-11",
		"sets": {
		  "google": 1,
		  "internal": 2
		},
		"actions": [
		  {"click": "a.sl-start"}
		],
		"queries": {
			"page.hour": 1
		}
	}
]
```

#### uri (required)
The location of the page, relative to [the base url](#base-required). Ex. ```"/blog"```

#### sets (required)
An object containing the [sets](#sets-required), as defined elsewhere in your definition, which this page should load. The key is the set and the value is the number of times it should be referenced. The above example will expect each URL in ```google``` set to be called once and each URL in the ```internal``` set twice:

#### actions (optional)
An array containing any actions to take on the page. Each action is represented as an object with the key being the event/action and the value being the target. Currently only the ```click``` ation is supported.

#### queries (optional)
An object containing the [queries](#queries-optional), as defined elsewhere in your definition, which this page should check. The key is the query and the value is the amount we expect that query to be updated by.

## Datastores
Haunted supports tracking that values are properly incremented in your datastore for analytics calls. To use a datastore, you must define [storage](#storage-optional) and [queries](#queries-optional) in your configuration, and activate the datastore. Currently only a MongoDB datastore driver is included with Haunted, which can be activated thusly:

``` javascript
haunted = new Haunted(definition, describer, tester);

// use the mongo datastore
haunted.setStorage(haunted.MongoHouse);
```

As the datastore is a simple class, you can easily write drivers for other datastores by following the conventions of the mongo datastore. If you do so, please submit a pull request so we can include it!