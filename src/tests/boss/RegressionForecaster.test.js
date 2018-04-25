'use strict';

var sinon = require('sinon'),
    expect = require('expect.js'),
    rewire = require('rewire'),
    Forecaster = rewire('../../boss/RegressionForecaster');

describe('RegressionForecastingRule', function() {

   var forecaster;

   beforeEach(function() {
      forecaster = new Forecaster();
   });

   describe('forecast', function() {

      it('creates a forecast', function() {
         var createSeriesStub = sinon.stub(forecaster, '_createRegressableTimeSeries'),
             addEmptySlotsStub = sinon.stub(forecaster, '_addEmptySlotsToTimeSeries'),
             regressStub = sinon.stub(forecaster, '_regress'),
             data, series, result;

         data = [
            { Timestamp: '2017-01-01T12:00:00.000Z', Value: 12 },
            { Timestamp: '2017-01-01T12:01:00.000Z', Value: 7 },
            { Timestamp: '2017-01-01T12:03:00.000Z', Value: 31 },
         ];

         series = [
            [ '2017-01-01T12:00:00.000Z', 12 ],
            [ '2017-01-01T12:01:00.000Z', 7 ],
            [ '2017-01-01T12:03:00.000Z', 31 ],
         ];
         createSeriesStub.returns(series);

         regressStub.returns([
            [ new Date('2017-01-01T12:00:00.000Z'), 7.24 ],
            [ new Date('2017-01-01T12:01:00.000Z'), 16.66 ],
            [ new Date('2017-01-01T12:03:00.000Z'), 26.09 ],
         ]);

         result = forecaster.forecast(data, 2);
         expect(result).to.be(26.09);

         sinon.assert.calledOnce(createSeriesStub);
         sinon.assert.calledWithExactly(createSeriesStub, data);

         sinon.assert.calledOnce(addEmptySlotsStub);
         sinon.assert.calledWithExactly(addEmptySlotsStub, series, 2);

         sinon.assert.calledOnce(regressStub);
         sinon.assert.calledWithExactly(regressStub, series);
      });

      it('makes a numerical forecast', function() {
         var usage, forecast;

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

      it('forecasts N minutes ahead', function() {
         var usage, forecast;

         usage = [
            { 'Timestamp': '1970-01-01T00:00:00.000Z', 'Value': 0 },
            { 'Timestamp': '1970-01-01T00:01:00.000Z', 'Value': 60 },
            { 'Timestamp': '1970-01-01T00:02:00.000Z', 'Value': 120 },
            { 'Timestamp': '1970-01-01T00:03:00.000Z', 'Value': 180 },
            { 'Timestamp': '1970-01-01T00:04:00.000Z', 'Value': 240 },
         ];

         forecast = forecaster.forecast(usage, 0);
         expect(forecast).to.be.within(239, 241);

         forecast = forecaster.forecast(usage, 5);
         expect(forecast).to.be.within(539, 541);
      });

      it('handles an empty usage dataset', function() {
         var forecast;

         forecast = forecaster.forecast([], 0);
         expect(forecast).to.be(undefined);

         forecast = forecaster.forecast([], 5);
         expect(forecast).to.be(undefined);
      });
   });

   describe('_createRegressableTimeSeries', function() {

      it('creates a regressable time series', function() {
         var data, series, expected;

         data = [
            { Timestamp: '2017-01-01T12:00:00.000Z', Value: 12 },
            { Timestamp: '2017-01-01T12:01:00.000Z', Value: 7 },
            { Timestamp: '2017-01-01T12:03:00.000Z', Value: 31 },
         ];

         expected = [
            [ new Date('2017-01-01T12:00:00.000Z'), 12 ],
            [ new Date('2017-01-01T12:01:00.000Z'), 7 ],
            [ new Date('2017-01-01T12:03:00.000Z'), 31 ],
         ];

         series = forecaster._createRegressableTimeSeries(data);

         expect(series).to.be.an('array');
         expect(series).to.have.length(3);
         expect(series).to.eql(expected);
      });

   });

   describe('_addEmptySlotsToTimeSeries', function() {
      var series, expected;

      beforeEach(function() {
         series = [
            [ new Date('2017-01-01T12:00:00.000Z'), 12 ],
            [ new Date('2017-01-01T12:01:00.000Z'), 7 ],
            [ new Date('2017-01-01T12:03:00.000Z'), 31 ],
         ];
      });

      it('adds no slots to empty series', function() {
         series = [];

         forecaster._addEmptySlotsToTimeSeries(series, 0);

         expect(series).to.be.an('array');
         expect(series).to.have.length(0);
      });

      it('will not add any slots when additionalMinutes less than 1', function() {
         expected = series.slice();

         forecaster._addEmptySlotsToTimeSeries(series, 0);

         expect(series).to.be.an('array');
         expect(series).to.have.length(3);
         expect(series).to.not.be(expected);
         expect(series).to.eql(expected);

         forecaster._addEmptySlotsToTimeSeries(series, -4);

         expect(series).to.be.an('array');
         expect(series).to.have.length(3);
         expect(series).to.not.be(expected);
         expect(series).to.eql(expected);
      });

      it('can add one empty slot', function() {
         expected = [
            [ new Date('2017-01-01T12:00:00.000Z'), 12 ],
            [ new Date('2017-01-01T12:01:00.000Z'), 7 ],
            [ new Date('2017-01-01T12:03:00.000Z'), 31 ],
            [ new Date('2017-01-01T12:04:00.000Z'), null ],
         ];

         forecaster._addEmptySlotsToTimeSeries(series, 1);

         expect(series).to.be.an('array');
         expect(series).to.have.length(4);
         expect(series).to.not.be(expected);
         expect(series).to.eql(expected);
      });

      it('adds "n" number of empty slots', function() {
         expected = [
            [ new Date('2017-01-01T12:00:00.000Z'), 12 ],
            [ new Date('2017-01-01T12:01:00.000Z'), 7 ],
            [ new Date('2017-01-01T12:03:00.000Z'), 31 ],
            [ new Date('2017-01-01T12:04:00.000Z'), null ],
            [ new Date('2017-01-01T12:05:00.000Z'), null ],
            [ new Date('2017-01-01T12:06:00.000Z'), null ],
            [ new Date('2017-01-01T12:07:00.000Z'), null ],
         ];

         forecaster._addEmptySlotsToTimeSeries(series, 4);

         expect(series).to.be.an('array');
         expect(series).to.have.length(7);
         expect(series).to.not.be(expected);
         expect(series).to.eql(expected);
      });

   });

   describe('_regress', function() {
      var fakeRegressionLib, revert, series, result;

      series = [
         [ new Date('2017-01-01T12:00:00.000Z'), 12 ],
         [ new Date('2017-01-01T12:01:00.000Z'), 7 ],
         [ new Date('2017-01-01T12:03:00.000Z'), 31 ],
      ];

      result = [
         [ new Date('2017-01-01T12:00:00.000Z'), 7.24 ],
         [ new Date('2017-01-01T12:01:00.000Z'), 16.66 ],
         [ new Date('2017-01-01T12:03:00.000Z'), 26.09 ],
      ];

      beforeEach(function() {
         fakeRegressionLib = {
            linear: sinon.stub(),
            polynomial: sinon.stub(),
         };

         revert = Forecaster.__set__({
            regression: fakeRegressionLib,
         });

         forecaster = new Forecaster();
      });

      afterEach(function() {
         revert();
      });

      it('uses the default regression type when no type is specified', function() {
         forecaster = new Forecaster();

         fakeRegressionLib.polynomial.returns({ points: result });

         expect(forecaster._regress(series)).to.be(result);

         sinon.assert.calledOnce(fakeRegressionLib.polynomial);
         sinon.assert.calledWithExactly(fakeRegressionLib.polynomial, series, { precision: 50 });
      });

      it('uses user provided regression type', function() {
         forecaster = new Forecaster('linear');

         fakeRegressionLib.linear.returns({ points: result });

         expect(forecaster._regress(series)).to.be(result);

         sinon.assert.calledOnce(fakeRegressionLib.linear);
         sinon.assert.calledWithExactly(fakeRegressionLib.linear, series, { precision: 50 });
      });

   });

});
