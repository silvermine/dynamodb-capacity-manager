'use strict';

var expect = require('expect.js'),
    resourceUtils = require('../../util/resource');

describe('Resource Utils', function() {

   describe('Resource name assembly', function() {

      it('should correctly return table names', function() {
         expect(resourceUtils.makeResourceName('')).to.be('');
         expect(resourceUtils.makeResourceName('table-name')).to.be('table-name');
         expect(resourceUtils.makeResourceName('other-table')).to.be('other-table');
         expect(resourceUtils.makeResourceName('table-name', false)).to.be('table-name');
         expect(resourceUtils.makeResourceName('table-name', undefined)).to.be('table-name');
         expect(resourceUtils.makeResourceName('table-name', '')).to.be('table-name');
      });

      it('should correctly return index names', function() {
         expect(resourceUtils.makeResourceName('', '')).to.be('');
         expect(resourceUtils.makeResourceName('table-name', 'my-index')).to.be('table-name::my-index');
         expect(resourceUtils.makeResourceName('other-table', 'different-index')).to.be('other-table::different-index');
         expect(resourceUtils.makeResourceName('', 'different-index')).to.be('::different-index');
      });

   });

});
