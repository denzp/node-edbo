var Session = require("./lib/session.js");
"use strict";

module.exports.createSession = function(options, callback) {
  new Session(options, callback);
}