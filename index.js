// act as a memory bridge for native nodejs require and requiring webpack

module.exports = {
  pelletMixin: require('./src/component-mixin.js'),
  pelletRender: require('./src/render.js')
};
