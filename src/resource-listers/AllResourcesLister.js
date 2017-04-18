'use strict';

var _ = require('underscore'),
    Q = require('q'),
    AWS = require('aws-sdk'),
    DynamoResourceLister = require('./base/DynamoResourceLister'),
    dynamo = new AWS.DynamoDB();

module.exports = DynamoResourceLister.extend({

   _fetchTableNames: function() {
      return this._fetchAll(dynamo, 'listTables', {}, 'ExclusiveStartTableName', 'LastEvaluatedTableName')
         .then(function(resps) {
            return _.flatten(_.pluck(resps, 'TableNames'));
         });
   },

   _fetchAll: function(service, methodName, request, requestPaginationTokenName, responsePaginationTokenName) {
      var deferred = Q.defer(),
          responses = [],
          next = null;

      function loop() {
         var params;

         params = _.extend({}, request);
         params[requestPaginationTokenName] = next;

         return Q.ninvoke(service, methodName, params)
            .then(function(resp) {
               responses.push(resp);

               if (resp[responsePaginationTokenName]) {
                  next = resp[responsePaginationTokenName];
                  Q.nextTick(loop);
               } else {
                  deferred.resolve(responses);
               }
            })
            .catch(function(err) {
               console.log('ERROR:', err, err.stack);
               deferred.reject(err);
            });
      }

      Q.nextTick(loop);

      return deferred.promise;
   },

});
