'use strict';

var expect = require('expect.js'),
    Rule = require('../../../boss/rules/EnforceMaximumIncreaseRule');

describe('EnforceMaximumIncreaseRule', function() {

   describe('apply', function() {
      var config;

      config = {
         AbsoluteMaximumProvisioned: 10000,
         MaximumIncreaseAmount: [
            { IfGreaterThan: 0, IfLessThanOrEqual: 10, Percentage: 100 },
            { IfGreaterThan: 10, IfLessThanOrEqual: 100, Percentage: 50 },
            { IfGreaterThan: 100, IfLessThanOrEqual: 1000, Percentage: 20 },
         ],
      };

      function runTest(currentCap, nextCap, expectedNextCap, expectedIsAllowed) {
         var state = { provisioning: { CapacityUnits: currentCap }, nextCapacity: nextCap },
             rule = new Rule(config);

         rule.apply(state);

         expect(state.nextCapacity).to.eql(expectedNextCap);
         expect(state.isAllowedToChange).to.eql(expectedIsAllowed);
      }

      it('enforces the maximum relative amount of change based on current capacity', function() {
         runTest(5, 6, 6);
         runTest(4, 8, 8);
         runTest(4, 9, 8); // capped out
         runTest(10, 19, 19);
         runTest(10, 20, 20);
         runTest(10, 21, 20); // capped out
         runTest(20, 29, 29);
         runTest(20, 30, 30);
         runTest(20, 31, 30); // capped out
      });

      it('enforces the absolute max', function() {
         runTest(9998, 10000, 10000);
         runTest(9998, 10001, 10000);
         runTest(9998, 1000000, 10000);
      });

      it('does not allow a change when provisioned amount is already over the absolute max', function() {
         // this allows for manual override in an emergency
         // a user could manually (through AWS console or CLI, etc) override the capacity
         // to be over our configured absolute max and we will not then lower it on the
         // next time we run just because it's over the absolute max
         runTest(11000, 12000, 12000, false);
      });

      it('does nothing when not increasing', function() {
         runTest(5, 4, 4);
      });

   });

});
