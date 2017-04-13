'use strict';

var _ = require('underscore'),
    constants = require('./constants');

module.exports = {};

// Expose for easy access and legacy compatibility
_.extend(module.exports, _.pick(constants, 'READ', 'WRITE', 'DEFAULT_RESOURCE_CONFIG'));

/* eslint-disable global-require */
_.extend(module.exports, { Builder: require('./Builder') });

_.extend(module.exports, require('./resource-listers/all'));
/* eslint-enable global-require */ // eslint-disable-line lines-around-comment
