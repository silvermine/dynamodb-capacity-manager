'use strict';

var _ = require('underscore'),
    sinon = require('sinon'),
    expect = require('expect.js'),
    rewire = require('rewire'),
    Lister = rewire('../../resource-listers/CloudFormationStackResourceLister');

describe('CloudFormationStackResourceLister', function() {
   var cfn = { listStackResources: _.noop },
       revert;

   beforeEach(function() {
      revert = Lister.__set__({
         cfn: cfn,
         console: { log: _.noop },
      });
   });

   afterEach(function() {
      revert();
   });

   describe('_fetchTableNames', function() {

      it('correctly fetches a list of tables - integration', function() {
         var lister = new Lister('cloud-stack'),
             stub = sinon.stub(cfn, 'listStackResources'),
             expectedResponse;

         expectedResponse = {
            StackResourceSummaries: [
               {
                  LogicalResourceId: 'PrimaryTable',
                  PhysicalResourceId: 'physical-resource-id-primary-table',
                  ResourceType: 'AWS::DynamoDB::Table',
                  LastUpdatedTimestamp: '2017-01-01T12:00:00.000Z',
                  ResourceStatus: 'CREATE_COMPLETE',
               },
               {
                  LogicalResourceId: 'DeployBucket',
                  PhysicalResourceId: 'physical-resource-id-deploy-bucket',
                  ResourceType: 'AWS::S3::Bucket',
                  LastUpdatedTimestamp: '2017-01-01T12:00:00.000Z',
                  ResourceStatus: 'CREATE_COMPLETE',
               },
            ],
         };

         stub.callsArgWithAsync(1, null, expectedResponse);

         return lister._fetchTableNames()
            .then(function(tableNames) {
               sinon.assert.calledOnce(stub);
               sinon.assert.calledOn(stub, cfn);
               sinon.assert.calledWith(stub, { StackName: 'cloud-stack' });

               expect(tableNames).to.eql([ 'physical-resource-id-primary-table' ]);

               stub.restore();
            });
      });

   });

});
