var path = require('path')
  , fs = require('fs')
  , inquirer = require('inquirer')
  , utils = require('../utils')
  , manifest = require('../../src/manifest')
  , async = require('async')
  , ejs = require('ejs');

var CWD = process.cwd();
var CREATE_TYPES = ['Component', 'Project'];

module.exports = function(program, addToReadyQue) {

  program
    .command('create [type] [name]')
    //.alias('c')
    .description('Create a component or project')
    .option('--output <path>', 'output directory', CWD)
    .option('--templateDir <path>', 'path to the template files', path.join(__dirname, '..', 'templates'))
    .action(function (type, name, options) {

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

        function validate(answer) {
          var outputFiles = {};

          if(answer.type == 'Component') {

            // get the base directory for output data
            var baseOutputDir = options.output;
            if(answer.createDir) {
              baseOutputDir = path.join(baseOutputDir, answer.name);
              outputFiles[baseOutputDir] = function(next) {
                fs.exists(baseOutputDir, function(exists) {
                  if(exists) {
                    return next(null);
                  }

                  fs.mkdir(baseOutputDir, next);
                });
              }
            }

            // helper function to render template and add to outputFile que
            function renderFile(outputPath, templatePath) {
              outputFiles[outputPath] = function(next) {
                try {
                  fs.writeFileSync(outputPath, ejs.render(fs.readFileSync(templatePath).toString(), answer));
                } catch (err) {
                  console.error('Cannot generate file', outputPath, 'because', err.message);
                  return next(err)
                }

                next(null);
              }
            }

            var componentEP, assetEP;
            // now build up the work needed to render/generate the template output
            if (answer.lang === 'JavaScript') {
              componentEP = path.join(baseOutputDir, answer.name + '.jsx');
              renderFile(componentEP, path.join(options.templateDir, 'comp-react-js.ejs'));
            } else if (answer.lang === 'CoffeeScript') {
              componentEP = path.join(baseOutputDir, answer.name + '.cjsx');
              renderFile(componentEP, path.join(options.templateDir, 'comp-react-cs.ejs'));
            }

            if (answer.assets === 'stylus') {
              assetEP = path.join(baseOutputDir, answer.name + '.styl');
              renderFile(assetEP, path.join(options.templateDir, 'comp-assets-styl.ejs'));
            } else if (answer.assets === 'css') {
              assetEP = path.join(baseOutputDir, answer.name + '.css');
              renderFile(assetEP, path.join(options.templateDir, 'comp-assets-css.ejs'));
            }

            // todo: add test types i.e. karma vs moka
            if (answer.test) {
              renderFile(path.join(baseOutputDir, answer.name + '.test.js'), path.join(options.templateDir, 'comp-test.ejs'));
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
                        console.error('Can not create manifest because:', err.message);
                      }

                      newManifest.save(manifestOutputPath, next);
                    });
                  } else {
                    newManifest.load(manifestOutputPath, {ignoreUpdatingWebpackEP:true}, function(err) {
                      newManifest.merge(manifestOutputPath, newComponent, {ignoreUpdatingWebpackEP:true, overwrite:true}, function(err) {
                        if(err) {
                          console.error('Can not create manifest because:', err.message);
                        }

                        newManifest.save(manifestOutputPath, next);
                      });
                    });
                  }

                }
              }
            }

          } else if(answer.type == 'Project') {
            // todo: build a list of files to flush!
          }

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
            default: isOk,
            message: 'Is this ok'
          }, function(confirmAnswer) {
            answer.isOk = confirmAnswer.isOk;
            createTemplate(answer);
          });
        }

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

            console.log('\n\nCreated the', answer.type, '(please comeback again WHINER!)');
          });
        }

        inquirer.prompt([{
          type: 'list',
          name: 'type',
          message: 'Type to create',
          choices: CREATE_TYPES,
          when: function(answer) {
            if(type && (type = type.charAt(0).toUpperCase()+typeslice(1).toLowerCase()) && CREATE_TYPES.indexOf(type) != -1) {
              answer.type = type;
              return false;
            }

            return true;
          }
        },{
          type: 'input',
          name: 'name',
          message: 'Name',
          default: path.basename(options.output),
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
          default: '0.0.0'
        },{
          type: 'confirm',
          name: 'createDir',
          message: 'Create Directory',
          'default': function(answer) {
            return (answer.name !== path.basename(options.output));
          }
        },{
          type: 'list',
          name: 'lang',
          message: 'Language',
          choices: ['JavaScript', 'CoffeeScript']
        },{
          type: 'list',
          name: 'assets',
          message: 'Styles',
          choices: ['stylus', 'css', 'none']
        },{
          type: 'confirm',
          name: 'test',
          message: 'Include unit tests'
        },{
          type: 'list',
          name: 'mergeManifest',
          message: 'Manifest location',
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
        }], validate);

      });
    }).on('--help', function () {
      console.log(fs.readFileSync(path.join(__dirname, '..', 'help', 'create.txt')).toString());
    });
};