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
  var _locales = renderOptions.locales || pellet.config.locales || 'en-US';
  var locales = pellet.config.jsMountPoint + _locales + '.js';

  var ourBodyScripts = '<script>window.__pellet__config = ' + JSON.stringify(pellet.config) + ';';
  if(ctx) {
    ourBodyScripts += 'window.__pellet__ctx = ' + ctx.toJSON() + ';</script>';
  } else {
    ourBodyScripts += '</script>';
  }

  ourBodyScripts += '<script>!function(e,t,r){function n(){for(;d[0]&&"loaded"==d[0][f];)c=d.shift(),c[o]=!i.parentNode.insertBefore(c,i)}for(var s,a,c,d=[],i=e.scripts[0],o="onreadystatechange",f="readyState";s=r.shift();)a=e.createElement(t),"async"in i?(a.async=!1,e.head.appendChild(a)):i[f]?(d.push(a),a[o]=n):e.write("<"+t+\' src="\'+s+\'" defer></\'+t+">"),a.src=s}(document,"script",['+
    '"' + pellet.options.polyfillPath + '?h=' + pellet.options.ushash + '",'+
    '"' + assetPath + '",'+
    '"' + pellet.options.reactCDNUrl + '",'+
    '"' + appPath + '",'+
    '"' + locales + '"' +
  '])' +
  '</script>';

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
      '<meta name="viewport" content="width=device-width, initial-scale=1">'+
      '<link rel="stylesheet" type="text/css" href="' + pellet.config.jsMountPoint + pellet.options.styleFileName + '">'+
      '<link rel="shortcut icon" type="image/ico" href="/favicon.ico" />'+
      renderOptions.http.headTags.join(' ')+
      '<link rel="subresource" href="' + pellet.options.polyfillPath + '?h=' + pellet.options.ushash + '">'+
      '<link rel="subresource" href="' + assetPath + '">'+
      '<link rel="subresource" href="' + pellet.options.reactCDNUrl + '">'+
      '<link rel="subresource" href="' + appPath + '">'+
      '<link rel="subresource" href="' + locales + '">'+
      ourBodyScripts+
    '</head>'+
    '<body class="lang '+_locales.substring(0,2)+'" locales="'+_locales+'">'+
      '<!--[if lt IE 7]>\n'+
      '<p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>\n'+
      '<![endif]-->\n'+
      '<div id="__PELLET__" class="loading_and_uninitialized">'+
        html +
      '</div>'+
    '</body>'+
    '</html>';
}


