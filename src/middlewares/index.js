const basicAuth = require('./basicAuth');
const headerAuth = require('./headerAuth');
const headerAuth2 = require('./headerAuth2');
const forceRateLimit = require('./forceRateLimit');

module.exports = {
    basicAuth,
    headerAuth,
    forceRateLimit,
    headerAuth2,
};
