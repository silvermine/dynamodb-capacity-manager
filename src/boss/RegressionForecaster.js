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
         return [ moment(point.Timestamp).utc().toDate(), point.Value ];
      });
   },

   _addEmptySlotsToTimeSeries: function(series, additionalMinutes) {
      var lastPoint = _.last(series),
          lastTime;

      if (!lastPoint) {
         return;
      }

      lastTime = lastPoint[0];

      _.each(_.range(1, additionalMinutes + 1), function() {
         var time = moment(lastTime).utc().add(1, 'minutes');

         series.push([ time.toDate(), null ]);

         lastTime = time;
      });
   },

   _regress: function(series) {
      return regression[this._regressionType](series, { precision: 50 }).points;
   },
});
