'use strict';

var _ = require('underscore'),
    Class = require('class.extend'),
    moment = require('moment'),
    DEFAULT_CONFIG;

DEFAULT_CONFIG = {
   AbsoluteMinimumProvisioned: 1,
   AbsoluteMaximumProvisioned: 10,
   MinutesToForecast: 5,
   PreferredForecastPadding: [
      { IfGreaterThan: 0, IfLessThanOrEqual: 30, Percentage: 100 },
      { IfGreaterThan: 30, IfLessThanOrEqual: 100, Percentage: 50 },
      { IfGreaterThan: 100, IfLessThanOrEqual: 1000, Percentage: 25 },
      { IfGreaterThan: 1000, IfLessThanOrEqual: 1000000, Percentage: 15 },
   ],
   MinimumMinutesBetweenIncreases: 0,
   MaximumIncreaseAmount: [
      { IfGreaterThan: 0, IfLessThanOrEqual: 10, Percentage: 100 },
      { IfGreaterThan: 10, IfLessThanOrEqual: 100, Percentage: 50 },
      { IfGreaterThan: 100, IfLessThanOrEqual: 1000, Percentage: 20 },
   ],
   MinimumMinutesBetweenDecreases: 45,
   MinimumDecreaseAmount: [
      { IfGreaterThan: 0, IfLessThanOrEqual: 100, Percentage: 50 },
      { IfGreaterThan: 100, IfLessThanOrEqual: 1000000, Percentage: 30 },
   ],
   AcceptableThrottledRequestsPerTimePeriod: 0,
};

module.exports = Class.extend({

   init: function(config) {
      this._config = _.extend({}, DEFAULT_CONFIG, config);

      this._rules = [
         new (require('./rules/ForecastingRule'))(this._config), // eslint-disable-line global-require
         new (require('./rules/ForecastPaddingRule'))(this._config), // eslint-disable-line global-require
         new (require('./rules/UseForecastForNextCapacityRule'))(this._config), // eslint-disable-line global-require
         new (require('./rules/RequireMinimumDecreaseAmountRule'))(this._config), // eslint-disable-line global-require
         new (require('./rules/EnforceMaximumIncreaseRule'))(this._config), // eslint-disable-line global-require
         new (require('./rules/DisallowTooSoonOrFrequentRule'))(this._config), // eslint-disable-line global-require
         new (require('./rules/DisallowLeavingTooFewDecreasesForFutureSlots'))(this._config), // eslint-disable-line global-require
      ];
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
    * @param {Date} currentTime - leave this undefined unless you're running historical analysis
    * @returns {Integer} the new capacity value for the table or index
    */
   getUpdatedCapacity: function(provisioned, usageData, throttlingData, currentTime) {
      var state;

      state = {
         provisioning: provisioned,
         usage: usageData,
         throttling: throttlingData,
         currentTime: moment(currentTime) || moment(),
         nextCapacity: provisioned.CapacityUnits,
         isAllowedToChange: !_.isEmpty(usageData),
      };

      _.each(this._rules, function(rule) {
         if (state.isAllowedToChange) {
            rule.apply(state);
            // console.log(_.omit(state, 'usage', 'throttling', 'currentTime'));
         }
      });

      return state.isAllowedToChange ? state.nextCapacity : provisioned.CapacityUnits;
   },

});
