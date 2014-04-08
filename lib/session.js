var Promise = require('bluebird'),
    Storage = require('./storage.js'),
    Service = require('./service.js');
    

function Session(settings, resolve, reject) {
  if(!(this instanceof Session)) {
    return new Session(settings, resolve, reject);
  }

  var self = this;
  var readyHandler = function(err) {
    if(err) {
      return reject(err);
    }

    if(self.Person.$ready && self.Guides.$ready) {
      self.$prepareConnection(settings, resolve, reject);
    }
  };

  this.Person = Service(Storage('Person', settings), readyHandler);
  this.Guides = Service(Storage('Guides', settings), readyHandler);
}

Session.prototype.$prepareConnection = function(settings, resolve, reject) {
  var self = this;

  self.Person.Login({
    User: settings.user,
    Password: settings.password,
    ClearPreviewSession: 1,
    ApplicationKey: settings.appkey
  })
  .then(function(guid) {
    if(!/[\w-]{36}/.test(guid)) {
      throw new Error('EDBO Error: ' + guid);
    }

    self.Person.$setSessionID(guid);
    self.Guides.$setSessionID(guid);
    resolve(self);
  })
  .catch(function(err) {
    reject(err);
  });
};

module.exports = Session;