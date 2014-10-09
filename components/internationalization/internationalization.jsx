/** @jsx react.DOM */

var react = require('react')
  , cx = react.addons.classSet
  , pellet = require('pellet');

var spec = {
  value: react.PropTypes.string,
  key: react.PropTypes.string,
  missing: react.PropTypes.string
};

module.exports = pellet.createClass({
  propsTypes: spec,

  getInitialState: function() {

    var state = {
      hasErrors: false,
      isMissing: true,
      translation: ''
    };

    var locales = this.props.locales || this.context.locales;

    // todo: make a function that will walk over all the locales and try to match them i.e. us-en, us-br, us

    if(locales) {
      if(pellet.locales[locales]) {
        if(this.props.key && pellet.locales[locales][this.props.key]) {
          state.isMissing = false;
          try {
            state.translation = pellet.locales[locales][this.props.key](this.props);
          } catch(ex) {
            console.error('Cannot get translation because:', ex.message);
            state.translation = '[ERROR:' + locales + ':' + this.props.key + ']';
            state.hasErrors = true;
          }
        } else if(this.props.value) {
          try {
            var val = this.props.value.toLowerCase().replace(/\W/g, '');
            if(pellet.locales[locales][val]) {
              state.translation = pellet.locales[locales][val](this.props);
            } else {
              state.translation = this.props.value;
            }

            state.isMissing = false;
          } catch(ex) {
            console.error('Cannot get translation because:', ex.message);
            state.translation = '[ERROR:' + locales + ':' + this.props.value + ']';
            state.hasErrors = true;
          }
        } else {
          state.translation = this.props.missing || 'MISSING';
        }
      } else {
        state.translation = '[UNKNOWN LOCALE]';
      }
    } else {
      state.translation = '[LOCALE NO SET]';
    }

    return state;
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
