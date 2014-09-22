#!/usr/bin/env node

"use strict";

var program = require("commander")
  , os = require("os")
  , util = require("util")
  , path = require("path")
  , fs = require("fs")
  , nconf = require("nconf")
  , inquirer = require("inquirer")
  , ejs = require("ejs")
  , utils = require("./utils")
  , version = require("../package.json").version
  , i;

// monkey patch inquirer (nicer formatting)
for(i in inquirer.prompts) {
  inquirer.prompts[i].prototype.prefix = function (str) {
    return str;
  };
}

program
  .version(require('../package.json').version)
  .option('-c, --config <path>', 'environment config file (override common config)', process.env.NODE_ENV ? process.env.NODE_ENV : 'development')
  .option('--config-common <path>', 'path to common config file', 'common')
  .option('--config-dir <path>', 'path to config directory', process.env.PELLET_CONF_DIR ? path.resolve(process.cwd(), process.env.PELLET_CONF_DIR) : path.join(__dirname, 'config'))
  .option('--command-dir <path>', 'path to directory containing additional commands', false)
  .option('--env-whitelist <string>', 'environment variable white list separated by ','', false)
  .option('--scrub-logs <string>', 'RegExp used to scrub launchDetails and logs', false)
  .option('--silent', 'will disable all pellet launch logging', false)
  .option('--launch-details', 'will print launch and env details', false)

var readyQue = [];
function addToReadyQue(onReadyFn) {
  readyQue.push(onReadyFn)
}

// scan for command extensions and load them
function mapFilter(basePath) {
  return fs.readdirSync(basePath).map(function(file) {
    if(/^cmd-.+\.js$/.test(file)) return path.join(basePath, file);
    else return false;
  });
}

// load our commands and any additional commands passed into --commandDir
var allCommandFiles = program.commandDir ? mapFilter(program.commandDir) : [];
allCommandFiles = allCommandFiles.concat(mapFilter(path.join(__dirname, 'commands')));
for(i in allCommandFiles) {
  if(allCommandFiles[i]) {
    require(allCommandFiles[i])(program, addToReadyQue);
  }
}

program.parse(process.argv);

// load the common and environment configuration files before building the nconf
// version because we need have access to things like security, envWhiteList to build
// the nconf. This is why we do not use the built in nconf load config file (nconf.add({type:'file'})) but use
// the memory loader. The load order is arguments -> common config -> environment config
var commonConfigFile = path.resolve(program.configDir, program.configCommon)
  , configFile = path.resolve(program.configDir, program.config)
  , commonConfig = utils.readConfigFile(commonConfigFile)
  , config = utils.readConfigFile(configFile);

if(!commonConfig || !config) {
  console.error('Can not load common (', commonConfigFile, ') or environment (', configFile, ')');
  process.exit(1);
}

// the scrubLogs is a list of fields we do not want to
// console log in verbose mode i.e. username and passwords to database, etc.
program.scrubLogs = new RegExp(config.scrubLogs || commonConfig.scrubLogs ||
  program.scrubLogs || '\s(user|pass|aws_)\w*\s+.+$','igm');

// the envWhiteList is a list of environment variable
// we will load into the config link NODE_ENV
var envWhiteList = (config.envWhitelist || commonConfig.envWhitelist ||
  program.envWhitelist || 'NODE_ENV,PELLET_CONF_DIR').split(',');

// now build up the configuration starting with environment variable
// then override with the common config and environment config (i.e. dev vs prod)
nconf.env({separator: '__', whitelist:envWhiteList});
nconf.use('memory').merge(commonConfig);
nconf.use('memory').merge(config);

// overwrite configuration with argument passed in
for(i in program.options) {
  var opt = program.options[i].long;
  if(!opt || ['--version'].indexOf(opt) != -1) {
    continue;
  }

  opt = opt.substring(2);
  var val = program[opt];

  if(opt && val) {
    nconf.set(opt, val);
  }
}

// show help and exit (no commands qued)
if(readyQue.length == 0) {
  program.help();
}

// show off!
if(!nconf.get('silent')) {
  console.log('\x1B[32m');
  console.log('            _ _      _                ,;:;;,');
  console.log(' ____   ___| | | ___| |_             ;;;;;');
  console.log('|  _ \\ / _ \\ | |/ _ \\ __|    .=\',    ;:;;:,');
  console.log('| |_) |  __/ | |  __/ |_    /_\', \"=. \';:;:;');
  console.log('|  __/ \\___|_|_|\\___|\\__|   @=:__,  \\\\,;:;:\'');
  console.log('|_|   \x1b[33mReactJS favor buddy\x1B[32m     _(\\\\.=  ;:;;\'');
  console.log('                             \x1B[32m`\"_(  _/=\"`\x1B[0m')
  console.log('\x1B[0m');
  console.log('Version:', version);

  if (nconf.get('launchDetails')) {
    console.log('System:', process.platform, 'pid:', process.pid, 'uid:', process.getuid(), 'gid:', process.getgid(), JSON.stringify(process.versions, null, 2).replace(/\\s+[{},\]]+/g, '').replace(/[{\[":,]/g, ''));
    console.log('Configuration ' + configFile + ' - ' + commonConfigFile + ':', JSON.stringify(nconf.get(), null, 2)
      .replace(/\s+[{},\]]+/g, '')
      .replace(/[{\[":,]/g, '')
      .replace(program.scrubLogs, '$1 ################'));
  }
}

// now exec the commands qued
for(i in readyQue) {
  readyQue[i](nconf);
}
