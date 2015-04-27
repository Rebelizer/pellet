var pellet = require('pellet');

if(pellet.options.includeUserAgentInfo) {
  var _UAParser = require('ua-parser-js')
    , mobileDetect = require('./mobile-detect.min.js')
    , UAParser = new _UAParser();

  function getUA(ua) {
    var detect = new mobileDetect(ua);
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

    return ua;
  }

  pellet.middlewareStack.push({
    priority: 7,
    fn: function(req, res, next) {
      var ua = req.headers['user-agent'];
      if(ua) {
        ua = getUA(ua);
      }

      if(!req.requestContext) {
        req.requestContext = {};
      }

      req.requestContext.userAgentDetails = ua;
      next();
    }
  });

  if(process.env.SERVER_ENV) {
    pellet.patchUACacheLayer = function (pipeline, ctx, head, metaData, next) {

      var ua = pipeline.http.request.headers['user-agent'];
      if(ua) {
        ctx.requestContext.userAgentDetails = getUA(ua);
      }

      next(null, ctx, head);
    }
  } else {
    pellet.patchUACacheLayer = function (pipeline, ctx, head, metaData, next) {
      next(null, ctx, head);
    }
  }
}
