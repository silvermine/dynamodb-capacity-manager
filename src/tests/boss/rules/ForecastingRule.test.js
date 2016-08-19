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

      it('sets the forecastUsage correctly', function() {
         var rule = new Rule({ MinutesToForecast: 10 }),
             state = { usage: 'usage-array' },
             forecaster = { forecast: function() {} },
             mock = sinon.mock(forecaster);

         mock.expects('forecast').withExactArgs(state.usage, 10).returns(20);

         rule.setForecaster(forecaster);

         rule.apply(state);

         expect(state.forecastUsage).to.eql(20);
         mock.verify();
      });

   });

});
