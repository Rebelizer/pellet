var react = require('react')
  , utils = require('./utils')
  , isomorphicRouteContext = require('./isomorphic-route-context.js');

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

          react.unmountComponentAtNode(options.targetEl);
          result = react.render(component, options.targetEl);
        } else if(options.mode == isomorphicRender.MODE_STRING) {
          result = react.renderToStaticMarkup(component);
        } else if(options.mode == isomorphicRender.MODE_HTML) {
          result = react.renderToString(component);
        }
      } catch(ex) {
        next(ex);
        return;
      }

      next(null, result, ctx);
    }

    var componentWithContext;

    // get the serialize state if component has a onRoute function
    if (component.__$onRoute) {

      try {
        var context = new isomorphicRouteContext(options.context, options.provider);

        if(options.props) {
          context.setProps(options.props);
        }

        component.__$onRoute.call(context, {}, function (err) {
          if(err) {
            return next(err);
          }

          try {
            componentWithContext = react.withContext({
              locales: options.locales
            }, function () {
              return component(context.props);
            });
          } catch(ex) {
            next(ex);
            return;
          }

          // wait a tick so all kefir emit get processed for the
          // context serialization.
          setTimeout(function() {
            context.release();
            renderReactComponent(componentWithContext, context);
          }, 0);
        });
      } catch(ex) {
        console.error('Error in trying to render component because:', ex.message);

        context.release();
        next(ex);
      }
    } else {

      try {
        componentWithContext = react.withContext({
          locales: options.locales
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
