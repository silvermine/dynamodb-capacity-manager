'use strict';

var _ = require('underscore'),
    Q = require('q'),
    AWS = require('aws-sdk'),
    DynamoResourceLister = require('./base/DynamoResourceLister'),
    cfn = new AWS.CloudFormation();

module.exports = DynamoResourceLister.extend({

   init: function(stackName) {
      this._stackName = stackName;
   },

   _fetchTableNames: function() {
      return Q.ninvoke(cfn, 'listStackResources', { StackName: this._stackName })
         .then(function(resp) {
            return _.chain(resp.StackResourceSummaries)
               .where({ ResourceType: 'AWS::DynamoDB::Table' })
               .pluck('PhysicalResourceId')
               .value();
         });
   },

});
