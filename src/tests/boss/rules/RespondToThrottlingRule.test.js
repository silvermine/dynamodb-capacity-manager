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
         runTest(10, 20, 30);
      });

      it('sets the forecastUsage correctly - usage forecast is higher than throttling', function() {
         runTest(20, 10, 30);
      });

      it('does not allow zero, negative, or NaN values to be forecast', function() {
         runTest(10, 0, 10);
         runTest(10, -1, 10);
         runTest(10, NaN, 10);
         runTest(10, null, 10);
         runTest(10, -1000, 10);
         runTest(10, -2.6, 10);
         runTest(10, 0.00001, 10);
      });

   });

});
