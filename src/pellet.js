var /*director = require('director')
  , */kefir = require('kefir')
  , globlePellet;

function pellet() {
  this.readyFnQue = [];
  this.initFnQue = [];

  this.emitters = {};
}


pellet.prototype.getEmitter = function(key, namespace) {
  if(this.emitters[key]) {
    return this.emitters[key];
  }

  var stream = this.emitters[key] = kefir.emitter();
  stream.onEnd(function() {
    delete this.emitters[key];
  });

  return stream;
}

/**
 * register a function to be called once pellet is ready
 * @param fn
 */
pellet.prototype.onReady = function(fn) {
  // if all ready running fire immediately with the last know err (or null if no errors)
  if(typeof(this.readyError) != 'undefined') {
    setTimeout(function() {
      fn(module.exports.readyError);
    }, 1);

    return;
  }

  this.readyFnQue.push(fn);
};

/**
 * register a function needed to complete before pellet is ready
 * @param fn
 */
pellet.prototype.registerInitFn = function(fn) {
  this.initFnQue.push(fn);
};

/**
 * Called after everyone has register their load functions
 */
pellet.prototype.startInit = function() {
  if(typeof(this.readyError) != 'undefined') {
    throw new Error('Can not reinit because pellet is all ready running.');
  }

  var cbCount = this.initFnQue.length;
  function done(err) {
    if(err) {
      // console log the error and safe the most recent error
      console.error('Error init pellet because:', err.message);
      module.exports.readyError = err;
    }

    if(--cbCount <= 0) {
      // if all callback had no error set to null
      if(!module.exports.readyError) {
        module.exports.readyError = null;
      }

      var fn;
      while(fn = module.exports.readyFnQue.pop()) {
        fn(module.exports.readyError);
      }
    }
  }

  if(cbCount === 0) {
    done(null);
    return;
  }

  // now call all init fn and wait until all done
  for(var i in this.initFnQue) {
    this.initFnQue[i](done);
  }
};

// for the server environment define the middleware
if(typeof BROWSER_ENV === 'undefined' || !BROWSER_ENV) {
  pellet.prototype.middleware = function (req, res, next) {
    var stream = globlePellet.getEmitter('route:change');

    // if no observers skip route
    if(!stream._active) {
      next();
      return;
    }

    stream.emit({
      path: req.path,
      query: req.query,
      req: req,
      res: res,
      next: next
    });
  };

  pellet.prototype.renderServerSide = function() {
    var markup;

    var ourBodyScripts = '<script src="//cdnjs.cloudflare.com/ajax/libs/history.js/1.8/native.history.min.js"></script>'+
      '<script src="//cdnjs.cloudflare.com/ajax/libs/react/0.11.1/react-with-addons.js"></script>'+
      '<script src="/js/demo.js"></script>';

    // for bots only return the markup with out react state and bootstrap call
    if(/googlebot|gurujibot|twitterbot|yandexbot|slurp|msnbot|bingbot|rogerbot|facebookexternalhit/i.test(message.req.headers['user-agent']||'')) {
      markup = react.renderComponentToStaticMarkup(layout({body:message.component, meta:message.meta, locales:app.i18n.locales, messages:app.i18n.messages}));
    } else {
      markup = react.renderComponentToString(layout({body:message.component, meta:message.meta, locales:app.i18n.locales, messages:app.i18n.messages}));

      if(message.id) {
        ourBodyScripts += '<script>app.bootstrap("'+message.id+'",'+JSON.stringify(message.props)+','+JSON.stringify(message.meta)+');</script>';
      }
    }

    ourBodyScripts += '<!-- Google Analytics: change UA-XXXXX-X to be your site\'s ID. -->\n'+
    '<script>\n'+
      '(function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=\n'+
      'function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;\n'+
      'e=o.createElement(i);r=o.getElementsByTagName(i)[0];\n'+
      'e.src=\'//www.google-analytics.com/analytics.js\';\n'+
      'r.parentNode.insertBefore(e,r)}(window,document,\'script\',\'ga\'));\n'+
      'ga(\'create\',\'UA-XXXXX-X\');ga(\'send\',\'pageview\');\n'+
    '</script>';

    // workaround because react does not support doctype or <!-- -->
    message.res.status((message.meta && message.meta.status) || 200);
    message.res.end('<!DOCTYPE html>\n'+
      '<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->\n'+
      '<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->\n'+
      '<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->\n'+
      '<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->\n'+
      '<head>'+
        '<meta charset="utf-8">'+
        '<meta http-equiv="X-UA-Compatible" content="IE=edge">'+
        ((message.meta && message.meta.title) ? '  <title>' + message.meta.title + '</title>' : '') +
        '<meta name="description" content="">'+
        '<meta name="viewport" content="width=device-width, initial-scale=1">'+
        '<script src="//polyfill.io"></script>'+
        '<script src="/js/demo-assets.js"></script>'+
      '</head>'+
      '<body>'+
        '<!--[if lt IE 7]>\n'+
        '<p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>\n'+
        '<![endif]-->\n'+
        '<div id="__APP__">'+
          markup +
        '</div>'+
        ourBodyScripts+
      '</body>'+
      '</html>');
  }
}

// hack the environment so that we can create a singleton that can be shared
// between the native nodejs environment and the webpacks container.
if(typeof BROWSER_ENV !== 'undefined' && BROWSER_ENV) {
  globlePellet = new pellet();
} else {
  if(global.__pelletSingleton) {
    globlePellet = global.__pelletSingleton;
  } else {
    globlePellet = global.__pelletSingleton = new pellet();
  }
}

module.exports = globlePellet;
