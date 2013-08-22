var Client = require("./client.js");
var soap = require("soap");

"use strict";

function Session(options, callback) {
  this.client = new Client(options);

  this.person_service = undefined;
  this.guides_service = undefined;


  //connect to Guides service
  soap.createClient(this.client.host_url + this.client.guides_path + "?WSDL", function(err, guides_client) {
    guides_service = guides_client;

    //connected to both services and logged
    if(this.person_service)
      callback(this);
  }.bind(this))

  //login to Person service
  soap.createClient(this.client.host_url + this.client.person_path + "?WSDL", function(err, person_client) {
    var args = {
      "User":           this.client.settings.get_login(),
      "Password":       this.client.settings.get_password(),
      "ApplicationKey": this.client.settings.get_appkey(),
      "ClearPreviewSession": 1
    }

    person_client.Login(args, function(err, result) {
      person_service = person_client;
      console.log(result);

      //connected to both services and logged
      if(this.guides_service)
        callback(this);
    })
  }.bind(this))
}

module.exports = Session;