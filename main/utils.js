const fs = require('fs');
const app = require('electron').app;
const path = require('path');

const buildAndGetStoragePath = () => {
  const storagePath = path.join(app.getPath('userData'), 'session-cookie');
  if (!fs.existsSync(storagePath)) {
    // make directory if it doesn't exist
    fs.mkdirSync(storagePath);
  }
  return storagePath;
};

const canUseFileStorage = () => {
  try {
    fs.accessSync(`${app.getPath('userData')}/`, fs.W_OK);
    return true;
  } catch (error) {
    return false;
  }
};

const guessUsername = () => {
  let username;
  if (canUseFileStorage()) {
    const files = fs.readdirSync(`${buildAndGetStoragePath()}`);
    if (files.length && files[0].endsWith('.json')) {
      username = files[0].slice(0, -5);
    }
  }
  return username;
};

const getStoredCookie = (filePath) => {
  let storage;
  let username;

  if (canUseFileStorage()) {
    if (!filePath && (username = guessUsername())) {
      filePath = `${username}.json`;
    }
    if (filePath) storage = fs.readFileSync(`${buildAndGetStoragePath()}/${filePath}`, 'utf8');
  } 
  return storage;
};

const clearCookieFiles = () => {
  // delete all session storage
  if (canUseFileStorage() && fs.existsSync(buildAndGetStoragePath())) {
    fs.readdirSync(`${buildAndGetStoragePath()}`).forEach((filename) => {
      fs.unlinkSync(`${buildAndGetStoragePath()}/${filename}`);
    });
  }
};


const storeCookies = (username, cookies) => {
  if (canUseFileStorage()) {
    const storagePath = buildAndGetStoragePath();
    const filePath = `${username}.json`;
    fs.writeFileSync(`${storagePath}/${filePath}`, JSON.stringify(cookies));
  }
};

module.exports = {
  canUseFileStorage, guessUsername,
  getStoredCookie, clearCookieFiles, storeCookies
};
