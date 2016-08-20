'use strict';

var _ = require('underscore'),
    Q = require('q'),
    fs = require('fs'),
    moment = require('moment'),
    yaml = require('js-yaml'),
    Boss = require('../src/boss/DecisionMaker'),
    HOURS_OF_DATA_FOR_BOSS = 1;

module.exports = function(grunt) {

   function updateProvisioned(p, newVal, timestamp, previousTimestamp) {
      var unixTime = moment(timestamp).utc().unix();

      if (moment(timestamp).utc().get('date') !== moment(previousTimestamp).utc().get('date')) {
         p.NumberOfDecreasesToday = 0;
      }

      if (newVal === p.CapacityUnits) {
         return;
      }

      if (newVal > p.CapacityUnits) {
         p.LastIncreaseDateTime = unixTime;
      } else {
         p.LastDecreaseDateTime = unixTime;
         p.NumberOfDecreasesToday = (p.NumberOfDecreasesToday + 1);
      }

      p.CapacityUnits = newVal;
   }

   function runAnalysis(dataFile, configFile, outputFilePath, startingValue) {
      var getConfig = Q.when({}),
          boss;

      if (configFile) {
         getConfig = Q.ninvoke(fs, 'readFile', configFile)
            .then(function(configData) {
               return yaml.safeLoad(configData);
            });
      }

      return Q.all([ Q.ninvoke(fs, 'readFile', dataFile), getConfig ])
         .spread(function(data, config) {
            boss = new Boss(config);
            return data;
         })
         .then(function(data) {
            return _.chain(data.toString().trim().split('\n'))
               .map(function(line) {
                  var columns = line.split(' ');

                  return {
                     Timestamp: columns[0],
                     Value: (columns[1] / 60),
                  };
               })
               .sortBy('Timestamp')
               .value();
         })
         .then(function(data) {
            var throttling = [],
                provisioned, previousTimestamp;

            provisioned = {
               CapacityUnits: startingValue,
               NumberOfDecreasesToday: 0,
               LastIncreaseDateTime: 0,
               LastDecreaseDateTime: 0,
            };

            return _.map(data, function(datapoint, i) {
               var usage = _.last(_.first(data, i + 1), (HOURS_OF_DATA_FOR_BOSS * 60)),
                   newValue;

               if (i >= 15) {
                  newValue = boss.getUpdatedCapacity(provisioned, usage, throttling, datapoint.Timestamp);
                  updateProvisioned(provisioned, newValue, datapoint.Timestamp, previousTimestamp);
               }

               previousTimestamp = datapoint.Timestamp;

               return {
                  Timestamp: datapoint.Timestamp,
                  ConsumedCapacity: datapoint.Value,
                  ProvisionedCapacity: provisioned.CapacityUnits,
               };
            });
         })
         .then(function(data) {
            var fileData = 'timestamp,consumed,provisioned\n';

            _.each(data, function(datapoint) {
               fileData += datapoint.Timestamp + ',' + datapoint.ConsumedCapacity + ',' + datapoint.ProvisionedCapacity + '\n';
            });

            return Q.ninvoke(fs, 'writeFile', outputFilePath, fileData, 'utf8');
         });
   }

   grunt.registerTask('run-sample-analysis', 'Generates what-if scenarios from sample throughput data', function() {
      var dataFile = grunt.option('data-file'),
          outputFile = grunt.option('output-file'),
          done = this.async();

      if (_.isEmpty(dataFile)) {
         grunt.fail.fatal('Must supply a --data-file=<FilePath> parameter');
      }
      if (_.isEmpty(outputFile)) {
         grunt.fail.fatal('Must supply a --output-file=<FilePath> parameter');
      }

      grunt.log.ok('Generating a sample analysis from', dataFile);

      return runAnalysis(dataFile, grunt.option('config-file'), outputFile, parseInt(grunt.option('starting-value'), 10) || 1)
         .then(done)
         .catch(done)
         .done();
   });

};
