'use strict';

var BaseRule = require('./BaseRule');

module.exports = BaseRule.extend({

   apply: function(state) {
      state.nextCapacity = Math.ceil(state.forecastUsage);
   },

});
