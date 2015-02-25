// THANKS TO "Michael Phan-Ba" for this code https://github.com/mikepb/jade-react-compiler
// We modified it slightly to support react 0.12 but Michael did all the hard work!
// fork sha a75a4909641dfe5fbd3bb20f5cc80c5967c97e34 last updated point

var parser = require('jade').Parser
  , compiler = require('./compiler')

module.exports = function(source) {
  this.cacheable && this.cacheable();

  var options = {
    filename:this.resourcePath,
    pretty: true,
    webpackLoader: this
  };

  var _parser = new parser(source.toString('utf8'), options.filename, options)
  var _compiler = new compiler(_parser.parse(), options);
  var jscode = _compiler.compile();
  jscode = 'React = react = require("react");' +
    'Pellet = pellet = require("pellet");' +
    'module.exports=function(__$this)' +
    jscode.substring(27);
  //console.log('>>>',jscode)

  return jscode;
};
