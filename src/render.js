var react = require('react')
  , pellet = require('./pellet')
  , utils = require('./utils')
  , isolator = require('./isolator')
  , pipeline = require('./isomorphic/pipeline');

// options.context options.mode=MODE_HTML, options.dom =

var pelletRender = module.exports = {
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
        options.mode = pelletRender.MODE_DOM;
      } else {
        options.mode = pelletRender.MODE_HTML;
      }
    }

    var instrument = pellet.instrumentation.namespace('isorender.');
    var mesure = instrument.elapseTimer();
    instrument.increment('isorender.count');

    function renderReactComponent(component, ctx) {
      var result;

      try {
        if(options.mode == pelletRender.MODE_DOM && process.env.BROWSER_ENV) {
          if(!options.targetEl) {
            options.targetEl = document.getElementById('__PELLET__');
            if(!options.targetEl) {
              options.targetEl = document.body;
            }
          }

          react.unmountComponentAtNode(options.targetEl);
          mesure.mark('react_unmount');

          // only add touch events if the device support it
          if ('ontouchstart' in document.documentElement) {
            react.initializeTouchEvents(true);
          }

          result = react.render(component, options.targetEl);
        } else if(options.mode == pelletRender.MODE_STRING) {
          result = react.renderToStaticMarkup(component);
        } else if(options.mode == pelletRender.MODE_HTML) {
          result = react.renderToString(component);
        }

        mesure.mark('react_render');
      } catch(ex) {
        next(ex);
        pellet.instrumentation.increment('isorender.error');
        return;
      }

      next(null, result, ctx);
    }

    var componentWithContext;

    // get the serialize state if component has a onRoute function
    if (component._$construction) {

      try {
        // create a pipeline to render the component and track its state.
        // options.context is the serialized data from the server
        // options.http is isomorphic req/res to
        var pipe = new pipeline(options.context, options.http, options.isolatedConfig, options.requestContext, options.locales);

        // update the pipe props because we got them in our options
        // the route function sets things like originalUrl, params, etc.
        // so the __$onRoute can know about the route that was triggered
        if(options.props) {
          pipe.setProps(options.props);
        }

        mesure.mark('create_pipeline');

        // now run the pre-flight code before asking react to render
        // this allows for async code to be executed and tracks any
        // data that needs to get serialized to the client.
        component._$construction.call(pipe, {}, function (err) {
          mesure.mark('component_construction');

          if(err) {
            instrument.increment('isorender.err');
            return next(err);
          }

          if(pipe.abortRender) {
            pipe.release();
            mesure.mark('release');
            instrument.increment('isorender.abort');
            return next(null, null, pipe);
          }

          // make sure the react context has locales to pick the
          // rendered language. Then render the element with the
          // props from the __$onRoute.
          try {
            componentWithContext = react.withContext({
              rootIsolator: new isolator(null, null, null, pipe.rootIsolator.isolatedConfig),
              requestContext: options.requestContext,
              locales: options.locales
            }, function () {
              return React.createElement(component, pipe.props);
            });
          } catch(ex) {
            next(ex);
            return;
          }

          mesure.mark('react_context');

          // wait a tick so all kefir emit get processed for the
          // pipe serialization.
          //setTimeout(function() {
            pipe.release();
            mesure.mark('release');
            renderReactComponent(componentWithContext, pipe);
          //}, 0);
        });
      } catch(ex) {
        console.error('Error in trying to render component because:', ex.message);

        pipe.release();
        next(ex);
      }
    } else {

      try {
        componentWithContext = react.withContext({
          rootIsolator: new isolator(null, null, null, options.isolatedConfig),
          requestContext: options.requestContext,
          locales: options.locales
        }, function () {
          var props;

          if(options.context && options.context.props) {
            if(options.props) {
              props = {};
              utils.objectUnion([options.context.props, options.props], props);
            } else {
              props = options.context.props;
            }
          } else if(options.props) {
            props = options.props;
          }

          return React.createElement(component, props);
        });
      } catch(ex) {
        next(ex);
        return;
      }

      renderReactComponent(componentWithContext, {
        toJSON: function() {
          try {
            return JSON.stringify({
              requestContext: options.requestContext,
              props: null,
              coordinatorState: null
            });
          } catch(ex) {
            console.error("Cannot serialize isomorphic context because:", ex.message);
            throw ex;
          }
        }
      });
    }
  }
};
