var path = require('path')
  , fs = require('fs')
  , manifest = require('../../src/manifest')
  , async = require('async')
  , webpack = require('webpack')
  , glob = require('glob')
  , util = require('util')
  , utils = require('../utils')
  , ejs = require('ejs');

var CWD = process.cwd();

module.exports = function(program, addToReadyQue) {

  program
    .command('webpack <manifest>')
    .alias('pack')
    .description('Build and pack code into dist folder')
    .option('--output <path>', 'path to the pack file and base path for dist output', '___output.js')
    .option('--output-browser <dir>', 'Directory browser packed version saved to', 'browser')
    .option('--output-node <dir>', 'Directory nodejs packed version saved to', 'node')
    .option('--watch', 'watch the files')
    .option('--build', 'Build the packed dist version mode')
    .option('--script <path>', 'Path to dump standalone pack script')
    .option('--dump', 'Print out basic script with out loaders')
    .option('--template-dir <path>', 'path to the template files', path.join(__dirname, '..', 'templates'))
    .option('--template-file <name>', 'Name of webpack template', 'webpack-basic.ejs')
    .action(function (manifestGlob, options) {
      // setup a callback hook that lets this sub command register
      // the logic needed to execute when the parent process is ready.
      // We do this so the parent process can load all the config info
      // before execute ourself.
      addToReadyQue(function() {

        if(!options.script && !options.dump && !options.build && !options.watch) {
          console.error('\nPlease specify additional options:\n  --build, --watch, --dump, or --script');
          process.exit(1);
        }

        var ourManifest = new manifest();

        // make sure the paths are absolute and resolve from cwd
        options.output = path.join(path.dirname(options.output), 'dist');
        options.outputBrowser = path.resolve(options.output, options.outputBrowser);
        options.outputServer = path.resolve(options.output, options.outputServer);

        // set mode using the config flag
        options.mode = program.env;

        // make sure we do not generate production webpack
        // because its hard to grantee that both the node & browser
        // version were successfuly compiles
        if(options.watch && options.mode == 'production') {
          console.error('\nWarning watch in production mode is not supported, because');
          console.error('it\'s difficult to guarantee both environments (node & browser)');
          console.error('are in sync please use --build option instead!\n');
        }

        ourManifest.buildWebpackConfig(manifestGlob, options, function(err, config) {
          if (err) {
            console.error('Cannot build Webpack config because:', err.message);
            process.exit(1);
          }

          if(options.script) {
            // TODO: need to sync the logic with cmd-server because this is a working version of the code. We need to copy the logic for standalone version!
            options.script = path.resolve(CWD, options.script);
            options.templateDir = path.resolve(CWD, options.templateDir);
            options.templateFile = path.resolve(options.templateDir, options.templateFile);

            console.info('Target:', options.script);
            console.info('Using template:', options.templateFile);

            try {
              ourManifest._util = util;
              ourManifest._path = path;
              ourManifest._outputBrowser = utils.relativeToOutputFile(options.script, options.outputBrowser);
              ourManifest._outputServer = utils.relativeToOutputFile(options.script, options.outputServer);

              fs.writeFileSync(options.script, ejs.render(fs.readFileSync(options.templateFile).toString(), ourManifest), {
                encoding:'utf8',
                mode: 0755,
                flag: 'w'
              });
            } catch (err) {
              console.error('Cannot build script because:', err.message);
              process.exit(1);
            }
          }

          if(options.dump) {
            try {
              console.log(JSON.stringify(config, null, 2));
            } catch (err) {
              console.error('Cannot dump config because:', err.message);
              process.exit(1);
            }
          }

          // build a function that sync the two step build into a single step that
          // builds the manifest profile and map. This also handles duplicate errors
          var doneFn = utils.syncNodeAndBrowserBuilds(utils.buildManifestProfileAndMap(options));

          // map webpacks react & pellet externals to our CLI versions
          // so we can make sure we are running our version not
          // anything else and the packed code will share the same
          // nodejs require modules allowing the CLI server to share
          // information to the webpack code. i.e. route events can
          // be setup here then the webpack code can require pellet
          // can listen to the events.
          config.browserConfig.externals = {
            react: 'React'
          };

          config.nodeConfig.externals = {
            react: require.resolve('react')
          };

          config.browserConfig.resolve = Object.create(config.browserConfig.resolve);
          config.browserConfig.resolve.alias = {
            pellet: require.resolve('../../src/pellet')
          };

          config.nodeConfig.resolve = Object.create(config.nodeConfig.resolve);
          config.nodeConfig.resolve.alias = {
            pellet: require.resolve('../../src/pellet')
          };

          if(options.watch) {
            config.browserConfig.bail = false;
            config.nodeConfig.bail = false;

            // start watching both
            webpack(config.browserConfig).watch(100, doneFn(0));
            webpack(config.nodeConfig).watch(100, doneFn(1));
          } else if(options.build) {
            webpack(config.browserConfig).run(doneFn(0));
            webpack(config.nodeConfig).run(doneFn(1));
          }
        });
      });
    }).on('--help', function () {
      console.log(fs.readFileSync(path.join(__dirname, '..', 'help', 'webpack.txt')).toString());
    });
};



