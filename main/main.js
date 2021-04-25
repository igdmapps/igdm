const electron = require('electron');
const { app, Menu, BrowserWindow, dialog } = electron;
const createMenuTemplate = require('./menutemplate');
const path = require('path');
const url = require('url');
const instagram = require('./instagram');
const autoUpdater = require('./autoupdater');
const client = require('electron-connect').client;
const {autoUpdatePreference} = require('./userpreferences');

// fixes electron's timeout inconsistency
// not doing this on windows because the fix doesn't work for windows.
if (process.platform != 'win32') {
  require('./timeout-shim').fix();
}

const RATE_LIMIT_DELAY = 60000;
let pollingInterval = 10000;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let authenticatedUser;

function createWindow () {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: `${__dirname}/../browser/img/icon.png`,
      minWidth: 500,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      }
    });
  }
  mainWindow.setTitle('IGdm - Instagram Desktop Messenger');

  instagram.hasActiveSession().then((result) => {
    const view = result.isLoggedIn ? '../browser/index.html' : '../browser/login.html';
    authenticatedUser = result.userInfo || authenticatedUser;

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, view),
      protocol: 'file:',
      slashes: true
    }));
  });
  // If we're in development mode then create an Electron Connect client for live reload.
  if (process.defaultApp) { 
    client.create(mainWindow);
  }
  mainWindow.on('closed', () => mainWindow = null);
}

function createOtpWindow (type) {
  const otpWindow = new BrowserWindow({
    width: 300,
    height: 300,
    resizable: false,
    icon: `${__dirname}/../browser/img/icon.png`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  });
  otpWindow.setTitle('IGdm - Instagram verification code');
  otpWindow.loadURL(url.format({
    pathname: path.join(__dirname, `../browser/${type}.html`),
    protocol: 'file:',
    slashes: true
  }));
  return otpWindow;
}

let chatListTimeoutObj;

function getChatList () {
  instagram.getChatList().then((chats) => {
    if (chatListTimeoutObj) {
      clearTimeout(chatListTimeoutObj);
    }

    instagram.getPresence().then((presenceInfo) => {
      for (const chat in chats) {
        if (chats[chat].users.length === 1 && Object.prototype.hasOwnProperty.call(presenceInfo.user_presence, chats[chat].users[0].pk)) {
          chats[chat].presence = presenceInfo.user_presence[chats[chat].users[0].pk];
        }
      }

      mainWindow.webContents.send('chatList', chats);
    }).catch(() => mainWindow.webContents.send('chatList', chats));

    chatListTimeoutObj = setTimeout(getChatList, pollingInterval);
  }).catch(() => setTimeout(getChatList, RATE_LIMIT_DELAY));
}

let chatTimeoutObj;
let messagesThread;
function getChat (evt, id) {
  // used to get older messages, see #getOlderMessages
  if (messagesThread && messagesThread.thread_id != id) {
    messagesThread = null;
  }
  instagram.getChat(id).then((chat) => {
    mainWindow.webContents.send('chat', chat);
    if (chatTimeoutObj) {
      clearTimeout(chatTimeoutObj);
    }
    chatTimeoutObj = setTimeout(getChat, pollingInterval, {}, id);
  }).catch(() => setTimeout(getChat, RATE_LIMIT_DELAY, evt, id));
}

function openDialog (options, callbacks) {
  dialog.showMessageBox(mainWindow, options, (selectedOption) => {
    callbacks[selectedOption]();
  });
}

function confirmDeleteChat (_, id) {
  const buttons = {
    'Delete' : () => { deleteChat(id); },
    'Cancel' : () => {}
  };
  const options = {
    type: 'warning',
    buttons: Object.keys(buttons),
    defaultId: 2,
    title: 'Are you sure ?',
    message: 'Delete this conversation ?',
    detail: 'Deleting removes the conversation from your inbox, but no one else\'s inbox',
  };
  openDialog(options, Object.values(buttons));
}


function deleteChat (id) {
  clearTimeout(chatListTimeoutObj);
  instagram.deleteChat(id).then(()=> {
    mainWindow.webContents.send('deletedChat', id);
  }).catch(() => {
    getChatList();
  });
}

function handleCheckpoint () {
  return new Promise((resolve, reject) => {
    instagram.startCheckpoint()
      .then((challenge) => {
        const cpWindow = createOtpWindow('checkpoint');
        electron.ipcMain.on('otpCode', (evt, data) => {
          electron.ipcMain.removeAllListeners('otpCode');
          cpWindow.close();
          challenge.sendSecurityCode(data.code).then(resolve).catch(reject);
        });
      }).catch(reject);
  });
}

function handleTwoFactor (error) {
  return new Promise((resolve, reject) => {
    const tfWindow = createOtpWindow('twofactor');
    const {username, totp_two_factor_on, two_factor_identifier} = error.response.body.two_factor_info;
    const verificationMethod = totp_two_factor_on ? '0' : '1';
    const trustThisDevice = '1';
    electron.ipcMain.on('otpCode', (evt, data) =>{
      electron.ipcMain.removeAllListeners('otpCode');
      tfWindow.close();
      instagram.twoFactorLogin(
        username,
        data.code,
        two_factor_identifier,
        trustThisDevice,
        verificationMethod
      ).then(resolve).catch(reject);
    });
  });
}

