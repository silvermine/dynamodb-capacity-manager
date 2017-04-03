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
