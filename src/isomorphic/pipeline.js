var pellet = require('./../pellet')
  , isolator = require('./../isolator')
  , utils = require('./../utils');

var defaultCacheInterface = null;

/**
 * context to merge the two environments
 *
 * @class
 * @param initData
 * @param http
 * @param isolatedConfig
 * @param requestContext
 * @param locales
 * @param {function} [cacheHitFn] called to send a cached data
 */
function pipeline(initData, http, isolatedConfig, requestContext, locales, cacheHitFn) {
  this.http = http;
  this.serialize = {};
  this.props = {};
  this.requestContext = requestContext;
  this.locales = locales;
  this.rootIsolator = new isolator(null, null, null, isolatedConfig);
  this.coordinatorNameTypeMap = {};

  // because the pipeline used Object.create to clone the namespace
  // we create a shared object that will not lose updates. for example
  // if you create a new namespace and update this.abortRender it update
  // only the namespace version not the owner/parent.
  this.$ = {
    abortRender: false,
    cacheInterface: defaultCacheInterface,    // the interace used to cache request
    cacheHitFn: cacheHitFn || null,           // a fn called to send the cached data to the clint
    cacheNeedsUpdating: false,                // true will update the cache at the end of the render
    cacheHitCalled: false,                    // this is if the cache hit was sent to the client
    cacheKey: ''
  };

  if(initData) {
    utils.objectUnion([initData.props], this.props);
    utils.objectUnion([initData.props], this.serialize);

    if(initData.coordinatorState) {
      this.coordinatorState = initData.coordinatorState;
      for(var i in this.coordinatorState) {
        var _coordinator = pellet.getCoordinator(i, this.coordinatorState[i].type);
        if(_coordinator) {
          _coordinator.load(this.coordinatorState[i].items);
        }
      }
    } else {
      this.coordinatorState = {};
    }
  } else {
    this.coordinatorState = {};
  }

  this.parentContext = null;
  this.insertAt = '';

  var root = {};
  this.insertNode = {
    key: false,
    head: root,
    root: root
  };
}

// HELPER FUNCTIONS - wrappers around
pipeline.prototype.LINK = 'link';
pipeline.prototype.META = 'meta';
pipeline.prototype.TITLE = 'title';

/**
 * Add header to the http response.
 *
 * Please refer to {@link isomorphicHttp#addToHead} for full list of supported tags
 *
 * Examples:
 *
 *     this.addToHead('title', 'My page title here')
 *     this.addToHead('meta', {name: 'description', content:'My SEO SERP description'})
 *
 * @param field
 * @param val
 */
pipeline.prototype.addToHead = function(field, val) {
  this.http.addToHead(field, val);
};

pipeline.prototype.headers = function(field, val) {
  if(arguments.length === 2) {
    return this.http.headers(field, val);
  } else {
    return this.http.headers(field);
  }
};

pipeline.prototype.setTitle = function(title) {
  this.http.addToHead(this.TITLE, title);
};

pipeline.prototype.setCanonical = function(url) {
  this.http.addToHead(this.LINK, {rel:'canonical', href:url});
};

pipeline.prototype.cookie = function() {
  return this.http.cookie.apply(this.http, Array.prototype.slice.apply(arguments));
};

pipeline.prototype.redirect = function(url) {
  this.http.redirect(url);
  this.$.abortRender = true;
};

pipeline.prototype.event = function(name) {
  return this.rootIsolator.event(name);
}

pipeline.prototype.getIsolatedConfig = function() {
  return this.rootIsolator.isolatedConfig;
}

pipeline.prototype.updateIsolatedConfig = function(config) {
  return this.rootIsolator.updateIsolatedConfig(config);
}

pipeline.prototype.getLocales = function() {
  return this.props.locales || this.locales;
}

pipeline.prototype.getRequestContext = function() {
  return this.requestContext;
}

pipeline.prototype.coordinator = function(name, type, serializeEventName) {
  this.coordinatorNameTypeMap[name] = type;
  var coordinator = this.rootIsolator.coordinator(name, type);

  if(serializeEventName && process.env.SERVER_ENV) {
    var _this = this;

    coordinator.event(serializeEventName).filter(function(data) {
      return (data.sender.id === coordinator._id.id) && (data.ctx === coordinator.isolatedConfig);
    }).on(function(data) {
      _this.set(name, data.event);
    }, true);
  }

  return coordinator;
}

/**
 * create a new namespace
 * @param namespace
 * @param fromRoot
 * @returns {*}
 */
pipeline.prototype.namespace = function(namespace, fromRoot) {
  // ignore if no change in namespace
  if(!namespace && !fromRoot) {
    return this;
  }

  var index, path, key
    , root = {}
    , head = root
    , newCtx = Object.create(this);

  // trim out trailing "." and clean up duplicate "..." before getting path
  path = (fromRoot ? namespace : (this.insertAt + '.' + namespace));
  path = path.trim().replace(/\.+/g, '.').replace(/(^\.)|(\.$)/g, '');

  newCtx.parentContext = this;
  newCtx.insertAt = path;

  path = path.split('.');
  key = path.pop();
  while((index = path.shift()) != null) {
    head = head[index] = {};
  }

  newCtx.insertNode = {
    key: key,
    head: head,
    root: root
  };

  return newCtx;
};

/**
 *
 * @private
 * @param obj
 * @returns {*}
 */
pipeline.prototype.buildMergeObjFromNamespace = function(obj) {
  if(!this.insertNode.key) {
    return obj;
  }

  this.insertNode.head[this.insertNode.key] = obj;
  return this.insertNode.root;
};

