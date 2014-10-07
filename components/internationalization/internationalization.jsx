/** @jsx react.DOM */

var react = require('react')
  , cx = react.addons.classSet
  , pellet = require('pellet');

module.exports = pellet.createClass({
  getInitialState: function() {

    var state = {
      hasErrors: false,
      isMissing: true,
      translation: ''
    };

    if(this.props.locale) {
      if(pellet.locale[this.props.locale]) {
        if(this.props.key && pellet.locale[this.props.locale][this.props.key]) {
          state.isMissing = false;
          try {
            state.translation = pellet.locale[this.props.locale][this.props.key](this.props);
          } catch(ex) {
            console.error('Cannot get translation because:', ex.message);
            state.translation = '[ERROR:' + this.props.locale + ':' + this.props.key + ']';
            state.hasErrors = true;
          }
        } else if(this.props.value) {
          try {
            var val = this.props.value.toLowerCase().replace(/\W/g, '');
            if(pellet.locale[this.props.locale][val]) {
              state.translation = pellet.locale[this.props.locale][val](this.props);
            } else {
              state.translation = this.props.value;
            }

            state.isMissing = false;
          } catch(ex) {
            console.error('Cannot get translation because:', ex.message);
            state.translation = '[ERROR:' + this.props.locale + ':' + this.props.value + ']';
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
