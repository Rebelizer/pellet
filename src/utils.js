
/**
 * Pellet's common utilities
 *
 * @namespace utils
 */

var exports = module.exports = {
  noop: function() {},

  /**
   *
   * @memberof utils
   * @param input
   * @returns {Object}
   */
  camelcase: function (input) {
    return input.split(/[^A-Za-z0-9_]+/).reduce(function (str, word) {
      return str + word[0].toUpperCase() + word.slice(1);
    });
  },

  /**
   * Hash a string using djb2
   *
   * @memberof utils
   * @param str
   * @returns {number}
   */
  djb2: function(str) {
    var hash = 5381, i = str.length;

    while(i) {
      hash = (hash * 33) ^ str.charCodeAt(--i);
    }

    return hash >>> 0;
  },

  /**
   * Hash a object is a safe way that ignores key order
   *
   * @memberof utils
   * @param obj
   * @param options
   *   ignoreArrayOrder:
   * @returns {number}
   */
  hashObject: function(obj, options) {
    var hash = 5381;

    function walkArray(obj) {
      var val, j = obj.length;

      if(options && options.ignoreArrayOrder) {
        var sorted = [];
        while (j--) {
          sorted[j] = exports.hashObject(obj[j], options);
        }

        val = sorted.sort().toString();

        j = val.length;
        while (j) {
          hash = (hash * 33) ^ val.charCodeAt(--j);
        }
      } else {
        while (j--) {
          walk(obj[j]);
        }
      }
    }

    function walk(obj) {
      var i, j, val, keys, type;

      type = typeof(obj);
      if(type === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          walkArray(obj);
          return;
        }

        keys = Object.keys(obj);
        i = keys.length;
        keys.sort();
      }

      // we are a primitive or empty obj like Regex, Date, null, undefined, etc.
      if(!i) {
        val = type + (obj && obj.toString());
        j = val.length;
        while (j) {
          hash = (hash * 33) ^ val.charCodeAt(--j);
        }
        return;
      }

      if (i = keys.length) {
        while (i--) {
          // now add the key to the hash
          val = keys[i];
          j = val.length;
          while (j) {
            hash = (hash * 33) ^ val.charCodeAt(--j);
          }

          walk(obj[keys[i]]);
        }
      }
    }

    walk(obj);

    return hash >>> 0;
  },

  /**
   * Order an array so the order will not effect the hash of
   * the object. This is done via sorting the array values
   * perdurable by their own hash.
   *
   * Use case:
   *   When hashing an object that needs to be sorted in a cache
   *   but the array order is not important, but you do not want
   *   to change the hash.
   *
   * @memberof utils
   * @param arr
   * @return {Array}
   */
  makeArrayHashSafe: function(arr) {
    return arr.sort(function(a, b) {
      exports.hashObject(a) - exports.hashObject(b);
    });
  },

  /**
   *
   * @memberof utils
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
   * @memberof utils
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
   * @memberof utils
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
