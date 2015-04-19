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

  // create a instrument interface that will embed our isolatedConfig info
  this.instrument = pellet.instrumentation.addIsolatedConfig(isolatedConfig);

  // because the pipeline used Object.create to clone the namespace
  // we create a shared object that will not lose updates. for example
  // if you create a new namespace and update this.abortRender it update
  // only the namespace version not the owner/parent.
  this.$ = {
    abortRender: false,
    cacheInterface: defaultCacheInterface,    // the interace used to cache request
    cacheHitFn: cacheHitFn || null,           // a fn called to send the cached data to the clint
    cacheNeedsUpdating: false,                // true will update the cache at the end of the render
    cacheForceRender: false,                  // true to force a render even if cache hash match
    cacheHitCalled: false,                    // this is if the cache hit was sent to the client
    cacheKey: '',
    cacheDataSignature: '',                   // this is a data signature to help skip full renders
    cacheHitData: null,                       // this is a last cached data to help skip full renders
    statusCode: null,                         // this is the current http statusCode
    relCanonical: null                        // this is the current rel canonical url
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

pipeline.prototype.RENDER_ABORT = 'abort';
pipeline.prototype.RENDER_NO_CHANGE = 'no-change';
pipeline.prototype.RENDER_NEEDED = 'needed';

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

/**
 * Get or Set the http status code
 *
 * Examples:
 *
 *     this.statusCode()
 *     this.statusCode(404)
 *
 * @param code
 * @return {*}
 */
pipeline.prototype.statusCode = function(code) {
  if(arguments.length === 1) {
    this.$.statusCode = code;
    this.http.status(code);
  } else {
    return this.$.statusCode;
  }
};

pipeline.prototype.setTitle = function(title) {
  this.http.addToHead(this.TITLE, title);
};

pipeline.prototype.setCanonical = function(url) {
  this.$.relCanonical = url;
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

pipeline.prototype.setState = function(obj, cb) {
  if(typeof obj !== 'object') {
    throw new Error('Cannot merge non objects to context state')
  } /*
  TODO: need to support the fn(previousState, currentProps) version
  need to update Unit test and make sure the namescpae is mantained
  else if(typeof obj !== 'function') {
    obj = obj(this.props.__initState, this.props)
  }*/

  var mergeObj = this.buildMergeObjFromNamespace({__initState:obj});
  utils.objectUnion([mergeObj], this.props, {deleteUndefined:true});
  if(typeof cb === 'function') {
    cb();
  }
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
 * Adds evidence to around cached data
 *
 * Use this to help pellet skip full react renders. For example if the cached
 * version was rendered with props {a:1, b:2} and the data from componentConstruction
 * has not changed is safe to skip the render because the markup will be the same.
 * This can safe pellet from having to render react markup and keep using the cached
 * version.
 *
 * If you do not use this pellet will use the props
 *
 * @param evidence
 */
pipeline.prototype.signatureCacheData = function(evidence) {
  this.$.cacheDataSignature += evidence;
};

/**
 * Used to transform the data send to the client
 *
 * @callback transformCtxFn
 * @param ctx This is the cached ctx
 * @param head This is the cached headers
 * @param meta This is the caches meta data
 * @callback next callback after your done with your transform
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
 * @param {number} dirtyRead use a potentially dirty version to ttl (in ms) if 0 do not server from the cache or -1 to force render
 * @param {transformCtxFn} [transformCtxFn] used to modify serialize data
 * @param {sendCachedCB} next
 */
pipeline.prototype.serveFromCache = function(dirtyRead, transformCtxFn, next) {
  if(arguments.length === 2) {
    next = transformCtxFn;
    transformCtxFn = null;
  }

  if(process.env.BROWSER_ENV || !this.$.cacheInterface) {
    if(next) {
      next(null, null, null);
    }
  } else {
    var _this = this;

    console.debug('Cache layer: check if in cache (key):', this.$.cacheKey);

    // turn on cache updating, because we are
    // trying to return a cached version.
    this.$.cacheNeedsUpdating = true;

    // check the cache for the cacheKey and if found transform ctx and
    // render the cached version if dirtyRead > 0
    this.$.cacheInterface.get(this.$.cacheKey, function(err, data, metaData) {
      if(err) {
        next(err, null, null);
        return;
      }

      console.debug('Cache layer: cache contains ctx', !!(data && data.ctx), 'head:',!!(data && data.head), 'meta:', !!metaData);
      //console.debug('Cache layer: DATA:', data||'nothing');
      //console.debug('Cache layer: head:', data && data.head);

      if(data) {
        // save off the data for the render step
        // this allow use to the skip render if data signature
        // has not changed. It most cases this is the props
        _this.$.cacheHitData = data;

        // if dirtyRead == -1 force render and ignore the cache
        if(dirtyRead === -1) {
          _this.$.cacheForceRender = true;
          dirtyRead = 0;
        }

        if(transformCtxFn) {
          transformCtxFn(_this, (data && data.ctx && JSON.parse(data.ctx)), data.head, metaData, function(err, ctx, head) {
            console.debug('Cache layer: use dirty read', dirtyRead && ((Date.now() - metaData.lastModified) <= dirtyRead), 'ttl:', dirtyRead, 'elapse:', (Date.now() - metaData.lastModified));

            if(dirtyRead && ((Date.now() - metaData.lastModified) <= dirtyRead)) {
              _this.$.cacheHitCalled = true;
              _this.$.cacheHitFn(data.html, ctx && JSON.stringify(ctx), head);
              return;
            }

            next(null, data, metaData);
          });
        } else {
          console.debug('Cache layer: use dirty read', dirtyRead && ((Date.now() - metaData.lastModified) <= dirtyRead), 'ttl:', dirtyRead, 'elapse:',(Date.now() - metaData.lastModified));

          if(dirtyRead && ((Date.now() - metaData.lastModified) <= dirtyRead)) {
            _this.$.cacheHitCalled = true;
            _this.$.cacheHitFn(data.html, data.ctx, data.head);
            return;
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
 * if we do not need to update the cache
 *
 * @param html
 * @param {callback} next
 * @return {boolean} if we need to update the cache
 */
pipeline.prototype.updateCache = function(html, next) {
  if(process.env.BROWSER_ENV || !this.$.cacheInterface) {
    next(null, false);
  } else {
    console.debug('Cache layer: needs to update:', this.$.cacheNeedsUpdating);

    // this is tied to the serveFromCache call so if
    // during a request serveFromCache is not called
    // we do not update the cache because it will never
    // get used.
    if(!this.$.cacheNeedsUpdating) {
      next(null, false);
      return;
    }

    try {
      var _this = this
        , ctx = this.getJSON(true);

      console.debug('Cache layer: update (key):', this.$.cacheKey, 'html hash:', ctx.hash);
      //console.debug('Cache layer: ctx:', JSON.stringify(ctx,null,2))

      // update the cache with the HTML and ctx
      this.$.cacheInterface.set(this.$.cacheKey, {
        html: html,
        hash: ctx.hash,
        ctx: ctx.json,
        head: this.http.headTags
      }, function(err) {
        if(err) {
          console.error('Error updating cache layer', _this.$.cacheKey, 'because:', err.message||err);
          next(err);
          return;
        }

        next(null);
      });
    } catch(ex) {
      console.error('Error updating cache layer', this.$.cacheKey, 'because:', ex.message||ex);
      next(ex);
    }
  }
};

/**
 * Returns if the the render should be aborted
 *
 * This can be caused by the pipeline being aborted via an
 * operation like a redirect or manual response. Additional
 * if the caching layer does not require a render this will
 * return false.
 *
 * @returns {boolean}
 */
pipeline.prototype.isRenderRequired = function() {
  console.debug('Cache layer: isRenderRequired abortRender:', this.$.abortRender, 'cacheHitCalled:', this.$.cacheHitCalled, 'cacheHitData.hash:', this.$.cacheHitData && this.$.cacheHitData.hash)

  if(this.$.abortRender) {
    console.debug('Abort render because manual abort in response (i.e. redirect)');
    return this.RENDER_ABORT;
  }

  var hash = this.getJSON(true, true).hash
    , needToRender = ((this.$.cacheHitData && this.$.cacheHitData.hash) != hash) ? this.RENDER_NEEDED : this.RENDER_NO_CHANGE;

  console.debug('Cache layer: render required:', needToRender, 'from cache (hash):', this.$.cacheHitData && this.$.cacheHitData.hash, 'current:', hash, 'force:', this.$.cacheForceRender);

  if(this.$.cacheForceRender) {
    needToRender = this.RENDER_NEEDED;
  }

  if(process.env.SERVER_ENV && this.$.cacheInterface && needToRender === this.RENDER_NO_CHANGE) {
    var _cacheKey = _this.$.cacheKey;
    // touch the cache to update its TTL data
    this.$.cacheInterface.touch(this.$.cacheKey, this.$.cacheHitData, function(err) {
      if(err) {
        console.error('Error touching cache layer', _cacheKey, 'because:', err.message||err);
        return;
      }
    });
  }

  return needToRender;
}

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

pipeline.prototype.getUA = function () {
  return (this.requestContext && this.requestContext.userAgentDetails) || {};
}

/**
 *
 * @param calcHash
 * @param skipJSON
 * @return {*}
 */
pipeline.prototype.getJSON = function(calcHash, skipJSON) {
  try {
    // now make sure the coordinator serialized state is safe for hashing, because
    // the data is async the order the data is stored in coordinatorState.*.items[*]
    // is random and this will change the hash of ctx (toJSON) so sort the array
    // via makeArrayHashSafe to make it perdurable
    if(!pellet.options.cacheHashIgnoreArrayOrder) {
      for (var i in this.coordinatorState) {
        this.coordinatorState[i].items = utils.makeArrayHashSafe(this.coordinatorState[i].items);
      }
    }

    var result = {}
      , data = {
        requestContext: this.requestContext,
        props: this.serialize,
        coordinatorState: this.coordinatorState
      };

    if(calcHash) {
      result.hash = this.$.cacheDataSignature || utils.hashObject(data, {ignoreArrayOrder: pellet.options.cacheHashIgnoreArrayOrder});
    }

    if(!skipJSON) {
      result.json = JSON.stringify(data);
    }

    return result;
  } catch(ex) {
    console.error("Cannot serialize isomorphic context because:", ex.message||ex);
    throw ex;
  }
}

/**
 * Returns a JSON string and a hash
 *
 * @return {string} returns the JSON string
 */
pipeline.prototype.toJSON = function() {
  return this.getJSON(false).json;
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
