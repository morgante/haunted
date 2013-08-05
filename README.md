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

Examples
--------
Two examples are included, a simple one using console.log and an example using the [Mocha test framework](http://visionmedia.github.io/mocha/). To use the Mocha example, you must install the mocha npm module.

```
npm install -g mocha
npm install should
```

To run the Mocha example, just use this command: ```mocha --reporter spec --ui bdd -r should example/mocha.js```