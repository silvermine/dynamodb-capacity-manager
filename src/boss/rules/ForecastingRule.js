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
      var forecast = this._forecaster.forecast(state.usage, this._config.MinutesToForecast) || 1;

      state.forecastUsage = Math.max(forecast, 1);
   },

});
