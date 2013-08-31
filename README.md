Node.js EDBO library
=================

###Overview
**_Early Alpha_** unofficial [EDBO](http://edbo.gov.ua/) middleware library for easy creation of EDBO clients.

##Usage
Firstly, you need yo create *config file* in JSON format which contains *security credentials* and *connection details* of EDBO services

**config.json**
```json
{
  "Host": "EDBO_HOST",
  "Port": EDBO_PORT,

  "User":           "YOUR_LOGIN",
  "Password":       "YOUR_PASSWORD",
  "ApplicationKey": "YOUR_APP_KEY"
}
```

in case of *test* EDBO services:
```
EDBO_HOST = "test.edbo.gov.ua"
EDBO_PORT = 8080
YOUR_APP_KEY = ""
```

Then you could use the library itself

**edbo-client-example.js**
```javascript
edbo.createSession({ config: "config.json" }, function(session) {
  session.request("guides", "EducationTypesGet", function(err, result) {
    if(err) throw err;
    console.log(result.dEducationTypes);
  })
})
```

##Dependencies
* [**node-soap**](https://github.com/milewise/node-soap)