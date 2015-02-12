var fs = require('fs-extra')
  , path = require('path')
  , async = require('async')
  , webpack = require('webpack')
  , messageFormat = require('messageformat')
  , glob = require('glob')
  , utils = require('./utils');

var WEBPACK_FIELDS = ['component', 'assets', 'style', 'server-dependencies', 'client-dependencies', 'coordinator', 'code'];

// todo: create a winston logger for pellet (budjs) and use it not console.log (let use ignore the logging if include is someone else project)

/**
 * helper function to merge unique fields
 *
 * @param self
 * @param component
 * @param field
 * @param targetField
 */
function mergeUniqueComponentFields(self, component, field, targetField) {
  if(targetField) {
    targetField = self[targetField];
  } else {
    targetField = self;
  }

  if(component[field]) {
    if(!targetField[field]) {
      if(typeof component[field] == 'string') {
        targetField[field] = [component[field]];
      } else if(component[field] instanceof Array) {
        targetField[field] = component[field];
      }
    } else {
      if(typeof component[field] == 'string') {
        if(targetField[field].indexOf(component[field]) == -1) {
          targetField[field].push(component[field]);
        }
      } else if(component[field] instanceof Array) {
        for(j in component[field]) {
          if(targetField[field].indexOf(component[field][j]) == -1) {
            targetField[field].push(component[field][j]);
          }
        }
      }
    }
  }
}

/**
 *
 * @param manifestFilePath
 * @param file file can be array or string
 * @param next
 */
function resolvePath(manifestFilePath, file, next) {

  // resolve an array of files in parallel by
  // call our self until all the files are resolved
  if(file instanceof Array) {
    var resolveAssets = [];
    async.each(file, function (file, next) {
      resolvePath(manifestFilePath, file, function (err, file) {
        if (err) {
          next(err);
        } else {
          resolveAssets.push(file);
          next(null);
        }
      });
    }, function(err) {
      next(err, err ? null:resolveAssets);
    });

    return;
  } else if(typeof(file) !== 'string') {
    return next(new Error('File must be a string or array of strings'))
  }

  // parse out loader detail using webpack loader style
  // i.e. "loader-a!loader-b!file" we will need to read loader
  // details before returning the file
  var loader = file.match(/^(.*!)?([^!]+)$/);
  if(loader) {
    file = loader[2];
    loader = loader[1];
  }

  // get the full path to the file relative to the manifest file
  var fullPath = path.resolve(path.dirname(manifestFilePath), file);
  fs.exists(fullPath, function(exists) {

    // try search node_modules if the file does not exist relative to the manifest file
    // and is not a relative path because require.resolve is relative to this file not
    // the manifests file.
    if(!exists && file[0] !== '.') {
      try {
        fullPath = require.resolve(file)
      } catch(ex) {
        console.error('Cannot find', file, 'referenced in manifest', manifestFilePath);
        return next(new Error('Cannot find file'));
      }
    }

    next(null, (loader?loader:'') + fullPath);
  });
}

/**
 * @class
 */
function manifestParser() {
  this.manifest = {};
  this.webpackEP = {};
  this.translations = [];
}

/**
 *
 * @param fullPath
 * @param options
 * @param next
 */
manifestParser.prototype.load = function(fullPath, options, next) {
  var _this = this;

  if(typeof options === 'function') {
    next = options;
    options = {};
  }

  fs.readFile(fullPath, function(err, data) {
    try {
      var manifest = JSON.parse(data.toString());
    } catch(err) {
      console.error('Cannot parse manifest file', fullPath, 'because:', err.message);
      return next(new Error('Cannot parse manifest file'));
    }

    _this.merge(fullPath, manifest, options, next);
  });
};

/**
 *
 * @param fullPath
 * @param options
 * @param next
 */
