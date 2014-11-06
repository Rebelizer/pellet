var react = require('react')
  , isomorphicContext = require('./isomorphic-context.js');

var spec = {
  locales: react.PropTypes.oneOfType([
    react.PropTypes.string,
    react.PropTypes.array
  ])
};

module.exports = {
  contextTypes     : spec,
  childContextTypes: spec,

  getInitialState: function() {
    return (this.props && this.props.__initState) || {};
  },

  getChildContext: function () {
    return {
      locales: this.props.locales || this.context.locales
    };
  }
};
