'use strict';

var _ = require('underscore'),
    Class = require('class.extend'),
    minimatch = require('minimatch'),
    Runner = require('./Runner'),
    constants = require('./constants'),
    resourceUtils = require('./util/resource');

module.exports = Class.extend({

   init: function() {
      this._resourceLister = null;
      this._excludedResources = [];
      this._handleReads = false;
      this._handleWrites = false;
      this._userDefaultConfig = {};
      this._userDefaultConfigByType = {};
      this._resourceConfigs = [];
   },

   findResourcesWith: function(resourceLister) {
      this._resourceLister = resourceLister;
      return this;
   },

   excludeTable: function(tableName, capacityType, alsoExcludeIndexes) {
      this._excludedResources.push({
         resourceType: 'table',
         name: resourceUtils.makeResourceName(tableName),
         capacityType: capacityType,
      });

      if (alsoExcludeIndexes) {
         this.excludeIndex(tableName, '*', capacityType);
      }
   },

   excludeIndex: function(tableName, indexName, capacityType) {
      this._excludedResources.push({
         resourceType: 'index',
         name: resourceUtils.makeResourceName(tableName, indexName),
         capacityType: capacityType,
      });
   },

   isExcludedResource: function(resource) {
      return !!_.find(this._excludedResources, function(exc) {
         var resourceTypeMatches = resource.resourceType === exc.resourceType,
             nameMatches = minimatch(resource.name, exc.name),
             isCorrectResource = resourceTypeMatches && nameMatches;

         if (!isCorrectResource) {
            return false;
         }

         if (exc.capacityType) {
            return resource.capacityType === exc.capacityType;
         }

         // this is the correct resource, and no exclusion type was specified, so the
         // user wants the resource entirely excluded, not just one type
         return true;
      });
   },

   handleReads: function() {
      this._handleReads = true;
      return this;
   },

   handleWrites: function() {
      this._handleWrites = true;
      return this;
   },

   handleReadsAndWrites: function() {
      return this.handleReads().handleWrites();
   },

   defaultRuleConfig: function(type, config) {
      // NOTE: type is optional
      if (type && config) {
         if (_.isString(type) && _.isObject(config)) {
            this._userDefaultConfigByType[type] = config;
         } else {
            throw new Error('When both type and config are supplied to defaultRuleConfig, type must be a string, and config an object');
         }
      } else if (_.isObject(type)) {
         // type, not config - because type wasn't supplied
         this._userDefaultConfig = type || {};
      } else {
         throw new Error('When no type is supplied to defaultRuleConfig, the first parameter must be an object');
      }

      return this;
   },

   ruleConfigForTable: function(tableName, type, config) {
      return this._saveRuleConfigForResource(tableName, undefined, 'table', type, config);
   },

   ruleConfigForIndex: function(tableName, indexName, type, config) {
      return this._saveRuleConfigForResource(tableName, indexName, 'index', type, config);
   },

   _saveRuleConfigForResource: function(tableName, indexName, resourceType, capacityType, config) {
      var resourceName = resourceUtils.makeResourceName(tableName, indexName);

      this._resourceConfigs.push({
         name: resourceName,
         resourceType: resourceType,
         capacityType: capacityType,
         config: _.extend({}, config),
      });

      return this;
   },

   _allRuleConfigsForResource: function(resource) {
      var groupedConfigs;

      groupedConfigs = _.chain(this._resourceConfigs)
         .filter(function(config) {
            return (resource.capacityType === config.capacityType
               && resource.resourceType === config.resourceType
               && minimatch(resource.name, config.name));
         })
         .groupBy(function(config) {
            return config.name.indexOf('*') === -1 ? 'specific' : 'wildcard';
         })
         .value();

      return _.pluck(_.union(groupedConfigs.wildcard, groupedConfigs.specific), 'config');
   },

   _mergeResourceConfigs: function(configs) {
      // This is the equivalent of _.extend({}, configs[0], configs[1], ...)
      return _.extend.apply(_, _.flatten([ {}, configs ], true));
   },

   getConfigForResource: function(resource) {
      var allConfigs;

      allConfigs = _.flatten(
         [
            constants.DEFAULT_RESOURCE_CONFIG,
            this._userDefaultConfig,
            this._userDefaultConfigByType[resource.capacityType],
            this._allRuleConfigsForResource(resource),
         ],
         true
      );

      return this._mergeResourceConfigs(allConfigs);
   },

   build: function() {
      // TODO: validate that required configuration was supplied
      return new Runner(this);
   },

});
