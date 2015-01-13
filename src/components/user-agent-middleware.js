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

      if(!req.requestContext) {
        req.requestContext = {};
      }

      req.requestContext.userAgentDetails = ua;
      next();
    }
  });
}
