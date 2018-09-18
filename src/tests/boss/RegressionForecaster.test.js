'use strict';

var _ = require('underscore'),
    sinon = require('sinon'),
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
            [ 1483272000, 12 ],
            [ 1483272060, 7 ],
            [ 1483272180, 31 ],
         ];
         createSeriesStub.returns(series);

         regressStub.returns([
            [ 1483272000, 7.24 ],
            [ 1483272060, 16.66 ],
            [ 1483272180, 26.09 ],
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
            [ 1483272000, 12 ],
            [ 1483272060, 7 ],
            [ 1483272180, 31 ],
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
            [ 1483272000, 12 ],
            [ 1483272060, 7 ],
            [ 1483272180, 31 ],
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
            [ 1483272000, 12 ],
            [ 1483272060, 7 ],
            [ 1483272180, 31 ],
            [ 1483272240, null ],
         ];

         forecaster._addEmptySlotsToTimeSeries(series, 1);

         expect(series).to.be.an('array');
         expect(series).to.have.length(4);
         expect(series).to.not.be(expected);
         expect(series).to.eql(expected);
      });

      it('adds "n" number of empty slots', function() {
         expected = [
            [ 1483272000, 12 ],
            [ 1483272060, 7 ],
            [ 1483272180, 31 ],
            [ 1483272240, null ],
            [ 1483272300, null ],
            [ 1483272360, null ],
            [ 1483272420, null ],
         ];

         forecaster._addEmptySlotsToTimeSeries(series, 4);

         expect(series).to.be.an('array');
         expect(series).to.have.length(7);
         expect(series).to.not.be(expected);
         expect(series).to.eql(expected);
      });

   });

   describe('_regress', function() {

      describe('regression lib API compatibility', function() {
         var fakeRegressionLib, revert, series, result;

         series = [
            [ 1483272000, 12 ],
            [ 1483272060, 7 ],
            [ 1483272180, 31 ],
         ];

         result = [
            [ 1483272000, 7.24 ],
            [ 1483272060, 16.66 ],
            [ 1483272180, 26.09 ],
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

      it('returns a number with this previously troublesome data set', function() {
         var usage, forecast;

         usage = [
            { 'Timestamp': '2018-03-16T12:56:00-04:00', 'Value': 8.741666666666667 },
            { 'Timestamp': '2018-03-16T12:57:00-04:00', 'Value': 7.558333333333334 },
            { 'Timestamp': '2018-03-16T12:58:00-04:00', 'Value': 8.383333333333333 },
            { 'Timestamp': '2018-03-16T12:59:00-04:00', 'Value': 6.45 },
            { 'Timestamp': '2018-03-16T13:00:00-04:00', 'Value': 7.95 },
            { 'Timestamp': '2018-03-16T13:01:00-04:00', 'Value': 7.4 },
            { 'Timestamp': '2018-03-16T13:02:00-04:00', 'Value': 5.583333333333333 },
            { 'Timestamp': '2018-03-16T13:03:00-04:00', 'Value': 6.95 },
            { 'Timestamp': '2018-03-16T13:04:00-04:00', 'Value': 6.083333333333333 },
            { 'Timestamp': '2018-03-16T13:05:00-04:00', 'Value': 5.666666666666667 },
            { 'Timestamp': '2018-03-16T13:06:00-04:00', 'Value': 6.791666666666667 },
            { 'Timestamp': '2018-03-16T13:07:00-04:00', 'Value': 5.791666666666667 },
            { 'Timestamp': '2018-03-16T13:08:00-04:00', 'Value': 6.983333333333333 },
            { 'Timestamp': '2018-03-16T13:09:00-04:00', 'Value': 5.975 },
            { 'Timestamp': '2018-03-16T13:10:00-04:00', 'Value': 7.133333333333334 },
            { 'Timestamp': '2018-03-16T13:11:00-04:00', 'Value': 8.016666666666667 },
            { 'Timestamp': '2018-03-16T13:12:00-04:00', 'Value': 7.133333333333334 },
            { 'Timestamp': '2018-03-16T13:13:00-04:00', 'Value': 7.508333333333334 },
            { 'Timestamp': '2018-03-16T13:14:00-04:00', 'Value': 6.758333333333334 },
            { 'Timestamp': '2018-03-16T13:15:00-04:00', 'Value': 7.475 },
         ];

         forecast = forecaster.forecast(usage, 5);
         expect(forecast).to.be.a('number');
         expect(_.isFinite(forecast)).to.be(true);
         expect(forecast).to.be.within(5, 10);
      });

   });

});
