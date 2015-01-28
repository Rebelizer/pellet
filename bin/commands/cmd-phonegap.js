var path = require('path')
  , fs = require('fs')
  , manifest = require('../../src/manifest')
  , inquirer = require('inquirer')
  , async = require('async')
  , osexec = require('child_process').exec;


var LAUNCH_CWD = process.cwd();
var PHONEGAP_DIR_NAME = '__phonegap';

module.exports = function(program, addToReadyQue) {

  var PELLET_PROJECT_PATH = (program.pelletConfig && program.pelletConfig._filepath && path.dirname(program.pelletConfig._filepath)) || LAUNCH_CWD;

  function launch(manifestGlob, options) {
    if (!manifestGlob) {
      manifestGlob = [program.pelletConfig && program.pelletConfig.manifestFiles &&
      path.resolve(PELLET_PROJECT_PATH, program.pelletConfig.manifestFiles)];
    } else if (program.args) {
      program.args.push(manifestGlob);
      manifestGlob = program.args;
    } else {
      manifestGlob = [manifestGlob];
    }

    options.build = true;
    options.clean = true;
    options.exitOnBuild = function() {
      var app, server, pellet;

      try {
        componentModule = require(componentModule);
        program._running = componentModule;
      } catch (ex) {
        console.error('Cannot load manifest', componentModule, 'because:', ex.message);
        process.exit(1);
      }

      if (componentModule.mode !== options.mode) {
        console.error('Cannot use manifest because it was build in', componentModule.mode, 'mode and you are running in', options.mode);
        process.exit(1);
      }

      // get base node dir by using _MANIFEST.json and its relative path to node version
      var baseServerDir = path.resolve(options.output, componentModule.server.relativePath)
        , componentFile = path.join(baseServerDir, componentModule.server.component);

      if (!fs.existsSync(componentFile)) {
        console.error('Cannot find build output. Please build and insure', componentModule, 'exists.');
        process.exit(1);
      }

      var appConfig = nconf.get('application:config');
      var appOptions = nconf.get('application:options');
      appOptions.skeletonPage = resolveConfigPaths(appOptions.skeletonPage);
      appOptions.assetFileName = componentModule.browser.assets;
      appOptions.componentFileName = componentModule.browser.component;
      appOptions.manifest = componentModule;

      try {
        console.log('Loading', componentFile, 'webpack into pellet server.');
        require('source-map-support').install({handleUncaughtExceptions: false});
        global.__pellet__bootstrap = {config:appConfig, options:appOptions};
        pellet = require(componentFile);
      } catch (ex) {
        console.error('Cannot load', componentFile, 'because:', ex.message);
        console.error(ex.stack);
        process.exit(1);
      }

      if (componentModule.server.translation) {
        var translationFile = path.join(baseServerDir, componentModule.server.translation);

        try {
          console.log('Loading', translationFile, 'translation into pellet server.');
          require(translationFile);
        } catch (ex) {
          console.error('Cannot load', translationFile, 'because:', ex.message);
          console.error(ex.stack);
          process.exit(1);
        }
      }

      var match = pellet.routes.parse(options.launchUrl);
      if (!match) {
        console.error('Cannot render', options.launchUrl, 'because no matching route');
        process.exit(1);
      }

      //match.next = function() {};

      //match.fn.call(match);

      phonegapCommand = 'phonegap build ' + phonegapProjectDir;
      osexec(phonegapCommand, function(error, stdout, stderr) {
        console.error(stdout);
        if(stderr && stderr.trim() != '') {
          console.error('stderr: ' + stderr);
        }

        if (error !== null) {
          console.error('Can not spawn phonegap command becuase:', error);
          process.exit(1);
        }

        console.log('\nNow fire up the emulater in', phonegapProjectDir);
        console.log('$ cordova emulate ios');
        console.log('$ cordova emulate android');
        console.log('OR');
        console.log('$ cordova run ios');
        console.log('$ cordova run android');
      });

        // options.outputBrowser

  /*
          // init the polyfill and rebuild cache is needed
          var polyfillOptions = nconf.get('polyfill');
          polyfillOptions.cache = resolveConfigPaths(polyfillOptions.cache);

          if (!nconf.get('silent')) {
            console.info('Polyfill:', polyfillOptions);
          }


          var _polyfill = polyfill();
  */

    };

    program.serverCommandFn.buildRunPackage(manifestGlob, options);
  }

  function createPhonegap(manifestGlob, options) {
    if(!program.pelletConfig) {
      console.error('\nPhonegap can only be added to an existing pellet project.');
      console.error('Please create a new project via "pellet init" or cd into an existing project.\n');
      process.exit(1);
    }

    var phonegapProjectDir = path.join(path.dirname(program.pelletConfig._filepath), PHONEGAP_DIR_NAME);
    if(!fs.existsSync(phonegapProjectDir)) {
      console.log('');
      console.log(fs.readFileSync(path.join(__dirname, '..', 'help', 'phonegap-pre-install.txt')).toString());
    } else {
      console.error('\nWe detected a Phonegap project already. Aborting');
      process.exit(1);
    }

    /*
     * Start the interview
     */
    inquirer.prompt([{
      type: 'input',
      name: 'domain',
      message: 'App Identifier',
      'default': 'com.pellet.phonegap_demo',
      validate: function (input) {
        return /^[a-zA-Z_-]([a-zA-Z0-9_]|\.)*$/.test(input);
      }
    }, {
      type: 'input',
      name: 'name',
      message: 'Name (title)',
      'default': path.basename(path.dirname(program.pelletConfig._filepath)),
      validate: function (input) {
        return /^[a-zA-Z_-]([a-zA-Z0-9_-]|\ )*$/.test(input);
      }
    }, {
      type: 'confirm',
      name: 'confirm',
      message: 'Add Phonegap Project',
      'default': true
    }], function(answer) {
      if(!answer.confirm) {
        console.error('\nAborting');
        process.exit(1);
      }

      phonegapCommand = 'phonegap create ' + phonegapProjectDir + ' ' + answer.domain+ ' ' + answer.name;
      osexec(phonegapCommand, function(error, stdout, stderr) {
        console.error(stdout);
        if(stderr && stderr.trim() != '') {
          console.error('stderr: ' + stderr);
        }

        if (error !== null) {
          console.error('Can not spawn phonegap command becuase:', error);
          process.exit(1);
        }

        console.log('\nNow add the platforms by "cd" into', phonegapProjectDir, "and running:");
        console.log('$ phonegap platform add ios');
        console.log('$ phonegap platform add amazon-fireos');
        console.log('$ phonegap platform add android');
        console.log('$ phonegap platform add blackberry10');
        console.log('$ phonegap platform add firefoxos');
        console.log('$ phonegap platform add wp8');
        console.log('$ phonegap platform add windows');
      });
    });
  }

  program
    .command('phonegap [manifest]')
    .alias('cordova')
    .description('Build and run pellet packages on phonegap')
    .option('--init', 'adds phonegap support to existing pellet project')
    .option('--launchUrl', 'url phonegap startup on', '/')
    //prepare ios
    //compile ios
    .action(function (manifestGlob, options) {
      // setup a callback hook that lets this sub command register
      // the logic needed to execute when the parent process is ready.
      // We do this so the parent process can load all the config info
      // before execute ourself.
      addToReadyQue(function() {

        if(options.init) {
          createPhonegap(manifestGlob, options);
          return;
        }

        launch(manifestGlob, options);
      });
    }).on('--help', function () {
      console.log(fs.readFileSync(path.join(__dirname, '..', 'help', 'phonegap.txt')).toString());
    });
};



