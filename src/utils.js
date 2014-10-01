
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
   */
  objectUnion: function(objects, result) {
    var i, j, obj, val;

    if(!result || typeof objects !== 'object') {
      throw new Error('both objects and result are required')
    }

    for(i in objects) {
      obj = objects[i];

      if(typeof obj === 'object') {
        for (j in obj) {
          val = obj[j];

          if(typeof(val) === 'object') {
            // todo: think about merging arrays (not sure what react merge does but we should copy logic)

            // add a result's placeholder obj if missing
            if(typeof result[j] !== 'object') {
              result[j] = {};
            }

            exports.objectUnion([val], result[j]);
          } else if(typeof(val) === 'undefined') {
            delete result[j];
          } else {
            result[j] = val;
          }
        }
      } else {
        result[i] = obj;
      }
    }
  }
};
