'use strict';

var _ = require('underscore'),
    Class = require('class.extend'),
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
      this._perResourceConfigs = {};
   },

   findResourcesWith: function(resourceLister) {
      this._resourceLister = resourceLister;
      return this;
   },

   excludeTable: function(tableName, capacityType) {
      this._excludedResources.push({ name: resourceUtils.makeResourceName(tableName), type: capacityType });
   },

   excludeIndex: function(tableName, indexName, capacityType) {
      this._excludedResources.push({ name: resourceUtils.makeResourceName(tableName, indexName), type: capacityType });
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
      return this._saveRuleConfigForResource(tableName, undefined, type, config);
   },

   ruleConfigForIndex: function(tableName, indexName, type, config) {
      return this._saveRuleConfigForResource(tableName, indexName, type, config);
   },

   _saveRuleConfigForResource: function(tableName, indexName, type, config) {
      var resourceName = resourceUtils.makeResourceName(tableName, indexName);

      if (!this._perResourceConfigs[resourceName]) {
         this._perResourceConfigs[resourceName] = {};
      }

      this._perResourceConfigs[resourceName][type] = config;
      return this;
   },

   getConfigForResource: function(resource) {
      var perResource = this._perResourceConfigs[resource.name],
          defaultForType = this._userDefaultConfigByType[resource.capacityType],
          forResourceType = perResource ? perResource[resource.capacityType] : {};

      return _.extend({}, constants.DEFAULT_RESOURCE_CONFIG, this._userDefaultConfig, defaultForType, forResourceType);
   },

   build: function() {
      // TODO: validate that required configuration was supplied
      return new Runner(this);
   },

});
