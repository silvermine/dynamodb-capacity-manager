'use strict';

module.exports = {

   makeResourceName: function(tableName, indexName) {
      return tableName + (indexName ? ('::' + indexName) : '');
   },

};
