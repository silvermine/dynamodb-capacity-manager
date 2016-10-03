'use strict';

var expect = require('expect.js'),
    moment = require('moment'),
    Rule = require('../../../boss/rules/DisallowLeavingTooFewDecreasesForFutureSlots');

describe('DisallowLeavingTooFewDecreasesForFutureSlots', function() {

   describe('apply', function() {

      function runTest(nextCapacity, time, numberDec, expectation, maxDecreases) {
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
            MaximumDecreasesToUsePerDay: maxDecreases || 4,
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

      it('does nothing when you have enough decreases left for the number of slots left - default 4', function() {
         // six hour slots
         // slot one - 00:00 to 06:00 - can only use first decrease (only can decrease if have zero previous decreases)
         runTest(50, '2016-08-18T00:10:01.000Z', 0, undefined);

         // slot two - 06:00 to 12:00 - can use first two decreases
         runTest(50, '2016-08-18T06:10:01.000Z', 0, undefined);
         runTest(50, '2016-08-18T06:10:01.000Z', 1, undefined);

         // slot three - 12:00 to 18:00 - can use first three decreases
         runTest(50, '2016-08-18T12:10:01.000Z', 0, undefined);
         runTest(50, '2016-08-18T12:10:01.000Z', 1, undefined);
         runTest(50, '2016-08-18T12:10:01.000Z', 2, undefined);

         // slot three - 18:00 to 00:00 - can use all decreases for the day
         runTest(50, '2016-08-18T18:10:01.000Z', 0, undefined);
         runTest(50, '2016-08-18T18:10:01.000Z', 1, undefined);
         runTest(50, '2016-08-18T18:10:01.000Z', 2, undefined);
         runTest(50, '2016-08-18T18:10:01.000Z', 3, undefined); // three previous, using the fourth now
      });

      it('does nothing when you have enough decreases left for the number of slots left - custom 3', function() {
         // eight hour slots
         // slot one - 00:00 to 08:00 - can only use first decrease (only can decrease if have zero previous decreases)
         runTest(50, '2016-08-18T00:10:01.000Z', 0, undefined); // none previous, using the first now

         // slot two - 08:00 to 16:00 - can use first two decreases
         runTest(50, '2016-08-18T08:10:01.000Z', 0, undefined);
         runTest(50, '2016-08-18T08:10:01.000Z', 1, undefined); // one previous, using the second now

         // slot three - 16:00 to 00:00 - can use all decreases for the day
         runTest(50, '2016-08-18T16:10:01.000Z', 0, undefined);
         runTest(50, '2016-08-18T16:10:01.000Z', 1, undefined);
         runTest(50, '2016-08-18T16:10:01.000Z', 2, undefined); // two previous, using the third now
      });

      it('disallows a change when you do not have enough decreases left for the number of slots left - default 4', function() {
         // six hour slots
         // slot one - 00:00 to 06:00 - can only use the first decrease
         runTest(50, '2016-08-18T00:10:01.000Z', 1, false); // have already used the first decrease
         runTest(50, '2016-08-18T00:10:01.000Z', 2, false);
         runTest(50, '2016-08-18T00:10:01.000Z', 3, false);
         runTest(50, '2016-08-18T00:10:01.000Z', 4, false);
         runTest(50, '2016-08-18T00:10:01.000Z', 5, false);

         // slot two - 06:00 to 12:00 - can only use the first two decreases
         runTest(50, '2016-08-18T06:10:01.000Z', 2, false); // have already used both decreases
         runTest(50, '2016-08-18T06:10:01.000Z', 3, false);
         runTest(50, '2016-08-18T06:10:01.000Z', 4, false);
         runTest(50, '2016-08-18T06:10:01.000Z', 5, false);

         // slot three - 12:00 to 18:00 - can only use the first three decreases
         runTest(50, '2016-08-18T12:10:01.000Z', 3, false); // have already used all three decreases
         runTest(50, '2016-08-18T12:10:01.000Z', 4, false);
         runTest(50, '2016-08-18T12:10:01.000Z', 5, false);

         // slot four - 18:00 to 00:00 - can use all four decreases
         runTest(50, '2016-08-18T18:10:01.000Z', 4, false); // have already used all four decreases
         runTest(50, '2016-08-18T18:10:01.000Z', 5, false);
      });

      it('disallows a change when you do not have enough decreases left for the number of slots left - custom 3', function() {
         // eight hour slots
         // slot one - 00:00 to 08:00 - can only use the first decrease
         runTest(50, '2016-08-18T00:10:01.000Z', 1, false); // have already used the first decrease
         runTest(50, '2016-08-18T00:10:01.000Z', 2, false);
         runTest(50, '2016-08-18T00:10:01.000Z', 3, false);
         runTest(50, '2016-08-18T00:10:01.000Z', 4, false);
         runTest(50, '2016-08-18T00:10:01.000Z', 5, false);

         // slot two - 08:00 to 16:00 - can only use the first two decreases
         runTest(50, '2016-08-18T08:10:01.000Z', 2, false); // have already used both decreases
         runTest(50, '2016-08-18T08:10:01.000Z', 3, false);
         runTest(50, '2016-08-18T08:10:01.000Z', 4, false);
         runTest(50, '2016-08-18T08:10:01.000Z', 5, false);

         // slot three - 16:00 to 00:00 - can use all three decreases
         runTest(50, '2016-08-18T16:10:01.000Z', 3, false); // have already used all three decreases
         runTest(50, '2016-08-18T16:10:01.000Z', 4, false);
         runTest(50, '2016-08-18T16:10:01.000Z', 5, false);
      });

   });

});