pipeline.prototype.setProps = function(obj) {
  if(this.insertNode.key === false && typeof obj !== 'object') {
    throw new Error('Cannot merge non objects to root namespace')
  }

  // todo: make sure no observables (save versions) because it will blow is someone uses it

  var mergeObj = this.buildMergeObjFromNamespace(obj);
  utils.objectUnion([mergeObj], this.props, {deleteUndefined:true});
};

pipeline.prototype.setState = function(obj) {
  if(typeof obj !== 'object') {
    throw new Error('Cannot merge non objects to context state')
  }

  var mergeObj = this.buildMergeObjFromNamespace({__initState:obj});
  utils.objectUnion([mergeObj], this.props, {deleteUndefined:true});
};

/**
 *
 * @param coordinator
 * @param obj
 */
pipeline.prototype.set = function(key, value) {

  // check if we are serialize data for a coordinator (need to make sure its one of our coordinators)
  if(typeof value !== 'undefined' && typeof(key) === 'string' && this.coordinatorNameTypeMap[key]) {
    var data;
    if(!(data = this.coordinatorState[key])) {
      data = this.coordinatorState[key] = {
        type: this.coordinatorNameTypeMap[key],
        items:[]
      };
    }

    data.items.push(value);
    return;
  }

  value = key;

  if(this.insertNode.key === false && typeof value !== 'object') {
    throw new Error('Cannot merge non objects to root namespace')
  }

  // todo: make sure all the items in obj are primitives i.e. number, strings, object but not functions or object with constrotor
  // this is because we JSON.stringify and we need the serialize to work

  var mergeObj = this.buildMergeObjFromNamespace(value);
  utils.objectUnion([mergeObj], this.props, {deleteUndefined:true});
  utils.objectUnion([mergeObj], this.serialize, {deleteUndefined:true});
};

/**
 * Adds evidence to cache key.
 * Use this to build up the cache key used to xxx
 *
 * @param {string} evidence addition evidence used to build the cache key
 */
pipeline.prototype.addCacheKey = function(evidence) {
  this.$.cacheKey += evidence;
};

/**
 * Used to transform the data send to the client
 *
 * @callback transformCtxFn
 * @param ctx This is an options with
 */

/**
 * Used to transform the data send to the client
 *
 * @callback sendCachedCB
 * @param err
 * @param cachedData
 */

/**
 * Use pipeline cache to  .
 *
 * let the pipeline lookup
 *
 * @param {boolean} dirtyRead use a potentially dirty version to immediately send markup for speed
 * @param {transformCtxFn} transformCtxFn used to modify serialize data
 * @param {sendCachedCB} next
 */
pipeline.prototype.serveFromCache = function(dirtyRead, transformCtxFn, next) {
  if(process.env.BROWSER_ENV || !this.$.cacheInterface) {
    if(next) {
      next(null, null, null);
    }
  } else {
    var _this = this;

    // turn on cache updating, because we are
    // trying to return a cached version.
    this.$.cacheNeedsUpdating = true;

    // check the cache for the cacheKey and if found transform ctx and
    // render the cached version if dirtyRead == true
    this.$.cacheInterface.get(this.$.cacheKey, function(err, data, metaData) {
      if(err) {
        next(err, null, null);
        return;
      }

      if(data) {
        if(transformCtxFn) {
          transformCtxFn(data.ctx, metaData, function(err, ctx) {
            if(!dirtyRead) {
              _this.$.cacheHitCalled = true;
              _this.$.cacheHitFn(data.html, ctx);
            }

            next(null, data, metaData);
          });
        } else {
          if(!dirtyRead) {
            _this.$.cacheHitCalled = true;
            _this.$.cacheHitFn(data.html, data.ctx);
          }

          next(null, data, metaData);
        }
      } else {
        next(null, null, null);
      }
    });
  }
};

/**
 * Update the cache with both the html and serialize data
 *
 * @param html
 * @param next
 */
pipeline.prototype.updateCache = function(html, next) {
  if(process.env.BROWSER_ENV || !this.$.cacheInterface) {
    if(next) {
      next(null, null, null);
    }
  } else {
    try {
      // update the cache with the HTML and ctx
      this.$.cacheInterface.set(this.$.cacheKey, {
        html: html,
        ctx: this.toJSON()
      }, next);
    } catch(ex) {
      if (next) {
        next(ex);
      }
    }
  }
};

/**
 * Set the cache interface this pipeline should use.
 *
 * @param cacheInterface
 */
pipeline.prototype.setCacheInterface = function(cacheInterface) {
  this.$.cacheInterface = cacheInterface;
};

pipeline.prototype.addChildComponent = function(namespace, component, options, next) {
  var context = this;

  if(component._$construction) {
    if(namespace) {
      context = this.namespace(namespace);
    }

    component._$construction.call(context, options, next);
  } else {
    next();
  }
};

if(pellet.options.includeUserAgentInfo) {
  pipeline.prototype.getUA = function () {
    return (this.requestContext && this.requestContext.userAgentDetails) || {};
  }
}

pipeline.prototype.toJSON = function() {
  try {
    return JSON.stringify({
      requestContext: this.requestContext,
      props: this.serialize,
      coordinatorState: this.coordinatorState
    });
  } catch(ex) {
    console.error("Cannot serialize isomorphic context because:", ex.message);
    throw ex;
  }
};

pipeline.prototype.release = function() {
  this.rootIsolator.release();
};

/**
 * Set the cache interface used by the pipeline.
 *
 * @param cacheInterface
 */
pellet.setDefaultPipelineCacheInterface = function(cacheInterface) {
  defaultCacheInterface = cacheInterface;
}

module.exports = pipeline;
