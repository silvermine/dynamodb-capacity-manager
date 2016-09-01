'use strict';

var _ = require('underscore'),
    Q = require('q'),
    moment = require('moment'),
    AWS = require('aws-sdk'),
    Class = require('class.extend'),
    cloudwatch = new AWS.CloudWatch();

module.exports = Class.extend({

   // TODO: stop disabling this rule:
   // eslint-disable-next-line max-params
   getStatistic: function(metricName, resource, minutesBack, fillZeroes, minutesToIgnore, divide) {
      var endTime = moment().utc(),
          startTime, params;

      // end at the first millisecond of the current minute (do not retrieve partial minute stats)
      endTime.seconds(0).milliseconds(0).subtract(minutesToIgnore, 'minutes');

      // start at the specified time
      startTime = endTime.clone().subtract(minutesBack, 'minutes');

      params = {
         Namespace: 'AWS/DynamoDB',
         MetricName: metricName,
         StartTime: startTime.toDate(),
         EndTime: endTime.toDate(),
         Period: 60,
         Statistics: [ 'Sum' ],
         Dimensions: [ { Name: 'TableName', Value: resource.tableName } ],
      };

      if (resource.indexName) {
         params.Dimensions.push({ Name: 'GlobalSecondaryIndexName', Value: resource.indexName });
      }

      return Q.ninvoke(cloudwatch, 'getMetricStatistics', params)
         .then(function(resp) {
            return this._fillAsNeeded(resp.Datapoints, startTime, endTime, fillZeroes);
         }.bind(this))
         .then(function(points) {
            if (divide) {
               _.each(points, function(point) {
                  point.value = point.value / 60;
               });
            }
            return points;
         });
   },


   _fillAsNeeded: function(datapoints, start, end, fillWithZeroes) {
      var filledPoints = [],
          valueLookup, time;

      if (!fillWithZeroes) {
         return _.map(datapoints, function(point) {
            return { date: moment(point.Timestamp), value: point.Sum };
         });
      }

      valueLookup = _.reduce(datapoints, function(memo, point) {
         memo[moment(point.Timestamp).unix()] = point.Sum;

         return memo;
      }, {});

      for (time = start.unix(); time < end.unix(); time = time + 60) {
         filledPoints.push({ date: moment.unix(time), value: (valueLookup[time] || 0) });
      }

      return filledPoints;
   },

});