manifestParser.prototype.save = function(fullPath, options, next) {
  var output = []
    , sortedUid = Object.keys(this.manifest).sort()
    , i;

  if(typeof options === 'function') {
    next = options;
    options = {};
  }

  if(sortedUid.length > 1) {
    for(i in sortedUid) {
      output.push(this.manifest[sortedUid[i]]);
    }

    fs.outputFile(fullPath, JSON.stringify(output, null, 2), {encoding:'utf8', flag:'w'}, next);
  } else if(sortedUid.length == 1) {
    fs.outputFile(fullPath, JSON.stringify(this.manifest[sortedUid[0]], null, 2), {encoding:'utf8', flag:'w'}, next);
  } else {
    fs.outputFile(fullPath, JSON.stringify({}), {encoding:'utf8', flag:'w'}, next);
  }
};

/**
 *
 * @param file used to resolve paths
 * @param additionalItems
 * @param options
 * @param next
 */
manifestParser.prototype.merge = function(file, additionalItems, options, next) {
  var uid, component, _this = this;

  if(typeof options === 'function') {
    next = options;
    options = {};
  }

  // we always batch process so if single object
  // wrap it in an array.
  if(!(additionalItems instanceof Array)) {
    additionalItems = [additionalItems];
  }

  // make sure all required fields are valid and check if overwrite rule
  // are valid. if options.ignoreUpdatingWebpackEP update manifest directly and
  // skip running the resolveComponentPaths.
  for(var i in additionalItems) {
    component = additionalItems[i];

    if(!component.name) {
      console.error('Cannot merge', file ,'manifest because missing component name');
      return next(new Error('Component require the name field'));
    }

    // bail if we already have this component unless options.overwrite is true
    uid = component.name + '@' + (component.version||'0.0.0');
    if(this.manifest[uid] && !options.overwrite) {
      console.error('Cannot merge because component ',uid,'already exist in manifest');
      return next(new Error('Component already defined'));
    }

    if(!options.ignoreUpdatingWebpackEP) {
      component._id = uid;
    } else {
      this.manifest[uid] = component;
    }
  }

  if(options.ignoreUpdatingWebpackEP) {
    return next(null);
  }

  async.each(additionalItems, function(item, next) {
    _this.resolveComponentPaths(file, item, function(err, component) {
      var i, j, field;

      if(err) {
        console.error('Cannot merge', file, 'manifest because:', err.message);
        return next(err);
      }

      if(component.excluded !== true) {
        // merge all webpack fields into
        for(i in WEBPACK_FIELDS) {
          field = WEBPACK_FIELDS[i];

          mergeUniqueComponentFields(_this, component, field, 'webpackEP');
        }

        mergeUniqueComponentFields(_this, component, 'translations');

        // add the component to our manifest and cleanup _id
        // we added in the validate step above
        _this.manifest[component._id] = component;
      }

      delete component._id;

      next(null);
    });
  }, next);
};

/**
 *
 * @param manifestFilePath
 * @param component
 * @param next
 */
manifestParser.prototype.resolveComponentPaths = function(manifestFilePath, component, next) {
  var steps = [];

  function resolveComponentField(field) {
    steps.push(function(next) {
      if(component[field]) {
        resolvePath(manifestFilePath, component[field], function (err, file) {
          if (err) return next(err);

          component[field] = file;
          next(null);
        });
      } else {
        next(null);
      }
    });
  }

  for(var i in WEBPACK_FIELDS) {
    resolveComponentField(WEBPACK_FIELDS[i]);
  }

  resolveComponentField('translations');
  resolveComponentField('assetConfig');
  resolveComponentField('styleMain');

  async.parallel(steps, function(err) {
    next(err, component);
  });
};

/**
 * build a config object that is helpfule to pass to webpack.
 *
 * This step will also build a component index (map file) and translations
 * optionaly you can skip saving this data and do it your self if you want.
 * i.e. if you have a need to handle translation or handle the lookup.
 *
 * @param manifestGlob
 * @param options
 * @param next
 */
