'use strict';

var Storage = require('./storage.js'),
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
      self.$prepareConnection(resolve, reject);
    }
  };

  this.$settings = settings;
  this.Person = new Service(this, new Storage('Person', settings), readyHandler);
  this.Guides = new Service(this, new Storage('Guides', settings), readyHandler);
}

Session.prototype.$prepareConnection = function(resolve, reject) {
  var self = this;

  self.Person.Login({
    User: self.$settings.user,
    Password: self.$settings.password,
    ClearPreviewSession: 1,
    ApplicationKey: self.$settings.appkey
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
