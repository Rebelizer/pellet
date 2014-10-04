var react = require('react')
  , isomorphicMixin = require('./isomorphic-mixin.js');

module.exports = function(spec) {
  if(!spec.mixins) {
    spec.mixins = [];
  }

  if(!(isomorphicMixin in spec.mixins)) {
    spec.mixins.push(isomorphicMixin);
  }

  if(spec.setupInitialRender) {
    if(!spec.statics) {
      spec.statics = {};
    }

    spec.statics.setupInitialRender = spec.setupInitialRender;
    delete spec.setupInitialRender;
  }

  return react.createClass(spec);
}
