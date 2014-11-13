var react = require('react')
  , cx = react.addons.classSet
  , pellet = require('pellet');

var spec = {
  value: react.PropTypes.string,
  index: react.PropTypes.string,
  missing: react.PropTypes.string
};

var _intl;
if(process.env.SERVER_ENV) {
  _intl = require('Intl');
} else {
  _intl = window.Intl;
}

function getTranslation(locales, props) {

  var state = {
    hasErrors: false,
    isMissing: true,
    translation: ''
  };

  // todo: make a function that will walk over all the locales and try to match them i.e. us-en, us-br, us

  if(locales) {
    if(pellet.locales[locales]) {
      if(props.index && pellet.locales[locales][props.index]) {
        state.isMissing = false;
        try {
          state.translation = pellet.locales[locales][props.index](props);
        } catch(ex) {
          console.error('Cannot get translation because:', ex.message);
          state.translation = '[ERROR:' + locales + ':' + props.index + ']';
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
 * helper function to lookup translation in pellet
 *
 * @param scope
 * @param options
 * @returns {string|*|buildManifestMap.server.translation}
 */
pellet.intl = function(scope, options) {
  return getTranslation(scope.props.locales || scope.context.locales || scope, options).translation;
}

pellet.intl.formatNumber = function(scope, number) {
  return number.toString();
  return _intl.NumberFormat(scope.props.locales || scope.context.locales).format(number);
}

pellet.intl.formatDateTime = function(scope, options) {
  return _intl.DateTimeFormat(scope.props.locales || scope.context.locales).format(options);
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
