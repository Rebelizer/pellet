// act as a memory bridge for native nodejs require and requiring webpack

module.exports = {
  isomorphicMixin: require('./src/isomorphic-mixin.js'),
  isomorphicRender: require('./src/isomorphic-render.js')
};
