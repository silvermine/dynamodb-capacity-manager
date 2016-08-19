'use strict';

var expect = require('expect.js'),
    Rule = require('../../../boss/rules/RequireMinimumDecreaseAmountRule');

describe('RequireMinimumDecreaseAmountRule', function() {

   describe('apply', function() {
      var config;

      config = {
         MinimumDecreaseAmount: [
            { IfGreaterThan: 0, IfLessThanOrEqual: 10, Percentage: 50 },
            { IfGreaterThan: 10, IfLessThanOrEqual: 100, Percentage: 20 },
            { IfGreaterThan: 100, IfLessThanOrEqual: 1000, Percentage: 8 },
         ],
      };

      function runTest(currentCap, nextCap, expectation) {
         var state = { provisioning: { CapacityUnits: currentCap }, nextCapacity: nextCap },
             rule = new Rule(config);

         rule.apply(state);

         expect(state.isAllowedToChange).to.eql(expectation);
      }

      it('requires at least X percentage of change for decreasing', function() {
         // If the change is allowed (it is at least the minimum amount of
         // change to justify allowing a decrease) we do not test for true - we
         // just test that we did not change the value. We only want to change
         // the value to false when we are specifically not allowing a change.
         runTest(8, 7, false); // not enough change
         runTest(8, 6, false); // not enough change
         runTest(8, 4, undefined); // enough change to allow (do not change the allowed flag)
         runTest(8, 2, undefined); // enough change to allow (do not change the allowed flag)
         runTest(20, 18, false); // not enough change
         runTest(20, 17, false); // not enough change
         runTest(20, 16, undefined); // enough change to allow (do not change the allowed flag)
         runTest(20, 10, undefined); // enough change to allow (do not change the allowed flag)
      });

      it('does nothing if not decreasing', function() {
         runTest(8, 10);
      });

   });

});
