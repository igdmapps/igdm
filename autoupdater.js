
const {BrowserWindow} = require('electron');
const url = require('url');
const path = require('path');
const {autoUpdater} = require("electron-updater");
let win;

exports.init = () => {
  autoUpdater.on('update-available', (ev, info) => {
    win = new BrowserWindow({
      width: 400,
      height: 200,
      icon: `${__dirname}/browser/img/icon.png`,
      maxWidth: 400,
      maxHeight: 200
    })

    win.setTitle('IG:dm software update')
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'browser/autoupdate.html'),
      protocol: 'file:',
      slashes: true
    }))

    win.on('closed', () => win = null)
  })

  autoUpdater.on('error', (ev, err) => {
    win.webContents.send('error', 'Update has failed! :(');
  })

  autoUpdater.on('download-progress', (ev, data) => {
    win.webContents.send('download-progress', data);
  })

  autoUpdater.on('update-downloaded', (ev, info) => autoUpdater.quitAndInstall());
  autoUpdater.checkForUpdates();
}
