var react = require('react')
  , isomorphicContext = require('./isomorphic-context.js');

//todo: add events and route logic into the mixin

var spec = {
  isomorphicContext: react.PropTypes.instanceOf(isomorphicContext),
  locales: react.PropTypes.oneOfType([
      react.PropTypes.string,
      react.PropTypes.array
  ])
};

module.exports = {
  contextTypes     : spec,
  childContextTypes: spec,

  getChildContext: function () {
    return {
      isomorphicContext: this.props.isomorphicContext || this.context.isomorphicContext,
      locales: this.props.locales || this.context.locales
    };
  }

/*
  getDefaultProps: function() {
    // todo: register component with react!
  },

  getInitialState: function() {
    console.log('@@@@',this.context)
    return {}
  },
*/

  /*
  good way to push stuff onto the state
  ,childContextTypes: {
      isomorphicContext: react.PropTypes.instanceOf(isomorphicContext)
    },
  getChildContext: function () {
    console.log('XXX', this.context);
    return this.context
  }
*/
};


//*********************
/*
var testA = react.createClass({
  mixins: [module.exports],
  render: function() {
    return react.DOM.div(null, 'testA:');
  }
});

var testComp = react.createClass({
  mixins: [module.exports],

  statics: {
    // this is a place to fetch the needed data for all our component and child components
    setupInitialRender: function (isomorphicContext, next) {
      isomorphicContext.set({isrc: 'one to three'});
      isomorphicContext.setProps({videoData: {}});

      isomorphicContext.emit({load: "haha haha haha"});
      //isomorphicContext.meta.set('header', 'test')
      //isomorphicContext.cache();
      //isomorphicContext.redirect();

      // switch ctx namespace to /subComponent/sweet
      //subCmp.setupInitialRender(isomorphicContext.namespace('subComponent.sweet', true), next);
      next(null);
    }
  },

  render: function() {
    //console.log('>>>', this.context.isomorphicContext)
    return react.DOM.div(null, 'haha', testA({i:123}));
  }
});

var r = new isomorphicContext();
testComp.setupInitialRender(r, function() {
  console.log(r); //<-- dump our state needed at the server side



  var component = react.withContext({
    isomorphicContext: r,
  }, function () {
    return testComp(r.props);
  });

  console.log(react.renderComponentToStaticMarkup(component));
});


*/