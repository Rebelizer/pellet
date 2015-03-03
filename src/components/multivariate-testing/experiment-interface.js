var pellet = require('pellet');

function experiment() {
}

experiment.prototype.componentFor = function(name, ctx, experimentId, _renderOptions) {
  // if name is a component just return it
  if(typeof name === 'object') {
    return name;
  }

  return pellet.components[name];
}

module.exports = experiment;
