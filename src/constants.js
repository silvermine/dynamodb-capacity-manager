'use strict';

module.exports = {

   READ: 'ReadCapacityUnits',
   WRITE: 'WriteCapacityUnits',

   DEFAULT_RESOURCE_CONFIG: {
      AbsoluteMinimumProvisioned: 1,
      AbsoluteMaximumProvisioned: 10,
      MinutesOfStatsToRetrieve: 20,
      MinutesOfStatsToIgnore: 2,
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
      MinimumMinutesBeforeDecreaseAfterIncrease: 15,
      MaximumDecreasesToUsePerDay: 4,
   },

};
