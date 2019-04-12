const fs = require('fs');
const Client = require('instagram-private-api').V1;
const app = require('electron').app;
const path = require('path');
const config = require('electron-json-config');

const buildAndGetStoragePath = () => {
  const storagePath = path.join(app.getPath('userData'), 'session-cookie')
  if (!fs.existsSync(storagePath)) {
    // make directory if it doesn't exist
    fs.mkdirSync(storagePath)
  }
  return storagePath
}

const canUseFileStorage = () => {
  try {
    fs.accessSync(`${app.getPath('userData')}/`, fs.W_OK);
    return true
  } catch (error) {
    return false
  }
}

const guessUsername = () => {
  let username;
  if (canUseFileStorage()) {
    const files = fs.readdirSync(`${buildAndGetStoragePath()}`);
    if (files.length && files[0].endsWith('.json')) {
      username = files[0].slice(0, -5);
    }
  }
  return username;
}

const getCookieStorage = (filePath) => {
  let storage;
  let username;

  if (canUseFileStorage()) {
    if (!filePath && (username = guessUsername())) {
      filePath = `${username}.json`
    }

    if (filePath) storage = new Client.CookieFileStorage(`${buildAndGetStoragePath()}/${filePath}`);
  } else {
    storage = new Client.CookieMemoryStorage();
  }

  return storage;
}

const clearCookieFiles = () => {
  // delete all session storage
  if (canUseFileStorage() && fs.existsSync(buildAndGetStoragePath())) {
    fs.readdirSync(`${buildAndGetStoragePath()}`).forEach((filename) => {
      fs.unlinkSync(`${buildAndGetStoragePath()}/${filename}`);
    })
  }
}

const getDevice = (username) => {
  let device;
  username = username || guessUsername();
  if (username) device = new Client.Device(username);
  return device;
}

//on windows it is recommended to use ICO icons to get best visual effects
let trayImage = 'image_name'; //TODO
if (process.platform != 'win32') {
  trayImage = 'image_name'; //TODO
}

const setTrayImageLight = () => {
  config.set('trayImageTheme', 'light');
}

const setTrayImageDark = () => {
  config.set('trayImageTheme', 'dark');
}

const getTrayImagePath = () => {
  let trayImageTheme = config.get('trayImageTheme');
  if (trayImageTheme === 'light') {
    return path.join(__dirname, 'path_to_image' + 'l_' + trayImage); //TODO
  }
  return path.join(__dirname, 'path_to_image' + trayImage); //TODO
}

module.exports = {
  canUseFileStorage, guessUsername,
  getCookieStorage, clearCookieFiles, getDevice,
  setTrayImageLight, setTrayImageDark, getTrayImagePath
}
