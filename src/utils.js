
var exports = module.exports = {
  /**
   *
   * @param input
   * @returns {Object}
   */
  camelcase: function (input) {
    return input.split(/[^A-Za-z0-9_]+/).reduce(function (str, word) {
      return str + word[0].toUpperCase() + word.slice(1);
    });
  },

  /**
   *
   * @param one
   * @param two
   * @returns {Function}
   */
  createChainedFunction: function (one, two) {
    return function chainedFunction() {
      one.apply(this, arguments);
      two.apply(this, arguments);
    };
  },

  /**
   *
   * @param dest
   * @param src
   * @param ignoreSpec
   * @param singleSpec array of
   */
  mixInto: function (dest, src, ignoreSpec, chainableSpec) {
    Object.keys(src).forEach(function (prop) {
      if (ignoreSpec && -1 !== ignoreSpec.indexOf(prop)) {
        return;
      }

      if (chainableSpec && chainableSpec.indexOf(prop) !== -1) {
        if (!dest[prop]) {
          dest[prop] = src[prop];
        } else {
          dest[prop] = exports.createChainedFunction(dest[prop], src[prop]);
        }
      } else {
        if (!dest[prop]) {
          dest[prop] = src[prop];
        } else {
          throw new Error('Mixin property collision for property "' + prop + '"');
        }
      }
    });
  },

  /**
   * deep merge/copy objects into a single union object
   *
   * @param objects
   * @param result
   * @param options
   *   deleteUndefined
   *   arrayCopyMode 0 = replace, 1=copy, 2=join/copy
   *   noneCopyTypes array of types like RegExp, Date
   *   refCopy - will make a ref to the source node if the target node is undefined or a non object type. If object type keep walking to and until endpoint.
   */
  objectUnion: function(objects, result, options, inRecursiveLoop) {
    var i, j, obj, val;

  // todo: this is SLOW! I need to rethink this and make it faster!

    var delUndefined = false
      , noneCopyTypes = false
      , refCopy = false
      , arrayCopyMode = 0;

    if(!result || typeof objects !== 'object') {
      throw new Error('both objects and result are required')
    }

    if(options) {
      delUndefined = !!options.deleteUndefined;
      if(typeof options.arrayCopyMode !== 'undefined') {
        arrayCopyMode = options.arrayCopyMode;
      }

      if(typeof options.noneCopyTypes !== 'undefined') {
        noneCopyTypes = options.noneCopyTypes;
      }

      if(typeof options.refCopy !== 'undefined') {
        refCopy = options.refCopy;
      }
    }

    if(!inRecursiveLoop && Array.isArray(objects)) {
      inRecursiveLoop = -1;
    }

    for(i in objects) {
      obj = objects[i];

      if(obj && typeof obj === 'object') {
        for (j in obj) {
          val = obj[j];

          if(typeof(val) === 'object' && val !== null) {
            if(Array.isArray(val)) {
              if(arrayCopyMode === 1) {
                result[j] = [].concat(val);
              } else if(arrayCopyMode === 2) {
                if(!Array.isArray(result[j])) {
                  if(typeof(result[j]) !== 'undefined') {
                    result[j] = [result[j]].concat(val);
                  } else {
                    result[j] = [].concat(val);
                  }
                } else {
                  result[j] = result[j].concat(val);
                }
              } else {
                result[j] = val;
              }

              continue;
            } else if(noneCopyTypes) {
              if(noneCopyTypes.filter(function(type) {return val instanceof type}).length) {
                result[j] = val;
                continue;
              }
            }

            if(typeof result[j] !== 'object') {
              if(!refCopy) {
                result[j] = {};
              } else {
                result[j] = val;
                continue;
              }
            }

            exports.objectUnion([val], result[j], options, true);
          } else if(delUndefined && typeof(val) === 'undefined') {
            delete result[j];
          } else {
            result[j] = val;
          }
        }
      } else {
        if(inRecursiveLoop === -1) {
          throw new Error('cannot merge non object types');
        }

        result[i] = obj;
      }
    }
  }
};
