'use strict';

var BaseRule = require('./BaseRule');

module.exports = BaseRule.extend({

   apply: function(state) {
      var range = this.getConfigRange(this._config.PreferredForecastPadding, state.forecastUsage);

      state.originalForecastUsage = state.forecastUsage;
      state.forecastUsage = state.forecastUsage * (1 + (range.Percentage / 100));
   },

});
