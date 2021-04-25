
const {BrowserWindow} = require('electron');
const url = require('url');
const path = require('path');
const {autoUpdater} = require('electron-updater');
let win;

exports.init = () => {
  autoUpdater.on('update-available', () => {
    win = new BrowserWindow({
      width: 400,
      height: 200,
      icon: `${__dirname}/../browser/img/icon.png`,
      maxWidth: 400,
      maxHeight: 200,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      }
    });

    win.setTitle('IGdm software update');
    win.loadURL(url.format({
      pathname: path.join(__dirname, '../browser/autoupdate.html'),
      protocol: 'file:',
      slashes: true
    }));

    win.on('closed', () => win = null);
  });

  autoUpdater.on('error', () => {
    win.webContents.send('error', 'Update has failed! :(');
  });

  autoUpdater.on('download-progress', (_, data) => {
    win.webContents.send('download-progress', data);
  });

  autoUpdater.on('update-downloaded', () => autoUpdater.quitAndInstall());
  autoUpdater.checkForUpdates();
};
