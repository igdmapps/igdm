const electron = require('electron')
const app = electron.app
const Menu = electron.Menu
const menuTemplate = require('./menutemplate')
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const igdm = require('./igdm')
let pollingInterval = 10000;
let shouldNotify = false;
const notifier = require('node-notifier')

// OSX needs custom notifier for custom notification icons
if (process.platform === 'darwin') {
  notifier.options.customPath = path.join(__dirname,
    'vendor/terminal-notifier.app/Contents/MacOS/terminal-notifier')
}

notifier.on('click', () => app.focus())

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let session

function createWindow () {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: `${__dirname}/browser/img/icon.png`,
      minWidth: 800,
      minHeight: 715
    })
  }
  mainWindow.setTitle('Desktop IG:dm')

  igdm.checkAuth().then((result) => {
    let view = result.isLoggedIn ? 'browser/index.html' : 'browser/login.html'
    session = result.session || session

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, view),
      protocol: 'file:',
      slashes: true
    }))
  })

  mainWindow.on('closed', () => mainWindow = null)
}

function getChatList () {
  igdm.getChatList(session).then((chats) => {
    mainWindow.webContents.send('chatList', chats)

    setTimeout(getChatList, pollingInterval);
  })
}

let timeoutObj;
function getChat (evt, id) {
  igdm.getChat(session, id).then((chat) => {
    mainWindow.webContents.send('chat', chat);

    if (timeoutObj) clearTimeout(timeoutObj)

    timeoutObj = setTimeout(getChat, pollingInterval, {}, id);
  })
}

app.on('ready', () => {
  createWindow()
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!mainWindow) createWindow()
})

// reduce polling frequency when app is not active.
app.on('browser-window-blur', () => {
  pollingInterval = 30000;
  shouldNotify = true;
})

app.on('browser-window-focus', () => {
  pollingInterval = 10000;
  shouldNotify = false;
})

electron.ipcMain.on('login', (evt, data) => {
  igdm.login(data.username, data.password).then((session_) => {
    session = session_
    createWindow()
  }).catch(() => createWindow())
})

electron.ipcMain.on('logout', (evt, data) => {
  igdm.logout()
  session = null
  createWindow()
})

electron.ipcMain.on('getChatList', getChatList)

electron.ipcMain.on('getChat', getChat)

electron.ipcMain.on('message', (evt, data) => {
  igdm.sendMessage(session, data.message, data.users).then((chat) => {
    if (data.isNewChat) getChat(null, chat[0].id)
  })
})

electron.ipcMain.on('searchUsers', (evt, search) => {
  igdm.searchUsers(session, search).then((users) => {
    mainWindow.webContents.send('searchResult', users);
  })
})

electron.ipcMain.on('markAsRead', (evt, thread) => {
  igdm.seen(session, thread)
})

electron.ipcMain.on('notify', (evt, message) => {
  // OSX uses the default terminal notifier icon
  let icon = process.platform !== 'darwin' ? path.join(__dirname, '/browser/img/icon.png') : undefined;
  if (shouldNotify) notifier.notify({ title: 'IG:dm Desktop', sound: true, message, icon });
})