manifestParser.prototype.buildWebpackConfig = function(manifestGlob, options, next) {
  if(typeof next === 'undefined') {
    next = options;
    options = {};
  }

  if(typeof manifestGlob === 'string') {
    manifestGlob = [manifestGlob];
  }

  if(!options.copyright) {
    options.copyright = 'Pellet v' + require('../package.json').version + '\n'+
    'https://github.com/Rebelizer/pellet\n\n'+
    'Copyright 2014 Demetrius Johnson\n'+
    'Released under the MIT license\n'+
    'https://github.com/Rebelizer/pellet/LICENSE\n\n';
  }

  if(!options.filename) {
    if(options.mode === 'production') options.filename = '[name]-[hash].js';
    else options.filename = '[name].js'
  }

  if(!options.chunkFilename) {
    if(options.mode === 'production') options.chunkFilename = '[id]-[hash].js';
    else options.chunkFilename = '[id].js'
  }

  var files = [];
  async.each(manifestGlob, function (globPattern, next) {
    glob(globPattern, function (err, fileList) {
      if (err) {
        console.error('Cannot find manifest using glob', manifestGlob, 'because:', err.message);
        return next(err);
      }
      files = files.concat(fileList);
      next();
    });

  }, function(err) {
    if (err) {
      return next(err);
    }

    var ourManifest = new manifestParser();

    for (var i in files) {
      files[i] = path.resolve(process.cwd(), files[i]);
    }

    async.each(files, function (file, next) {
      console.info('Loading and merge', file);
      ourManifest.load(file, {}, function (err) {
        if (err) {
          console.error('Cannot load', file, 'because', err.message);
          return next(err);
        }

        next(null);
      });
    }, function (err) {
      var ix;

      if (err) {
        console.error('Cannot load manifests file because:', err.message);
        return next(err);
      }

      console.info('Use http://webpack.github.io/analyse/ with _PROFILE_*.json in build dir for deep understanding');

      // dump the webpack entry points.
      console.info('Webpack entry points:', JSON.stringify(ourManifest.webpackEP, null, 2)
        .replace(/\s+[{},\]]+/g, "")
        .replace(/[{\[":,]/g, ""));

      /*
       * build a component lookup file that can be added to our webpack, so
       * that the developer does not have to require a component, but can reference
       * it via pellet.components.###.
       *
       * in addition look for the assetConfig and styleMain so we can build
       * intermediate files that can handle the problem we have with stylus NIB
       * needed to only be included one time at the head of the file.
       */

      var subNode, manifestIndex = ourManifest.manifest;
      var indexScript = 'var index = {};';
      var styleMainPath = [];
      var assetConfigPath = [];
      for(ix in manifestIndex) {
        if((subNode = manifestIndex[ix])) {
          if(subNode.component) {
            indexScript += 'index["' + ix + '"] = require("' + subNode.component + '");';
          }

          if(subNode.assetConfig) {
            if(typeof(subNode.assetConfig) === 'string') {
              assetConfigPath.push(subNode.assetConfig);
            } else {
              assetConfigPath = assetConfigPath.concat(subNode.assetConfig);
            }
          }

          if(subNode.styleMain) {
            if(typeof(subNode.styleMain) === 'string') {
              styleMainPath.push(subNode.styleMain);
            } else {
              styleMainPath = styleMainPath.concat(subNode.styleMain);
            }
          }
        }
      }

      indexScript += 'require("pellet").loadManifestComponents(index);';

      if(options.embedManifestIndex) {
        var embedFilePath = path.resolve(__dirname, options.embedManifestIndex);

        fs.outputFileSync(embedFilePath, indexScript);
        ourManifest.webpackEP.component.push(embedFilePath);
      }

      /*
       * Now build the translation
       */
      var msgFormatBuilder
        , translation
        , translationFiles = ourManifest.translations
        , j, k;

      var translationDictionary = {};
      var intermediateStyleFiles = {};
      var intermediateAssetFiles = {};
      var assetFallbackPaths = [];

      for(ix in translationFiles) {
        try {
          // load the translation file and merge each key
          translation = JSON.parse(fs.readFileSync(translationFiles[ix]).toString().replace(/\n/g,''));
          for(k in translation) {
            for(j in translation[k]) {
              // insure locale exist
              if(!translationDictionary[j]) {
                translationDictionary[j] = {};
              }

              if(translationDictionary[j][k]) {
                console.warn('warning translation', k, j, 'already exists');
              }

              translationDictionary[j][k] = translation[k][j];
            }
          }
        } catch(ex) {
          console.error('Cannot read translation', translationFiles[ix], 'because:', ex.message);
          next(ex);
          return;
        }
      }

      // save the transactions map file
      if(options.translationMapFile) {
        var translationMapFile = path.resolve(__dirname, options.translationMapFile);
        fs.writeJSONFileSync(translationMapFile, translationDictionary);
      }

      var localData, assetFullFilePath, translationObj =[], translationStats = {};

      for(j in translationDictionary) {
        msgFormatBuilder = new messageFormat(j.split('-')[0]);

        translationStats[j] = Object.keys(translationDictionary[j]).length;

        for (k in translationDictionary[j]) {
          try {
            translationObj.push(JSON.stringify(k) + ':' + msgFormatBuilder.precompile(msgFormatBuilder.parse(translationDictionary[j][k])));
          } catch(ex) {
            console.error('Can not include translation', j, 'KEY['+k+']', 'VALUE['+translationDictionary[j][k]+']', 'because:', ex.message);
          }
        }

        translationDictionary[j] = {
          i18n: '(function() {var i18n=' + msgFormatBuilder.functions() + ';' +
          'i18n._={' + translationObj.join(',') + '};' +
          'if(__pellet__ref) {__pellet__ref.loadTranslation("' + j + '",i18n._);}})();\n'
        };

        if(options.intlLocaleDataPath && fs.existsSync(path.resolve(options.intlLocaleDataPath, 'json', j + '.json'))) {
          localData = JSON.parse(fs.readFileSync(path.resolve(options.intlLocaleDataPath, 'json', j + '.json')).toString());
        } else {
          localData = JSON.parse(fs.readFileSync(require.resolve('intl/locale-data/json/' + j + '.json')).toString());
        }

        translationDictionary[j].localeData = 'if(Intl.__addLocaleData) {Intl.__addLocaleData(' + JSON.stringify(localData) + ');}';
      }

      if(Object.keys(translationStats).length == 0) {
        console.info('No Translations');
      } else {
        console.info('Translations Breakdown:', JSON.stringify(translationStats, null, 2)
          .replace(/\s+[{},\]]+/g, "")
          .replace(/[{\[":,]/g, ""));
      }

      /* if a manifests has an assetConfig of type "less or stylus" we need to build an
       * intermediate file because if each asset includes the config that could included
       * NIB, globes, mixins, and resets the outputted webpack css would have duplicate styles,
       * resets, etc. To fix this we create a style file that imports the "asset configs" and
       * all the manifests assets under a single file.
       */
      if(assetConfigPath.length > 0) {
        ourManifest.webpackEP._assets = [];

        for(j in assetConfigPath) {
          if((k = assetConfigPath[j].match(/\.(styl|css|less)$/)) && (k = k[1])) {
            assetFullFilePath = assetConfigPath[j];
            if(intermediateAssetFiles[k]) {
              intermediateAssetFiles[k].push(assetFullFilePath);
            } else {
              intermediateAssetFiles[k] = [assetFullFilePath];
            }
          } else {
            // unknown type so add to the webpack asset files
            ourManifest.webpackEP._assets.push(assetConfigPath[j])
          }
        }

        // now sift through all the assets and pull out types that have a type that matches one of our asset config types.
        for(j in ourManifest.webpackEP.assets) {

          assetFullFilePath = ourManifest.webpackEP.assets[j];
          if((k = assetFullFilePath.match(/\.(styl|css|less)$/)) && (k=k[1]) && intermediateAssetFiles[k]) {
            intermediateAssetFiles[k].push(assetFullFilePath);
          } else {
            ourManifest.webpackEP._assets.push(assetFullFilePath);
          }

          // only add unique parent asset dir as fallback path so in the assets
          // we can ~[parentDir]/foo.png
          if(options.includeFallbackPaths && (assetFullFilePath = path.dirname(path.dirname(assetFullFilePath)))
            && assetFullFilePath !== '.'
            && assetFallbackPaths.indexOf(assetFullFilePath) === -1) {
            assetFallbackPaths.push(assetFullFilePath);
          }
        }

        // clean up the temp array used to filter out asset we need to merge into a single asset
        ourManifest.webpackEP.assets = ourManifest.webpackEP._assets;
        delete ourManifest.webpackEP._assets;

        for(j in intermediateAssetFiles) {
          intermediateAssetFiles[j] = '// intermediate file (so no duplicate globes/mixins/etc)\n@import "' + intermediateAssetFiles[j].join('"\n@import "') + '"\n';
        }

        if(options.useIntermediateAssets) {
          for(j in intermediateAssetFiles) {
            var intermediateAssetPath = path.resolve(__dirname, options.useIntermediateAssets) + '.' + j;

            fs.outputFileSync(intermediateAssetPath, intermediateAssetFiles[j]);
            ourManifest.webpackEP.assets.push(intermediateAssetPath);
          }
        }
      }

      /* All style need to be packed into intermediate file and they can only
       * include style sheet files.
       */
      for(j in styleMainPath) {
        if((k = styleMainPath[j].match(/\.(styl|css|less)$/)) && (k = k[1])) {
          assetFullFilePath = styleMainPath[j];
          if(intermediateStyleFiles[k]) {
            intermediateStyleFiles[k].push(assetFullFilePath);
          } else {
            intermediateStyleFiles[k] = [assetFullFilePath];
          }
        } else {
          console.error('Cannot have non style', styleMainPath[j], 'in styleMain section');
          next(new Error('Only styles allowed in the styleMain session'));
          return;
        }
      }

      // now sift through all the style and pull out types that have a type that matches one of our asset config types.
      for(j in ourManifest.webpackEP.style) {
        assetFullFilePath = ourManifest.webpackEP.style[j];
        if((k = assetFullFilePath.match(/\.(styl|css|less)$/)) && (k=k[1])) {
          if(intermediateStyleFiles[k]) {
            intermediateStyleFiles[k].push(assetFullFilePath);
          } else {
            intermediateStyleFiles[k] = [assetFullFilePath];
          }
        } else {
          console.error('Cannot have non style', assetFullFilePath, 'in style section');
          next(new Error('Only styles allowed in the style session'));
          return;
        }

        // only add unique parent asset dir as fallback path so in the style
        // we can ~[parentDir]/foo.png
        if(options.includeFallbackPaths && (assetFullFilePath = path.dirname(path.dirname(assetFullFilePath)))
          && assetFullFilePath !== '.'
          && assetFallbackPaths.indexOf(assetFullFilePath) === -1) {
          assetFallbackPaths.push(assetFullFilePath);
        }
      }

      for(j in intermediateStyleFiles) {
        intermediateStyleFiles[j] = '// intermediate file (so no duplicate globes/mixins/etc)\n@import "' + intermediateStyleFiles[j].join('"\n@import "') + '"\n';
      }

      // nuke the style endpoint because we broken up
      // and merged the styles into intermediate files
      delete ourManifest.webpackEP.style;

      // merge in pellet into the components so its loaded and can bootstrap environment
      var pelletEntryPointPath = path.resolve(__dirname, './pellet.js');
      ourManifest.webpackEP.component.push(pelletEntryPointPath);

      // merge in the code into the webpack component
      if(ourManifest.webpackEP.code) {
        ourManifest.webpackEP.component = ourManifest.webpackEP.code.concat(ourManifest.webpackEP.component);
        delete ourManifest.webpackEP.code;
      }

      // merge in the coordinators into the webpack component
      if(ourManifest.webpackEP.coordinator) {
        ourManifest.webpackEP.component = ourManifest.webpackEP.coordinator.concat(ourManifest.webpackEP.component);
        delete ourManifest.webpackEP.coordinator;
      }

      var config = {
        bail: true,
        cache: true,
        profile: true,
        devtool: '#inline-source-map',
        entry: ourManifest.webpackEP,
        externals: [],
        recordsPath: path.join(path.resolve(process.cwd(), options.output || '/tmp/dist'), '_MAP.json'),
        resolve: {
          extensions: ['', '.js', '.coffee', '.jsx', '.cjsx'],
          alias: {
            pellet: pelletEntryPointPath
          }
        },
        resolveLoader: {
          root: [path.resolve(__dirname, '..', 'node_modules'), process.cwd()],
          modulesDirectories: ['node_modules', 'bower_components']
        },
        module: {
          unknownContextCritical: false,
          loaders: [
          ]
        }
      };

      if(options.includeFallbackPaths) {
        // add all component to our fallback paths
        for (j in ourManifest.webpackEP.component) {
          // only add unique parent component dir as fallback path so in any code dev can ~module/foo.js
          if ((assetFullFilePath = path.dirname(path.dirname(ourManifest.webpackEP.component[j])))
            && assetFullFilePath !== '.'
            && assetFallbackPaths.indexOf(assetFullFilePath) === -1) {
            assetFallbackPaths.push(assetFullFilePath);
          }
        }

        config.resolve.fallback = assetFallbackPaths;
      }

      if(options.jadeTemplateSupport) {
        config.resolve.extensions.push('.jade');
        config.module.loaders.push({test: /\.jade$/, loader: path.join(__dirname, 'jade-loader')});
      }

      var browser = {}
        , node = {};

      utils.objectUnion([config, {
        target: 'web',
        output: {
          path: path.resolve(process.cwd(), options.outputBrowser || '/tmp/dist/browser'),
          publicPath: options.mountPoint,
          filename: options.filename,
          chunkFilename: options.chunkFilename,
          hashDigestLength: 8
        },
        externals:[{
          React: 'React',
          react: 'React',
          intl: 'intl'
        }],
        plugins:[
          new webpack.optimize.DedupePlugin(),
          //new webpack.NoErrorsPlugin(),
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.SERVER_ENV': JSON.stringify(false),
            'process.env.BROWSER_ENV': JSON.stringify(true)
          }),
          new webpack.BannerPlugin(
            options.copyright +
            '\nDate: '+new Date().toJSON()
          )
        ]
      }], browser, {arrayCopyMode:2});

      // allow dev to target the version of react, intl, ejs
      // i.e. does webpack use pellet react version or the calling
      // projects version
      var externalDependencies;
      if(options.useInternalDependencies) {
        externalDependencies = {};
        if(fs.existsSync(path.resolve(options.projectRootPath, 'node_modules', 'pellet', 'node_modules', 'react'))) {
          externalDependencies.React = path.join('pellet', 'node_modules', 'react', 'addons');
          externalDependencies.react = externalDependencies.React;
        } else {
          externalDependencies.React = path.resolve(__dirname, '..', 'node_modules', 'react', 'addons');
          externalDependencies.react = externalDependencies.React;
        }

        if(fs.existsSync(path.resolve(options.projectRootPath, 'node_modules', 'pellet', 'node_modules', 'intl'))) {
          externalDependencies.intl = path.join('pellet', 'node_modules', 'intl');
        } else {
          externalDependencies.intl = path.resolve(__dirname, '..', 'node_modules', 'intl');
        }

        if(fs.existsSync(path.resolve(options.projectRootPath, 'node_modules', 'pellet', 'node_modules', 'ejs'))) {
          externalDependencies.ejs = path.join('pellet', 'node_modules', 'ejs');
        } else {
          externalDependencies.ejs = path.resolve(__dirname, '..', 'node_modules', 'ejs');
        }

        if(fs.existsSync(path.resolve(options.projectRootPath, 'node_modules', 'pellet', 'node_modules', 'messageformat'))) {
          externalDependencies.messageformat = path.join('pellet', 'node_modules', 'messageformat');
        } else {
          externalDependencies.messageformat = path.resolve(__dirname, '..', 'node_modules', 'messageformat');
        }
      } else {
        externalDependencies = {
          React: 'react/addons',
          react: 'react/addons',
          intl: 'intl',
          messageformat: 'messageformat',
          ejs: 'ejs'
        };
      }

      // load the intl code that defines the way that each lang date, formatting, etc is configured
      if(options.intlLocaleDataPath && fs.existsSync(path.resolve(options.intlLocaleDataPath, 'complete.js'))) {
        externalDependencies.intl = path.join(externalDependencies.intl, 'Intl.complete.js');
        config.resolve.alias['intl/locale-data/complete.js'] = path.resolve(options.intlLocaleDataPath, 'complete.js');
      } else {
        config.resolve.alias['intl/locale-data/complete.js'] = path.resolve(__dirname, 'components/internationalization/no-op.js');
      }

      utils.objectUnion([config, {
        target: 'node',
        node: {
          __dirname: true,
          __filename: true
        },
        output:{
          path: path.resolve(process.cwd(), options.outputServer || '/tmp/dist/node'),
          filename: options.filename,
          chunkFilename: options.chunkFilename,
          hashDigestLength: 8,
          libraryTarget:'commonjs2'
        },
        externals: [externalDependencies],
        plugins:[
          new webpack.optimize.DedupePlugin(),
          //new webpack.NoErrorsPlugin(),
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.SERVER_ENV': JSON.stringify(true),
            'process.env.BROWSER_ENV': JSON.stringify(false)
          }),
          new webpack.BannerPlugin(
              options.copyright +
              '\nDate: '+new Date().toJSON()
          )
        ]
      }], node, {arrayCopyMode:2});

      //
      // Now move the client-dependencies and server-dependencies endpoint
      // into the browser & node component entry points because this code
      // is for the targeted environment and needed tobe apart of the code
      // bundle. The order should also be dependencies before UI code.
      //
      if(ourManifest.webpackEP['client-dependencies']) {
        if(!browser.entry.component) {
          browser.entry.component = [ourManifest.webpackEP['client-dependencies']];
        } else {
          browser.entry.component = ourManifest.webpackEP['client-dependencies'].concat(browser.entry.component);
        }

        delete ourManifest.webpackEP['client-dependencies'];
        delete browser.entry['client-dependencies'];
        delete node.entry['client-dependencies'];
      }

      if(ourManifest.webpackEP['server-dependencies']) {
        if(!node.entry.component) {
          node.entry.component = [ourManifest.webpackEP['server-dependencies']];
        } else {
          node.entry.component = ourManifest.webpackEP['server-dependencies'].concat(node.entry.component);
        }

        delete ourManifest.webpackEP['server-dependencies'];
        delete browser.entry['server-dependencies'];
        delete node.entry['server-dependencies'];
      }

      //
      // now dump the static intermediate styles to disk
      // and add it to the browser entry point. This will
      // include all style types less, stylus,and css
      //
      if(options.useIntermediateStyle) {
        for(j in intermediateStyleFiles) {
          var intermediateStylePath = path.resolve(__dirname, options.useIntermediateStyle) + '.static-' + j;

          fs.outputFileSync(intermediateStylePath, intermediateStyleFiles[j]);

          var styleEP = '_style_' + j;
          if(!browser.entry[styleEP]) {
            browser.entry[styleEP] = [];
          }

          browser.entry[styleEP].push(intermediateStylePath);
        }
      }

      // for the browser version change to true source maps and minify the js
      if(options.mode === 'production') {
        browser.devtool = '#source-map';

        if(!options.uglifyOptions) {
          options.uglifyOptions = {
            mangle: {},
            output: {
              indent_start  : 0,     // start indentation on every line (only when `beautify`)
              indent_level  : 4,     // indentation level (only when `beautify`)
              quote_keys    : false, // quote all keys in object literals?
              space_colon   : true,  // add a space after colon signs?
              ascii_only    : false, // output ASCII-safe? (encodes Unicode characters as ASCII)
              inline_script : false, // escape "</script"?
              width         : 80,    // informative maximum line width (for beautified output)
              max_line_len  : 32000, // maximum line length (for non-beautified output)
              beautify      : false, // (default is true) beautify output?
              source_map    : null,  // output a source map
              bracketize    : false, // use brackets every time?
              semicolons    : true,  // use semicolons to separate statements? (otherwise, newlines)
              preamble      : null,
              comments      : /^\**!|@preserve|@license/ // output comments? or false
            },
            compress: {
              sequences     : true,  // join consecutive statemets with the “comma operator”
              properties    : true,  // optimize property access: a["foo"] → a.foo
              dead_code     : true,  // discard unreachable code
              drop_debugger : true,  // discard “debugger” statements
              unsafe        : false, // some unsafe optimizations (see below)
              conditionals  : true,  // optimize if-s and conditional expressions
              comparisons   : true,  // optimize comparisons
              evaluate      : true,  // evaluate constant expressions
              booleans      : true,  // optimize boolean expressions
              loops         : true,  // optimize loops
              unused        : false, // (default is true) drop unused variables/functions
              hoist_funs    : true,  // hoist function declarations
              hoist_vars    : false, // hoist variable declarations
              if_return     : true,  // optimize if-s followed by return/continue
              join_vars     : true,  // join var declarations
              cascade       : true,  // try to cascade `right` into `left` in sequences
              warnings      : false, // (default is true) warn about potentially dangerous optimizations/code
              negate_iife   : true,
              pure_getters  : false,
              pure_funcs    : null,
              drop_console  : true
            }
          };
        } else {
          if(options.uglifyOptions.output && options.uglifyOptions.output.comments) {
            if(typeof(options.uglifyOptions.output.comments) !== 'object') {
              options.uglifyOptions.output.comments = new RegExp(options.uglifyOptions.output.comments);
            }
          }
        }

        browser.plugins.push(new webpack.optimize.UglifyJsPlugin(options.uglifyOptions));
      }

      //new webpack.optimize.CommonsChunkPlugin(),
      //new webpack.NoErrorsPlugin()

      next(null, {
        translationDictionary: translationDictionary,
        intermediateStyleFiles: intermediateStyleFiles,
        intermediateAssetFiles: intermediateAssetFiles,
        indexScript: indexScript,
        baseConfig: config,
        browserConfig: browser,
        serverConfig: node
      });
    });
  });
};

/**
 * create the style.css file by merge all the styl,less,css files into
 * a single file. To build the name just use the bundle format
 *
 * @param manifestGlob
 * @param options
 * @param next
 */
manifestParser.prototype.convertStyleEPToStaticFile = function(browserStats, outputPath) {

  var i
    , styleFile
    , staticStyles
    , styleFileOutputPath
    , styleFileOutput
    , styleFileName= false;

  staticStyles = [
    browserStats.assetsByChunkName['_style_css'],
    browserStats.assetsByChunkName['_style_less'],
    browserStats.assetsByChunkName['_style_styl']
  ];

  for(i = 0; i < staticStyles.length; i++) {
    if(staticStyles[i]) {

      if(!styleFileName) {
        if(typeof staticStyles[i] === 'string') {
          styleFileName = staticStyles[i];
        } else {
          styleFileName = staticStyles[i][0];
        }

        styleFileOutput = styleFileName.replace(/\.js.*$/, '.css').replace(/^[^\-]*\-/,'style-');
        if(styleFileOutput.indexOf('style-') !== 0) {
          styleFileOutput = 'style.css';
        }

        styleFileOutputPath = path.join(outputPath, styleFileOutput);

        if(fs.existsSync(styleFileOutputPath)) {
          fs.unlinkSync(styleFileOutputPath);
        }
      }

      styleFile = path.join(outputPath, styleFileName);

      try {
        var styleCode = fs.readFileSync(styleFile).toString();

        // because the webpack minified version (i.e in prod mode) has a funny output we need to
        // update it so that we can eval it the same way as the normal webpack version
        styleCode = styleCode.replace(/!function\((\w+)\)\s*{/, 'ret=function ___($1){');
        fs.appendFileSync(styleFileOutputPath, eval(styleCode).toString()+'\n\n', {flag:'a+'});
      } catch(ex) {
        console.error('Cannot build webpack files because style output error:', ex.message);
        return false;
      }
    }
  }

  return styleFileOutput;
}

module.exports = manifestParser;

// if ENV=='testing' exports manifest test functions look at rewire to do this also!
