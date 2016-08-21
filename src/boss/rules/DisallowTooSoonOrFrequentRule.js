'use strict';

var moment = require('moment'),
    BaseRule = require('./BaseRule');

module.exports = BaseRule.extend({

   apply: function(state) {
      var lastIncrease = state.provisioning.LastIncreaseDateTime,
          lastDecrease = state.provisioning.LastDecreaseDateTime,
          nextAllowedIncrease = moment(lastIncrease).add(this._config.MinimumMinutesBetweenIncreases, 'minutes'),
          nextAllowedDecrease = moment(lastDecrease).add(this._config.MinimumMinutesBetweenDecreases, 'minutes');

      if (this.isIncreasing(state) && nextAllowedIncrease.isAfter(state.currentTime)) {
         state.isAllowedToChange = false;
      }

      if (this.isDecreasing(state)) {
         // decrease is being planned - should we stop it?
         if (nextAllowedDecrease.isAfter(state.currentTime) || state.provisioning.NumberOfDecreasesToday >= 4) {
            state.isAllowedToChange = false;
         }
      }
   },

});