function displayError (error) {
  const msg = `${error.message}\n${error.stack}`;
  electron.dialog.showErrorBox('IGdm Pro - Error', msg);
}

// fixes this issue https://github.com/electron/electron/issues/10864
app.setAppUserModelId('com.ifedapoolarewaju.desktop.igdm');

app.on('ready', () => {
  createWindow();
  // only set the menu template when in production mode/
  // this also leaves the dev console enabled when in dev mode.
  const baseMenu = (process.defaultApp ? Menu.getApplicationMenu().items : null);
  createMenuTemplate(baseMenu).then((template) => {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  });
  if (autoUpdatePreference.autoUpdateStatus) {
    autoUpdater.init();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // only call createWindow after mainWindow is set to null at
  // mainWindow.on('closed')
  if (mainWindow === null) createWindow();
});

// reduce polling frequency when app is not active.
app.on('browser-window-blur', () => {
  pollingInterval = 30000;
});

app.on('browser-window-focus', () => {
  pollingInterval = 10000;
  app.setBadgeCount(0);
});

electron.ipcMain.on('login', (evt, data) => {
  if (data.username === '' || data.password === '') {
    return mainWindow.webContents.send('loginError', 'Please enter all required fields');
  }
  const login = () => {
    instagram.login(data.username, data.password).then((userInfo) => {
      authenticatedUser = userInfo;
      createWindow();
    }).catch((error) => {
      if (instagram.isCheckpointError(error)) {
        handleCheckpoint(error)
          .then(() => login(true))
          .catch(() => mainWindow.webContents.send('loginError', getErrorMsg(error)));
      } else if (instagram.isTwoFactorError(error)) {
        handleTwoFactor(error)
          .then((userInfo) => {
            authenticatedUser = userInfo;
            createWindow();
          })
          .catch((tferror) => mainWindow.webContents.send('loginError', getErrorMsg(tferror)));
      } else {
        mainWindow.webContents.send('loginError', getErrorMsg(error));
      }
    });
  };

  const getErrorMsg = (error) => {
    return error.text || error.message || 'An unknown error occurred.';
  };

  login();
});

electron.ipcMain.on('logout', () => {
  instagram.logout();
  authenticatedUser = null;
  createWindow();
});

electron.ipcMain.on('getLoggedInUser', () => {
  mainWindow.webContents.send('loggedInUser', authenticatedUser);
});

electron.ipcMain.on('getChatList', getChatList);

electron.ipcMain.on('getChat', getChat);

electron.ipcMain.on('confirmDeleteChat', confirmDeleteChat);

electron.ipcMain.on('getOlderMessages', (_, id) => {
  instagram.getOlderMessages(messagesThread, id)
    .then((data) => {
      messagesThread = data.thread;
      mainWindow.webContents.send('olderMessages', {chatId: id, messages: data.messages});
    }).catch(displayError);
});

function messageSent (chatId, trackerKey) {
  mainWindow.webContents.send('messageSent', {chatId, trackerKey});
}

electron.ipcMain.on('message', (_, data) => {
  const messageTracker = data.trackerKey;
  if (data.isNewChat) {
    instagram.sendNewChatMessage(data.message, data.users).then((chat) => {
      getChat(null, chat.thread_id);
      getChatList();
      messageSent(chat.thread_id, messageTracker);
    }).catch(displayError);
  } else {
    instagram.sendMessage(data.message, data.chatId).then(() => {
      getChat(null, data.chatId);
      getChatList();
      messageSent(data.chatId, messageTracker);
    }).catch(displayError);
  }
});

electron.ipcMain.on('upload', (_, data) => {
  const sendTo = data.isNewChat ? data.recipients : data.chatId;
  const { type } = data;
  instagram.uploadFile(data.filePath, type, sendTo)
    .then((chat) => getChat(null, chat.thread_id))
    .catch(() => mainWindow.webContents.send('upload-error', { chatId: data.chatId, type}));
});

electron.ipcMain.on('searchUsers', (_, search) => {
  instagram.searchUsers(search).then((users) => {
    mainWindow.webContents.send('searchResult', users.users);
  }).catch(displayError);
});

electron.ipcMain.on('markAsRead', (_, thread) => {
  instagram.seen(thread);
});

electron.ipcMain.on('increase-badge-count', () => {
  app.setBadgeCount(app.getBadgeCount() + 1);
});

electron.ipcMain.on('getUnfollowers', () => {
  instagram.getUnfollowers().then((users) => {
    mainWindow.webContents.send('unfollowers', users);
  }).catch(displayError);
});

electron.ipcMain.on('unfollow', (_, userId) => {
  instagram.unfollow(userId);
});

electron.ipcMain.on('getDisplayPictureUrl', (_, userId) => {
  instagram.getUser(userId).then((user) => {
    mainWindow.webContents.send('getDisplayPictureUrl', { userId: userId, url: user.profile_pic_url });
  }).catch(displayError);
});
