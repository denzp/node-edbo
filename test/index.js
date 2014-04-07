var EDBO = require('../');

EDBO.setGlobalConfig('config.json');

EDBO
  .session()
  .then(function(session) {
    // TODO
    console.log(session);
  })
  .catch(function(err) {
    console.log(err);
  })