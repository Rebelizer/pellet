var pellet = require('pellet')
  , fs = require('fs')
  , ejs = require('ejs');

pellet.registerInitFn(function(next) {
  if(pellet.config.skeletonPage) {
    var fn = ejs.compile(fs.readFileSync(pellet.config.skeletonPage).toString());
    pellet.setSkeletonPage(function(html, ctx, renderOptions) {
      return fn({config:pellet.config, ctx:ctx, html:html, options:renderOptions});
    });
  } else {
    pellet.setSkeletonPage(defaultRender);
  }

  next();
});

function defaultRender(html, ctx, renderOptions) {
  var assetPath = pellet.config.jsMountPoint + pellet.config.assetFileName;
  var appPath = pellet.config.jsMountPoint + pellet.config.componentFileName;
  var locales = pellet.config.jsMountPoint + (renderOptions.locales || pellet.config.locales || 'en') + '.js';

  var ourBodyScripts = '<script src="//cdnjs.cloudflare.com/ajax/libs/history.js/1.8/native.history.min.js"></script>'+
    '<script src="//cdnjs.cloudflare.com/ajax/libs/react/0.11.1/react-with-addons.js"></script>'+
    '<script src="' + appPath + '"></script>'+
    '<script src="' + locales + '"></script>';

  if(ctx) {
    ourBodyScripts += '<script>window.__pellet__ctx = "' + ctx.toJSON().replace(/"/g,'\\"') + '";</script>';
  }

  ourBodyScripts += '<script>window.__pellet__config = ' + JSON.stringify(pellet.config.__publicCommonConfig) + ';</script>';

  ourBodyScripts += '<!-- Google Analytics: change ' + pellet.config.googleTrackID + ' to be your site\'s ID. -->\n'+
  '<script>\n'+
    '(function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=\n'+
    'function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;\n'+
    'e=o.createElement(i);r=o.getElementsByTagName(i)[0];\n'+
    'e.src=\'//www.google-analytics.com/analytics.js\';\n'+
    'r.parentNode.insertBefore(e,r)}(window,document,\'script\',\'ga\'));\n'+
    'ga(\'create\',\'' + pellet.config.googleTrackID + '\');ga(\'send\',\'pageview\');\n'+
  '</script>';

  if(ctx) {
    //message.res.status((message.meta && message.meta.status) || 200);
  }

  return '<!DOCTYPE html>\n'+
    '<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->\n'+
    '<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->\n'+
    '<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->\n'+
    '<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->\n'+
    '<head>'+
      '<meta charset="utf-8">'+
      '<meta http-equiv="X-UA-Compatible" content="IE=edge">'+
      //((message.meta && message.meta.title) ? '  <title>' + message.meta.title + '</title>' : '') +
      '<meta name="description" content="">'+
      '<meta name="viewport" content="width=device-width, initial-scale=1">'+
      '<script src="' + pellet.config.polyfillPath + '"></script>'+
      '<script src="' + assetPath + '"></script>'+
    '</head>'+
    '<body>'+
      '<!--[if lt IE 7]>\n'+
      '<p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>\n'+
      '<![endif]-->\n'+
      '<div id="__PELLET__">'+
        html +
      '</div>'+
      ourBodyScripts+
    '</body>'+
    '</html>';
}
