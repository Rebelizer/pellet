var pellet
  , utils = require('./utils');

/**
 * context to merge the two environments
 *
 * @class
 * @param initData
 * @param middlewareProvider
 */
function isomorphicContext(initData, middlewareProvider) {
  this.provider = middlewareProvider;
  this.serialize = {};
  this.props = {};
  this.coordinators = {};

  // use the require('pellet') to fix a webpack bug
  // if we require at head of this files pellet is not
  // defined because the load order is wrong :(
  if(!pellet) {pellet = require('./pellet');}

  if(initData) {
    if(typeof(initData) === 'string') {
      initData = JSON.parse(initData);
    }

    utils.objectUnion([initData.props], this.props);
    utils.objectUnion([initData.props], this.serialize);

    if(initData.coordinatorState) {
      this.coordinatorState = initData.coordinatorState;
      for(var i in this.coordinatorState) {
        var _coordinator = pellet.getCoordinator(i);
        if(_coordinator) {
          _coordinator.load(this.coordinatorState[i]);
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
isomorphicContext.prototype.LINK = 'link';
isomorphicContext.prototype.META = 'meta';
isomorphicContext.prototype.TITLE = 'title';

isomorphicContext.prototype.addToHead = function(field, val) {
  this.provider.addToHead(field, val);
};

isomorphicContext.prototype.setTitle = function(title) {
  this.provider.addToHead(this.TITLE, title);
};

isomorphicContext.prototype.setCanonical = function(url) {
  this.provider.addToHead(this.LINK, {rel:'canonical', href:url});
};

/**
 * Get coordinator for this context
 *
 * Use this to automatically get a coordinator that is wraped
 * for...
 *
 * @param name
 * @returns {*}
 */
isomorphicContext.prototype.getCoordinator = function(name, type, autoSerialize) {
  if(this.coordinators[name]) {
    return this.coordinators[name];
  }

  var coordinator = pellet.getCoordinator(name, type);
  if(coordinator) {
    coordinator = coordinator.createContext(this);
    this.coordinators[name] = coordinator;
  }

  if(autoSerialize) {
    this.serializeCoordinator(name);
  }

  return coordinator;
};

/**
 *
 * @returns {Function}
 */
isomorphicContext.prototype.serializeCoordinator = function(name, filterFn) {
  // ignore serializetion on client
  if(process.env.SERVER_ENV) {
    var coordinator;
    var _this = this;

    if (!(coordinator = this.coordinators[name])) {
      console.error('Cannot serialize', name, 'because it has not been defined yet');
      throw new Error('Cannot serialize undefined coordinator')
    }

    if (!filterFn) {
      filterFn = function (details) {
        return (details.ctx !== _this);
      };
    }

    var serializeEvent = coordinator.getEvent("serialize");
    serializeEvent.filter(filterFn).on(function (data) {
      if (data.details && data.details.type) {
        _this.set(name, data.details);
      }
    });
  }
}

/**
 * create a new namespace
 * @param namespace
 * @param fromRoot
 * @returns {*}
 */
isomorphicContext.prototype.namespace = function(namespace, fromRoot) {
  // ignore if no change in namespace
  if(!namespace && !fromRoot) {
    return this;
  }

  var index, path, key
    , root = {}
    , head = root
    , newCtx = Object.create(this);

  // trim out trailing "." and clean up duplicate "..." before geting path
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
isomorphicContext.prototype.buildMergeObjFromNamespace = function(obj) {
  if(!this.insertNode.key) {
    return obj;
  }

  this.insertNode.head[this.insertNode.key] = obj;
  return this.insertNode.root;
};

isomorphicContext.prototype.setProps = function(obj) {
  if(this.insertNode.key === false && typeof obj !== 'object') {
    throw new Error('Cannot merge non objects to root namespace')
  }

  // todo: make sure no observables (save versions) because it will blow is someone uses it

  var mergeObj = this.buildMergeObjFromNamespace(obj);
  utils.objectUnion([mergeObj], this.props, {deleteUndefined:true});
};

/**
 *
 * @param coordinator
 * @param obj
 */
isomorphicContext.prototype.set = function(coordinator, obj) {

  if(typeof obj !== 'undefined' && typeof(coordinator) === 'string' && this.coordinators[coordinator]) {
    var data;
    if(!(data = this.coordinatorState[coordinator])) {
      data = this.coordinatorState[coordinator] = [];
    }

    data.push(obj);
    return;
  }

  obj = coordinator;

  if(this.insertNode.key === false && typeof obj !== 'object') {
    throw new Error('Cannot merge non objects to root namespace')
  }

  // todo: make sure all the items in obj are primitives i.e. number, strings, object but not functions or object with constrotor
  // this is because we JSON.stringify and we need the serialize to work

  var mergeObj = this.buildMergeObjFromNamespace(obj);
  utils.objectUnion([mergeObj], this.props, {deleteUndefined:true});
  utils.objectUnion([mergeObj], this.serialize, {deleteUndefined:true});
};

isomorphicContext.prototype.toJSON = function() {
  try {
    return JSON.stringify({
      props: this.serialize,
      coordinatorState: this.coordinatorState
    });
  } catch(ex) {
    console.error("Cannot serialize isomorphic context because:", ex.message);
    throw ex;
  }
};

isomorphicContext.prototype.release = function() {
  for(var i in this.coordinators) {
    this.coordinators[i].release();
  }

  this.coordinators = [];
};

// todo: think about adding caching control so content can tell the system if we can cache it and how long and for what... ie. cache for all users or only us vs fr etc. This will let use cache local copys
module.exports = isomorphicContext;
