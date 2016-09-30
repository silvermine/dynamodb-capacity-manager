'use strict';

var expect = require('expect.js'),
    sinon = require('sinon'),
    Rule = require('../../../boss/rules/RespondToThrottlingRule');

describe('RespondToThrottlingRule', function() {

   describe('onAfterInit', function() {

      it('sets the default forecaster for you', function() {
         var rule = new Rule();

         expect(rule._forecaster).to.be.an('object');
         expect(rule._forecaster.forecast).to.be.a('function');
      });

   });


   describe('apply', function() {

      function runTest(existingForecast, throttlingForecast, expectedForecast) {
         var rule = new Rule({ MinutesToForecast: 10 }),
             state = { throttling: 'throttling-array', forecastUsage: existingForecast },
             forecaster = { forecast: function() {} },
             mock = sinon.mock(forecaster);

         mock.expects('forecast').withExactArgs(state.throttling, 10).returns(throttlingForecast);

         rule.setForecaster(forecaster);

         rule.apply(state);

         expect(state.forecastUsage).to.eql(expectedForecast);
         mock.verify();
      }

      it('sets the forecastUsage correctly - usage forecast is lower than throttling', function() {
         runTest(10, 20, 20);
      });

      it('sets the forecastUsage correctly - usage forecast is higher than throttling', function() {
         runTest(20, 10, 20);
      });

      it('does not allow zero, negative, or NaN values to be forecast', function() {
         runTest(1, 0, 1);
         runTest(1, -1, 1);
         runTest(1, NaN, 1);
         runTest(1, null, 1);
         runTest(1, -1000, 1);
         runTest(1, -2.6, 1);
         runTest(1, 0.00001, 1);
      });

   });

});
