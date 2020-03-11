const electron = require('electron');
const path = require('path');
const fs = require('fs');

function parseDataFile (filePath, defaults) {
  // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
  // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    // if there was some kind of error, return the passed in defaults instead.
    return defaults;
  }
}

const Store = function (storeProps) {
  const userDataPath = (electron.app || electron.remote.app).getPath('userData');
  this.path = path.join(userDataPath, storeProps.configName + '.json');
  this.data = parseDataFile(this.path, storeProps.defaults);
};

Store.prototype.get = function (key) {
  return this.data[key];
};

Store.prototype.set = function (key, value) {
  this.data[key] = value;
  fs.writeFileSync(this.path, JSON.stringify(this.data));
};

module.exports = Store;
