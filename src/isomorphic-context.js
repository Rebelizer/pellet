var utils = require('./utils');

/**
 *
 */
function isomorphicContext(initData, middlewareProvider) {
  this.provider = middlewareProvider;
  this.serialize = {};
  this.props = {};

  if(initData) {
    if(typeof(initData) === 'string') {
      initData = JSON.parse(initData);
    }

    utils.objectUnion([initData.props], this.props);
    utils.objectUnion([initData.props], this.serialize);

    this.stream = initData.stream;
  } else {
    this.stream = [];
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

  var mergeObj = this.buildMergeObjFromNamespace(obj);
  utils.objectUnion([mergeObj], this.props, {deleteUndefined:true});
};

isomorphicContext.prototype.set = function(obj) {
  if(this.insertNode.key === false && typeof obj !== 'object') {
    throw new Error('Cannot merge non objects to root namespace')
  }

  var mergeObj = this.buildMergeObjFromNamespace(obj);
  utils.objectUnion([mergeObj], this.props, {deleteUndefined:true});
  utils.objectUnion([mergeObj], this.serialize, {deleteUndefined:true});
};

isomorphicContext.prototype.emit = function(streamName, data) {
  this.stream.push({
    id: streamName,
    data: data
  });
};

isomorphicContext.prototype.toJSON = function() {
  return JSON.stringify({
    props: this.serialize,
    stream: this.stream
  });
};

// todo: need to add support to set thinks like (title, http status, meta tags, script load tags, etc. this is because we want component to have access to this kind of stuff (and on server render we need this kind of data!
// todo: think about adding caching control so content can tell the system if we can cache it and how long and for what... ie. cache for all users or only us vs fr etc. This will let use cache local copys
module.exports = isomorphicContext;
