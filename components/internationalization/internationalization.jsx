/** @jsx react.DOM */

var react = require('react')
  , cx = react.addons.classSet
  , pellet = require('pellet');

var spec = {
  value: react.PropTypes.string,
  key: react.PropTypes.string,
  missing: react.PropTypes.string
};

function getTranslation(locales, props) {

  var state = {
    hasErrors: false,
    isMissing: true,
    translation: ''
  };

  // todo: make a function that will walk over all the locales and try to match them i.e. us-en, us-br, us

  if(locales) {
    if(pellet.locales[locales]) {
      if(props.key && pellet.locales[locales][props.key]) {
        state.isMissing = false;
        try {
          state.translation = pellet.locales[locales][props.key](props);
        } catch(ex) {
          console.error('Cannot get translation because:', ex.message);
          state.translation = '[ERROR:' + locales + ':' + props.key + ']';
          state.hasErrors = true;
        }
      } else if(props.value) {
        try {
          var val = props.value.toLowerCase().replace(/\W/g, '');
          if(pellet.locales[locales][val]) {
            state.translation = pellet.locales[locales][val](props);
          } else {
            state.translation = props.value;
          }

          state.isMissing = false;
        } catch(ex) {
          console.error('Cannot get translation because:', ex.message);
          state.translation = '[ERROR:' + locales + ':' + props.value + ']';
          state.hasErrors = true;
        }
      } else {
        state.translation = props.missing || 'MISSING';
      }
    } else {
      state.translation = '[UNKNOWN LOCALE]';
    }
  } else {
    state.translation = '[LOCALE NO SET]';
  }

  return state;
}

/**
 * helper function for jade teammates making it easier to add intl to jade
 *
 * just add: "#{pellet.intlComponent({key:'MyKEY'})}"
 *
 * @param options
 * @returns {Function}
 */
pellet.jadeUtils.intl = function(options) {
  return function() {
    return module.exports(options);
  };
}

/**
 * helper function to lookup translation in pellet
 *
 * @param scope
 * @param options
 * @returns {string|*|buildManifestMap.server.translation}
 */
pellet.intl = function(scope, options) {
  return getTranslation(scope.props.locales || scope.context.locales || scope, options).translation;
}

module.exports = pellet.createClass({
  propsTypes: spec,

  getInitialState: function() {
    return getTranslation(this.props.locales || this.context.locales, this.props);
  },

  render: function() {

    var classes = cx({
      'translation-missing': this.state.isMissing,
      'translation-error': this.state.hasErrors
    });

    return (
      <span className={classes}>{this.state.translation}</span>
    );
  }
});
