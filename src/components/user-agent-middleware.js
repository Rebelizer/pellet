var pellet = require('pellet')
  , _UAParser = require('ua-parser-js')
  , UAParser = new _UAParser();

if(pellet.options.includeUserAgentInfo) {
  pellet.middlewareStack.push({
    priority: 7,
    fn: function(req, res, next) {
      var ua = req.headers['user-agent'];
      if(ua) {
        ua = UAParser.setUA(ua).getResult();
        delete ua.ua;
      }

      /*
      TODO NOTE: this is a TEMPORARY patch fix for a bigger issue. Our user agent detection library (ua-parser) is not detecting
      certain mobile devices correctly such as MotoX and various other mobile devices. It sets userAgent.device.type to 'undefined' instead of "mobile"
      This is a known issue in the lib and has multiple tickets filed on Github Repo (https://github.com/faisalman/ua-parser-js/issues)
      So for now, assume all Android devices should fall under "mobile"
      */
      if(ua.os.name === "Android") {
        ua.device.type = "mobile";
      }

      if(!req.requestContext) {
        req.requestContext = {};
      }

      req.requestContext.userAgentDetails = ua;
      next();
    }
  });
}
