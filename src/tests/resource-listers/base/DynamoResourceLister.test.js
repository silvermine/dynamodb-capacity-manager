'use strict';

var _ = require('underscore'),
    Q = require('q'),
    sinon = require('sinon'),
    expect = require('expect.js'),
    rewire = require('rewire'),
    constants = require('../../../constants'),
    Lister = rewire('../../../resource-listers/base/DynamoResourceLister');

describe('DynamoResourceLister', function() {
   var dynamo = { describeTable: _.noop },
       lister, revert,
       mockTbl1, mockTbl1NameIndex;

   mockTbl1NameIndex = {
      IndexName: 'Name',
      KeySchema: [
         { AttributeName: 'Name', KeyType: 'HASH' },
      ],
      Projection: { ProjectionType: 'ALL' },
      IndexStatus: 'ACTIVE',
      ProvisionedThroughput: {
         LastIncreaseDateTime: 1492546261,
         LastDecreaseDateTime: 1492241142,
         NumberOfDecreasesToday: 2,
         ReadCapacityUnits: 8,
         WriteCapacityUnits: 12,
      },
      IndexSizeBytes: 515,
      ItemCount: 123,
      IndexArn: 'arn:aws:dynamodb:us-east-1:12345:table/Tbl1/index/Name',
   };

   mockTbl1 = {
      AttributeDefinitions: [
         { AttributeName: 'Name', AttributeType: 'S' },
         { AttributeName: 'NaturalKey', AttributeType: 'S' },
      ],
      TableName: 'Tbl1',
      KeySchema: [ { AttributeName: 'NaturalKey', KeyType: 'HASH' } ],
      TableStatus: 'ACTIVE',
      CreationDateTime: 'Mon Apr 18 2017 16:46:37 GMT-0400 (EDT)',
      ProvisionedThroughput: {
         LastIncreaseDateTime: 1492346261,
         LastDecreaseDateTime: 1492441142,
         NumberOfDecreasesToday: 1,
         ReadCapacityUnits: 7,
         WriteCapacityUnits: 3,
      },
      TableSizeBytes: 2315,
      ItemCount: 432,
      TableArn: 'arn:aws:dynamodb:us-east-1:12345:table/Tbl1',
      GlobalSecondaryIndexes: [
         mockTbl1NameIndex,
      ],
   };

   beforeEach(function() {
      revert = Lister.__set__({
         dynamo: dynamo,
         console: { log: _.noop },
      });

      lister = new Lister();
   });

   afterEach(function() {
      revert();
   });

   describe('listResources', function() {

      it('assembles and returns information about resources', function() {
         var fetchTableNamesStub = sinon.stub(lister, '_fetchTableNames'),
             convertTableNameToResourcesStub = sinon.stub(lister, 'convertTableNameToResources');

         fetchTableNamesStub.returns(Q.delay([ 'Tbl1', 'Tbl2', 'NoResources', 'Tbl3' ], 3));
         convertTableNameToResourcesStub.onCall(0).returns(Q.delay([
            { resourceType: 'table', name: 'Tbl1', capacityType: constants.READ },
            { resourceType: 'table', name: 'Tbl1', capacityType: constants.WRITE },
            { resourceType: 'index', name: 'Tbl1::_id', capacityType: constants.READ },
            { resourceType: 'index', name: 'Tbl1::_id', capacityType: constants.WRITE },
         ], 3));
         convertTableNameToResourcesStub.onCall(1).returns(Q.delay([
            { resourceType: 'table', name: 'Tbl2', capacityType: constants.READ },
            { resourceType: 'index', name: 'Tbl2::_id', capacityType: constants.READ },
         ], 3));
         convertTableNameToResourcesStub.onCall(2).returns(Q.delay([], 3));
         convertTableNameToResourcesStub.onCall(3).returns(Q.delay([
            { resourceType: 'table', name: 'Tbl3', capacityType: constants.READ },
            { resourceType: 'table', name: 'Tbl3', capacityType: constants.WRITE },
         ], 3));

         return lister.listResources()
            .then(function(resources) {
               sinon.assert.calledOnce(fetchTableNamesStub);

               sinon.assert.callOrder(
                  convertTableNameToResourcesStub.withArgs('Tbl1'),
                  convertTableNameToResourcesStub.withArgs('Tbl2'),
                  convertTableNameToResourcesStub.withArgs('NoResources'),
                  convertTableNameToResourcesStub.withArgs('Tbl3')
               );

               expect(resources).to.eql([
                  { resourceType: 'table', name: 'Tbl1', capacityType: constants.READ },
                  { resourceType: 'table', name: 'Tbl1', capacityType: constants.WRITE },
                  { resourceType: 'index', name: 'Tbl1::_id', capacityType: constants.READ },
                  { resourceType: 'index', name: 'Tbl1::_id', capacityType: constants.WRITE },
                  { resourceType: 'table', name: 'Tbl2', capacityType: constants.READ },
                  { resourceType: 'index', name: 'Tbl2::_id', capacityType: constants.READ },
                  { resourceType: 'table', name: 'Tbl3', capacityType: constants.READ },
                  { resourceType: 'table', name: 'Tbl3', capacityType: constants.WRITE },
               ]);
            });
      });

   });

   describe('_fetchTableNames', function() {

      it('throws an error when called, as this function needs to be overridden by subclasses', function() {
         expect(lister._fetchTableNames).to.throwError();
      });

   });

   describe('convertTableNameToResources', function() {

      it('fetches table info and returns its resources', function() {
         var stub = sinon.stub(dynamo, 'describeTable');

         stub.onCall(0).callsArgWithAsync(1, null, { Table: mockTbl1 });

         return lister.convertTableNameToResources()
            .then(function(resources) {
               expect(resources).to.eql([
                  {
                     resourceType: 'table',
                     name: 'Tbl1',
                     tableName: 'Tbl1',
                     capacityType: constants.READ,
                     provisioning: {
                        lastIncrease: 1492346261,
                        lastDecrease: 1492441142,
                        numberOfDecreasesToday: 1,
                        currentCapacity: 7,
                     },
                  },
                  {
                     resourceType: 'table',
                     name: 'Tbl1',
                     tableName: 'Tbl1',
                     capacityType: constants.WRITE,
                     provisioning: {
                        lastIncrease: 1492346261,
                        lastDecrease: 1492441142,
                        numberOfDecreasesToday: 1,
                        currentCapacity: 3,
                     },
                  },
                  {
                     resourceType: 'index',
                     name: 'Tbl1::Name',
                     tableName: 'Tbl1',
                     indexName: 'Name',
                     capacityType: constants.READ,
                     provisioning: {
                        lastIncrease: 1492546261,
                        lastDecrease: 1492241142,
                        numberOfDecreasesToday: 2,
                        currentCapacity: 8,
                     },
                  },
                  {
                     resourceType: 'index',
                     name: 'Tbl1::Name',
                     tableName: 'Tbl1',
                     indexName: 'Name',
                     capacityType: constants.WRITE,
                     provisioning: {
                        lastIncrease: 1492546261,
                        lastDecrease: 1492241142,
                        numberOfDecreasesToday: 2,
                        currentCapacity: 12,
                     },
                  },
               ]);
            });
      });

   });

   describe('convertTableToResource', function() {

      it('converts table to resource - read', function() {
         expect(lister.convertTableToResource(mockTbl1, constants.READ)).to.eql({
            resourceType: 'table',
            name: 'Tbl1',
            tableName: 'Tbl1',
            capacityType: constants.READ,
            provisioning: {
               lastIncrease: 1492346261,
               lastDecrease: 1492441142,
               numberOfDecreasesToday: 1,
               currentCapacity: 7,
            },
         });
      });

      it('converts table to resource - write', function() {
         expect(lister.convertTableToResource(mockTbl1, constants.WRITE)).to.eql({
            resourceType: 'table',
            name: 'Tbl1',
            tableName: 'Tbl1',
            capacityType: constants.WRITE,
            provisioning: {
               lastIncrease: 1492346261,
               lastDecrease: 1492441142,
               numberOfDecreasesToday: 1,
               currentCapacity: 3,
            },
         });
      });

   });

   describe('convertIndexToResource', function() {

      it('converts index to resource - read', function() {
         expect(lister.convertIndexToResource('Tbl1', mockTbl1NameIndex, constants.READ)).to.eql({
            resourceType: 'index',
            name: 'Tbl1::Name',
            tableName: 'Tbl1',
            indexName: 'Name',
            capacityType: constants.READ,
            provisioning: {
               lastIncrease: 1492546261,
               lastDecrease: 1492241142,
               numberOfDecreasesToday: 2,
               currentCapacity: 8,
            },
         });
      });

      it('converts index to resource - write', function() {
         expect(lister.convertIndexToResource('Tbl1', mockTbl1NameIndex, constants.WRITE)).to.eql({
            resourceType: 'index',
            name: 'Tbl1::Name',
            tableName: 'Tbl1',
            indexName: 'Name',
            capacityType: constants.WRITE,
            provisioning: {
               lastIncrease: 1492546261,
               lastDecrease: 1492241142,
               numberOfDecreasesToday: 2,
               currentCapacity: 12,
            },
         });
      });

   });

});
