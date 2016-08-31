'use strict';

var BaseRule = require('./BaseRule');

module.exports = BaseRule.extend({

   apply: function(state) {
      if (this.isDecreasing(state) && state.nextCapacity < this._config.AbsoluteMinimumProvisioned) {
         state.nextCapacity = this._config.AbsoluteMinimumProvisioned;
      }
   },

});
