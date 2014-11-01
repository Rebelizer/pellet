var parser = require('jade').Parser
  , compiler = require('./compiler')

// THANKS TO "Michael Phan-Ba" for this code https://github.com/mikepb/jade-react-compiler
// We just needed to update to support the new react!

module.exports = function(source) {
  this.cacheable && this.cacheable();

  var options = {
    // todo: need to update this path using the source path info
    filename:'/Users/demi/Projects/pellet/doghouse/frontend/haha'
  };

  var _parser = new parser(source.toString('utf8'), options.filename, options)
  var _compiler = new compiler(_parser.parse(), options);

  var jscode = _compiler.compile();
  jscode = 'React = react = require("react");' +
    'Pellet = pellet = require("pellet");' +
    'utils = {addComponent:pellet.jade_addComponent, addEl:pellet.jade_addEl, intl:pellet.jade_intl};' +
    'module.exports=function(scope)' +
    jscode.substring(27);
  //console.log(jscode)

  return jscode;
};
