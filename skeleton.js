#! /usr/bin/env node
'use strict';

const cmd = require('caporal');
const colors = require('colors');
const fs = require('fs');
const path = require('path');
const {readSync} = require("node-yaml");
const rm = require('rimraf').sync;

const Skeleton = require('./lib/skeleton.js');
const Question = require('./lib/question.js');
const FetchSkeleton = require('./lib/fetchskeleton.js');


let config = require('rc')('ahoy', {});

const VERSION = '1.0.0';


/**
 * Is the provided local valid
 * @param {string} skelPath - path to the skeleton
 */
function ValidatePath(skelPath) {
  if (fs.existsSync(skelPath) == false && fs.statSync(skelPath).isDirectory() == false) {
    throw Error("Invalid path")
  }
  return skelPath
}


/**
 * Project Generator
 * @param {string} skelPath - path to the skeleton
 * @param {boolean} force - determines whether to force overwriting a file
 * @param {boolean} verbose - a more informative output
 */
async function GenerateProject(skelPath, force=false, verbose=false) {
  let skelConfig;
  let skelConfigPath = path.join(path.resolve(skelPath), '.ahoy/skeleton');
  if (fs.existsSync(skelConfigPath + ".json") == true) {
    if (verbose === true)
      console.log(colors.cyan('CONFIG: '), "skeleton.json");
    try {
      skelConfig = JSON.parse(fs.readFileSync(skelConfigPath + ".json", 'utf8'));
    } catch (error) {
      console.log(colors.red('Error loading skeleton configuration file'));
      return;
    }
  } else if (fs.existsSync(skelConfigPath + ".yml") == true) {
    if (verbose === true)
      console.log(colors.cyan('CONFIG: '), "skeleton.yml");
    skelConfig = readSync(skelConfigPath + ".yml");
  } else {
    console.log(colors.red('Skeleton config not found'));
    return;
  }
  if (verbose === true)
    console.log(colors.cyan('\nQuestion Prompt:'));
  let question = new Question(skelConfig);
  let context = await question.questionPromptSync();
  let skeleton = new Skeleton(path.resolve(skelPath), context);
  await skeleton.generateSync(skelConfig.copy || [], skelConfig.ignore || [], force, verbose);
}


if (require.main === module) {
  cmd.version(VERSION);
  cmd.description(
    'Ahoy Matey!! Start projects faster using skeleton templates'
  );

  cmd.command('start')
     .description('Starts an empty skeleton template')
     .argument('[name]', 'Name of the skeleton template to use', /^[a-zA-Z0-9\-\_]+/)
     .option('-b, --blank', "Starts a blank project")
     .option('-s, --skeleton', "Starts a blank skeleton template")
     .option('-f, --force', "Overwrites existing files")
     .option('-v, --verbose', "Noisy console output")
     .option('-p, --path <path>', 'Path to skeleton template', ValidatePath)
     .action(async (args, opts, logger) => {
      // Searches via url or shorthand name. Eventually add the abillity to pull from package manager.
      if (typeof args.name !== 'undefined') {
        let repo = args.name;
        if (repo.startsWith('http'))
          repo = 'direct:' + repo
        let fetchSkeleton = new FetchSkeleton()
        let skelPath = await fetchSkeleton.download(repo, {}, opts.verbose)
        await GenerateProject(skelPath, opts.force, opts.verbose)
        rm(skelPath)
      } else if (typeof args.name === 'undefined' && (opts.blank == true || opts.skeleton == true)) {
        // Builds a blank project or a blank skeleton template when either flag is provided.
        console.log(colors.yellow('Implement'));
      } else if (typeof args.name === 'undefined' && typeof opts.path !== 'undefined') {
        // Search for a local skeleton template from the provided path.
        await GenerateProject(opts.path, opts.force, opts.verbose)
      } else {
        console.log(colors.red('\nSkeleton build failed\n'));
        return;
      }
      console.log(colors.green('\nSkeleton built successfully\n'));
  });

  cmd.command('search')
     .description('Searches for a skeleton template')
     .argument('<name>', 'Name of the skeleton template', /^[a-zA-Z0-9\-\_]+/)
     .action((args, options, logger) => {
      // Searches the package manager for the template.
  });

  cmd.command('register')
     .description('Registers a skeleton template')
     .action((args, options, logger) => {
      // Has the ability to register a new skeleton to be searchable.
      // Has the option to update an existing skeleton.
      // Has the option to remove an existing skeleton.
      // Uses the .ahoy/ meta files to find the name of the template.
      // Must contain a .ahoy/skeleton.json|yml file
  });

  cmd.parse(process.argv);
}
