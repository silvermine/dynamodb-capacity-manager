'use strict';

var _ = require('underscore'),
    Class = require('class.extend'),
    moment = require('moment'),
    DEFAULT_CONFIG;

DEFAULT_CONFIG = {
   AbsoluteMinimumProvisioned: 1,
   AbsoluteMaximumProvisioned: 10,
   MinutesToForecast: 5,
   MinimumMinutesBetweenIncreases: 0,
   MinimumMinutesBetweenDecreases: 90,
   MinimumIncreaseUnits: 1,
   MaximumIncreaseUnits: [
      { CurrentCapacityMin: 1, CurrentCapacityMax: 10, Percentage: 100 },
      { CurrentCapacityMin: 11, CurrentCapacityMax: 100, Percentage: 50 },
      { CurrentCapacityMin: 101, CurrentCapacityMax: 1000, Percentage: 20 },
   ],
   AcceptableThrottledRequestsPerTimePeriod: 0,
};

module.exports = Class.extend({

   init: function(config) {
      this._config = _.extend({}, DEFAULT_CONFIG, config);
   },

   /**
    * This is the main function you call for getting a decision on what the
    * capacity of the given index or table should be. It examines the current
    * table/index configuration as well as the usage statistics (used capacity
    * and throttling) and limits and configuration you provided at
    * instantiation to make a decision on what the new capacity should be (if
    * there should be a change at all).
    *
    * The `provisioned` object contains the current provisioned throughput data
    * about the table or index returned by `describe-table` mapped to look like
    * what is shown below. Note that since a boss only handles decisions about
    * reads *or* writes, the output of `describe-table` is mapped to look like
    * this, which is agnostic of whether this is a read or write decision (that
    * is, instead of `WriteCapacityUnits` or `ReadCapacityUnits`, there is
    * simply `CapacityUnits`).
    *
    * ```
    * {
    *    NumberOfDecreasesToday: 0,
    *    LastIncreaseDateTime: 401643000.123,
    *    LastDecreaseDateTime: 690921000.123,
    *    CapacityUnits: 100,
    * }
    * ```
    *
    * The `usageData` and `throttlingData` arrays are both arrays of
    * datapoints. Each object in the array must have a `Timestamp` (string in
    * the format shown below) and a `Value` (float, as shown below). **NOTE**
    * that if you take CloudWatch metrics and pass them into this function, you
    * need to take the CloudWatch sum for each datapoint and divide it by the
    * period you specified. For example, if you call CloudWatch with a period
    * of sixty seconds and get the sum, it's the sum of all capacity used in
    * that one-minute period. Since DynamoDB capacity is a per-second metric,
    * you then divide what CloudWatch gave you by sixty (the period) and get a
    * per-second average. That value is the real capacity unit value we need
    * for making capacity decisions.
    *
    * We recommend using a one-minute period, and passing in the previous
    * hour's worth of data.
    *
    * TODO: is one hour the correct amount of data we need?
    *
    * ```
    * [
    *    {
    *       Timestamp: "2016-08-07T23:14:00Z",
    *       Value: 50.4,
    *    },
    *    {
    *       Timestamp: "2016-08-07T23:15:00Z",
    *       Value: 51.2,
    *    },
    * ]
    * ```
    *
    * @param {Object} provisioned - the table's current capacity, etc - see note above
    * @param {Array} usageData - the used capacity metrics - see note above
    * @param {Array} throttlingData - the used capacity metrics - see note above
    * @returns {Integer} the new capacity value for the table or index
    */
   getUpdatedCapacity: function(provisioned, usageData, throttlingData) {
      var forecastUsageValue = this.forecastUsage(usageData),
          recentUnacceptableThrottledRequestCount = this.getRecentUnacceptableThrottledRequestCount(throttlingData),
          nextAllowedIncrease = moment.unix(provisioned.LastIncreaseDateTime).add(this._config.MinimumMinutesBetweenIncreases, 'minutes'),
          nextAllowedDecrease = moment.unix(provisioned.LastDecreaseDateTime).add(this._config.MinimumMinutesBetweenDecreases, 'minutes');

      if (forecastUsageValue > provisioned.CapacityUnits) {
         // trending up, may need to consider an increase
         if (nextAllowedIncrease.isAfter(moment())) {
            // short-circuit: do not allow an increase sooner than configured min minutes between increases
            return provisioned.CapacityUnits;
         }

         // TODO: implement real rules
         return forecastUsageValue;
      }

      // trending down, may need to consider a decrease
      if (nextAllowedDecrease.isAfter(moment()) || provisioned.NumberOfDecreasesToday >= 4) {
         // short-circuit: do not allow an decrease sooner than configured min minutes between increases
         // or if we've already hit our max decrease limit
         return provisioned.CapacityUnits;
      }

      // TODO: implement real rules
      return forecastUsageValue;
   },


   forecastUsage: function(usageData) {
      // TODO: implement
      return Math.ceil(_.chain(usageData).pluck('Value').max().value() + 10);
   },


   getRecentUnacceptableThrottledRequestCount: function(throttlingData) {
      // TODO: implement
      return 0;
   },


});
