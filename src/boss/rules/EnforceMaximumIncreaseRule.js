'use strict';

var BaseRule = require('./BaseRule');

module.exports = BaseRule.extend({

   apply: function(state) {
      var changeAmount = Math.abs(state.nextCapacity - state.provisioning.CapacityUnits),
          changePctg = (changeAmount / state.provisioning.CapacityUnits) * 100,
          range;

      if (this.isIncreasing(state)) {
         if (state.provisioning.CapacityUnits > this._config.AbsoluteMaximumProvisioned) {
            // We do not allow a change and do not modify anything else if it
            // is already provisioned over our absolute max. See comments in
            // the unit test for reasoning.
            state.isAllowedToChange = false;
            return;
         }

         // we don't want to spend too much money by making sudden massive jumps, so we
         // allow for tiered maximum jump amounts based on the currently-provisioned
         // capacity
         range = this.getConfigRange(this._config.MaximumIncreaseAmount, state.provisioning.CapacityUnits);

         if (changePctg > range.Percentage) {
            state.nextCapacity = Math.ceil(state.provisioning.CapacityUnits * (1 + (range.Percentage / 100)));
         }

         if (state.nextCapacity > this._config.AbsoluteMaximumProvisioned) {
            state.nextCapacity = this._config.AbsoluteMaximumProvisioned;
         }
      }
   },

});
