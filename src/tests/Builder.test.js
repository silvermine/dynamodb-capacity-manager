'use strict';

var _ = require('underscore'),
    expect = require('expect.js'),
    constants = require('../constants'),
    Builder = require('../Builder');

describe('Builder', function() {

   var defaultConfig = constants.DEFAULT_RESOURCE_CONFIG,
       tbl1R = { resourceType: 'table', name: 'Tbl1', tableName: 'Tbl1', capacityType: 'ReadCapacityUnits' },
       tbl1W = { resourceType: 'table', name: 'Tbl1', tableName: 'Tbl1', capacityType: 'WriteCapacityUnits' },
       tbl1idR = { resourceType: 'index', name: 'Tbl1::_id', tableName: 'Tbl1', indexName: '_id', capacityType: 'ReadCapacityUnits' },
       tbl1idW = { resourceType: 'index', name: 'Tbl1::_id', tableName: 'Tbl1', indexName: '_id', capacityType: 'WriteCapacityUnits' },
       tbl1NameR = { resourceType: 'index', name: 'Tbl1::_name', tableName: 'Tbl1', indexName: '_name', capacityType: 'ReadCapacityUnits' },
       tbl2R = { resourceType: 'table', name: 'Tbl2', tableName: 'Tbl2', capacityType: 'ReadCapacityUnits' },
       tbl2W = { resourceType: 'table', name: 'Tbl2', tableName: 'Tbl2', capacityType: 'WriteCapacityUnits' },
       tbl2idR = { resourceType: 'index', name: 'Tbl2::_id', tableName: 'Tbl2', indexName: '_id', capacityType: 'ReadCapacityUnits' },
       tbl2idW = { resourceType: 'index', name: 'Tbl2::_id', tableName: 'Tbl2', indexName: '_id', capacityType: 'WriteCapacityUnits' },
       customUserConfig, customUserConfigForType, wildcardResourceConfig, specificResourceConfig,
       builder;

   customUserConfig = {
      AbsoluteMinimumProvisioned: 9999,
      AbsoluteMaximumProvisioned: 9998,
      MinutesOfStatsToRetrieve: 9997,
      MinutesOfStatsToIgnore: 9996,
   };

   customUserConfigForType = {
      AbsoluteMaximumProvisioned: 8999,
      MinutesOfStatsToRetrieve: 8998,
      MinutesOfStatsToIgnore: 8997,
   };

   wildcardResourceConfig = {
      MinutesOfStatsToRetrieve: 7999,
      MinutesOfStatsToIgnore: 7998,
   };

   specificResourceConfig = {
      MinutesOfStatsToIgnore: 6999,
   };

   expect(customUserConfig.AbsoluteMinimumProvisioned).to.not.eql(defaultConfig.AbsoluteMinimumProvisioned);
   expect(customUserConfig.AbsoluteMaximumProvisioned).to.not.eql(defaultConfig.AbsoluteMaximumProvisioned);
   expect(customUserConfig.MinutesOfStatsToRetrieve).to.not.eql(defaultConfig.MinutesOfStatsToRetrieve);
   expect(customUserConfig.MinutesOfStatsToIgnore).to.not.eql(defaultConfig.MinutesOfStatsToIgnore);
   expect(customUserConfigForType.AbsoluteMaximumProvisioned).to.not.eql(defaultConfig.AbsoluteMaximumProvisioned);
   expect(customUserConfigForType.MinutesOfStatsToRetrieve).to.not.eql(defaultConfig.MinutesOfStatsToRetrieve);
   expect(customUserConfigForType.MinutesOfStatsToIgnore).to.not.eql(defaultConfig.MinutesOfStatsToIgnore);
   expect(wildcardResourceConfig.MinutesOfStatsToRetrieve).to.not.eql(defaultConfig.MinutesOfStatsToRetrieve);
   expect(wildcardResourceConfig.MinutesOfStatsToIgnore).to.not.eql(defaultConfig.MinutesOfStatsToIgnore);
   expect(specificResourceConfig.MinutesOfStatsToIgnore).to.not.eql(defaultConfig.MinutesOfStatsToIgnore);

   beforeEach(function() {
      builder = new Builder();
   });

   describe('resource exclusion', function() {

      it('excludes a particular resource by name - tables', function() {
         builder.excludeTable(tbl1R.tableName);
         expect(builder.isExcludedResource(tbl1R)).to.be(true);
         expect(builder.isExcludedResource(tbl1W)).to.be(true);
         expect(builder.isExcludedResource(tbl1idR)).to.be(false);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('excludes a particular resource by name - indexes', function() {
         builder.excludeIndex(tbl1idR.tableName, tbl1idR.indexName);
         expect(builder.isExcludedResource(tbl1R)).to.be(false);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true);
         expect(builder.isExcludedResource(tbl1idW)).to.be(true);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('excludes multiple tables by using a wildcard in the name', function() {
         builder.excludeTable('Tbl*');
         expect(builder.isExcludedResource(tbl1R)).to.be(true);
         expect(builder.isExcludedResource(tbl1W)).to.be(true);
         expect(builder.isExcludedResource(tbl1idR)).to.be(false);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(true);
         expect(builder.isExcludedResource(tbl2W)).to.be(true);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('still excludes an individual table when there is a wildcard at the end of the table name', function() {
         builder.excludeTable('Tbl1*');
         expect(builder.isExcludedResource(tbl1R)).to.be(true);
         expect(builder.isExcludedResource(tbl1W)).to.be(true);
         expect(builder.isExcludedResource(tbl1idR)).to.be(false);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('excludes indexes on single table matched by a wildcard in the index name', function() {
         builder.excludeIndex('Tbl1', '*id');
         expect(builder.isExcludedResource(tbl1R)).to.be(false);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true);
         expect(builder.isExcludedResource(tbl1idW)).to.be(true);
         expect(builder.isExcludedResource(tbl1NameR)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('excludes indexes on multiple tables by using a wildcard in the table name', function() {
         builder.excludeIndex('Tbl*', '*');
         expect(builder.isExcludedResource(tbl1R)).to.be(false);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true);
         expect(builder.isExcludedResource(tbl1idW)).to.be(true);
         expect(builder.isExcludedResource(tbl1NameR)).to.be(true);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(true);
         expect(builder.isExcludedResource(tbl2idW)).to.be(true);
      });

      it('still excludes index when there is a wildcard at the end of the table name', function() {
         builder.excludeIndex('Tbl1*', '_id');
         expect(builder.isExcludedResource(tbl1R)).to.be(false);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true);
         expect(builder.isExcludedResource(tbl1idW)).to.be(true);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('still excludes index when there is a wildcard at the end of the index name', function() {
         builder.excludeIndex('Tbl1', '_id*');
         expect(builder.isExcludedResource(tbl1R)).to.be(false);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true);
         expect(builder.isExcludedResource(tbl1idW)).to.be(true);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('excludes a particular resource for capacity type - tables', function() {
         builder.excludeTable(tbl1R.tableName, tbl1R.capacityType);
         expect(builder.isExcludedResource(tbl1R)).to.be(true);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(false);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);

         builder.excludeTable(tbl1W.tableName, tbl1W.capacityType);
         expect(builder.isExcludedResource(tbl1R)).to.be(true); // excluded by previous builder call
         expect(builder.isExcludedResource(tbl1W)).to.be(true);
         expect(builder.isExcludedResource(tbl1idR)).to.be(false);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('excludes a particular resource for capacity type - indexes', function() {
         builder.excludeIndex(tbl1idR.tableName, tbl1idR.indexName, tbl1idR.capacityType);
         expect(builder.isExcludedResource(tbl1R)).to.be(false);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);

         builder.excludeIndex(tbl1idW.tableName, tbl1idW.indexName, tbl1idW.capacityType);
         expect(builder.isExcludedResource(tbl1R)).to.be(false);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true); // excluded by previous builder call
         expect(builder.isExcludedResource(tbl1idW)).to.be(true);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('excludes wildcard matches to tables for capacity type', function() {
         builder.excludeTable('*1', constants.READ);
         expect(builder.isExcludedResource(tbl1R)).to.be(true);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(false);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);

         builder.excludeTable('Tbl*', constants.WRITE);
         expect(builder.isExcludedResource(tbl1R)).to.be(true); // excluded by previous builder call
         expect(builder.isExcludedResource(tbl1W)).to.be(true);
         expect(builder.isExcludedResource(tbl1idR)).to.be(false);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(true);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('excludes wildcard matches to indexes for capacity type', function() {
         builder.excludeIndex('*1', '*id', constants.READ);
         expect(builder.isExcludedResource(tbl1R)).to.be(false);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);

         builder.excludeIndex('Tbl*', '*', constants.WRITE);
         expect(builder.isExcludedResource(tbl1R)).to.be(false);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true); // excluded by previous builder call
         expect(builder.isExcludedResource(tbl1idW)).to.be(true);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(true);
      });

      it('excludes a particular resource when redundancy exists', function() {
         builder.excludeTable(tbl1R.tableName, tbl1R.capacityType);
         builder.excludeTable(tbl1R.tableName);
         builder.excludeIndex(tbl2idR.tableName, tbl2idR.indexName);
         builder.excludeIndex(tbl2idR.tableName, tbl2idR.indexName, tbl2idR.capacityType);
         expect(builder.isExcludedResource(tbl1R)).to.be(true);
         expect(builder.isExcludedResource(tbl1W)).to.be(true);
         expect(builder.isExcludedResource(tbl1idR)).to.be(false);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(true);
         expect(builder.isExcludedResource(tbl2idW)).to.be(true);
      });

      it('excludes indexes along with table, as requested, when matched by name', function() {
         builder.excludeTable('Tbl1', undefined, true);
         expect(builder.isExcludedResource(tbl1R)).to.be(true);
         expect(builder.isExcludedResource(tbl1W)).to.be(true);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true);
         expect(builder.isExcludedResource(tbl1idW)).to.be(true);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);
      });

      it('excludes indexes along with table, as requested, when matched by a wildcard', function() {
         builder.excludeTable('Tbl*', undefined, true);
         expect(builder.isExcludedResource(tbl1R)).to.be(true);
         expect(builder.isExcludedResource(tbl1W)).to.be(true);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true);
         expect(builder.isExcludedResource(tbl1idW)).to.be(true);
         expect(builder.isExcludedResource(tbl2R)).to.be(true);
         expect(builder.isExcludedResource(tbl2W)).to.be(true);
         expect(builder.isExcludedResource(tbl2idR)).to.be(true);
         expect(builder.isExcludedResource(tbl2idW)).to.be(true);
      });

      it('excludes indexes along with table, as requested, when matched by name and capacity type', function() {
         builder.excludeTable('Tbl1', constants.READ, true);
         expect(builder.isExcludedResource(tbl1R)).to.be(true);
         expect(builder.isExcludedResource(tbl1W)).to.be(false);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true);
         expect(builder.isExcludedResource(tbl1idW)).to.be(false);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(false);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(false);

         builder.excludeTable('Tbl*', constants.WRITE, true);
         expect(builder.isExcludedResource(tbl1R)).to.be(true); // excluded by previous builder call
         expect(builder.isExcludedResource(tbl1W)).to.be(true);
         expect(builder.isExcludedResource(tbl1idR)).to.be(true); // excluded by previous builder call
         expect(builder.isExcludedResource(tbl1idW)).to.be(true);
         expect(builder.isExcludedResource(tbl2R)).to.be(false);
         expect(builder.isExcludedResource(tbl2W)).to.be(true);
         expect(builder.isExcludedResource(tbl2idR)).to.be(false);
         expect(builder.isExcludedResource(tbl2idW)).to.be(true);
      });

   });

   describe('rule configuration', function() {

      it('allows config to be added in a chain', function() {
         expect(builder.ruleConfigForTable(tbl1R.tableName, tbl1R.capacityType, {})).to.be(builder);
         expect(builder.ruleConfigForTable(tbl1W.tableName, tbl1W.capacityType, {})).to.be(builder);
         expect(builder.ruleConfigForIndex(tbl1idR.tableName, tbl1idR.indexName, tbl1idR.capacityType, {})).to.be(builder);
         expect(builder.ruleConfigForIndex(tbl1idW.tableName, tbl1idW.indexName, tbl1idW.capacityType, {})).to.be(builder);
      });

      it('uses global defaults when no other config is present', function() {
         expect(builder.getConfigForResource(tbl1R)).to.eql(defaultConfig);
         expect(builder.getConfigForResource(tbl1W)).to.eql(defaultConfig);
         expect(builder.getConfigForResource(tbl1idR)).to.eql(defaultConfig);
         expect(builder.getConfigForResource(tbl1idW)).to.eql(defaultConfig);
      });

      describe('user defaults', function() {

         it('allows config to be added in a chain', function() {
            expect(builder.defaultRuleConfig({})).to.be(builder);
            expect(builder.defaultRuleConfig('WriteCapacityUnits', {})).to.be(builder);
         });

         it('allows user to set their own defaults', function() {
            var expectedConfig = _.extend({}, defaultConfig, customUserConfig);

            builder.defaultRuleConfig(customUserConfig);

            expect(builder.getConfigForResource(tbl1R)).to.eql(expectedConfig);
            expect(builder.getConfigForResource(tbl1W)).to.eql(expectedConfig);
            expect(builder.getConfigForResource(tbl1idR)).to.eql(expectedConfig);
            expect(builder.getConfigForResource(tbl1idW)).to.eql(expectedConfig);
         });

         it('allows user to set their own defaults for a specific type', function() {
            var expectedReadConfig = _.extend({}, defaultConfig),
                expectedWriteConfig = _.extend({}, defaultConfig, customUserConfigForType);

            builder.defaultRuleConfig(constants.WRITE, customUserConfigForType);

            expect(builder.getConfigForResource(tbl1R)).to.eql(expectedReadConfig);
            expect(builder.getConfigForResource(tbl1W)).to.eql(expectedWriteConfig);
            expect(builder.getConfigForResource(tbl1idR)).to.eql(expectedReadConfig);
            expect(builder.getConfigForResource(tbl1idW)).to.eql(expectedWriteConfig);
         });

      });

      describe('resource specific config', function() {

         it('allows config to be added in a chain', function() {
            expect(builder.ruleConfigForTable(tbl1R.tableName, tbl1R.capacityType, {})).to.be(builder);
            expect(builder.ruleConfigForIndex(tbl1idR.tableName, tbl1idR.indexName, tbl1idR.capacityType, {})).to.be(builder);
         });

         it('allows for custom config for a specific table and capacity', function() {
            var expectedConfig = _.extend({}, defaultConfig, specificResourceConfig);

            builder.ruleConfigForTable(tbl1R.tableName, tbl1R.capacityType, specificResourceConfig);

            expect(builder.getConfigForResource(tbl1R)).to.eql(expectedConfig);
            expect(builder.getConfigForResource(tbl1W)).to.eql(defaultConfig);
            expect(builder.getConfigForResource(tbl1idR)).to.eql(defaultConfig);
            expect(builder.getConfigForResource(tbl1idW)).to.eql(defaultConfig);
         });

         it('allows for custom config for a specific index', function() {
            var expectedConfig = _.extend({}, defaultConfig, specificResourceConfig);

            builder.ruleConfigForIndex(tbl1idR.tableName, tbl1idR.indexName, tbl1idR.capacityType, specificResourceConfig);

            expect(builder.getConfigForResource(tbl1R)).to.eql(defaultConfig);
            expect(builder.getConfigForResource(tbl1W)).to.eql(defaultConfig);
            expect(builder.getConfigForResource(tbl1idR)).to.eql(expectedConfig);
            expect(builder.getConfigForResource(tbl1idW)).to.eql(defaultConfig);
         });

      });

      it('allows all config levels play nice together', function() {
         var expectedConfig = _.extend({}, defaultConfig);

         expectedConfig.AbsoluteMinimumProvisioned = customUserConfig.AbsoluteMinimumProvisioned;
         expectedConfig.AbsoluteMaximumProvisioned = customUserConfigForType.AbsoluteMaximumProvisioned;
         expectedConfig.MinutesOfStatsToRetrieve = customUserConfigForType.MinutesOfStatsToRetrieve;
         expectedConfig.MinutesOfStatsToIgnore = specificResourceConfig.MinutesOfStatsToIgnore;

         builder.defaultRuleConfig(customUserConfig);
         builder.defaultRuleConfig(constants.READ, customUserConfigForType);
         builder.ruleConfigForTable(tbl1R.tableName, tbl1R.capacityType, specificResourceConfig);

         expect(builder.getConfigForResource(tbl1R)).to.eql(expectedConfig);
      });

   });

});
