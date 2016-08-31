'use strict';

var expect = require('expect.js'),
    Rule = require('../../../boss/rules/EnforceAbsoluteMinimumRule');

describe('EnforceAbsoluteMinimumRule', function() {

   describe('apply', function() {
      var config;

      config = {
         AbsoluteMinimumProvisioned: 5,
      };

      function runTest(currentCap, nextCap, expectedNextCap, expectedIsAllowed) {
         var state = { provisioning: { CapacityUnits: currentCap }, nextCapacity: nextCap },
             rule = new Rule(config);

         rule.apply(state);

         expect(state.nextCapacity).to.eql(expectedNextCap);
         expect(state.isAllowedToChange).to.eql(expectedIsAllowed);
      }

      it('enforces the absolute minimum provisioning when decreasing', function() {
         runTest(10, 0, 5);
         runTest(10, 1, 5);
         runTest(10, 2, 5);
         runTest(10, 3, 5);
         runTest(10, 4, 5);
         runTest(10, 5, 5);
         runTest(10, 6, 6);
         runTest(10, 7, 7);
         runTest(10, 8, 8);
         runTest(10, 9, 9);
      });

      it('does nothing when not decreasing', function() {
         runTest(10, 10, 10);
         runTest(10, 11, 11);
         runTest(10, 12, 12);
      });

   });

});
