'use strict';

var _ = require('underscore'),
    expect = require('expect.js'),
    moment = require('moment'),
    Rule = require('../../../boss/rules/DisallowTooSoonOrFrequentRule');

describe('DisallowTooSoonOrFrequent', function() {

   describe('apply', function() {

      // eslint-disable-next-line max-params
      function runTest(nextCapacity, time, numberDec, expectation, configOpts, provisioningOverride) {
         var state, config, rule;

         configOpts = configOpts || {};

         state = {
            provisioning: {
               CapacityUnits: 100,
               LastIncreaseDateTime: new Date('2016-08-18T20:00:00.000Z'),
               LastDecreaseDateTime: new Date('2016-08-18T20:00:00.000Z'),
               NumberOfDecreasesToday: numberDec,
            },
            currentTime: moment(time),
            nextCapacity: nextCapacity,
         };

         state.provisioning = _.extend(state.provisioning, provisioningOverride || {});

         config = {
            MaximumDecreasesToUsePerDay: configOpts.maxDecreases || 4,
            MinimumMinutesBetweenIncreases: 5,
            MinimumMinutesBetweenDecreases: 10,
            MinimumMinutesBeforeDecreaseAfterIncrease: configOpts.decAfterInc || 15,
         };

         rule = new Rule(config);
         rule.apply(state);

         expect(state.isAllowedToChange).to.be(expectation);
      }

      it('disallows change when trending up and not enough time has elapsed since the last increase', function() {
         runTest(200, '2016-08-18T20:01:00.000Z', 0, false);
         runTest(200, '2016-08-18T20:02:00.000Z', 0, false);
         runTest(200, '2016-08-18T20:03:00.000Z', 0, false);
         runTest(200, '2016-08-18T20:04:00.000Z', 0, false);
         runTest(200, '2016-08-18T20:04:59.999Z', 0, false);
      });

      it('disallows change when trending down and not enough time has elapsed since the last decrease', function() {
         runTest(50, '2016-08-18T20:01:00.000Z', 0, false, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:02:00.000Z', 0, false, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:03:00.000Z', 0, false, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:04:00.000Z', 0, false, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:05:00.000Z', 0, false, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:06:00.000Z', 0, false, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:07:00.000Z', 0, false, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:08:00.000Z', 0, false, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:09:00.000Z', 0, false, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:09:59.999Z', 0, false, { decAfterInc: 1 });
      });

      it('disallows change when trending down and not enough time has elapsed since the last increase', function() {
         runTest(50, '2016-08-18T20:01:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:02:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:03:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:04:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:05:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:06:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:07:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:08:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:09:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:10:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:11:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:12:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:13:00.000Z', 0, false);
         runTest(50, '2016-08-18T20:14:59.999Z', 0, false);
      });

      it('disallows change when trending down and already had maximum decreases for the day', function() {
         runTest(50, '2016-08-18T20:30:00.000Z', 4, false);
         runTest(50, '2016-08-18T20:30:00.000Z', 5, false);
         runTest(50, '2016-08-18T20:30:00.000Z', 2, false, { maxDecreases: 2 });
         runTest(50, '2016-08-18T20:30:00.000Z', 3, false, { maxDecreases: 3 });
         runTest(50, '2016-08-18T20:30:00.000Z', 4, false, { maxDecreases: 4 });
      });

      it('allows change other times', function() {
         // undefined because no change
         // trending up, it has been over five minutes since last increase
         runTest(200, '2016-08-18T20:05:01.000Z', 0, undefined);
         runTest(200, '2016-08-18T20:05:01.000Z', 4, undefined);
         runTest(200, '2016-08-18T20:05:01.000Z', 5, undefined);

         // trending down, it has been over ten minutes since last decrease, not too many decreases
         runTest(50, '2016-08-18T20:10:01.000Z', 0, undefined, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:10:01.000Z', 1, undefined, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:10:01.000Z', 2, undefined, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:10:01.000Z', 3, undefined, { decAfterInc: 1 });

         // trending down, it has been over ten minutes since last decrease, not too many decreases (custom max dec count)
         runTest(50, '2016-08-18T20:10:01.000Z', 0, undefined, { decAfterInc: 1, maxDecreases: 3 });
         runTest(50, '2016-08-18T20:10:01.000Z', 1, undefined, { decAfterInc: 1, maxDecreases: 3 });
         runTest(50, '2016-08-18T20:10:01.000Z', 2, undefined, { decAfterInc: 1, maxDecreases: 3 });

         // trending down, it has been over ten minutes since last decrease, fifteen since last increase, not too many decreases
         runTest(50, '2016-08-18T20:15:01.000Z', 0, undefined, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:15:01.000Z', 1, undefined, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:15:01.000Z', 2, undefined, { decAfterInc: 1 });
         runTest(50, '2016-08-18T20:15:01.000Z', 3, undefined, { decAfterInc: 1 });

         // trending down, it has been over ten minutes since last decrease, fifteen since last increase, not too many decreases
         // custom max dec count
         runTest(50, '2016-08-18T20:15:01.000Z', 0, undefined, { decAfterInc: 1, maxDecreases: 3 });
         runTest(50, '2016-08-18T20:15:01.000Z', 1, undefined, { decAfterInc: 1, maxDecreases: 3 });
         runTest(50, '2016-08-18T20:15:01.000Z', 2, undefined, { decAfterInc: 1, maxDecreases: 3 });
      });

      it('allows increase when LastIncreaseDateTime is undefined', function() {
         runTest(200, '2016-08-18T20:05:01.000Z', 0, undefined, {}, { LastIncreaseDateTime: undefined });
      });

      it('allows decrease when LastDecreaseDateTime is undefined', function() {
         runTest(50, '2016-08-18T20:05:01.000Z', 0, undefined, {}, { LastDecreaseDateTime: undefined });
      });

   });

});
