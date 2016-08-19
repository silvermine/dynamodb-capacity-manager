'use strict';

var expect = require('expect.js'),
    Rule = require('../../../boss/rules/BaseRule');

describe('BaseRule', function() {

   describe('init', function() {

      it('sets the config', function() {
         var rule = new Rule('config');

         expect(rule._config).to.eql('config');
      });

      it('calls onAfterInit after setting the config', function() {
         var ExtendedRule, called;

         ExtendedRule = Rule.extend({

            onAfterInit: function() {
               expect(this._config).to.eql('config');
               called = true;
            },

         });

         new ExtendedRule('config'); // eslint-disable-line no-new

         expect(called).to.be.ok();
      });

   });


   describe('getConfigRange', function() {
      var rule = new Rule(),
          ranges;

      ranges = [
         { IfGreaterThan: 0, IfLessThanOrEqual: 10, Percentage: 100 },
         { IfGreaterThan: 10, IfLessThanOrEqual: 100, Percentage: 50 },
         { IfGreaterThan: 100, IfLessThanOrEqual: 1000, Percentage: 20 },
         { IfGreaterThan: 1500, IfLessThanOrEqual: 2000, Percentage: 10 }, // skip some values
         { IfGreaterThan: 1800, IfLessThanOrEqual: 2500, Percentage: 5 }, // overlap some values
         { IfGreaterThan: 2500, IfLessThanOrEqual: 4000, Percentage: 1 },
      ];

      function runTest(val, expectedPctg) {
         var range = rule.getConfigRange(ranges, val);

         expect(range).to.be.ok();
         expect(range.Percentage).to.eql(expectedPctg);
      }

      it('returns the first matching range for a matched value', function() {
         runTest(1, 100);
         runTest(2, 100);
         runTest(3, 100);
         runTest(4, 100);
         runTest(5, 100);
         runTest(6, 100);
         runTest(7, 100);
         runTest(8, 100);
         runTest(9, 100);
         runTest(10, 100);
         runTest(10.0001, 50);
         runTest(11, 50);
         runTest(1800, 10);
         runTest(1900, 10);
         runTest(2000, 10);
      });

      it('returns the last range when there is no match', function() {
         runTest(1001, 1);
         runTest(1400, 1);
         runTest(1500, 1);
         runTest(4000.001, 1);
         runTest(15000, 1);
      });

   });


   describe('isDecreasing', function() {
      var rule = new Rule();

      it('returns correct values', function() {
         expect(rule.isDecreasing({ provisioning: { CapacityUnits: 10 }, nextCapacity: 9 })).to.be(true);
         expect(rule.isDecreasing({ provisioning: { CapacityUnits: 10 }, nextCapacity: 10 })).to.be(false);
         expect(rule.isDecreasing({ provisioning: { CapacityUnits: 10 }, nextCapacity: 11 })).to.be(false);
      });

   });


   describe('isIncreasing', function() {
      var rule = new Rule();

      it('returns correct values', function() {
         expect(rule.isIncreasing({ provisioning: { CapacityUnits: 10 }, nextCapacity: 9 })).to.be(false);
         expect(rule.isIncreasing({ provisioning: { CapacityUnits: 10 }, nextCapacity: 10 })).to.be(false);
         expect(rule.isIncreasing({ provisioning: { CapacityUnits: 10 }, nextCapacity: 11 })).to.be(true);
      });

   });

});
