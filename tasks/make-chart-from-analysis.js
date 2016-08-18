'use strict';

var _ = require('underscore'),
    Q = require('q'),
    fs = require('fs'),
    path = require('path');

module.exports = function(grunt) {

   function makeChart(analysisFile, outputFolderPath) {
      return Q.ninvoke(fs, 'readFile', analysisFile)
         .then(function(fileData) {
            return _.map(fileData.toString().trim().split('\n'), function(line) {
               return line.split(',');
            });
         })
         .then(function(data) {
            return 'setData(' + JSON.stringify(data) + ');';
         })
         .then(function(str) {
            return Q.ninvoke(fs, 'writeFile', path.join(outputFolderPath, 'data.js'), str, 'utf8');
         });
   }

   grunt.registerTask('make-chart-from-analysis', 'Generates a chart from a what-if scenario', function() {
      var inputFile = grunt.option('input-file'),
          outputFolder = grunt.option('output-folder'),
          done = this.async();

      if (_.isEmpty(inputFile)) {
         grunt.fail.fatal('Must supply a --input-file=<FilePath> parameter');
      }
      if (_.isEmpty(outputFolder)) {
         grunt.fail.fatal('Must supply a --output-folder=<FolderPath> parameter');
      }

      grunt.log.ok('Generating a chart from %s analysis file to %s', inputFile, outputFolder);

      grunt.file.mkdir(outputFolder);
      grunt.file.copy(path.join(__dirname, 'static-assets', 'chart.html'), path.join(outputFolder, 'chart.html'));

      return makeChart(inputFile, outputFolder)
         .then(done)
         .catch(done)
         .done();
   });

};
