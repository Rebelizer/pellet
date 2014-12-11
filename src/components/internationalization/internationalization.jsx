var react = require('react')
  , cx = react.addons.classSet
  , pellet = require('pellet');

var spec = {
  value: react.PropTypes.string,
  index: react.PropTypes.string,
  fuzzy: react.PropTypes.boolean,
  missing: react.PropTypes.string
};

var _intl;
if(process.env.SERVER_ENV) {
  _intl = require('intl');
} else {
  _intl = window.Intl;
}

function getTranslation(locales, props) {

  var val;

  var state = {
    hasErrors: false,
    isMissing: true,
    translation: ''
  };

  // supports calling props as
  //  getTranslation(locales, { index: stringToTranslate })
  // or
  //  getTranslation(locales, stringToTranslate)
  if (typeof props === "string") {
    props = {
      index: props
    }
  }

  // todo: make a function that will walk over all the locales and try to match them i.e. us-en, us-br, us

  if(locales) {
    if(pellet.locales[locales]) {
      if(props.index && (val = (props.fuzzy ? props.index.toLowerCase().replace(/\W/g, ''):props.index)) && pellet.locales[locales][val]) {
        state.isMissing = false;
        try {
          state.translation = pellet.locales[locales][val](props);
        } catch(ex) {
          console.error('Cannot get translation because:', ex.message);
          state.translation = '[ERROR:' + locales + ':' + val + ']';
          state.hasErrors = true;
        }
      } else if(props.value) {
        try {
          if(props.fuzzy) {
            val = props.value.toLowerCase().replace(/\W/g, '');
          } else {
            val = props.value;
          }

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
        state.translation = props.missing || '[MISSING: "' + props.index + '"]';
      }
    } else {
      state.translation = '[UNKNOWN LOCALE: "' + locales + '"]';
    }
  } else {
    state.translation = '[LOCALE NOT SET]';
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

pellet.intl.formatNumber = function(scope, number, options) {
  return _intl.NumberFormat(scope.props.locales || scope.context.locales, options).format(number);
}

pellet.intl.formatDateTime = function(scope, date, options) {
  return _intl.DateTimeFormat(scope.props.locales || scope.context.locales, options).format(date);
}

pellet.intl.load = function(locales, next) {
  if(pellet.locales[locales]) {
    if(next) {
      next();
      return;
    }
  }

  var src = (pellet.config.jsMountPoint || '/js/') + locales + '.js';
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = src;

  if(next) {
    script.onreadystatechange = next;
    script.onload = next;
  }

  head.appendChild(script);
}

module.exports = pellet.createClass({
  propsTypes: spec,

  render: function() {

    var locales = this.props.locales || this.context.locales;
    var translation = getTranslation(locales, this.props);

    if(process.env.BROWSER_ENV && translation.isMissing && !pellet.locales[locales] && !pellet.locales['_$'+locales]) {
      console.info('Try to load missing locales:', locales);
      pellet.locales['_$'+locales] = true;
      var _this = this;

      pellet.intl.load(locales, function() {
        while(_this._owner) {
          _this = _this._owner;
        }

        _this.forceUpdate();
      });

      return (
        <span></span>
      );
    }

    var classes = cx({
      'translation-missing': translation.isMissing,
      'translation-error': translation.hasErrors
    });

    return (
      <span className={classes}>{translation.translation}</span>
    );
  }
});
