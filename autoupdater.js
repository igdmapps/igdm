
const {BrowserWindow} = require('electron');
const log = require('electron-log');
const url = require('url');
const {autoUpdater} = require("electron-updater");
let window;

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

exports.init = () => {
  autoUpdater.on('update-available', (ev, info) => {
    window = new BrowserWindow({
      width: 800,
      height: 400,
      icon: `${__dirname}/browser/img/icon.png`,
      maxWidth: 800,
      maxHeight: 400
    })

    window.setTitle('IG:dm software update')
    window.loadURL(url.format({
      pathname: path.join(__dirname, 'browser/autoupdate.html'),
      protocol: 'file:',
      slashes: true
    }))

    window.on('closed', () => window = null)
  })

  autoUpdater.on('error', (ev, err) => {
    log.info(err);
    window.webContents.send('error', 'Update failed');
  })

  autoUpdater.on('download-progress', (ev, data) => {
    log.info(data);
    window.webContents.send('download-progress', data);
  })

  autoUpdater.on('update-downloaded', (ev, info) => autoUpdater.quitAndInstall());
  autoUpdater.checkForUpdates();
}
