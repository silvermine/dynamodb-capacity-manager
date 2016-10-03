'use strict';

var moment = require('moment'),
    BaseRule = require('./BaseRule');

module.exports = BaseRule.extend({

   apply: function(state) {
      var maxDecreases = this._config.MaximumDecreasesToUsePerDay,
          decreasesLeft = (maxDecreases - state.provisioning.NumberOfDecreasesToday),
          endOfDay = moment(state.currentTime).utc().hours(0).minutes(0).seconds(0).milliseconds(0).add(1, 'day'),
          secondsToEndOfDay = (endOfDay.unix() - moment(state.currentTime).unix()),
          fullSlotsLeft = Math.floor(secondsToEndOfDay / (86400 / maxDecreases)); // 86,400 is seconds in a day

      // also, we do not let you use up all your decreases in the first "slot" of the day
      // (a "slot" is the day divided by how many decreases you're allowed in a day)
      // you must leave one for each remaining slot of the day
      // so if your first slot doesn't use one, any subsequent slot can use two, and so on
      if (this.isDecreasing(state) && decreasesLeft <= fullSlotsLeft) {
         state.isAllowedToChange = false;
      }
   },

});
