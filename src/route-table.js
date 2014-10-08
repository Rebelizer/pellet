var pathToRegexp = require('path-to-regexp')
  , querystring = require('querystring');

function router(options) {
  this.routes = [];

  this.defaults = {
    sensitive: !!(options && options.sensitive || false),
    strict: !!(options && options.strict || false),
    end: true,
    rank: 0
  };

  if(options && typeof options.end !== 'undefined') {
    this.defaults.end = !!options.end;
  }
}

router.prototype.add = function(pattern, fn, options) {
  var key;

  if(!fn) {
    throw new Error('callback fn is required.')
  }

  // build up the options using our defaults and overrides
  var privateOptions = Object.create(this.defaults);
  if(options) {
    if(typeof(options.sensitive) !== 'undefined') {
      privateOptions.sensitive = !!options.sensitive;
    }

    if(typeof(options.strict) !== 'undefined') {
      privateOptions.strict = !!options.strict;
    }

    if(typeof(options.end) !== 'undefined') {
      privateOptions.end = !!options.end;
    }

    if(typeof(options.rank) !== 'undefined') {
      privateOptions.rank = parseInt(options.rank, 10);
    }
  }

  // build a unique key to identify the route ignoring named parameters
  if(typeof pattern === 'string') {
    key = pattern.replace(/:[^\?\*\/]+/g,'_').replace(/_([\*\?])/g,'$1');
  } else if(pattern instanceof Array) {
    key = JSON.stringify(pattern).replace(/[\[\]"\,]/g,'');
  } else if(pattern instanceof RegExp) {
    key = pattern.toString();
  }

  var route;

  // looking for duplicate routes
  for(var i in this.routes) {
    if(this.routes[i].key === key) {
      if(this.routes[i].rank >= privateOptions.rank) {
        return false;
      } else {
        route = this.routes[i] = pathToRegexp(pattern, [], privateOptions);
        route.key = key;
        route.rank = privateOptions.rank;
        route.fn = fn;
        return key;
      }
    }
  }

  route = pathToRegexp(pattern, [], privateOptions);
  route.key = key;
  route.rank = privateOptions.rank;
  route.fn = fn;

  this.routes.push(route);

  // todo: sort the routes by key and order so most specific route are first i.e. /foo/demi -> /foo/:name -> /foo/:path*
  this.routes.sort(function(a, b) {
    return b.rank - a.rank;
  });

  return key;
};

router.prototype.parse = function(fullpath) {
  var i, path, result, route, query;

  query = fullpath.indexOf('?');
  if(query !== -1) {
    path = fullpath.substring(0, query);
    query = querystring.parse(fullpath.substring(query + 1));
  } else {
    path = fullpath;
  }

  for(i in this.routes) {
    route = this.routes[i];
    result = route.exec(path);

    if(result) {
      result.shift();

      var details = {
        fn: route.fn,
        url: path,
        originalUrl: fullpath,
        query: query !== -1 ? query : null,
        params: route.keys.length ? {} : null
      };

      for(i in route.keys) {
        details.params[route.keys[i].name] = result.shift();
      }

      return details;
    }
  }

  return false;
};

module.exports = router;
