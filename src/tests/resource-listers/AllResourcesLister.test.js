'use strict';

var _ = require('underscore'),
    Q = require('q'),
    sinon = require('sinon'),
    expect = require('expect.js'),
    rewire = require('rewire'),
    Lister = rewire('../../resource-listers/AllResourcesLister');

describe('AllResourcesLister', function() {
   var dynamo = { listTables: _.noop },
       lister, revert;

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

   describe('_fetchTableNames', function() {

      it('correctly fetches a list of tables - integration', function() {
         var stub = sinon.stub(dynamo, 'listTables'),
             expectedResponse1 = { TableNames: [ 'table-a', 'table-b', 'table-c' ], LastEvaluatedTableName: 'next-table-set' },
             expectedResponse2 = { TableNames: [ 'table-d', 'table-e', 'table-f' ], LastEvaluatedTableName: 'further-table-set' },
             expectedResponse3 = { TableNames: [ 'table-g', 'table-h', 'table-i' ] };

         stub.onCall(0).callsArgWithAsync(1, null, expectedResponse1);
         stub.onCall(1).callsArgWithAsync(1, null, expectedResponse2);
         stub.onCall(2).callsArgWithAsync(1, null, expectedResponse3);

         return lister._fetchTableNames()
            .then(function(tableNames) {
               sinon.assert.calledThrice(stub);
               sinon.assert.calledOn(stub, dynamo);

               sinon.assert.callOrder(
                  stub.withArgs({ ExclusiveStartTableName: null }),
                  stub.withArgs({ ExclusiveStartTableName: 'next-table-set' }),
                  stub.withArgs({ ExclusiveStartTableName: 'further-table-set' })
               );

               expect(tableNames).to.eql([
                  'table-a', 'table-b', 'table-c',
                  'table-d', 'table-e', 'table-f',
                  'table-g', 'table-h', 'table-i',
               ]);

               stub.restore();
            });
      });

      it('processes data from _fetchAll properly', function() {
         var stub = sinon.stub(lister, '_fetchAll');

         stub.returns(Q.delay([
            { TableNames: [ 'table-a', 'table-b', 'table-c' ], LastEvaluatedTableName: 'next-table-set' },
            { TableNames: [ 'table-d', 'table-e', 'table-f' ], LastEvaluatedTableName: 'further-table-set' },
            { TableNames: [ 'table-g', 'table-h', 'table-i' ] },
         ], 3));

         return lister._fetchTableNames()
            .then(function(tableNames) {
               sinon.assert.calledOnce(stub);
               sinon.assert.calledOn(stub, lister);
               sinon.assert.calledWith(stub, dynamo, 'listTables', {}, 'ExclusiveStartTableName', 'LastEvaluatedTableName');

               expect(tableNames).to.eql([
                  'table-a', 'table-b', 'table-c',
                  'table-d', 'table-e', 'table-f',
                  'table-g', 'table-h', 'table-i',
               ]);

               stub.restore();
            });
      });

   });

   describe('_fetchAll', function() {

      it('works when there is only one page of results', function() {
         var service = { action: function() { } },
             actionStub = sinon.stub(service, 'action'),
             expectedResponse = { data: 'value' };

         actionStub.callsArgWithAsync(1, null, expectedResponse);

         return lister._fetchAll(service, 'action', { search: 'param' }, 'requestToken', 'responseToken')
            .then(function(resps) {
               sinon.assert.calledOnce(actionStub);
               sinon.assert.calledOn(actionStub, service);
               sinon.assert.calledWith(actionStub, { search: 'param', requestToken: null });

               expect(resps).to.be.an('array');
               expect(resps).to.have.length(1);
               expect(resps[0]).to.eql(expectedResponse);

               actionStub.restore();
            });
      });

      it('works when there is more than one page of results', function() {
         var service = { action: function() { } },
             actionStub = sinon.stub(service, 'action'),
             expectedResponse1 = { data: 'some stuff', responseToken: 'get-more' },
             expectedResponse2 = { data: 'more stuff' };

         actionStub.onCall(0).callsArgWithAsync(1, null, expectedResponse1);
         actionStub.onCall(1).callsArgWithAsync(1, null, expectedResponse2);

         return lister._fetchAll(service, 'action', { search: 'param' }, 'requestToken', 'responseToken')
            .then(function(resps) {
               sinon.assert.calledTwice(actionStub);
               sinon.assert.alwaysCalledOn(actionStub, service);

               sinon.assert.callOrder(
                  actionStub.withArgs({ search: 'param', requestToken: null }),
                  actionStub.withArgs({ search: 'param', requestToken: 'get-more' })
               );

               expect(resps).to.be.an('array');
               expect(resps).to.have.length(2);
               expect(resps[0]).to.eql(expectedResponse1);
               expect(resps[1]).to.eql(expectedResponse2);

               actionStub.restore();
            });
      });

      it('fails when the service throws an error on first endpoint call', function() {
         var service = { action: function() { } },
             actionStub = sinon.stub(service, 'action'),
             wasRejected = false,
             expectedError = { error: 'some-service-error' };

         actionStub.callsArgWithAsync(1, expectedError, null);

         return lister._fetchAll(service, 'action', { search: 'param' }, 'requestToken', 'responseToken')
            .catch(function(err) {
               expect(err).to.eql(expectedError);
               wasRejected = true;
            })
            .then(function() {
               sinon.assert.calledOnce(actionStub);
               expect(wasRejected).to.eql(true);

               actionStub.restore();
            });
      });

      it('fails when the service throws an error on subsequent endpoint call', function() {
         var service = { action: function() { } },
             actionStub = sinon.stub(service, 'action'),
             wasRejected = false,
             expectedResponse = { data: 'value', responseToken: 'get-more' },
             expectedError = { error: 'some-service-error' };

         actionStub.onCall(0).callsArgWithAsync(1, null, expectedResponse);
         actionStub.onCall(1).callsArgWithAsync(1, expectedError, undefined);

         return lister._fetchAll(service, 'action', { search: 'param' }, 'requestToken', 'responseToken')
            .catch(function(err) {
               expect(err).to.eql(expectedError);
               wasRejected = true;
            })
            .then(function() {
               sinon.assert.calledTwice(actionStub);
               expect(wasRejected).to.eql(true);

               actionStub.restore();
            });
      });

      it('can call a different endpoint', function() {
         var service = { secondary: function() { } },
             actionStub = sinon.stub(service, 'secondary'),
             expectedResponse = { data: 'value' };

         actionStub.callsArgWithAsync(1, null, expectedResponse);

         return lister._fetchAll(service, 'secondary', { query: 'string' }, 'NextToken', 'NextToken')
            .then(function(resps) {
               sinon.assert.calledOnce(actionStub);
               sinon.assert.calledOn(actionStub, service);
               sinon.assert.calledWith(actionStub, { query: 'string', NextToken: null });

               expect(resps).to.be.an('array');
               expect(resps).to.have.length(1);
               expect(resps[0]).to.eql(expectedResponse);

               actionStub.restore();
            });
      });

   });

});
