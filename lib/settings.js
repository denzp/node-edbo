function Settings(path) {
  var data = require("fs").readFileSync(path, { encoding: "utf-8" });
  var security_data = JSON.parse(data);

  this.get_appkey = function() {
    return security_data.ApplicationKey;
  }
  this.get_login = function() {
    return security_data.User;
  }
  this.get_password = function() {
    return security_data.Password;
  }
  this.get_host = function() {
    return security_data.Host;
  }
  this.get_port = function() {
    return security_data.Port;
  }
}

module.exports = Settings;