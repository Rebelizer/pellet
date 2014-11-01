var parser = require('jade').Parser
  , compiler = require('./compiler')

module.exports = function(source) {
  this.cacheable && this.cacheable();

  var options = {
    filename:this.resourcePath,
    webpackLoader: this
  };

  var _parser = new parser(source.toString('utf8'), options.filename, options)
  var _compiler = new compiler(_parser.parse(), options);

  var jscode = _compiler.compile();
  jscode = 'React = react = require("react");' +
    'Pellet = pellet = require("pellet");' +
    'module.exports=function(__$this)' +
    jscode.substring(27);
  //console.log(jscode)

  return jscode;
};
