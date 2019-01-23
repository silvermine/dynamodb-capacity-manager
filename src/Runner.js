'use strict';

var _ = require('underscore'),
    Q = require('q'),
    moment = require('moment'),
    AWS = require('aws-sdk'),
    DCM = require('./index'),
    Boss = require('./boss/DecisionMaker'),
    Class = require('class.extend'),
    StatisticsRetriever = require('./StatisticsRetriever'),
    stats = new StatisticsRetriever(),
    dynamo = new AWS.DynamoDB();

// A resource looks like:
// {
//    resourceType: 'table', // or 'index',
//    name: 'Table::Index',
//    tableName: 'Table',
//    indexName: '_id',
//    capacityType: 'ReadCapacityUnits', // or 'WriteCapacityUnits'
//    provisioning {
//       lastIncrease: Date,
//       lastDecrease: Date,
//       numberOfDecreasesToday: 2,
//       currentCapacity: 10,
//    },
//    usageStats: [], // filled in by _loadRelevantStatistics
//    throttlingStats: [], // filled in by _loadRelevantStatistics
//    updatedCapacity: 10, // filled in by _makeDecisionsAboutResource
// }
module.exports = Class.extend({

   init: function(builder) {
      this._builder = builder;
   },

   previewChanges: function() {
      return this._builder._resourceLister.listResources()
         .then(this._removeExcludedResources.bind(this))
         .then(function(resources) {
            function reduceResource(prev, resource) {
               return prev
                  .then(this._loadRelevantStatistics.bind(this, resource))
                  .then(this._logResourceInfo.bind(this, resource))
                  .then(this._makeDecisionsAboutResource.bind(this, resource));
            }

            return _.reduce(resources, reduceResource.bind(this), Q.when())
               .then(function() {
                  return resources;
               });
         }.bind(this))
         .then(this._convertToChanges.bind(this))
         .then(this._logChanges.bind(this, false));
   },

   executeChanges: function(changes) {
      return _.reduce(changes, this._executeTableChangeReducer.bind(this), Q.when([]))
         .then(function(allExecutedChanges) {
            return _.groupBy(allExecutedChanges, 'tableName');
         })
         .then(this._logChanges.bind(this, true));
   },

   _executeTableChangeReducer: function(prev, plannedChanges, tableName) {
      return prev
         .then(function(executedChanges) {
            return this._executeTableChange(tableName, plannedChanges)
               .then(function(tableExecutedChanges) {
                  return executedChanges.concat(tableExecutedChanges);
               });
         }.bind(this));
   },

   _executeTableChange: function(tableName, plannedChanges) {
      return Q.ninvoke(dynamo, 'describeTable', { TableName: tableName })
         .then(function(describeResp) {
            var params = this._makeUpdateTableParams(describeResp.Table, plannedChanges),
                executedChanges = params.executedChanges,
                realParams = _.omit(params, 'executedChanges');

            if (_.isEmpty(executedChanges) || _.isEmpty(realParams)) {
               // no update is needed
               return [];
            }

            return Q.ninvoke(dynamo, 'updateTable', _.omit(params, 'executedChanges'))
               .then(function() {
                  return executedChanges;
               })
               .catch(function(err) {
                  console.log('ERROR: could not update table:', err, err.stack);
                  return [];
               });
         }.bind(this));
   },

   _makeUpdateTableParams: function(tableDesc, plannedChanges) {
      var executedChanges = [],
          params;

      if (tableDesc.TableStatus !== 'ACTIVE') {
         console.log('not updating anything on table %s because it is in state %s', tableDesc.TableName, tableDesc.TableStatus);
         return {};
      }

      params = _.pick(tableDesc, 'TableName');
      params.ProvisionedThroughput = _.pick(tableDesc.ProvisionedThroughput, 'ReadCapacityUnits', 'WriteCapacityUnits');

      // we store this here just to return it from this function
      // the caller must remove it before using it in a call to AWS
      params.executedChanges = executedChanges;

      function applyChange(objParams, change) {
         var realCurrentValue = objParams.ProvisionedThroughput[change.capacityType];

         if (realCurrentValue === change.originalCapacity) {
            executedChanges.push(change);
            objParams.ProvisionedThroughput[change.capacityType] = change.updatedCapacity;
         } else {
            console.log(
               'not updating %s %s: the current capacity (%d) does not match the capacity we had when planning the change (%d)',
               change.name,
               change.capacityType,
               realCurrentValue,
               change.originalCapacity
            );
         }
      }

      function isIndexChange(change) {
         return change.indexName !== undefined;
      }

      // make the changes that apply to the table itself
      _.chain(plannedChanges).reject(isIndexChange).each(applyChange.bind(null, params));

      if (executedChanges.length === 0) {
         // if we are not actually executing any changes on the table throughput we should
         // not supply the ProvisionedThroughput parameter for the table itself
         params = _.omit(params, 'ProvisionedThroughput');
      }

      // now make the changes that apply to the indexes on the table
      _.each(tableDesc.GlobalSecondaryIndexes, function(gsi) {
         var gsiProvisionedThroughput = _.pick(gsi.ProvisionedThroughput, 'ReadCapacityUnits', 'WriteCapacityUnits'),
             gsiUpdateParams = { IndexName: gsi.IndexName, ProvisionedThroughput: gsiProvisionedThroughput },
             thisIndexChanges = _.where(plannedChanges, { indexName: gsi.IndexName }),
             numberOfChangesMade = executedChanges.length;

         if (thisIndexChanges.length === 0) {
            return;
         }

         if (gsi.IndexStatus !== 'ACTIVE') {
            console.log('not updating index %s::%s because it is in state %s', tableDesc.TableName, gsi.IndexName, gsi.IndexStatus);
            return;
         }

         _.each(thisIndexChanges, applyChange.bind(null, gsiUpdateParams));

         if (executedChanges.length > numberOfChangesMade) {
            // we made changes with this particular index, so we need to apply those to
            // the table update params
            if (!params.GlobalSecondaryIndexUpdates) {
               params.GlobalSecondaryIndexUpdates = [];
            }

            params.GlobalSecondaryIndexUpdates.push({ Update: gsiUpdateParams });
         }
      });

      return params;
   },

   _logChanges: function(haveBeenExecuted, allChanges) {
      _.each(allChanges, function(tableChanges, tableName) {
         console.log('for table %s %s the following changes:', tableName, (haveBeenExecuted ? 'we made' : 'we plan to make'));
         _.each(tableChanges, function(change) {
            console.log('\t%s %s from %s to %s', change.name, change.capacityType, change.originalCapacity, change.updatedCapacity);
         });
      });

      return allChanges;
   },

   run: function() {
      return this.previewChanges().then(this.executeChanges.bind(this));
   },

   _removeExcludedResources: function(resources) {
      return _.reject(resources, function(resource) {
         var isExcludedType = false;

         // now do exclusions based on the type of the resource and whether this runner
         // actually handles that type
         if (!this._builder._handleReads && resource.capacityType === DCM.READ) {
            isExcludedType = true;
         } else if (!this._builder._handleWrites && resource.capacityType === DCM.WRITE) {
            isExcludedType = true;
         }

         return this._builder.isExcludedResource(resource) || isExcludedType;
      }.bind(this));
   },

   _loadRelevantStatistics: function(resource) {
      var consumedStatName = 'Consumed' + resource.capacityType,
          throttledStatName = (resource.capacityType === DCM.READ ? 'Read' : 'Write') + 'ThrottleEvents',
          resourceConfig = this._builder.getConfigForResource(resource),
          minutesToRetrieve = resourceConfig.MinutesOfStatsToRetrieve,
          minutesToIgnore = resourceConfig.MinutesOfStatsToIgnore,
          promises;

      promises = [
         stats.getStatistic(consumedStatName, resource, minutesToRetrieve, true, minutesToIgnore),
         stats.getStatistic(throttledStatName, resource, minutesToRetrieve, true, minutesToIgnore),
      ];

      return Q.all(promises)
         .spread(function(consumed, throttled) {
            resource.usageStats = consumed;
            resource.throttlingStats = throttled;
            return resource;
         });
   },

   _logResourceInfo: function(resource) {
      console.log(
         'Resource "%s" (%s) current capacity %s, %d decreases today (most recent %s), usage stats: %s, throttling: %s',
         resource.name,
         resource.capacityType,
         resource.provisioning.currentCapacity,
         resource.provisioning.numberOfDecreasesToday,
         resource.provisioning.lastDecrease,
         _.chain(resource.usageStats).last(3).pluck('value').value().join(', '),
         _.chain(resource.throttlingStats).last(3).pluck('value').value().join(', ')
      );
   },

   _makeDecisionsAboutResource: function(resource) {
      var resourceConfig = this._builder.getConfigForResource(resource),
          boss = new Boss(resourceConfig),
          provisioning, usage, throttling, newCapacity;

      // This check would be better as a rule for the Boss. However, since rules don't
      // currently have access to the resource, this will be a fairly major adjustment.
      // Therefore, putting this "rule" here until the rules are refactored (see the TODO
      // below).
      if (this._shouldDisallowChangesSoonAfterTableCreation(resourceConfig, resource)) {
         resource.updatedCapacity = resource.provisioning.currentCapacity;
         return resource;
      }

      // TODO: we should not need to map between the data format we're using here for
      // provisioning and the data format the boss expects. This class is using our
      // standard naming convention, which starts variables with a lower case number. The
      // boss was using AWS' format, which has upper case letters. In a subsequent commit
      // we need to refactor the boss, all rules, tests, etc, to use this standard and
      // stop doing the mapping here.
      provisioning = {
         NumberOfDecreasesToday: resource.provisioning.numberOfDecreasesToday,
         LastIncreaseDateTime: resource.provisioning.lastIncrease,
         LastDecreaseDateTime: resource.provisioning.lastDecrease,
         CapacityUnits: resource.provisioning.currentCapacity,
      };

      function statMapper(stat) {
         return { Timestamp: stat.date.format(), Value: stat.value };
      }

      usage = _.map(resource.usageStats, statMapper);
      throttling = _.map(resource.throttlingStats, statMapper);

      newCapacity = boss.getUpdatedCapacity(provisioning, usage, throttling);

      resource.updatedCapacity = newCapacity;
      return resource;
   },

   _shouldDisallowChangesSoonAfterTableCreation: function(config, resource, currentTime) {
      var earliestTableCanBeAdjustedAfterCreation;

      if (!config.MinimumMinutesBeforeAdjustingNewTable || _.isUndefined(resource.tableCreationDateTime)) {
         return false;
      }

      currentTime = currentTime || moment();
      earliestTableCanBeAdjustedAfterCreation = moment(resource.tableCreationDateTime)
         .add(config.MinimumMinutesBeforeAdjustingNewTable, 'minutes');

      return moment(currentTime).isBefore(earliestTableCanBeAdjustedAfterCreation);
   },

   _convertToChanges: function(resources) {
      return _.chain(resources)
         .map(function(resource) {
            var change = null;

            if (resource.provisioning.currentCapacity !== resource.updatedCapacity) {
               change = _.pick(resource, 'name', 'tableName', 'indexName', 'capacityType', 'updatedCapacity');
               change.originalCapacity = resource.provisioning.currentCapacity;
            }

            return change;
         })
         .filter(_.identity)
         .sortBy(function(r) {
            return r.name + '::' + r.capacityType;
         })
         .groupBy('tableName')
         .value();
   },

});
