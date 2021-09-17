'use strict';

const glob = require("glob");
const colors = require('colors');
const fs = require('fs');
const path = require('path');
const resolve = require('path').resolve
const {Liquid} = require('liquidjs');
const {isText, isBinary, getEncoding} = require('istextorbinary')

let config = require('rc')('ahoy', JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json"))));

const LE = new Liquid();
const IGNORE_PATTERNS = []


class Skeleton {

  /**
   * @param {string} basePath - path to the skeleton
   * @param {Object} context - an object of variables to render the skeleton
   * @constructs
   */
  constructor(basepath, context) {
    this.basepath = basepath;
    this.context = context;
  }

  /**
   * Scan skeleton template for project files and returns an array of files/folder paths
   *
   * @param {string} pattern - the file path pattern to search for skeleton files/folders
   * @param {Array.string} [ignoreFilesPatterns] - an array of file path patterns to ignore
   * @param {string} data - data to be encrypted
   *
   * @returns {Array.string} array of file/folder paths
   * @private
   */
  _scan(pattern, ignoreFilesPatterns=[]) {
    return glob.sync(pattern, {
      ignore: [...config.ignore, ...ignoreFilesPatterns],
      cwd: resolve(this.basepath)
    });
  }

  /**
   * A wrapper method around the liquidjs template rendering engine
   *
   * @param {string} content - template string to be rendered
   *
   * @returns {string} rendered template string
   * @private
   */
  async _renderSync(content) {
    let rendered = '';
    await LE.parseAndRender(content, this.context).then(resp => rendered = resp);
    return rendered;
  }

  /**
   * Renders files from the skeleton into the destination project folder
   *
   * @param {Array.string} [ignoreFilesPatterns] - an array of file path patterns to ignore
   * @param {boolean} [force] - determines whether to force overwriting a file
   *
   * @private
   */
  async _renderFilesSync(ignoreFilesPatterns=[], force=false) {
    let items = this._scan(path.join(this.basepath, "/**/*"), ignoreFilesPatterns);
    let targetDir = await this._renderSync(path.join(process.cwd(), '{{ skeleton_name }}'));
    let destDir = '';
    // Creates top level project folder if one does not exist
    if (fs.existsSync(targetDir) == false) {
      fs.mkdirSync(targetDir);
    }
    for (let item of items) {
      destDir = path.join(targetDir, item.split(resolve(this.basepath) + "/")[1])
      destDir = await this._renderSync(destDir);
      // Is the skeleton path a folder and has the generated folder path been created
      if (fs.statSync(item).isDirectory() && fs.existsSync(destDir) == false) {
        fs.mkdirSync(destDir);
      }
      // Remove file (not a folder) if forced overwrite flag was passed
      // In the event the user tries to regenerate over an existing project, it won't overwrite
      if (fs.statSync(item).isDirectory() == false && fs.existsSync(destDir) && force == true) {
        fs.unlinkSync(destDir);
      }
      // Skeleton path (not a folder) is a binary file, copy the binary file to the destination
      if (fs.statSync(item).isDirectory() == false &&
           isBinary(item, fs.readFileSync(item)) && fs.existsSync(destDir) == false) {
        fs.copyFileSync(item, destDir);
      }
      // Skeleton path (not a folder) is a text file, render file contents and write to the destination
      if (fs.statSync(item).isDirectory() == false &&
           isText(item, fs.readFileSync(item)) && fs.existsSync(destDir) == false) {
        let fileContents = fs.readFileSync(item);
        let fileContentsRendered = await this._renderSync(fileContents.toString());
        fs.writeFileSync(destDir, fileContentsRendered);
      }
    }
  }

  /**
   * Copies files from the skeleton into the destination project folder
   *
   * @param {Array.string} [copyFilePatterns] - an array of file path patterns to copy
   * @param {Array.string} [ignoreFilesPatterns] - an array of file path patterns to ignore
   * @param {boolean} [force] - determines whether to force overwriting a file
   *
   * @private
   */
  async _copyFilesSync(copyFilePatterns, ignoreFilesPatterns=[], force=false) {
    let items = [];
    let tempItems = [];
    // Loop through each file pattern as there is no way to combine file patterns
    for (let filePath of copyFilePatterns) {
      tempItems.push(this._scan(path.join(this.basepath, filePath), ignoreFilesPatterns));
    }
    // Merge file paths and remove dups
    items = new Set(items.concat(...tempItems));
    let targetDir = await this._renderSync(path.join(process.cwd(), '{{ skeleton_base }}'));
    let destDir = '';
    // Creates top level project folder if one does not exist
    if (fs.existsSync(targetDir) == false) {
      fs.mkdirSync(targetDir);
    }
    for (let item of items) {
      destDir = path.join(targetDir, item.split(resolve(this.basepath) + "/")[1])
      destDir = await this._renderSync(destDir);
      // Is the skeleton path a folder and has the generated folder path been created
      if (fs.statSync(item).isDirectory() && fs.existsSync(destDir) == false) {
        fs.mkdirSync(destDir);
      }
      // Remove file (not a folder) if forced overwrite flag was passed
      // In the event the user tries to regenerate over an existing project, it won't overwrite
      if (fs.statSync(item).isDirectory() == false && fs.existsSync(destDir) && force == true) {
        fs.unlinkSync(destDir);
      }
      // Copy file from the skeleton to the destiration project folder
      if (fs.statSync(item).isDirectory() == false && fs.existsSync(destDir) == false) {
        fs.copyFileSync(item, destDir);
      }
    }
  }

  /**
   * Generates a new skeleton
   *
   * @param {Array.string} [copyFilePatterns] - an array of file path patterns to copy
   * @param {Array.string} [ignoreFilesPatterns] - an array of file path patterns to ignore
   * @param {boolean} [force] - determines whether to force overwriting a file
   */
  async generateSync(copyFilePatterns, ignoreFilesPatterns, force=false) {
    await this._renderFilesSync([...copyFilePatterns, ...ignoreFilesPatterns], force);
    if (copyFilePatterns.length > 0) {
      await this._copyFilesSync(copyFilePatterns, ignoreFilesPatterns, force);
    }
  }

  /**
   * Logs which paths will be rendered, copied or ignored
   *
   * Useful when building a skeleton from scratch and need to file patterns or working correctly
   *
   * @param {Array.string} [copyFilePatterns] - an array of file path patterns to copy
   * @param {Array.string} [ignoreFilesPatterns] - an array of file path patterns to ignore
   * @param {boolean} [force] - determines whether to force overwriting a file
   */
  filePaths(copyFilePatterns, ignoreFilesPatterns, force=false) {
    let items = this._scan(path.join(this.basepath, "/**/*"), [...copyFilePatterns, ...ignoreFilesPatterns]);
    console.log("\nRender Paths:")
    console.log(colors.green([...items].join("\n")))
    items = [];
    let tempItems = [];
    // Loop through each file pattern as there is no way to combine file patterns
    for (let filePath of copyFilePatterns) {
      tempItems.push(this._scan(path.join(this.basepath, filePath), ignoreFilesPatterns));
    }
    // Merge file paths and remove dups
    items = new Set(items.concat(...tempItems));
    console.log("\nCopy Paths:")
    console.log(colors.green([...items].join("\n")))

    items = [];
    tempItems = [];
    // Loop through each file pattern as there is no way to combine file patterns
    for (let filePath of ignoreFilesPatterns) {
      tempItems.push(this._scan(path.join(this.basepath, filePath)));
    }
    // Merge file paths and remove dups
    items = new Set(items.concat(...tempItems));
    console.log("\nIgnore Paths:")
    console.log(colors.green([...items].join("\n")))
  }
}

module.exports = Skeleton;