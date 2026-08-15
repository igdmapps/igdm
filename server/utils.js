const fs = require('fs');
const path = require('path');

const storagePath = path.join(__dirname, 'storage');
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

function getStoredCookie(filePath) {
  if (!filePath) {
    const files = fs.readdirSync(storagePath).filter((file) => file.endsWith('.json'));
    if (files.length) {
      filePath = files[0];
    }
  }
  if (!filePath) {
    return null;
  }
  return fs.readFileSync(path.join(storagePath, filePath), 'utf8');
}

function clearCookieFiles() {
  if (!fs.existsSync(storagePath)) {
    return;
  }
  fs.readdirSync(storagePath).forEach((filename) => {
    if (filename.endsWith('.json')) {
      fs.unlinkSync(path.join(storagePath, filename));
    }
  });
}

function storeCookies(username, cookies) {
  const filePath = path.join(storagePath, `${username}.json`);
  fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
}

module.exports = {
  getStoredCookie,
  clearCookieFiles,
  storeCookies,
};
