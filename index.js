// act as a memory bridge for native nodejs require and requiring webpack

module.exports = {
  pelletMixin: require('./src/pellet-react-mixin.js'),
  isomorphicRender: require('./src/isomorphic/render.js')
};
