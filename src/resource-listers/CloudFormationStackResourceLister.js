'use strict';

var _ = require('underscore'),
    Q = require('q'),
    Class = require('class.extend'),
    AWS = require('aws-sdk'),
    DCM = require('../index'),
    cfn = new AWS.CloudFormation(),
    dynamo = new AWS.DynamoDB();

module.exports = Class.extend({

   init: function(stackName) {
      this._stackName = stackName;
   },

   listResources: function() {
      var self = this;

      return Q.ninvoke(cfn, 'listStackResources', { StackName: this._stackName })
         .then(function(resp) {
            return _.chain(resp.StackResourceSummaries)
               .where({ ResourceType: 'AWS::DynamoDB::Table' })
               .pluck('PhysicalResourceId')
               .value();
         })
         .then(function(tableNames) {
            return _.reduce(tableNames, function(prev, tableName) {
               return prev.then(function(resources) {
                  return self.convertTableNameToResources(tableName)
                     .then(function(tableResources) {
                        return resources.concat(tableResources);
                     });
               });
            }, Q.when([]));
         })
         .then(function(resources) {
            return resources;
         });
   },

   convertTableNameToResources: function(tableName) {
      return Q.ninvoke(dynamo, 'describeTable', { TableName: tableName })
         .then(function(resp) {
            var resources = [];

            resources.push(this.convertTableToResource(resp.Table, DCM.READ));
            resources.push(this.convertTableToResource(resp.Table, DCM.WRITE));

            _.each(resp.Table.GlobalSecondaryIndexes, function(index) {
               resources.push(this.convertIndexToResource(resp.Table.TableName, index, DCM.READ));
               resources.push(this.convertIndexToResource(resp.Table.TableName, index, DCM.WRITE));
            }.bind(this));

            return resources;
         }.bind(this));
   },

   convertTableToResource: function(table, capacityType) {
      return {
         resourceType: 'table',
         name: DCM.makeResourceName(table.TableName),
         tableName: table.TableName,
         capacityType: capacityType,
         provisioning: {
            lastIncrease: table.ProvisionedThroughput.LastIncreaseDateTime,
            lastDecrease: table.ProvisionedThroughput.LastDecreaseDateTime,
            numberOfDecreasesToday: table.ProvisionedThroughput.NumberOfDecreasesToday,
            currentCapacity: table.ProvisionedThroughput[capacityType],
         },
      };
   },

   convertIndexToResource: function(tableName, index, capacityType) {
      return {
         resourceType: 'index',
         name: DCM.makeResourceName(tableName, index.IndexName),
         tableName: tableName,
         indexName: index.IndexName,
         capacityType: capacityType,
         provisioning: {
            lastIncrease: index.ProvisionedThroughput.LastIncreaseDateTime,
            lastDecrease: index.ProvisionedThroughput.LastDecreaseDateTime,
            numberOfDecreasesToday: index.ProvisionedThroughput.NumberOfDecreasesToday,
            currentCapacity: index.ProvisionedThroughput[capacityType],
         },
      };
   },

});
