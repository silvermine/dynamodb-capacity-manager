'use strict';

var expect = require('expect.js'),
    sinon = require('sinon'),
    Rule = require('../../../boss/rules/ForecastingRule');

describe('ForecastingRule', function() {

   describe('onAfterInit', function() {

      it('sets the default forecaster for you', function() {
         var rule = new Rule();

         expect(rule._forecaster).to.be.an('object');
         expect(rule._forecaster.forecast).to.be.a('function');
      });

   });


   describe('apply', function() {

      function runTest(forecastValue, expectedForecast, expectedIsAllowedToChange) {
         var rule = new Rule({ MinutesToForecast: 10 }),
             state = { usage: 'usage-array', isAllowedToChange: true },
             forecaster = { forecast: function() {} },
             mock = sinon.mock(forecaster);

         mock.expects('forecast').withExactArgs(state.usage, 10).returns(forecastValue);

         rule.setForecaster(forecaster);

         rule.apply(state);

         expect(state.forecastUsage).to.eql(expectedForecast);
         expect(state.isAllowedToChange).to.eql(expectedIsAllowedToChange === undefined ? true : expectedIsAllowedToChange);
         mock.verify();
      }

      it('sets the forecastUsage correctly', function() {
         runTest(20, 20);
      });

      it('does not allow zero or negative values to be forecast', function() {
         runTest(0, 1);
         runTest(-1, 1);
         runTest(-1000, 1);
         runTest(-2.6, 1);
         runTest(0.00001, 1);
      });

      it('does not allow NaN or Infinity forecasts to adjust the forecast', function() {
         runTest(NaN, undefined, false);
         runTest(Infinity, undefined, false);
         runTest(-Infinity, undefined, false);
         runTest(null, undefined, false);
      });

   });

});
