var Client = require("./client.js");
var soap   = require("soap");

"use strict";

function Session(options, callback) {
  this.client = new Client(options);

  this.services = {
    person: undefined,
    guides: undefined
  }

  this.language_id  = undefined;
  this.session_guid = undefined;

  var self = this;
  var _check_connection = function() {
    for(var item in self.services)
      if(!self.services[item])
        return;

    if(!self.session_guid || !self.language_id)
      return;

    callback(self);
  }

  //connect to Guides service
  soap.createClient(this.client.host_url + this.client.guides_path + "?WSDL", function(err, guides_client) {
    self.services.guides = guides_client;
    _check_connection();
  })

  //login to Person service
  soap.createClient(this.client.host_url + this.client.person_path + "?WSDL", function(err, person_client) {
    self.services.person = person_client;

    var login_args = {
      "User":           self.client.settings.get_login(),
      "Password":       self.client.settings.get_password(),
      "ApplicationKey": self.client.settings.get_appkey(),
      "ClearPreviewSession": 1
    };

    self.request("person", "Login", login_args, function(err, result) {
      if(err)
        throw new EDBOError(err);

      self.session_guid = result;

      self.request("person", "LanguagesGet", function(err, result) {
        if(err)
          throw new EDBOError(err);

        self.language_id = result.dLanguages[0].Id_Language;
        _check_connection();
      })
    })
  })
}

Session.prototype.format_date_ = function(date){
  function padding(n) {
    return n < 10 ? '0' + n : n
  }

  return  padding(date.getDate()) + '.'
        + padding(date.getMonth() + 1) + '.'
        + date.getFullYear() + ' '

        + padding(date.getHours()) + ':'
        + padding(date.getMinutes()) + ':'
        + padding(date.getSeconds());
}

Session.prototype.check_args_ = function(service_name, method_name, args) {
  var bindings = this.services[service_name].wsdl.definitions.bindings;
  var methods = bindings[Object.getOwnPropertyNames(bindings)[0]].methods;

  var check_sequence = function(seq_def, args) {
    for(var i = 0; i < seq_def.length; ++i) {
      if(args[seq_def[i].$name] == undefined)
        throw new EDBOError(-1, method_name + ": argument '" + seq_def[i].$name + "' not specified!");

      if(seq_def[i].$type.indexOf("string") != -1) {
        args[seq_def[i].$name] = "" + args[seq_def[i].$name];
      }
      else
      if(seq_def[i].$type.indexOf("int") != -1) {
        args[seq_def[i].$name] = parseInt(args[seq_def[i].$name]);
      }
      else
        console.log("TODO: check_args_: unknown type " + seq_def[i].$type)
    }
  }
  var check = function(wsdl_def, args) {
    for(var i = 0; i < wsdl_def.length; ++i) {
      var cur_def = wsdl_def[i];

      if(cur_def.name == "complexType")
        check(cur_def.children, args);
      else
      if(cur_def.name == "sequence")
        check_sequence(cur_def.children, args);
    }
  }

  check(methods[method_name].input.children, args);
}

Session.prototype.request = function(service_name, method_name, args, callback) {
  if(!this.services[service_name])
    throw new EDBOError({ code: -1, msg: "request: not connected to service '" + service_name + "'" });

  if(!this.services[service_name].hasOwnProperty(method_name))
    throw new EDBOError({ code: -1, msg: "request: service '" + service_name + "' doesn't have method '" + method_name + "'" });

  if(args instanceof Function) {
    callback = args;
    args = { };
  }

  this.session_guid ? args.SessionGUID = this.session_guid : null;
  this.language_id  ? args.Id_Language = this.language_id : null;
  args.ActualDate = this.format_date_(new Date());

  this.check_args_(service_name, method_name, args);

  var self = this;
  this.services[service_name][method_name](args, function(err, result) {
    var fields = Object.getOwnPropertyNames(result);

    if(fields.length > 1)
      throw new EDBOError({ code: -1, msg: "request: TODO! fields.length > 1" });

    if(fields.length == 1)
      callback(undefined, result[fields[0]]);
    else
      self.getLastError(function(err) { callback(err, { }); });
  })
}

Session.prototype.getLastError = function(callback) {
  var service_name = "person";

  if(!this.services[service_name])
    throw new EDBOError({ code: -1, msg: "GetLastError: not connected to service '" + service_name + "'" });

  this.services[service_name].GetLastError({ SessionGUID: this.session_guid }, function(err, result) {
    if(!result.GetLastErrorResult)
      throw new EDBOError({ code: -1, msg: "service '" + service_name + "' closed the session" });

    callback({
      code: result.GetLastErrorResult.dLastError[0].LastErrorCode,
      msg: result.GetLastErrorResult.dLastError[0].LastErrorDescription
    })
  })
}

module.exports = Session;