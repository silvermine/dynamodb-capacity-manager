'use strict';

var expect = require('expect.js'),
    index = require('../index');

describe('Index', function() {

   describe('Constant Access', function() {

      it('should expose the READ table type', function() {
         expect(index.READ).to.be.a('string');
      });

      it('should expose the WRITE table type', function() {
         expect(index.WRITE).to.be.a('string');
      });

      it('should expose the default config', function() {
         expect(index.DEFAULT_RESOURCE_CONFIG).to.be.an('object');
      });

   });

});
