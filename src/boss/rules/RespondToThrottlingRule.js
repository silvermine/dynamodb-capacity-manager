'use strict';

var Forecaster = require('../RegressionForecaster'),
    BaseRule = require('./BaseRule');

module.exports = BaseRule.extend({

   onAfterInit: function() {
      this._forecaster = new Forecaster();
   },

   setForecaster: function(forecaster) {
      this._forecaster = forecaster;
      return this;
   },

   apply: function(state) {
      var forecast = this._forecaster.forecast(state.throttling, this._config.MinutesToForecast) || 1;

      if (forecast > 1) {
         state.forecastUsage = Math.max(state.forecastUsage + forecast, 1);
      }
   },

});
