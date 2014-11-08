var pellet
  , coordinator = require('./coordinator')
  , utils = require('./utils');

/**
 * context to merge the two environments
 *
 * @class
 * @param initData
 * @param provider
 */
function isomorphicRouteContext(initData, provider) {
  this.provider = provider;
  this.serialize = {};
  this.props = {};
  this.rootCoordinator = new coordinator();

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
        // todo: we need a way to pass in the type, options to pellet.getCoordinator
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
isomorphicRouteContext.prototype.LINK = 'link';
isomorphicRouteContext.prototype.META = 'meta';
isomorphicRouteContext.prototype.TITLE = 'title';

isomorphicRouteContext.prototype.addToHead = function(field, val) {
  this.provider.addToHead(field, val);
};

isomorphicRouteContext.prototype.setTitle = function(title) {
  this.provider.addToHead(this.TITLE, title);
};

isomorphicRouteContext.prototype.setCanonical = function(url) {
  this.provider.addToHead(this.LINK, {rel:'canonical', href:url});
};

// HELPER FUNCTIONS - wrappers around coordinator
isomorphicRouteContext.prototype.event = function(name) {
  return this.rootCoordinator.event(name);
}

isomorphicRouteContext.prototype.coordinator = function(name, type) {
  // todo: need to save the name/type so we can send to client
  return this.rootCoordinator.coordinator(name, type);
}

/**
 * create a new namespace
 * @param namespace
 * @param fromRoot
 * @returns {*}
 */
isomorphicRouteContext.prototype.namespace = function(namespace, fromRoot) {
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
isomorphicRouteContext.prototype.buildMergeObjFromNamespace = function(obj) {
  if(!this.insertNode.key) {
    return obj;
  }

  this.insertNode.head[this.insertNode.key] = obj;
  return this.insertNode.root;
};

isomorphicRouteContext.prototype.setProps = function(obj) {
  if(this.insertNode.key === false && typeof obj !== 'object') {
    throw new Error('Cannot merge non objects to root namespace')
  }

  // todo: make sure no observables (save versions) because it will blow is someone uses it

  var mergeObj = this.buildMergeObjFromNamespace(obj);
  utils.objectUnion([mergeObj], this.props, {deleteUndefined:true});
};

isomorphicRouteContext.prototype.setInitialState = function(obj) {
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
isomorphicRouteContext.prototype.set = function(coordinator, obj) {

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

isomorphicRouteContext.prototype.toJSON = function() {
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

isomorphicRouteContext.prototype.release = function() {
  this.rootCoordinator.release();
};

// todo: think about adding caching control so content can tell the system if we can cache it and how long and for what... ie. cache for all users or only us vs fr etc. This will let use cache local copys
module.exports = isomorphicRouteContext;


/*
isomorphicRouteContext.prototype.getCoordinator = function(name, type, autoSerialize) {
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

isomorphicRouteContext.prototype.serializeCoordinator = function(name, filterFn) {
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
}*/
