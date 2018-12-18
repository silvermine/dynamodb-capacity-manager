'use strict';

var _ = require('underscore'),
    sinon = require('sinon'),
    expect = require('expect.js'),
    rewire = require('rewire'),
    moment = require('moment'),
    DecisionMaker = rewire('../../boss/DecisionMaker');

describe('DecisionMaker', function() {
   var decisionMaker, revert;

   beforeEach(function() {
      revert = DecisionMaker.__set__({
         console: { log: _.noop },
      });

      decisionMaker = new DecisionMaker();
   });

   afterEach(function() {
      revert();
   });

   describe('getUpdatedCapacity', function() {
      var willChangeCapacityRule, willChangeCapacitySpy,
          changeDenyRule, changeDenySpy;

      beforeEach(function() {
         willChangeCapacityRule = {
            apply: function(state) {
               state.nextCapacity = 99;
            },
         };
         willChangeCapacitySpy = sinon.spy(willChangeCapacityRule, 'apply');

         changeDenyRule = {
            apply: function(state) {
               state.isAllowedToChange = false;
            },
         };
         changeDenySpy = sinon.spy(changeDenyRule, 'apply');
      });

      it('leaves capacity alone if no usage data is present', function() {
         var currentTime = '2017-04-18T23:11:01Z',
             provisioned;

         decisionMaker._rules = [ willChangeCapacityRule ];

         provisioned = {
            NumberOfDecreasesToday: 0,
            LastIncreaseDateTime: new Date('2017-04-18T20:11:01Z'),
            LastDecreaseDateTime: new Date('2017-04-15T07:25:42Z'),
            CapacityUnits: 75,
         };

         expect(decisionMaker.getUpdatedCapacity(provisioned, [], [], currentTime)).to.be(75);

         sinon.assert.notCalled(willChangeCapacitySpy);
      });

      it('leaves capacity alone if no rules are present', function() {
         var currentTime = '2017-04-18T23:11:01Z',
             provisioned, usageData;

         decisionMaker._rules = [];

         provisioned = {
            NumberOfDecreasesToday: 0,
            LastIncreaseDateTime: new Date('2017-04-18T20:11:01Z'),
            LastDecreaseDateTime: new Date('2017-04-15T07:25:42Z'),
            CapacityUnits: 75,
         };

         usageData = [
            {
               Timestamp: '2017-04-18T23:09:05Z',
               Value: 50.4,
            },
            {
               Timestamp: '2017-04-18T23:10:02Z',
               Value: 51.2,
            },
         ];

         expect(decisionMaker.getUpdatedCapacity(provisioned, usageData, [], currentTime)).to.be(75);
      });

      it('allows rules to update capacity', function() {
         var currentTime = '2017-04-18T23:11:01Z',
             provisioned, usageData;

         decisionMaker._rules = [ willChangeCapacityRule ];

         provisioned = {
            NumberOfDecreasesToday: 0,
            LastIncreaseDateTime: new Date('2017-04-18T20:11:01Z'),
            LastDecreaseDateTime: new Date('2017-04-15T07:25:42Z'),
            CapacityUnits: 75,
         };

         usageData = [
            {
               Timestamp: '2017-04-18T23:09:05Z',
               Value: 50.4,
            },
            {
               Timestamp: '2017-04-18T23:10:02Z',
               Value: 51.2,
            },
         ];

         expect(decisionMaker.getUpdatedCapacity(provisioned, usageData, [], currentTime)).to.be(99);

         sinon.assert.calledOnce(willChangeCapacitySpy);

         // Not able to properly assert due to sinon keeping a reference to the passed
         // args rather than cloning them: See:
         // https://github.com/sinonjs/sinon/issues/665
         // sinon.assert.calledWith(willChangeCapacitySpy, {
         //    provisioning: provisioned,
         //    usage: usageData,
         //    throttling: [],
         //    currentTime: moment(currentTime),
         //    nextCapacity: 75,  // <--- This is what breaks, reported as '99'
         //    isAllowedToChange: false,
         // });
      });

      it('rules can prevent a change to capacity - denied at start', function() {
         var currentTime = '2017-04-18T23:11:01Z',
             provisioned, usageData;

         decisionMaker._rules = [ changeDenyRule, willChangeCapacityRule ];

         provisioned = {
            NumberOfDecreasesToday: 0,
            LastIncreaseDateTime: new Date('2017-04-18T20:11:01Z'),
            LastDecreaseDateTime: new Date('2017-04-15T07:25:42Z'),
            CapacityUnits: 75,
         };

         usageData = [
            {
               Timestamp: '2017-04-18T23:09:05Z',
               Value: 50.4,
            },
            {
               Timestamp: '2017-04-18T23:10:02Z',
               Value: 51.2,
            },
         ];

         expect(decisionMaker.getUpdatedCapacity(provisioned, usageData, [], currentTime)).to.be(75);

         sinon.assert.calledOnce(changeDenySpy);

         sinon.assert.calledWith(changeDenySpy, {
            provisioning: provisioned,
            usage: usageData,
            throttling: [],
            currentTime: moment(currentTime),
            nextCapacity: 75,
            isAllowedToChange: false,
         });

         sinon.assert.notCalled(willChangeCapacitySpy);
      });

      it('rules can prevent a change to capacity - denied at end', function() {
         var currentTime = '2017-04-18T23:11:01Z',
             provisioned, usageData;

         decisionMaker._rules = [ willChangeCapacityRule, changeDenyRule ];

         provisioned = {
            NumberOfDecreasesToday: 0,
            LastIncreaseDateTime: new Date('2017-04-18T20:11:01Z'),
            LastDecreaseDateTime: new Date('2017-04-15T07:25:42Z'),
            CapacityUnits: 75,
         };

         usageData = [
            {
               Timestamp: '2017-04-18T23:09:05Z',
               Value: 50.4,
            },
            {
               Timestamp: '2017-04-18T23:10:02Z',
               Value: 51.2,
            },
         ];

         expect(decisionMaker.getUpdatedCapacity(provisioned, usageData, [], currentTime)).to.be(75);

         sinon.assert.calledOnce(willChangeCapacitySpy);

         // Not able to properly assert due to sinon keeping a reference to the passed
         // args rather than cloning them: See:
         // https://github.com/sinonjs/sinon/issues/665
         // sinon.assert.calledWith(willChangeCapacitySpy, {
         //    provisioning: provisioned,
         //    usage: usageData,
         //    throttling: [],
         //    currentTime: moment(currentTime),
         //    nextCapacity: 75,  // <--- This is what breaks, reported as '99'
         //    isAllowedToChange: false,
         // });

         sinon.assert.calledOnce(changeDenySpy);
      });

   });

});
