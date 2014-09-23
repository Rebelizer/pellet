var path = require("path")
  , fs = require("fs")
  , crypto = require('crypto');

var VALID_MANIFEST_FILES = [/*'package.json',*/ 'pellet.json', 'manifest.json'];
var CONFIG_EXT = ['', '.json', '.js', '.config'];

var exports = module.exports = {
  VALID_MANIFEST_FILES: VALID_MANIFEST_FILES,

  /**
   * Scans for pellet manifest or configuration file.
   *
   * @param searchPath
   * @returns {*}
   */
  getManifestFile: function(searchPath) {
    var i, filePath;

    searchPath = path.resolve(process.cwd(), searchPath);

    for (i in VALID_MANIFEST_FILES) {
      filePath = path.join(searchPath, VALID_MANIFEST_FILES[i]);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    // search parent folder for the manifest file
    filePath = path.resolve(searchPath, '..');

    // stop looking when we find the root dir
    if (filePath == searchPath) return null;
    return exports.getManifestFile(filePath);
  },

  /**
   * try to discover and load a config file.
   *
   * check for .json .js .config version of the file
   *
   * @param targetPath
   * @returns {*}
   */
  readConfigFile: function(targetPath) {
    var filePath;

    for (i in CONFIG_EXT) {
      filePath = targetPath + CONFIG_EXT[i];
      if (fs.existsSync(filePath)) {
        return require(filePath);
      }
    }

    return null;
  },

  /**
   *
   * @param str
   * @returns {*}
   */
  md5: function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
  },

  /**
   * sync both node and browser builds
   * @param next
   * @param hashUsingSize
   * @returns {Function}
   */
  syncNodeAndBrowserBuilds: function(hashUsingSize, next) {
    var stacks = [[],[]];
    var statusMap = {};

    // use a stack of both node & browser build hash
    // to track when both complete with out errors
    function sync(err, info) {
      if(err) {
        if(next) {
          next(err);
        }
      } else {
        for(var i in stacks[0]) {
          for(var j in stacks[1]) {
            if(stacks[0][i] === stacks[1][j]) {
              var _key, browserStats, nodeStats;

              _key = stacks[0].splice(i,1) + 0;
              browserStats = statusMap[_key];
              delete statusMap[_key];

              _key = stacks[1].splice(j,1) + 1;
              nodeStats = statusMap[_key];
              delete statusMap[_key];

              if(next) {
                next(null, browserStats, nodeStats);
              }

              return;
            }
          }
        }
      }
    }

    // return a helper function to make tracking easy
    return function(type) {
      return function(err, info) {
        if(err) {
          sync(err);
        } else if(info) {
          var stats = info.toJson({
            hash: true,
            version: true,
            timings: true,
            assets: true,
            chunks: true,
            chunkModules: true,
            modules: true,
            cached: true,
            reasons: true,
            source: true,
            errorDetails: true,
            chunkOrigins: true,
            modulesSort: true,
            chunksSort: true,
            assetsSort: true
          });

          if(stats.warnings.length > 0) {
            console.warn('Warnings in webpack:');
            console.warn(stats.warnings.join('\n\n'));
          }

          if(stats.errors.length > 0) {
            sync(new Error(stats.errors.join('\n\n')));
            return;
          }

          // because webpack processes the node and browser files differently
          // the webpack build hash (info.hash) will be different and can not
          // be used to match up the two build passes so we need to build a
          // hash based on all the input files and their sizes.
          var safeHash = '';
          for(var i in stats.modules) {
            if(hashUsingSize) {
              safeHash += stats.modules[i].id + stats.modules[i].size;
            } else {
              safeHash += stats.modules[i].id + stats.modules[i].name;
            }
          }

          safeHash = exports.md5(safeHash);

          console.info('\n\n-------------------------', type === 0 ? 'browser' : 'node js', safeHash);
          console.info(info.toString({chunkModules:false, chunks:false}))

          stacks[type].push(safeHash);
          statusMap[safeHash+type] = stats;

          sync(null, stats);
        } else {
          sync(null);
        }
      }
    }
  },

  /**
   *
   * @param options
   * @returns {Function}
   */
  buildManifestProfileAndMap: function(options, next) {
    var lastError = null;
    return function(err, browserStats, nodeStats) {
      if (err) {
        // because we make 2 passes to build a node and browser version
        // we get 2 errors most of the time so just air bag the second error
        if (lastError !== err.message) {
          console.error(err.message);
          lastError = err.message
        } else {
          lastError = false;
        }

        return;
      }

      try {
        var profileFilePath = path.resolve(options.output, '_PROFILE#.json');

        // flush the profile file to dist. use http://webpack.github.io/analyse/ for additional help
        fs.writeFileSync(profileFilePath.replace('#', '_BROWSER'), JSON.stringify(browserStats, null, 2));
        fs.writeFileSync(profileFilePath.replace('#', '_NODE'), JSON.stringify(nodeStats, null, 2));

        profileFilePath = path.resolve(options.output, '_MANIFEST.json');
        var buildManifestMap = {
          date: new Date().toJSON(),
          browser: {
            //outputPath: options.outputBrowser,
            relativePath: exports.relativeToOutputFile(profileFilePath, options.outputBrowser),
            hash: browserStats.hash,
            init: browserStats.assetsByChunkName['init.js'] || browserStats.assetsByChunkName['init-[hash].js'],
            assets: browserStats.assetsByChunkName['assets'],
            component: browserStats.assetsByChunkName['component']
          },
          node: {
            //outputPath: options.outputNode,
            relativePath: exports.relativeToOutputFile(profileFilePath, options.outputNode),
            hash: nodeStats.hash,
            init: nodeStats.assetsByChunkName['init.js'] || nodeStats.assetsByChunkName['init-[hash].js'],
            assets: nodeStats.assetsByChunkName['assets'],
            component: nodeStats.assetsByChunkName['component']
          }
        };

        // remove the source-map files
        if (options.mode === 'production') {
          buildManifestMap.browser.init = buildManifestMap.browser.init[0];
          buildManifestMap.browser.assets = buildManifestMap.browser.assets[0];
          buildManifestMap.browser.component = buildManifestMap.browser.component[0];
        }

        fs.writeFileSync(profileFilePath, JSON.stringify(buildManifestMap, null, 2));
        if(next) {
          next(null, buildManifestMap, browserStats, nodeStats);
        }
      } catch (ex) {
        console.error('Error building manifest profile & map because', ex.message);
        if(next) {
          next(ex);
        }
      }
    }
  },

  /**
   *
   * @param fullPath
   * @param buildTimePath
   * @returns {*}
   */
  relativeToOutputFile: function(fullPath, buildTimePath) {
    return buildTimePath.replace(path.dirname(fullPath) + path.sep, '');
  },

  /**
   *
   * @param input
   * @returns {Object}
   */
  camelcase: function(input) {
    return input.split('-').reduce(function(str, word) {
      return str + word[0].toUpperCase() + word.slice(1);
    });
  }


};
