var react = require('react')
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
      var markup;

      try {
        if(options.mode == isomorphicRender.MODE_DOM && process.env.BROWSER_ENV) {
          if(!options.targetEl) {
            options.targetEl = document.getElementById('__PELLET__');
            if(!options.targetEl) {
              options.targetEl = document.body;
            }
          }

          markup = react.renderComponent(component, options.targetEl);

          // on the browser update the dom meta session and script etc.
          if(ctx) {
            //document.title = ctx.meta.title;
          }
        } else if(options.mode == isomorphicRender.MODE_STRING) {
          markup = react.renderComponentToStaticMarkup(component);
        } else if(options.mode == isomorphicRender.MODE_HTML) {
          markup = react.renderComponentToString(component);
        }
      } catch(ex) {
        next(ex);
        return;
      }

      next(null, markup, ctx);
    }

    // get serialize state if component supports the setupInitialRender
    if (component.setupInitialRender) {
      var ctx = new isomorphicContext(options.context);

      if(options.props) {
        ctx.setProps(options.props);
      }

      try {
        component.setupInitialRender(ctx, function (err) {
          if(err) {
            return next(err);
          }

          try {
            var root = react.withContext({
              isomorphicContext: ctx
              // todo: add the i18n stuff here!
            }, function () {
              return component(ctx.props);
            });
          } catch(ex) {
            next(ex);
            return;
          }

          renderReactComponent(root, ctx);
        });
      } catch(ex) {
        next(ex);
      }
    } else {
      // todo: wrapping context with i18n support
      //todo: review the logic for the arguments
      renderReactComponent(component((options.context && options.context.props) || options.props));
    }
  }
};
