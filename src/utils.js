
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
   * deep merge object or return the union of the objects
   * @param objects
   * @param result
   * @param options
   *  0 = replace, 1=copy, 2=join/copy
   */
  objectUnion: function(objects, result, options, inRecursiveLoop) {
    var i, j, obj, val;

    var delUndefined = false
      , arrayCopyMode = 0;

    if(!result || typeof objects !== 'object') {
      throw new Error('both objects and result are required')
    }

    if(options) {
      delUndefined = !!options.deleteUndefined;
      if(typeof options.arrayCopyMode !== 'undefined') {
        arrayCopyMode = options.arrayCopyMode;
      }
    }

    if(!inRecursiveLoop && Array.isArray(objects)) {
      inRecursiveLoop = 'dieOnNoneObj';
    }

    for(i in objects) {
      obj = objects[i];

      if(obj && typeof obj === 'object') {
        for (j in obj) {
          val = obj[j];

          if(typeof(val) === 'object') {
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
            }

            // add a result's placeholder obj if missing
            if(typeof result[j] !== 'object') {
              result[j] = {};
            }

            exports.objectUnion([val], result[j], options, true);
          } else if(delUndefined && typeof(val) === 'undefined') {
            delete result[j];
          } else {
            result[j] = val;
          }
        }
      } else {
        if(inRecursiveLoop == 'dieOnNoneObj') {
          throw new Error('cannot merge non object types');
        }

        result[i] = obj;
      }
    }
  }
};
