'use strict';

var _ = require('underscore'),
    Class = require('class.extend');

module.exports = Class.extend({

   init: function(config) {
      this._config = config;
      this.onAfterInit();
   },

   onAfterInit: _.noop,

   getConfigRange: function(ranges, val) {
      return _.reduce(ranges, function(memo, range) {
         if (!memo && val > range.IfGreaterThan && val <= range.IfLessThanOrEqual) {
            return range;
         }

         return memo;
      }, false) || _.last(ranges);
   },

   isIncreasing: function(state) {
      return state.nextCapacity > state.provisioning.CapacityUnits;
   },

   isDecreasing: function(state) {
      return state.nextCapacity < state.provisioning.CapacityUnits;
   },

});
