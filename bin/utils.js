var path = require('path')
  , fs = require('fs-extra')
  , crypto = require('crypto')
  , json5 = require('json5');

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

    for (var i in CONFIG_EXT) {
      filePath = targetPath + CONFIG_EXT[i];
      if (fs.existsSync(filePath)) {
        if(filePath.match(/\.json$/i)) {
          return json5.parse(fs.readFileSync(filePath).toString());
        } else {
          return require(filePath);
        }
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
   * @param config
   * @param next
   * @returns {Function}
   */
  syncNodeAndBrowserBuilds: function(next) {
    var browserStats
      , nodeStats
      , browserTimestamps = null
      , serverTimestamps = null;

    // return a helper function to make tracking easy
    return function(type) {
      return function(err, info) {
        if(err) {
          if(next) {
            next(err);
          }
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
            if(next) {
              next(new Error(stats.errors.join('\n\n')));
            }
            return;
          }

          var i, baseTimestamps, changedTimestamps;

          if(type === 0) {
            changedTimestamps = browserTimestamps = info.compilation.fileTimestamps;
            baseTimestamps = serverTimestamps;
            browserStats = stats;
            console.info('Browser Pack -------------------------');
          } else {
            changedTimestamps = serverTimestamps = info.compilation.fileTimestamps;
            baseTimestamps = browserTimestamps;
            nodeStats = stats;
            console.info('Server Pack -------------------------');
          }

          console.info(info.toString({chunkModules:false, chunks:false}), '\n');

          if(!baseTimestamps || !changedTimestamps) {
            return;
          }

          var isSafeRun = true;
          for(i in changedTimestamps) {
            if(baseTimestamps[i] && baseTimestamps[i] !== changedTimestamps[i]) {
              isSafeRun = false;
              break;
            }
          }

          if(isSafeRun) {
            if(next) {
              console.info('Isomorphic packing in done at ' + new Date());
              next(null, browserStats, nodeStats);
            }
          }
        }
      }
    }
  },

  /**
   *
   * @param options
   * @param next
   * @returns {Function}
   */
  buildManifestProfileAndMap: function(options, next) {
    var lastError = null;
    return function(err, browserStats, nodeStats) {
      if (err) {
        // because we make 2 passes to build a node and browser version
        // we get 2 errors most of the time so just air bag the second error
        if (lastError !== err.message) {
          console.error('Error in webpack passes (browser|server) because:', err.message);
          console.verbose('Try deleting your webpack output directory');
          lastError = err.message
        } else {
          lastError = false;
        }

        return;
      }

      try {
        var profileFilePath = path.resolve(options.output, '_PROFILE#.json');

        // flush the profile file to disk. use http://webpack.github.io/analyse/ for additional help
        fs.writeFileSync(profileFilePath.replace('#', '_BROWSER'), JSON.stringify(browserStats, null, 2));
        fs.writeFileSync(profileFilePath.replace('#', '_NODE'), JSON.stringify(nodeStats, null, 2));

        profileFilePath = path.resolve(options.output, '_MANIFEST.json');
        var buildManifestMap = {
          date: new Date().toJSON(),
          mode: options.mode,
          browser: {
            //outputPath: options.outputBrowser,
            relativePath: exports.relativeToOutputFile(profileFilePath, options.outputBrowser),
            hash: browserStats.hash,
            assets: browserStats.assetsByChunkName['assets'],
            component: browserStats.assetsByChunkName['component']
          },
          server: {
            //outputPath: options.outputServer,
            relativePath: exports.relativeToOutputFile(profileFilePath, options.outputServer),
            hash: nodeStats.hash,
            assets: nodeStats.assetsByChunkName['assets'],
            component: nodeStats.assetsByChunkName['component']
          }
        };

        // NOTE: If you update this you will need to update this in manifest.js!
        var i, styleFileName, staticStyles = [
          browserStats.assetsByChunkName['_style_css'],
          browserStats.assetsByChunkName['_style_less'],
          browserStats.assetsByChunkName['_style_styl']
        ];

        for(i = 0; i < staticStyles.length; i++) {
          if (staticStyles[i]) {
            if (!styleFileName) {
              if (typeof staticStyles[i] === 'string') {
                styleFileName = staticStyles[i];
              } else {
                styleFileName = staticStyles[i][0];
              }

              styleFileOutput = styleFileName.replace(/\.js.*$/, '.css').replace(/^[^\-]*\-/, 'style-');
              if (styleFileOutput.indexOf('style-') !== 0) {
                styleFileOutput = 'style.css';
              }

              buildManifestMap.browser.style = styleFileOutput;
              break;
            }
          }
        }

        if(options.translationDetails) {
          buildManifestMap.browser.translations = options.translationDetails.browser;
          buildManifestMap.server.translation = options.translationDetails.server;
        }

        // remove the source-map files (because webpack adds source maps in production mode and we don't need to return this)
        if (options.mode === 'production') {
          buildManifestMap.browser.assets = buildManifestMap.browser.assets && buildManifestMap.browser.assets[0];
          buildManifestMap.browser.component = buildManifestMap.browser.component && buildManifestMap.browser.component[0];
        }

        fs.writeFileSync(profileFilePath, JSON.stringify(buildManifestMap, null, 2));
        if(next) {
          next((lastError ? err : null), buildManifestMap, browserStats, nodeStats);
        }
      } catch (ex) {
        console.error('Error building manifest profile and map because:', ex.message, ex.stack);
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
  },

  /**
   *
   * @param nconf
   * @param commanderObj
   */
  overwriteNconfWithArgs: function(nconf, commanderObj) {
    // overwrite configuration with argument passed in
    for(var i in commanderObj.options) {

      var opt = commanderObj.options[i].long;
      if(!opt || ['--version'].indexOf(opt) != -1) {
        continue;
      }

      opt = exports.camelcase(opt.substring(2));
      var val = commanderObj[opt];

      if(opt && val) {
        nconf.set(opt, val);
      }
    }
  }
};
