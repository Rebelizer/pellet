var pellet = require('pellet')
  , fs = require('fs')
  , ejs = require('ejs');

pellet.registerInitFn(function(next) {
  if(pellet.options.skeletonPage) {
    var fn = ejs.compile(fs.readFileSync(pellet.options.skeletonPage).toString());
    pellet.setSkeletonPage(function(html, ctx, renderOptions) {
      return fn({isomorphicSharedConfig:pellet.config, config:pellet.options, ctx:(ctx && ctx.toJSON()), html:html, options:renderOptions});
    });
  } else {
    pellet.setSkeletonPage(defaultRender);
  }

  next();
});

function defaultRender(html, ctx, renderOptions) {
  var assetPath = pellet.config.jsMountPoint + pellet.options.assetFileName;
  var appPath = pellet.config.jsMountPoint + pellet.options.componentFileName;
  var locales = pellet.config.jsMountPoint + (renderOptions.locales || pellet.config.locales || 'en-US') + '.js';

  var ourBodyScripts = '<script src="'+pellet.options.reactCDNUrl+'"></script>'+
    '<script>window.__pellet__config = ' + JSON.stringify(pellet.config) + ';</script>'+
    '<script src="' + appPath + '"></script>'+
    '<script src="' + locales + '"></script>';

  if(ctx) {
    ourBodyScripts += '<script>window.__pellet__ctx = ' + ctx.toJSON() + ';</script>';
  }

  ourBodyScripts += '<!-- Google Analytics: change ' + pellet.options.googleTrackID + ' to be your site\'s ID. -->\n'+
  '<script>\n'+
    '(function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=\n'+
    'function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;\n'+
    'e=o.createElement(i);r=o.getElementsByTagName(i)[0];\n'+
    'e.src=\'//www.google-analytics.com/analytics.js\';\n'+
    'r.parentNode.insertBefore(e,r)}(window,document,\'script\',\'ga\'));\n'+
    'ga(\'create\',\'' + pellet.options.googleTrackID + '\');ga(\'send\',\'pageview\');\n'+
  '</script>';

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
      '<script src="' + pellet.options.polyfillPath + '"></script>'+
      '<script src="' + assetPath + '"></script>'+
      renderOptions.http.headTags.join(' ')+
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
