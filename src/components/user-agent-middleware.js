var pellet = require('pellet')
  , _UAParser = require('ua-parser-js')
  , mobileDetect = require('mobile-detect/mobile-detect.min.js')
  , UAParser = new _UAParser();

if(pellet.options.includeUserAgentInfo) {
  pellet.middlewareStack.push({
    priority: 7,
    fn: function(req, res, next) {
      var ua = req.headers['user-agent'];
      var detect;

      if(ua) {
        detect = new mobileDetect(ua);
        ua = UAParser.setUA(ua).getResult();

        if(!ua.device.type) {
          if(detect.tablet()) {
            ua.device.type = 'tablet';
            ua.device.vendor = detect.tablet().replace(/Tablet/i,'');
          } else if(detect.mobile()) {
            ua.device.type = 'mobile';
            ua.device.vendor = detect.mobile().replace(/Mobile/i,'');
          } else if(detect.is('console')) {
            ua.device.type = 'console';
          } else if(detect.is('tv')) {
            ua.device.type = 'tv';
          }
        }

        if(detect.is('wpdesktop')) {
          ua.device.type = 'web';
        } else if(detect.phone()) {
          ua.device.type = 'phone';
        } else if(!ua.device.type) {
          ua.device.type = 'web';
        }

        if(detect.is('bot')) {
          ua.type = 'bot';
          if(detect.is('mobilebot')) {
            ua.type = 'mobilebot';
            ua.device.type = 'mobile';
          }
        } else {
          ua.type = 'device';
        }

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
