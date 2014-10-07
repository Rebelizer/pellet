// act as a memory bridge for native nodejs require and requiring webpack

module.exports = {
  pelletMixin: require('./src/pellet-mixin.js'),
  isomorphicRender: require('./src/isomorphic-render.js')
};
