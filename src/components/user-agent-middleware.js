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
      }

      if(!req.requestContext) {
        req.requestContext = {};
      }

      delete ua.ua;
      req.requestContext.userAgentDetails = ua;
      next();
    }
  });
}
