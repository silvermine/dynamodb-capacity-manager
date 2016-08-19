'use strict';

var expect = require('expect.js'),
    Rule = require('../../../boss/rules/ForecastPaddingRule');

describe('ForecastPaddingRule', function() {

   describe('apply', function() {

      it('pads the forecast correctly', function() {
         var rule = new Rule({ PreferredForecastPadding: [ { IfGreaterThan: 0, IfLessThanOrEqual: 1000000, Percentage: 10 } ] }),
             state = { forecastUsage: 100 };

         rule.apply(state);

         expect(state.forecastUsage).to.be.within(109.9, 110.1);
      });

   });

});
