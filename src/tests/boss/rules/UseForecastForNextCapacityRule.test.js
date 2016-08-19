'use strict';

var expect = require('expect.js'),
    Rule = require('../../../boss/rules/UseForecastForNextCapacityRule');

describe('UseForecastForNextCapacityRule', function() {

   describe('apply', function() {

      it('overwrites nextCapacity with the ceiling of forecastUsage', function() {
         var rule = new Rule(),
             state = { forecastUsage: 100.12345 };

         rule.apply(state);

         expect(state.nextCapacity).to.eql(101);
      });

   });

});
