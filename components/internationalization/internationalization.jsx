/** @jsx react.DOM */

var react = require('react')
  , cx = react.addons.classSet
  , pellet = require('pellet');

var spec = {
  locales: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.array
  ]),

  formats : React.PropTypes.object,
  messages: React.PropTypes.object
};

module.exports = pellet.createClass({
  getInitialState: function() {

    if(this.props.locales) {
      if(pellet.locales[this.props.locales]) {
        if(this.props.key && pellet.locales[this.props.locales][this.props.key]) {
          state.isMissing = false;
          try {
            state.translation = pellet.locales[this.props.locales][this.props.key](this.props);
          } catch(ex) {
            console.error('Cannot get translation because:', ex.message);
            state.translation = '[ERROR:' + this.props.locales + ':' + this.props.key + ']';
            state.hasErrors = true;
          }
        } else if(this.props.value) {
          try {
            var val = this.props.value.toLowerCase().replace(/\W/g, '');
            if(pellet.locales[this.props.locales][val]) {
              state.translation = pellet.locales[this.props.locales][val](this.props);
            } else {
              state.translation = this.props.value;
            }

            state.isMissing = false;
          } catch(ex) {
            console.error('Cannot get translation because:', ex.message);
            state.translation = '[ERROR:' + this.props.locales + ':' + this.props.value + ']';
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
