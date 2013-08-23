var Client = require("./client.js");
var soap   = require("soap");

"use strict";

function Session(options, callback) {
  this.client = new Client(options);

  this.services = {
    person: undefined,
    guides: undefined
  }

  this.languge_id   = undefined;
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

        self.languge_id = result.dLanguages[0].Id_Language;
        _check_connection();
      })
    })
  })
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

  var self = this;
  this.services[service_name][method_name](args, function(err, result) {
    var fields = Object.getOwnPropertyNames(result);

    if(fields.length > 1)
      throw new EDBOError({ code: -1, msg: "request: TODO! fields.length > 1" });

    if(fields.length == 1)
      callback(undefined, result[fields[0]]);
    else
      self.getLastError(function(err) { callback(err, { }); })
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