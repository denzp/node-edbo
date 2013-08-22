var Settings = require("./settings.js");
"use strict";

function Client(options) {
  this.settings = new Settings(options.config);

  this.person_path = "EDBOPerson/EDBOPerson.asmx";
  this.guides_path = "EDBOGuides/EDBOGuides.asmx";

  this.host_url = "http://" + this.settings.get_host() + ":" + this.settings.get_port() + "/";
}

module.exports = Client;