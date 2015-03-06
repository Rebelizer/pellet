/**
 *
 * @interface experimentI
 * @class
 */
function experimentInterface(pellet) {
  this.pellet = pellet;
}

experimentInterface.prototype.select = function(name, ctx, experimentId, _renderOptions) {
  var i, type;

  if(name === null) {
    return;
  }

  if(typeof name === 'function') {
    // look up the component's version/key
    for(i in this.pellet.components) {
      if(this.pellet.components[i] === name) {
        name = i;
        break;
      }
    }

    // if not found return undefined
    if(typeof name === 'function') {
      return;
    }

    name = name.substring(0, name.indexOf('@'));
    type = 1;
  } else if(typeof name !== 'string') {
    console.warn('GA experiment: invalid version experiment:', experimentId, 'type:', typeof name, 'name:', name);
    throw new Error('invalid experiment version type');
  } else {
    if (name[0] === '@') {
      type = 1;
      name = name.substring(1);
    } else if (name[0] === '=') {
      type = 2;
      name = name.substring(1);
    }

    if (!name) {
      return;
    }

    // if the key has a version use the specified version
    // and ignore the experiment version
    if (type !== 2 && name.indexOf('@') !== -1) {
      return this.pellet.components[name];
    }

    if (type !== 1 && (i = name.indexOf('=')) !== -1) {
      return name.substring(i + 1);
    }
  }

  if(type === 1) return this.pellet.components[name];
  else if(type === 2) return name;
  return this.pellet.components[name] || name;
}

module.exports = experimentInterface;
