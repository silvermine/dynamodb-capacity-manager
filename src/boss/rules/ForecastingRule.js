'use strict';

var _ = require('underscore'),
    Forecaster = require('../RegressionForecaster'),
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
      var forecast = this._forecaster.forecast(state.usage, this._config.MinutesToForecast);

      if (!_.isFinite(forecast)) {
         console.log(
            'ERROR: Not changing usage as forecaster did not create a valid forecast (predicted: %s) for the usage %s',
            forecast,
            JSON.stringify(state.usage)
         );
         state.isAllowedToChange = false;
         return;
      }

      state.forecastUsage = Math.max(forecast, 1);
   },

});
