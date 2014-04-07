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

    if(self.Person.$ready && self.Person.$ready) {
      self.$prepareConnection(settings, resolve, reject);
    }
  };

  this.Person = Service(Storage('Person', settings), readyHandler);
}

Session.prototype.$prepareConnection = function(settings, resolve, reject) {
  this.Person.Login({
    User: settings.user,
    Password: settings.password,
    ClearPreviewSession: 1,
    ApplicationKey: settings.appkey
  })
  .then(function(data) {
    console.log(data);
  })
  .catch(function(err) {
    console.log(err);
  });
};

module.exports = Session;