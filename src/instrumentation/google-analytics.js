var pellet = require('../pellet');

if(process.env.BROWSER_ENV) {
  var PARSE_STATSD = /^\["((.+)\.)?(.+)"\s*,\s*(.+)\]$/;

  pellet.registerInitFn(function (next) {
    if(pellet.config && pellet.config.instrumentation) {
      var gaTimingFilterFn = pellet.config.instrumentation.gaTimingFilterFn
        , gaEventFilterFn = pellet.config.instrumentation.gaEventFilterFn;
    }

    pellet.instrumentation.bus.on(function (data) {
      var namespace = data.namespace
        , details = data.details
        , type = data.type
        , fn;

      if(type === 'uncaught-exception') {
        ga('send', 'exception', {
          exDescription: details.msg + ' lineno:' + details.no
        });
      } else if(type === 'statsd' && details.c === 'timing') {
        if(gaTimingFilterFn && (fn = pellet.instrumentation.getTransformFn(gaTimingFilterFn)) && !(data = fn(data))) {
          return;
        }

        // convert the statsd data to a GA timing event
        data = data.details.a.match(PARSE_STATSD);
        if(data) {
          ga('send', 'timing', {
            'timingCategory': data[2] || 'statsd',
            'timingVar': data[3],
            'timingValue': parseInt(data[4])
          });
        }
      } else if(type === 'event') {
        if(gaEventFilterFn && (fn=pellet.instrumentation.getTransformFn(gaEventFilterFn)) && !(data = fn(data))) {
          return;
        }

        ga('send', 'event', data);
      } else if(type === 'routechange'){
        ga('set', {
          page: details.originalUrl,
          title: document.title
        });

        ga('send', 'pageview');
      }
    });

    next();
  });
}
