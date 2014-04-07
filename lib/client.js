"use strict";

var nconf    = require('nconf'),
    Promise  = require('bluebird'),
    Session  = require('./session.js');

var configPath;

module.exports = { };

module.exports.setGlobalConfig = function(path) {
  configPath = path;
};

module.exports.session = function(config) {
  nconf.env({ separator: '_' })
  if(configPath) {
    nconf.file({ file: configPath });
  }

  var _throw = function(text) {
    throw new Error('EDBO Error: ' + text);
  };

  config = config || { };

  var currentConfig = {
    host: config.host || nconf.get('edbo:host') || _throw('no host specified!'),
    port: config.port || nconf.get('edbo:port') || _throw('no port specified!'),

    user:     config.user     || nconf.get('edbo:user')     || _throw('no user specified!'),
    password: config.password || nconf.get('edbo:password') || _throw('no password specified!'),
    appkey:   config.appkey   || nconf.get('edbo:appkey')   || '',
  };

  return new Promise(function(resolve, reject) {
    new Session(currentConfig, resolve, reject);
  });
};