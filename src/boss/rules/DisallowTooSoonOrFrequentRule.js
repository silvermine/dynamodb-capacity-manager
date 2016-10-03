'use strict';

var moment = require('moment'),
    BaseRule = require('./BaseRule');

module.exports = BaseRule.extend({

   apply: function(state) {
      var maxDecreases = this._config.MaximumDecreasesToUsePerDay,
          lastIncrease = state.provisioning.LastIncreaseDateTime,
          lastDecrease = state.provisioning.LastDecreaseDateTime,
          nextAllowedIncrease = moment(lastIncrease).add(this._config.MinimumMinutesBetweenIncreases, 'minutes'),
          nextAllowedDecAfterDec = moment(lastDecrease).add(this._config.MinimumMinutesBetweenDecreases, 'minutes'),
          nextAllowedDecAfterInc = moment(lastIncrease).add(this._config.MinimumMinutesBeforeDecreaseAfterIncrease, 'minutes'),
          nextAllowedDecrease = nextAllowedDecAfterDec;

      if (nextAllowedDecAfterInc.isAfter(nextAllowedDecAfterDec)) {
         nextAllowedDecrease = nextAllowedDecAfterInc;
      }

      if (this.isIncreasing(state) && nextAllowedIncrease.isAfter(state.currentTime)) {
         state.isAllowedToChange = false;
      }

      if (this.isDecreasing(state)) {
         // decrease is being planned - should we stop it?
         if (nextAllowedDecrease.isAfter(state.currentTime) || state.provisioning.NumberOfDecreasesToday >= maxDecreases) {
            state.isAllowedToChange = false;
         }
      }
   },

});
