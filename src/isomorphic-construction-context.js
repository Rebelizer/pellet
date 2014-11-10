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
function isomorphicConstructionContext(initData, provider) {
  this.provider = provider;
  this.serialize = {};
  this.props = {};
  this.rootCoordinator = new coordinator();
  this.coordinatorNameTypeMap = {};

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
isomorphicConstructionContext.prototype.LINK = 'link';
isomorphicConstructionContext.prototype.META = 'meta';
isomorphicConstructionContext.prototype.TITLE = 'title';

isomorphicConstructionContext.prototype.addToHead = function(field, val) {
  this.provider.addToHead(field, val);
};

isomorphicConstructionContext.prototype.setTitle = function(title) {
  this.provider.addToHead(this.TITLE, title);
};

isomorphicConstructionContext.prototype.setCanonical = function(url) {
  this.provider.addToHead(this.LINK, {rel:'canonical', href:url});
};

// HELPER FUNCTIONS - wrappers around coordinator
isomorphicConstructionContext.prototype.event = function(name) {
  return this.rootCoordinator.event(name);
}

isomorphicConstructionContext.prototype.coordinator = function(name, type, serializeEventName) {
  this.coordinatorNameTypeMap[name] = type;
  var coordinator = this.rootCoordinator.coordinator(name, type);

  if(serializeEventName && process.env.SERVER_ENV) {
    var _this = this;

    coordinator.event(serializeEventName).filter(function(data) {
      return (data.sender.id === coordinator._id.id)
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
isomorphicConstructionContext.prototype.namespace = function(namespace, fromRoot) {
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
isomorphicConstructionContext.prototype.buildMergeObjFromNamespace = function(obj) {
  if(!this.insertNode.key) {
    return obj;
  }

  this.insertNode.head[this.insertNode.key] = obj;
  return this.insertNode.root;
};

isomorphicConstructionContext.prototype.setProps = function(obj) {
  if(this.insertNode.key === false && typeof obj !== 'object') {
    throw new Error('Cannot merge non objects to root namespace')
  }

  // todo: make sure no observables (save versions) because it will blow is someone uses it

  var mergeObj = this.buildMergeObjFromNamespace(obj);
  utils.objectUnion([mergeObj], this.props, {deleteUndefined:true});
};

isomorphicConstructionContext.prototype.setState = function(obj) {
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
isomorphicConstructionContext.prototype.set = function(key, value) {

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

isomorphicConstructionContext.prototype.addChildComponent = function(namespace, component, options, next) {
  var context = this;

  if(component.__$construction) {
    if(namespace) {
      context = this.namespace(namespace);
    }

    component.__$construction.call(context, options, next);
  } else {
    next();
  }
};

isomorphicConstructionContext.prototype.toJSON = function() {
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

isomorphicConstructionContext.prototype.release = function() {
  this.rootCoordinator.release();
};

module.exports = isomorphicConstructionContext;
