'use strict';

var _ = require('underscore'),
    Class = require('class.extend'),
    moment = require('moment'),
    regression = require('regression');

module.exports = Class.extend({

   init: function(regressionType) {
      this._regressionType = (regressionType || 'polynomial');
   },

   forecast: function(data, additionalMinutes) {
      var series = this._createRegressableTimeSeries(data);

      this._addEmptySlotsToTimeSeries(series, additionalMinutes);

      return _.chain(this._regress(series))
         .map(function(pair) {
            return pair[1];
         })
         .last()
         .value();
   },

   _createRegressableTimeSeries: function(data) {
      return _.map(data, function(point) {
         return [ moment(point.Timestamp).utc().unix(), point.Value ];
      });
   },

   _addEmptySlotsToTimeSeries: function(series, additionalMinutes) {
      var lastPoint = _.last(series),
          lastSeconds;

      if (!lastPoint) {
         return;
      }

      lastSeconds = lastPoint[0];

      // Underscore will now make descending ranges if provided with a negative stop. To
      // ensure we don't add extra slots, we need to avoid making a descending range.
      if (additionalMinutes < 0) {
         return;
      }

      _.each(_.range(1, additionalMinutes + 1), function() {
         var seconds = lastSeconds + 60; // Add 1 minute

         series.push([ seconds, null ]);

         lastSeconds = seconds;
      });
   },

   _regress: function(series) {
      return regression[this._regressionType](series, { precision: 50 }).points;
   },
});
