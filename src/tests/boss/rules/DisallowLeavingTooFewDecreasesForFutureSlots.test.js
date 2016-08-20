'use strict';

var expect = require('expect.js'),
    moment = require('moment'),
    Rule = require('../../../boss/rules/DisallowLeavingTooFewDecreasesForFutureSlots');

describe('DisallowLeavingTooFewDecreasesForFutureSlots', function() {

   describe('apply', function() {

      function runTest(nextCapacity, time, numberDec, expectation) {
         var config = {},
             state, rule;

         state = {
            provisioning: {
               CapacityUnits: 100,
               NumberOfDecreasesToday: numberDec,
            },
            currentTime: moment(time),
            nextCapacity: nextCapacity,
         };

         config = {
            MinimumMinutesBetweenIncreases: 5,
            MinimumMinutesBetweenDecreases: 10,
         };

         rule = new Rule(config);
         rule.apply(state);

         expect(state.isAllowedToChange).to.be(expectation);
      }

      it('does nothing when increasing', function() {
         runTest(150, '2016-08-18T00:10:01.000Z', 3, undefined);
      });

      it('does nothing when not increasing or decreasing', function() {
         runTest(100, '2016-08-18T00:10:01.000Z', 3, undefined);
      });

      it('does nothing when you have enough decreases left for the number of slots left', function() {
         runTest(50, '2016-08-18T00:10:01.000Z', 0, undefined);

         runTest(50, '2016-08-18T06:10:01.000Z', 0, undefined);
         runTest(50, '2016-08-18T06:10:01.000Z', 1, undefined);

         runTest(50, '2016-08-18T12:10:01.000Z', 0, undefined);
         runTest(50, '2016-08-18T12:10:01.000Z', 1, undefined);
         runTest(50, '2016-08-18T12:10:01.000Z', 2, undefined);

         runTest(50, '2016-08-18T18:10:01.000Z', 0, undefined);
         runTest(50, '2016-08-18T18:10:01.000Z', 1, undefined);
         runTest(50, '2016-08-18T18:10:01.000Z', 2, undefined);
         runTest(50, '2016-08-18T18:10:01.000Z', 3, undefined);
      });

      it('disallows a change when you do not have enough decreases left for the number of slots left', function() {
         runTest(50, '2016-08-18T00:10:01.000Z', 1, false);
         runTest(50, '2016-08-18T00:10:01.000Z', 2, false);
         runTest(50, '2016-08-18T00:10:01.000Z', 3, false);
         runTest(50, '2016-08-18T00:10:01.000Z', 4, false);
         runTest(50, '2016-08-18T00:10:01.000Z', 5, false);

         runTest(50, '2016-08-18T06:10:01.000Z', 2, false);
         runTest(50, '2016-08-18T06:10:01.000Z', 3, false);
         runTest(50, '2016-08-18T06:10:01.000Z', 4, false);
         runTest(50, '2016-08-18T06:10:01.000Z', 5, false);

         runTest(50, '2016-08-18T12:10:01.000Z', 3, false);
         runTest(50, '2016-08-18T12:10:01.000Z', 4, false);
         runTest(50, '2016-08-18T12:10:01.000Z', 5, false);

         runTest(50, '2016-08-18T18:10:01.000Z', 4, false);
         runTest(50, '2016-08-18T18:10:01.000Z', 5, false);
      });

   });

});
