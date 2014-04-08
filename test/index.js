var EDBO = require('../');

EDBO.setGlobalConfig('config.json');

var currentSession;

EDBO
  .session()
  .then(function(session) {
    currentSession = session;
    return currentSession.Person.PersonSexTypesGet();
  })
  .then(function(data) {
    console.log(data.dPersonSexTypes);

    return currentSession.Guides.BenefitsGet();
  })
  .then(function(data) {
    console.log(data.dBenefits);
  })
  .catch(function(err) {
    console.log(err);
  })