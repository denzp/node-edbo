var Promise = require('bluebird'),
    fs      = require('fs'),
    http    = require('http');

function Storage(name, settings) {
  if(!(this instanceof Storage)) {
    return new Storage(name, settings);
  }

  this.url   = 'http://' + settings.host + ':' + settings.port + '/';
  this.cache = '.cache/EDBO' + name + '.asmx';
  this.path  = 'EDBO' + name + '/EDBO' + name + '.asmx';
}

Storage.prototype.get = function() {
  var self = this;

  return self
    .checkCache()
    .catch(function() {
      return self.downloadFile();
    });
};

Storage.prototype.checkCache = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    fs.stat( self.cache, function(err) {
      if(err) {
        return reject('not found');
      }

      return resolve(self.cache);
    });
  });
};

Storage.prototype.downloadFile = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    http.get(self.url + self.path + '?WSDL', function(response) {
      var contents = '';

      response
        .on('data', function(data) {
          contents += data;
        })
        .on('end', function() {
          try {

            if(!fs.existsSync('.cache')) {
              fs.mkdirSync('.cache');
            }

            fs.writeFileSync(self.cache, contents, {
              encoding: 'utf-8',
              flag: 'w'
            });

          } catch(e) { }

          resolve(self.cache);
        });
    })
    .on('error', function(err) {
      err.url = self.url + self.path + '?WSDL';
      reject(err);
    });
  });
};

module.exports = Storage;