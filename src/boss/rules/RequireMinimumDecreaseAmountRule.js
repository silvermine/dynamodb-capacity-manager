'use strict';

var BaseRule = require('./BaseRule');

module.exports = BaseRule.extend({

   apply: function(state) {
      var changeAmount = Math.abs(state.nextCapacity - state.provisioning.CapacityUnits),
          changePctg = (changeAmount / state.provisioning.CapacityUnits) * 100,
          range;

      if (this.isDecreasing(state)) {
         // we don't want to "waste" a decrease by doing it for a negligible amount, so we
         // wait until the change being requested is at least a certain amount
         range = this.getConfigRange(this._config.MinimumDecreaseAmount, state.provisioning.CapacityUnits);
         if (changePctg < range.Percentage) {
            state.isAllowedToChange = false;
         }
      }
   },

});
