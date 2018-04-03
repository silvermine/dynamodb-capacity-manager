'use strict';

var expect = require('expect.js'),
    Forecaster = require('../../boss/RegressionForecaster');

describe('RegressionForecastingRule', function() {

   describe('forecast', function() {

      it('makes a numerical forecast', function() {
         var forecaster = new Forecaster(),
             usage, forecast;

         usage = [
            { 'Timestamp': '2018-01-01T01:00:00-00:00', 'Value': 5 },
            { 'Timestamp': '2018-01-01T01:01:00-00:00', 'Value': 5 },
            { 'Timestamp': '2018-01-01T01:02:00-00:00', 'Value': 5 },
            { 'Timestamp': '2018-01-01T01:03:00-00:00', 'Value': 8 },
            { 'Timestamp': '2018-01-01T01:04:00-00:00', 'Value': 6 },
            { 'Timestamp': '2018-01-01T01:05:00-00:00', 'Value': 7 },
            { 'Timestamp': '2018-01-01T01:06:00-00:00', 'Value': 7 },
            { 'Timestamp': '2018-01-01T01:07:00-00:00', 'Value': 8 },
            { 'Timestamp': '2018-01-01T01:08:00-00:00', 'Value': 9 },
            { 'Timestamp': '2018-01-01T01:09:00-00:00', 'Value': 5 },
            { 'Timestamp': '2018-01-01T01:10:00-00:00', 'Value': 6 },
            { 'Timestamp': '2018-01-01T01:11:00-00:00', 'Value': 5 },
            { 'Timestamp': '2018-01-01T01:12:00-00:00', 'Value': 5 },
            { 'Timestamp': '2018-01-01T01:13:00-00:00', 'Value': 8 },
            { 'Timestamp': '2018-01-01T01:14:00-00:00', 'Value': 6 },
            { 'Timestamp': '2018-01-01T01:15:00-00:00', 'Value': 7 },
            { 'Timestamp': '2018-01-01T01:16:00-00:00', 'Value': 7 },
            { 'Timestamp': '2018-01-01T01:17:00-00:00', 'Value': 8 },
            { 'Timestamp': '2018-01-01T01:18:00-00:00', 'Value': 9 },
            { 'Timestamp': '2018-01-01T01:19:00-00:00', 'Value': 5 },
         ];

         forecast = forecaster.forecast(usage, 0);
         expect(forecast).to.be.a('number');
         expect(forecast).to.be.within(5, 9);
      });

   });

});
