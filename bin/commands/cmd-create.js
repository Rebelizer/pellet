var path = require('path')
  , fs = require('fs-extra')
  , inquirer = require('inquirer')
  , utils = require('../utils')
  , manifest = require('../../src/manifest')
  , async = require('async')
  , ejs = require('ejs');

var CWD = process.cwd();
var CREATE_TYPES = ['Component', 'Page', 'Layout', 'Project'];

/**
 * Helper function to add template file to generate que
 * @param outputFiles
 * @param outputPath
 * @param templatePath
 */
function renderFile(outputFiles, outputPath, templatePath, data) {
  outputFiles[outputPath] = function(next) {
    try {
      fs.outputFile(outputPath, ejs.render(fs.readFileSync(templatePath).toString(), data), function (err) {
        if (err) {
          console.error('Cannot generate file', outputPath, 'because', err.message);
          return next(err)
        }

        next(null);
      });
    } catch(ex) {
      console.error('Cannot generate file', outputPath, 'because and error in', templatePath);
      next(ex);
    }
  }
}

module.exports = function(program, addToReadyQue) {

  program
    .command('create [type] [name]')
    .alias('init')
    .description('Create a component or project')
    .option('--output <path>', 'output directory', CWD)
    .option('--templateDir <path>', 'path to the template files', path.join(__dirname, '..', 'templates'))
    .action(function (type, name, options) {
      var _type;

      if(program.rawArgs[2] == 'init') {
        type = 'project';
      }

      // make the type optional so if only one args and its not one of CREATE_TYPES use it as the name
      if(type && (_type = type.charAt(0).toUpperCase()+type.slice(1).toLowerCase()) && CREATE_TYPES.indexOf(_type) != -1) {
        type = _type;
      } else if(!name) {
        name = type;
        type = false;
      }

      // setup a callback hook that lets this sub command register
      // the logic needed to execute when the parent process is ready.
      // We do this so the parent process can load all the config info
      // before execute ourself.
      addToReadyQue(function() {
        var manifestFile;

        // make sure the paths are absolute and resolve from cwd
        options.output = path.resolve(CWD, options.output);
        options.templateDir = path.resolve(CWD, options.templateDir);

        // try to find and load the manifestFile
        manifestFile = utils.getManifestFile(options.output);

        /*
         * FUNCTION TO BUILD COMPONENT
         */

        function validateComponent(answer) {
          var outputFiles = {};

          // make sure component is camelcased

          answer.fileName = answer.name;
          answer.name = utils.camelcase(answer.fileName);

          // get the base directory for output data
          var baseOutputDir = options.output;
          if(answer.createDir) {
            baseOutputDir = path.join(baseOutputDir, answer.fileName);
            outputFiles[baseOutputDir] = function(next) {
              fs.exists(baseOutputDir, function(exists) {
                if(exists) {
                  return next(null);
                }

                fs.mkdir(baseOutputDir, next);
              });
            }
          }

          var baseTemplateNames = [
            ['comp-react', 'assets', 'comp'],
            ['page-react', 'assets', 'page'],
            ['layout-react', 'assets', 'comp'],
            null
          ];

          baseTemplateNames = baseTemplateNames[CREATE_TYPES.indexOf(answer.type)];

          var componentEP, assetEP, jadeEP;

          // now build up the work needed to render/generate the template output
          if(answer.templateType === 'Jade') {
            baseTemplateNames[0] = 'jade-' + baseTemplateNames[0];

            jadeEP = path.join(baseOutputDir, answer.fileName + '.jade');
            renderFile(outputFiles, jadeEP, path.join(options.templateDir, baseTemplateNames[0]+'.ejs'), answer);

            if (answer.lang === 'JavaScript') {
              componentEP = path.join(baseOutputDir, answer.fileName + '.js');
              renderFile(outputFiles, componentEP, path.join(options.templateDir, baseTemplateNames[0]+'-js.ejs'), answer);
            } else if (answer.lang === 'CoffeeScript') {
              componentEP = path.join(baseOutputDir, answer.fileName + '.coffee');
              renderFile(outputFiles, componentEP, path.join(options.templateDir, baseTemplateNames[0]+'-cs.ejs'), answer);
            }

          } else if(answer.templateType === 'JSX') {
            baseTemplateNames[0] = 'jsx-' + baseTemplateNames[0];

            if (answer.lang === 'JavaScript') {
              componentEP = path.join(baseOutputDir, answer.fileName + '.jsx');
              renderFile(outputFiles, componentEP, path.join(options.templateDir, baseTemplateNames[0]+'-js.ejs'), answer);
            } else if (answer.lang === 'CoffeeScript') {
              componentEP = path.join(baseOutputDir, answer.fileName + '.cjsx');
              renderFile(outputFiles, componentEP, path.join(options.templateDir, baseTemplateNames[0]+'-cs.ejs'), answer);
            }

          }

          if (answer.assets === 'stylus') {
            assetEP = path.join(baseOutputDir, answer.fileName + '.styl');
            renderFile(outputFiles, assetEP, path.join(options.templateDir, baseTemplateNames[1]+'-styl.ejs'), answer);
          } else if (answer.assets === 'css') {
            assetEP = path.join(baseOutputDir, answer.fileName + '.css');
            renderFile(outputFiles, assetEP, path.join(options.templateDir, baseTemplateNames[1]+'-css.ejs'), answer);
          }

          // todo: add test types i.e. karma vs moka
          if (answer.test) {
            renderFile(outputFiles, path.join(baseOutputDir, answer.fileName + '.test.js'), path.join(options.templateDir, baseTemplateNames[2]+'-test.ejs'), answer);
          }

          // now update or create the manifest AFTER all our files have been created.
          // because the manifest will try to resolve the paths.
          if(answer.mergeManifest) {
            answer.mergeManifest = answer.mergeManifest.split(' ');
            if (answer.mergeManifest[0] != 'None') {
              var manifestOutputPath = answer.mergeManifest[1];
              var manifestOutputDir = path.dirname(manifestOutputPath);

              outputFiles[manifestOutputPath] = function (next) {
                var newManifest = new manifest();
                var newComponent = {
                  "name": answer.name,
                  "version": answer.version,
                  "component": '.' + path.sep + path.relative(manifestOutputDir, componentEP),
                  "assets": ['.' + path.sep + path.relative(manifestOutputDir, assetEP)]
//                    "dependencies": ["react"],
//                    "test": false,
//                    "docs": false
                };

                if(answer.mergeManifest[0] === 'Create') {
                  newManifest.merge(manifestOutputPath, newComponent, {ignoreUpdatingWebpackEP:true}, function(err) {
                    if(err) {
                      console.error('Cannot create manifest because:', err.message);
                    }

                    newManifest.save(manifestOutputPath, next);
                  });
                } else {
                  newManifest.load(manifestOutputPath, {ignoreUpdatingWebpackEP:true}, function(err) {
                    newManifest.merge(manifestOutputPath, newComponent, {ignoreUpdatingWebpackEP:true, overwrite:true}, function(err) {
                      if(err) {
                        console.error('Cannot create manifest because:', err.message);
                      }

                      newManifest.save(manifestOutputPath, next);
                    });
                  });
                }

              }
            }
          }

          var isOk = true;
          console.log('\nAbout to:');
          for(var i in outputFiles) {
            if(fs.existsSync(i)) {
              console.log(' Overwrite:', i);
              // ignore manifest.json to abort overwrite flag
              if(i.indexOf('manifest.json') == -1) {
                isOk = false;
              }
            } else {
              console.log(' Create:', i);
            }
          }

          console.log('');

          answer.outputFiles = outputFiles;

          inquirer.prompt({
            type: 'confirm',
            name: 'isOk',
            'default': isOk,
            message: 'Is this ok'
          }, function(confirmAnswer) {
            answer.isOk = confirmAnswer.isOk;
            createTemplate(answer);
          });
        }

        /*
         * FUNCTION TO BUILD THE PROJECT
         */
        function validateProject(answer) {
          var outputFiles = {};

          answer.fileName = answer.name;
          answer.name = utils.camelcase(answer.fileName);

          // get the base directory for output data
          var baseOutputDir = options.output;
          if(answer.createDir) {
            baseOutputDir = path.join(baseOutputDir, answer.fileName);
            outputFiles[baseOutputDir] = function(next) {
              fs.exists(baseOutputDir, function(exists) {
                if(exists) {
                  return next(null);
                }

                fs.mkdir(baseOutputDir, next);
              });
            }
          }

          var configDir = path.join(baseOutputDir, 'config');
          answer.relitiveConfigDirPath = '.' + path.sep + 'config';
          outputFiles[configDir] = function(next) {
            fs.copy(path.resolve(__dirname, '..', 'config'), configDir, function(err) {
              // hack to repalce the common.json PELLET_BIN_DIR to use PELLET_PROJECT_PATH
              var updateFile = path.resolve(__dirname, '..', 'config', 'common.json');
              fs.writeFileSync(path.join(configDir, 'common.json'), fs.readFileSync(updateFile).toString().replace(/#PELLET_BIN_DIR#/gm, '#PELLET_PROJECT_PATH#'));
              next(null);
            });
          };

          var publicDir = path.join(baseOutputDir, 'public');
          outputFiles[publicDir] = function(next) {
            fs.copy(path.resolve(__dirname, '..', 'public'), publicDir, next);
          };

          var skeletonFile = path.join(baseOutputDir, 'src', 'page-skeleton.ejs');
          outputFiles[skeletonFile] = function(next) {
            fs.copy(path.join(options.templateDir, 'project-page-skeleton.ejs'), skeletonFile, next);
          };

          var errorPage = path.join(baseOutputDir, 'src', 'page-500.ejs');
          outputFiles[errorPage] = function(next) {
            fs.copy(path.join(options.templateDir, 'project-page-500.ejs'), errorPage, next);
          };

          var missingPage = path.join(baseOutputDir, 'src', 'page-404.ejs');
          outputFiles[missingPage] = function(next) {
            fs.copy(path.join(options.templateDir, 'project-page-404.ejs'), missingPage, next);
          };

          var componentPath = path.join(baseOutputDir, 'frontend');
          outputFiles[componentPath] = function(next) {
            fs.ensureDir(componentPath, next);
          };

          renderFile(outputFiles, path.join(baseOutputDir, '.pellet'), path.join(options.templateDir, 'pellet.ejs'), answer);

          var componentEP, assetEP, jadeEP, templateType, resetFile;

          // we should add a example into /src that is server only, client only, etc.

          if(answer.templateType === 'Jade') {
            templateType = 'jade';
            jadeEP = path.join(baseOutputDir, 'frontend', 'index.jade');
            renderFile(outputFiles, jadeEP, path.join(options.templateDir, templateType+'-page-react.ejs'), {type:'Page', name:'index', mode:'project', fileName:'index'});
          } else if(answer.templateType === 'JSX') {
            templateType = 'jsx';
          }

          if (answer.lang === 'JavaScript') {
            componentEP = path.join(baseOutputDir, 'frontend', 'index.js');
            renderFile(outputFiles, componentEP, path.join(options.templateDir, templateType+'-page-react-js.ejs'), {type:'Page', name:'index', mode:'project', fileName:'index'});
          } else if (answer.lang === 'CoffeeScript') {
            componentEP = path.join(baseOutputDir, 'src', 'index.coffee');
            renderFile(outputFiles, componentEP, path.join(options.templateDir, templateType+'-page-react-cs.ejs'), {type:'Page', name:'index', mode:'project', fileName:'index'});
          }

          if (answer.assets === 'stylus') {
            assetEP = path.join(baseOutputDir, 'assets', answer.fileName + '.styl');
            renderFile(outputFiles, assetEP, path.join(options.templateDir, 'project-assets-site-styl.ejs'), answer);

            resetFile = path.join(baseOutputDir, 'assets', 'reset.styl');
          } else if (answer.assets === 'css') {
            assetEP = path.join(baseOutputDir, 'assets', answer.fileName + '.css');
            renderFile(outputFiles, assetEP, path.join(options.templateDir, 'project-assets-site-css.ejs'), answer);

            resetFile = path.join(baseOutputDir, 'assets', 'reset.css');
          }

          outputFiles[resetFile] = function(next) {
            fs.copy(path.join(options.templateDir, 'project-assets-reset.css'), resetFile, next);
          };

          var manifestOutputPath = path.join(baseOutputDir, 'manifest.json');
          answer.relitiveManifestPath = '.' + path.sep + 'manifest.json';
          outputFiles[manifestOutputPath] = function (next) {
            var newManifest = new manifest();
            var newComponent = {
              "name": answer.name,
              "version": answer.version,
              "assetConfig": '.' + path.normalize(assetEP.replace(baseOutputDir, '')),
              "component": '.' + path.sep + path.relative(baseOutputDir, componentEP)
//              "assets": ['.' + path.normalize(assetEP.replace(baseOutputDir, ''))]
//                    "dependencies": ["react"],
//                    "test": false,
//                    "docs": false
            };

            newManifest.merge(manifestOutputPath, newComponent, {ignoreUpdatingWebpackEP: true}, function (err) {
              if (err) {
                console.error('Cannot create manifest because:', err.message);
              }

              newManifest.save(manifestOutputPath, next);
            });
          };

          var isOk = true;
          console.log('\nAbout to:');
          for(var i in outputFiles) {
            if(fs.existsSync(i)) {
              console.log(' Overwrite:', i);
              isOk = false;
            } else {
              console.log(' Create:', i);
            }
          }

          console.log('');

          answer.outputFiles = outputFiles;

          inquirer.prompt({
            type: 'confirm',
            name: 'isOk',
            'default': isOk,
            message: 'Is this ok'
          }, function(confirmAnswer) {
            answer.isOk = confirmAnswer.isOk;
            createTemplate(answer);
          });
        }

        /*
         * DO THE WORK TO BUILD THE TEMPLATE
         */
        function createTemplate(answer) {
          if(!answer.isOk) {
            console.log('Canceled (you dodged that bullet)', answer.type);
            process.exit(0);
          }

          async.series(answer.outputFiles, function(err) {
            if(err) {
              console.error('Stoped before completing because', err.message);
              process.exit(1);
            }

            console.log('\n\n');
            if(answer.type === 'Project') {
              console.log('#### IMPORTANT ####');
              console.log('The default configuration of pellet requires react,');
              console.log('ejs, and intl installed.\n\nPlease run:\n');

              console.log('$ cd', options.output);

              if(!fs.existsSync(path.join(options.output, 'package.json'))) {
                console.log('$ npm init')
                console.log('$ npm install react ejs intl --save')
              } else {
                console.log('$ npm install react ejs intl --save')
              }

              console.log('\nIf you want to use pellet standalone you will need');
              console.log('to set useInternalDependencies=false in your config');
              console.log('and "npm install pellet --save"\n\n');

              console.log('To start pellet run:');
              console.log('$ pellet run --watch --clean');

            }
          });
        }

        /*
         * Start the interview
         */
        inquirer.prompt([{
          type: 'list',
          name: 'type',
          message: 'Type to create',
          choices: CREATE_TYPES,
          when: function(answer) {
            if(type) {
              answer.type = type;
              return false;
            }

            return true;
          }
        },{
          type: 'input',
          name: 'name',
          message: 'Name',
          'default': path.basename(options.output),
          validate: function(input) {
            return /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(input);
          },
          when: function(answer) {
            if(name) {
              answer.name = name;
              return false;
            }

            return true;
          }
        },{
          type: 'input',
          name: 'version',
          message: 'Version',
          'default': '0.0.0'
        },{
          type: 'confirm',
          name: 'createDir',
          message: 'Create Directory',
          'default': function(answer) {
            if(program.pelletConfig && typeof program.pelletConfig.defaults.createDir !== 'undefined') {
              return program.pelletConfig.defaults.createDir;
            }

            var currentBase = path.basename(options.output);
            return (answer.name !== currentBase || currentBase === 'frontend');
          }
        },{
          type: 'list',
          name: 'templateType',
          message: 'Template Type',
          'default': program.pelletConfig && program.pelletConfig.defaults.templateType,
          choices: ['Jade', 'JSX'] // code only
        },{
          type: 'list',
          name: 'lang',
          message: 'Language',
          'default': program.pelletConfig && program.pelletConfig.defaults.lang,
          choices: ['JavaScript', 'CoffeeScript']
        },{
          type: 'list',
          name: 'assets',
          message: 'Styles',
          'default': program.pelletConfig && program.pelletConfig.defaults.assets,
          choices: ['stylus', 'css', 'none']
        }], switchTypes);

        function switchTypes(answer) {
          if(['Component', 'Page', 'Layout'].indexOf(answer.type) !== -1) {
            inquirer.prompt([{
              type: 'confirm',
              name: 'test',
              'default': program.pelletConfig && program.pelletConfig.defaults.test,
              message: 'Include unit tests'
            },{
              type: 'list',
              name: 'mergeManifest',
              message: 'Manifest location',
              'default': program.pelletConfig && program.pelletConfig.defaults.mergeManifest,
              choices: function(answer) {
                var opt = ['None (skip updating manifest)'];

                function addToChoices(name) {
                  for(var i in utils.VALID_MANIFEST_FILES) {
                    var createPath = path.join(options.output, name?name:'', utils.VALID_MANIFEST_FILES[i]);
                    if (createPath != manifestFile) {
                      opt.unshift('Create ' + createPath);
                    }
                  }
                }

                if(answer.createDir) {
                  addToChoices(answer.name);
                } else {
                  addToChoices();
                }

                if(manifestFile) {
                  opt.unshift('Update '+manifestFile);
                }

                return opt;
              }
            }], function(answer2) {
              answer2.__proto__ = answer;
              validateComponent(answer2);
            });
          } else if(answer.type == 'Project') {
            validateProject(answer);
          }
        }
      });
    }).on('--help', function () {
      console.log(fs.readFileSync(path.join(__dirname, '..', 'help', 'create.txt')).toString());
    });
};
