# DynamoDB Capacity Manager (DCM)

[![Build Status](https://travis-ci.org/silvermine/dynamodb-capacity-manager.png?branch=master)](https://travis-ci.org/silvermine/dynamodb-capacity-manager)
[![Coverage Status](https://coveralls.io/repos/github/silvermine/dynamodb-capacity-manager/badge.svg?branch=master)](https://coveralls.io/github/silvermine/dynamodb-capacity-manager?branch=master)
[![Dependency Status](https://david-dm.org/silvermine/dynamodb-capacity-manager.png)](https://david-dm.org/silvermine/dynamodb-capacity-manager)
[![Dev Dependency Status](https://david-dm.org/silvermine/dynamodb-capacity-manager/dev-status.png)](https://david-dm.org/silvermine/dynamodb-capacity-manager#info=devDependencies&view=table)


## What is it?

DCM is a library for automatically managing the capacity of your DynamoDB tables.
It can be run as a script from your workstation, a server, or as a Lambda function.
We recommend running it as a Lambda function on a scheduled basis - typically
every minute.


## What does it do?

The basic flow of execution is:

   * List the resources (tables and indexes) that it needs to operate on. This list might be all the tables (and their associated indexes):
      * in a CloudFormation stack, or
      * in your account, or
      * a specific list of tables and indexes that you determine and give it
   * Find out what the currently-provisioned capacity for these resources is
   * Retrieve CloudWatch statistics on the recent consumed capacity and throttle events for these resources
   * Then apply a series of rules to take the recent consumption and throttle data to determine if an update should be made
      * These rules include running a linear regression on the trajectory of your recent consumption
      * Then applying your configuration of minimums, maximums, and other inputs for the rules to create a new target capacity
   * Then, if updates are needed, apply those updates

Each rule (including the forecasting) has a number of configuration parameters
that you can provide it to determine how it works. A generic set of base
configuration can be provided, as well as specific configuration for each table
and index, and separate configuration for read capacity vs. write capacity.

In future releases, the library will allow greater configuration of which rules
run, in what order, and allow you to easily add custom rules and forecasters
(other than linear regression).


## How do I use it?

Here's an example of how you can write a script that uses this library:

```js
'use strict';

var DCM = require('./src/index.js'),
    builder = new DCM.Builder(),
    dcm;

// Depending on your particular environment's configuration,
// you may have to configure the AWS SDK with region, etc, here
// For example: AWS.config.update({ region: 'us-east-1' });

// Give it a way to find the list of tables and indexes that it will operate on:
builder.findResourcesWith(new DCM.CloudFormationStackResourceLister('your-stack-name'));
// NOTE: in the 0.9.0 release, this is the only resource lister available, but
// before 1.0.0 more will be made available.

// Possibly exclude certain tables or indexes from the list above.
builder.excludeTable('SomeTable');
builder.excludeIndex('SomeTable', 'IndexName');

// Tell it whether it should handle reads, writes, or both.
// NOTE: the default is not to handle anything, so you must
// call one of these functions.
builder.handleReads();
// or: builder.handleWrites();
// or: builder.handleReadsAndWrites();

// If you want to override any of the built-in default configuration, you
// can provide your own overrides. These will extend the built-in defaults.
// When passed to `builder.defaultRuleConfig` they will apply to all tables
// and indexes that are operated on. This is a good place for global overrides
// for your particular environment - absolute mins and maxes, etc.
builder.defaultRuleConfig({
   AbsoluteMinimumProvisioned: 2,
   AbsoluteMaximumProvisioned: 50,
   MinimumMinutesBetweenIncreases: 3,
});

// In addition to providing your own default config that works for all
// resources and capacity types (read and write), you can also have a default
// that is used only for reads or writes, which will override your own generic
// default and the library's default.
builder.defaultRuleConfig(DCM.WRITE, {
   AbsoluteMinimumProvisioned: 1,
   AbsoluteMaximumProvisioned: 20,
   MinimumMinutesBetweenIncreases: 3,
});

// Then you can also provide an override for specific tables or indexes.
// These overrides will extend the built-in defaults as well as the defaults
// that you provided in the `defaultRuleConfig` call shown above.
// These overrides are specific for reads *or* writes, which each must be
// configured separately.
builder.ruleConfigForTable('MyMuchBusierThanAverageTable', DCM.READ, {
   AbsoluteMaximumProvisioned: 1500,
   MinimumMinutesBetweenIncreases: 3,
   MinimumDecreaseAmount: [
      { IfGreaterThan: 10, IfLessThanOrEqual: 1000, Percentage: 20 },
   ],
});

builder.ruleConfigForTable('MyMuchBusierThanAverageTable', DCM.WRITE, {
   AbsoluteMaximumProvisioned: 200,
   MinimumMinutesBetweenIncreases: 3,
});

builder.ruleConfigForIndex('MyMuchBusierThanAverageTable', 'SomeIndex', DCM.READ, {
   AbsoluteMaximumProvisioned: 500,
});

builder.ruleConfigForIndex('MyMuchBusierThanAverageTable', 'SomeIndex', DCM.WRITE, {
   AbsoluteMaximumProvisioned: 100,
});

// now that you have all your configuration in the DCM builder, go ahead
// and build an instance of the DynamoDB Capacity Manager.
dcm = builder.build();

// now if you want to just experiment you can simply preview the changes:
dcm.previewChanges()
   .then(function(changes) {
      console.log(changes);
   })
   .done(); // always call `.done` at the end of your promise chain so errors are thrown

// Or you can `run` the manager to preview **and apply** the changes
// **Warning: this will actually update the capacity of your tables!**
// dcm.run().done();

// `run` is equivalent to:
// dcm.previewChanges()
//    .then(function(changes) {
//       return dcm.executeChanges(changes);
//    })
//    .done();

// **Additional notes:**

// `executeChanges` returns a list of the changes that were actually applied.
// At times, not all of the changes that were returned by `previewChanges` can
// actually be applied. For instance, if the table is in an "updating" status,
// changes can not be applied to it until it is back to "active" status.

// Also, both `previewChanges` and `executeChanges` (and thus `run` as well) will
// log to the console what they are planning to do (`previewChanges`) or have
// just done (`executeChanges`), so there's not a lot of reason for you to add
// your own logging.

// All of the code above can run from a script on your workstation if you have
// the `AWS_PROFILE` environment variable set to a profile that has the appropriate
// permissions. You'll also need `AWS_REGION` set in your environment or in your
// AWS machine configuration.

// The script above can also be part of a `handler` function in a Lambda function
// and run on a schedule. We recommend doing that and running the function once
// per minute after you have run it some on your own workstation to see what it
// will be doing and see if you have your configuration to your liking.
```

## How do I configure it?

See [src/index.js](src/index.js) for the default configuration, and tune those
settings to your liking. You can look in [src/boss/rules](src/boss/rules) to see
how the configuration variables are used. In future releases, the documentation
for configuration and usage will be improved. Pull requests welcome!


## How do I contribute?

Easy! Pull requests are welcome! Just do the following:

   * Clone the code
   * Install the dependencies with `npm install`
   * Create a feature branch (e.g. `git checkout -b my_new_feature`)
   * Make your changes and commit them with a reasonable commit message
   * Make sure the code passes our standards with `grunt standards`
   * Make sure all unit tests pass with `npm test`

NOTE: in the 0.9.0 release, there are a lot of places still missing automated testing,
but these will be getting fixed in subsequent releases. Our goal is 100% unit test
coverage, with **good and effective** tests (it's easy to hit 100% coverage with junk
tests, so we differentiate). We **will not accept pull requests for new features that do
not include unit tests**. If you are submitting a pull request to fix a bug, we may accept
it without unit tests (we will certainly write our own for that bug), but we *strongly
encourage* you to write a unit test exhibiting the bug, commit that, and then commit a fix
in a separate commit. This *greatly increases* the likelihood that we will accept your pull
request and the speed with which we can process it.


## License

This software is released under the MIT license. See [the license file](LICENSE) for more details.
