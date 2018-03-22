'use strict';

var _ = require('underscore'),
    Q = require('q'),
    fs = require('fs'),
    moment = require('moment'),
    StatisticsRetriever = require('../src/StatisticsRetriever'),
    constants = require('../src/constants'),
    stats = new StatisticsRetriever(),
    MAX_MINUTES_PER_TIMESLICE = 1440;

module.exports = function(grunt) {

   function exportThroughputData(resource, outputFilePath, minutesToRetrieve, minutesToIgnore) {
      var consumedStatName = 'Consumed' + resource.capacityType,
          endTime = moment().utc().seconds(0).milliseconds(0).subtract(minutesToIgnore, 'minutes'),
          latestSliceStartTime = endTime.clone().subtract(Math.min(minutesToRetrieve, MAX_MINUTES_PER_TIMESLICE), 'minutes'),
          startTime = endTime.clone().subtract(minutesToRetrieve, 'minutes'),
          timeslices = [ { end: endTime, start: latestSliceStartTime } ],
          promises;

      timeslices = _.reduce(_.range(0, Math.floor(minutesToRetrieve / MAX_MINUTES_PER_TIMESLICE)), function(memo) {
         var end = _.last(memo).start.clone(),
             start = end.clone().subtract(MAX_MINUTES_PER_TIMESLICE, 'minutes');

         if (start.isBefore(startTime)) {
            start = startTime;
         }

         if (!end.isSameOrBefore(startTime)) {
            memo.push({
               end: end,
               start: start,
            });
         }

         return memo;
      }, timeslices);

      promises = Q.all(_.map(timeslices, function(timeslice) {
         return stats.getStatisticForTimeslice(consumedStatName, resource, timeslice.start, timeslice.end, true);
      }));

      return promises
         .then(function(data) {
            var fileData;

            fileData = _.chain(data)
               .flatten(true)
               .sortBy(function(point) {
                  return moment(point.date).unix();
               })
               .reduce(function(memo, point) {
                  return memo + moment(point.date).toISOString() + ' ' + point.value + '\n';
               }, '')
               .value();

            return Q.ninvoke(fs, 'writeFile', outputFilePath, fileData, 'utf8');
         });
   }

   grunt.registerTask('export-cloudwatch-data-sample', 'Exports throughput data for a given table from CloudWatch', function() {
      var tableName = grunt.option('table'),
          outputFile = grunt.option('output-file'),
          done = this.async(),
          resource, capacityType, minutesToRetrieve, minutesToIgnore;

      capacityType = (grunt.option('capacity-type') === constants.WRITE ? constants.WRITE : constants.READ);
      minutesToRetrieve = grunt.option('retrieve-minutes') || (1 * 24 * 60); // Default: 1 day
      minutesToIgnore = grunt.option('ignore-minutes') || 2; // Default: 2 minutes

      if (_.isEmpty(tableName)) {
         grunt.fail.fatal('Must supply a --table=<TableName> parameter');
      }
      if (_.isEmpty(outputFile)) {
         grunt.fail.fatal('Must supply a --output-file=<FilePath> parameter');
      }

      resource = {
         tableName: tableName,
         indexName: grunt.option('index-name'),
         capacityType: capacityType,
      };

      grunt.log.ok('Exporting throughput data from CloudWatch for', resource);

      return exportThroughputData(resource, outputFile, minutesToRetrieve, minutesToIgnore)
         .then(done)
         .catch(done)
         .done();
   });

};
