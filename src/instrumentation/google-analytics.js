var pellet = require('../pellet');

if(process.env.BROWSER_ENV) {
  var PARSE_STATSD = /^\["((.+)\.)?(.+)"\s*,\s*(.+)\]$/;

  function sendCmd(type, gaTrackID) {
    if(!gaTrackID) {
      gaTrackID = pellet.config[type];
    }

    if(!gaTrackID){
      return 'send';
    }

    return gaTrackID + '.send';
  }

  pellet.registerInitFn(function (next) {
    if(pellet.config && pellet.config.instrumentation) {
      var gaTimingFilterFn = pellet.config.instrumentation.gaTimingFilterFn
        , gaEventFilterFn = pellet.config.instrumentation.gaEventFilterFn;
    }

    pellet.instrumentation.bus.on(function (data) {
      var namespace = data.namespace
        , gaTrackID = data.gaTrackID
        , details = data.details
        , type = data.type
        , fn;

      if(type === 'uncaught-exception' && pellet.config.gaExceptionTrackID !== false) {
        ga(sendCmd('gaExceptionTrackID', gaTrackID), 'exception', {
          exDescription: details.msg + ' lineno:' + details.no
        });
      } else if(type === 'statsd' && details.c === 'timing' && pellet.config.gaTimingTrackID !== false) {
        if(gaTimingFilterFn && (fn = pellet.instrumentation.getTransformFn(gaTimingFilterFn)) && !(data = fn(data))) {
          return;
        }

        // update the gaTrackID because
        // getTransformFn can update the value
        gaTrackID = data.gaTrackID;

        // convert the statsd data to a GA timing event
        data = data.details.a.match(PARSE_STATSD);
        if(data) {
          ga(sendCmd('gaTimingTrackID', gaTrackID), 'timing', {
            'timingCategory': data[2] || 'statsd',
            'timingVar': data[3],
            'timingValue': parseInt(data[4])
          });
        }
      } else if(type === 'event' && pellet.config.gaEventTrackID !== false) {
        if(gaEventFilterFn && (fn=pellet.instrumentation.getTransformFn(gaEventFilterFn)) && !(data = fn(data))) {
          return;
        }

        // update the gaTrackID because
        // getTransformFn can update the value
        gaTrackID = data.gaTrackID;

        ga(sendCmd('gaEventTrackID', gaTrackID), 'event', data);
      } else if(type === 'routechange') {

        var statusCode = (details.pipeline.$ && details.pipeline.$.statusCode) || 200;
        var url = (pellet.config.gaTrackCanonical && details.pipeline.$ && details.pipeline.$.relCanonical) || details.originalUrl;

        // report normal 2XX status codes, but for any other codes like
        // 404, 500 status send them to the gaSyntheticPageUrl page for tracking
        if(!pellet.config.gaSyntheticPageUrl || statusCode === 200) {
          ga('set', {
            page: url,
            title: document.title
          });
        } else {
          ga('set', {
            page: pellet.config.gaSyntheticPageUrl + '/' + statusCode + '?url=' + url + '&refer=' + details.referrer,
            title: document.title
          });
        }

        ga('send', 'pageview');
      }
    });

    next();
  });
}
