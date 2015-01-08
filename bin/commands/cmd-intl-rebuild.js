/**
 * Compiles all JSON data into the polyfill and saves it as Intl.complete.js
 * this is a striped down version of the Intl.js/task/compile-data.js grunt file in Intl project.
 *
 * You can also use the tools to build the JSON files.
 */

var path = require('path')
  , fs = require('fs-extra')
  , manifest = require('../../src/manifest');

var LAUNCH_CWD = process.cwd();

function replacer($0, type, loc) {
    return (type === 'prims' ? 'a' : 'b') + loc;
}

module.exports = function(program, addToReadyQue) {
  var PELLET_PROJECT_PATH = (program.pelletConfig && program.pelletConfig._filepath && path.dirname(program.pelletConfig._filepath)) || LAUNCH_CWD;

  program
    .command('intl-rebuild')
    .description('Rebuild the intl server locale data')
    .option('--locale-data <path>', 'path to Intl locale-data', path.resolve(PELLET_PROJECT_PATH, (program.pelletConfig && program.pelletConfig.configDir) || '.', 'locale-data'))
    .action(function (options) {

      var
          locData  = {},
          objStrs  = {},
          objs     = [],
          prims    = [],

          valCount = 0,
          objCount = 0,

          fileData = '',
          defaultData,
          locales  = fs.readdirSync(path.join(options.localeData, 'json'));

      fileData += '(function(addLocaleData){\n';

      locales.forEach(function (file) {
          var c = fs.readFileSync(path.join(options.localeData, 'json', file)),
              k = file.slice(0, file.indexOf('.'));
          if (k === 'en') {
              defaultData = c;
          }
          locData[k] = JSON.parse(c, reviver);
      });
      function reviver (k, v) {
          var idx;

          if (k === 'locale')
              return v;

          else if (typeof v === 'string') {
              idx = prims.indexOf(v);
              valCount++;

              if (idx === -1)
                  idx += prims.push(v);

              return '###prims['+ idx +']###';
          }

          else if (typeof v === 'object' && v !== null) {
              var str = JSON.stringify(v);
              objCount++;

              if (objStrs.hasOwnProperty(str))
                  return objStrs[str];

              else {
                  // We need to make sure this object is not added to the same
                  // array as an object it references (and we need to check
                  // this recursively)
                  var
                      depth,
                      objDepths = [ 0 ];

                  for (var key in v) {
                      if (typeof v[key] === 'string' && (depth = v[key].match(/^###objs\[(\d+)/)))
                          objDepths.push(+depth[1] + 1);
                  }

                  depth = Math.max.apply(Math, objDepths);

                  if (!Array.isArray(objs[depth]))
                      objs[depth] = [];

                  idx = objs[depth].push(v) - 1;
                  objStrs[str] = '###objs['+ depth +']['+ idx +']###';

                  return objStrs[str];
              }
          }

          else
              return v;
      }

      fileData += 'var a='+ JSON.stringify(prims) +',b=[];';
      objs.forEach(function (val, idx) {
          var ref = JSON.stringify(val).replace(/"###(objs|prims)(\[[^#]+)###"/g, replacer);

          fileData += 'b['+ idx +']='+ ref +';';
      });

      for (var k in locData) {
          fileData += 'addLocaleData('+ locData[k].replace(/###(objs|prims)(\[[^#]+)###/, replacer) +');\n';
      }

      fileData += '})(IntlPolyfill.__addLocaleData);';

      // writting the complete optimized bundle
      fs.writeFileSync(path.join(options.localeData, 'complete.js'), fileData);

      // writting the english ES6 format
      // TODO: decide if we want default data or not
      // grunt.file.write('src/en.js', 'export default ' + defaultData);

      console.log('Total number of reused strings is ' + prims.length + ' (reduced from ' + valCount + ')');
      console.log('Total number of reused objects is ' + Object.keys(objStrs).length + ' (reduced from ' + objCount + ')');
      process.exit();

    }).on('--help', function () {
      console.log(fs.readFileSync(path.join(__dirname, '..', 'help', 'webpack.txt')).toString());
    });
};

