var Promise = require('bluebird'),
    soap    = require('soap'),
    _       = require('lodash');

function Service(session, storage, ready) {
  if(!(this instanceof Service)) {
    return new Service(session, storage, ready);
  }

  var self = this;
  storage.get()
    .then(function(url) {
      self.$buildService(url, ready);
    })
    .catch(function(err) {
      ready(err);
    })

  self.$parentSession = session;
}

Service.prototype.$buildService = function(url, ready) {
  var self = this;

  soap.createClient(url, function(err, client) {
    for(var item in client) {
      if(!client.hasOwnProperty(item) || item === 'wsdl') {
        continue;
      }

      self[item] = self.$call.bind(self, item);
    }

    delete client.wsdl.xml;
    self.$client = client;
    self.$ready = true;
    ready();
  });
};

Service.prototype.$call = function(name, args) {
  var self = this;

  return new Promise(function edboHandler(resolve, reject) {
    args = _.cloneDeep(args) || { };

    var schema  = self.$getSchema(name),
        invalid = self.$validate(schema.input.children[0], args);

    // bad style
    args.Id_Language = 1;
    args.ActualDate = self.$formatDate();

    if(self.$session) {
      args.SessionGUID = self.$session;
      args.GUIDSession = self.$session;
    }

    if(invalid) {
      return reject(invalid);
    }

    self.$client[name](args, function(err, data) {
      var expected = schema.output.children[0].children[0].children[0].$name;
      if(data[expected]) {
        return resolve(data[expected]);
      }

      self.GetLastError()
        .then(function(err) {
          if(err.dLastError[0].LastErrorCode === 101) { // session blocked
            self.$parentSession.$prepareConnection(function() {
              edboHandler(resolve, reject);
            },
            function() {
              reject(err.dLastError);
            });
          }
          else {
            reject(err.dLastError);
          }
        })
        .catch(function(err) {
          reject(new Error('EDBO Fatal Error: GetLastError failed!'));
        })
    });
  });
};

Service.prototype.$getSchema = function(name) {
  var services = this.$client.wsdl.services,
      serviceName = Object.getOwnPropertyNames(services)[0];

  var methods = services[serviceName].ports[serviceName + 'Soap12'].binding.methods;
  return methods[name];
};

Service.prototype.$validate = function(schema, args, depth) {
  if(depth === undefined) {
    depth = 0;
    args  = _.cloneDeep(args);
  }

  if(schema.name === 'complexType' || schema.name === 'sequence') {
    for(var i = 0; i < schema.children.length; ++i) {
      var current = this.$validate(schema.children[i], args, depth + 1);

      if(current) {
        return current;
      }
    }
  }
  else if(schema.name === 'element' &&
      ['Id_Language', 'SessionGUID', 'GUIDSession', 'ActualDate'].indexOf(schema.$name) === -1) {
    var name = schema.$name,
        type = schema.$type;

    var _throw = function(name, type, value) {
      var chunks = [
        'field "' + name + '":',
        'expected \'' + type + '\'',
        'but got: \'' + typeof value + '\''
      ];

      return new Error(chunks.join(' '));
    };

    if(type === 's:string') {
      if(typeof args[name] !== 'string') {
        return _throw(name, type, args[name]);
      }

      delete args[name];
    }
    else
    if(type === 's:int') {
      if(typeof args[name] !== 'number') {
        return _throw(name, type, args[name]);
      }

      delete args[name];
    }
    else {
      console.log('TODO: $validate for ' + type);
    }
  }

  if(depth === 0) {
    var names = Object.getOwnPropertyNames(args);
    names = names.filter(function(name) {
      return !/(GUID)|(ActualDate)|(Id_Language)/g.test(name);
    });

    if(names.length > 0) {
      return new Error('unknown field "' + names[0] + '"');
    }
  }
};

Service.prototype.$setSessionID = function(session) {
  this.$session = session;
};

Service.prototype.$formatDate = function() {
  function padding(n) {
    return n < 10 ? '0' + n : n
  }

  var date = new Date();

  return  padding(date.getDate()) + '.'
        + padding(date.getMonth() + 1) + '.'
        + date.getFullYear() + ' '

        + padding(date.getHours()) + ':'
        + padding(date.getMinutes()) + ':'
        + padding(date.getSeconds());
}

module.exports = Service;
