const fs = require('fs');
const Client = require('instagram-private-api').V1;

const canUseFileStorage = () => {
  try {
    fs.accessSync(`${__dirname}/cookies/`, fs.W_OK);
    return true
  } catch (error) {
    return false
  }
}

const guessUsername = () => {
  let username;
  if (canUseFileStorage()) {
    const files = fs.readdirSync(`${__dirname}/cookies`);
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
      filePath = `${__dirname}/cookies/${username}.json`  
    }

    if (filePath) storage = new Client.CookieFileStorage(filePath);
  } else {
    storage = new Client.CookieMemoryStorage();
  }

  return storage;
}

const clearCookieFiles = () => {
  // delete all session storage
  if (canUseFileStorage()) {
    fs.readdirSync(`${__dirname}/cookies`).forEach((filename) => {
      fs.unlinkSync(`${__dirname}/cookies/${filename}`);
    })
  }
}

const getDevice = (username) => {
  let device;
  username = username || guessUsername();
  if (username) device = new Client.Device(username);
  return device;
}

module.exports = {
  canUseFileStorage, guessUsername,
  getCookieStorage, clearCookieFiles, getDevice
}
