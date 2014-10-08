var react = require('react')
  , utils = require('./utils')
  , isomorphicContext = require('./isomorphic-context.js');

// options.context options.mode=MODE_HTML, options.dom =

var isomorphicRender = module.exports = {
  MODE_STRING: 'static',
  MODE_HTML: 'markup',
  MODE_DOM: 'dom',

  /**
   * Render the component for both the server and browser
   *
   * @param component
   * @param options (mode: targetEl:, context: or props:)
   * @param next
   */
  renderComponent: function(component, options, next) {
    if(typeof options == 'function') {
      next = options;
      options = {};
    } else if(!options) {
      options = {};
    }

    if(!component || !next) {
      throw new Error('the component and next are required')
    }

    // default the mode using the environment so if in browser use
    // DOM render else render full html with react-ids
    if(!options.mode) {
      if(process.env.BROWSER_ENV) {
        options.mode = isomorphicRender.MODE_DOM;
      } else {
        options.mode = isomorphicRender.MODE_HTML;
      }
    }

    function renderReactComponent(component, ctx) {
      var result;

      try {
        if(options.mode == isomorphicRender.MODE_DOM && process.env.BROWSER_ENV) {
          if(!options.targetEl) {
            options.targetEl = document.getElementById('__PELLET__');
            if(!options.targetEl) {
              options.targetEl = document.body;
            }
          }

          result = react.renderComponent(component, options.targetEl);
        } else if(options.mode == isomorphicRender.MODE_STRING) {
          result = react.renderComponentToStaticMarkup(component);
        } else if(options.mode == isomorphicRender.MODE_HTML) {
          result = react.renderComponentToString(component);
        }
      } catch(ex) {
        next(ex);
        return;
      }

      next(null, result, ctx);
    }

    var componentWithContext;

    // get serialize state if component supports the setupInitialRender
    if (component.setupInitialRender) {
      var ctx = new isomorphicContext(options.context, options.provider);

      if(options.props) {
        ctx.setProps(options.props);
      }

      try {
        component.setupInitialRender(ctx, function (err) {
          if(err) {
            return next(err);
          }

          try {
            componentWithContext = react.withContext({
              isomorphicContext: ctx,
              locales: options.locals
            }, function () {
              return component(ctx.props);
            });
          } catch(ex) {
            next(ex);
            return;
          }

          renderReactComponent(componentWithContext, ctx);
        });
      } catch(ex) {
        next(ex);
      }
    } else {

      try {
        componentWithContext = react.withContext({
          locales: options.locals
        }, function () {
          var props;

          if(options.context && options.props && options.context.props) {
            props = {};
            utils.objectUnion([options.context.props, options.props], props);
          } else if(options.props) {
            props = options.props;
          } else if(options.context && options.context.props) {
            props = options.context.props;
          }

          return component(props);
        });
      } catch(ex) {
        next(ex);
        return;
      }

      renderReactComponent(componentWithContext);
    }
  }
};
