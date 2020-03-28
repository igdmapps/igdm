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
let session;

function createWindow () {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: `${__dirname}/../browser/img/icon.png`,
      minWidth: 500,
      minHeight: 400
    });
  }
  mainWindow.setTitle('IG:dm - Instagram Desktop Messenger');

  instagram.checkAuth(session).then((result) => {
    const view = result.isLoggedIn ? '../browser/index.html' : '../browser/login.html';
    session = result.session || session;

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
  });
  otpWindow.setTitle('IG:dm - Instagram verification code');
  otpWindow.loadURL(url.format({
    pathname: path.join(__dirname, `../browser/${type}.html`),
    protocol: 'file:',
    slashes: true
  }));
  return otpWindow;
}

let chatListTimeoutObj;
function getChatList () {
  if (!session) {
    return;
  }
  instagram.getChatList(session).then((chats) => {
    mainWindow.webContents.send('chatList', chats);

    if (chatListTimeoutObj) {
      clearTimeout(chatListTimeoutObj);
    }
    chatListTimeoutObj = setTimeout(getChatList, pollingInterval);
  }).catch(() => setTimeout(getChatList, RATE_LIMIT_DELAY));
}

let chatTimeoutObj;
let messagesThread;
function getChat (evt, id) {
  if (!session) {
    return;
  }
  // used to get older messages, see #getOlderMessages
  if (messagesThread && messagesThread.threadId != id) {
    messagesThread = null;
  }

  instagram.getChat(session, id).then((chat) => {
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
  instagram.deleteChat(session, id).then(()=> {
    mainWindow.webContents.send('deletedChat', id);
  }).catch(() => {
    getChatList();
  });
}

function handleCheckpoint (checkpointError) {
  return new Promise((resolve, reject) => {
    instagram.startCheckpoint(checkpointError)
      .then((challenge) => {
        const cpWindow = createOtpWindow('checkpoint');
        electron.ipcMain.on('otpCode', (evt, data) => {
          electron.ipcMain.removeAllListeners('otpCode');
          cpWindow.close();
          challenge.code(data.code).then(resolve).catch(reject);
        });
      }).catch(reject);
  });
}

function handleTwoFactor (error) {
  return new Promise((resolve, reject) => {
    const tfWindow = createOtpWindow('twofactor');
    const username = error.json.two_factor_info.username;
    const twoFactorIdentifier = error.json.two_factor_info.two_factor_identifier;
    const trustThisDevice = '1';
    const verificationMethod = '1';
    electron.ipcMain.on('otpCode', (evt, data) =>{
      electron.ipcMain.removeAllListeners('otpCode');
      tfWindow.close();
      instagram.twoFactorLogin(
        username,
        data.code,
        twoFactorIdentifier,
        trustThisDevice,
        verificationMethod
      ).then(resolve).catch(reject);
    });
  });
}

// fixes this issue https://github.com/electron/electron/issues/10864
app.setAppUserModelId('com.ifedapoolarewaju.desktop.igdm');

app.on('ready', () => {
  createWindow();
  // only set the menu template when in production mode/
  // this also leaves the dev console enabled when in dev mode.
  if (!process.defaultApp) {
    createMenuTemplate().then((template) => {
      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    });
  }
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
  const login = (keepLastSession) => {
    instagram.login(data.username, data.password, keepLastSession).then((session_) => {
      session = session_;
      createWindow();
    }).catch((error) => {
      if (instagram.isCheckpointError(error)) {
        handleCheckpoint(error)
          .then(() => login(true))
          .catch(() => mainWindow.webContents.send('loginError', getErrorMsg(error)));
      } else if (instagram.isTwoFactorError(error)) {
        handleTwoFactor(error)
          .then(() => login(true))
          .catch((tferror) => mainWindow.webContents.send('loginError', getErrorMsg(tferror)));
      } else {
        mainWindow.webContents.send('loginError', getErrorMsg(error));
      }
    });
  };

  const getErrorMsg = (error) => {
    let message = 'An unknown error occurred.';
    if (error.message) {
      message = error.message;
    }
    return message;
  };

  login();
});

electron.ipcMain.on('logout', () => {
  instagram.logout();
  session = null;
  createWindow();
});

electron.ipcMain.on('getLoggedInUser', () => {
  instagram.getLoggedInUser(session).then((user) => {
    mainWindow.webContents.send('loggedInUser', user);
  });
});

electron.ipcMain.on('getChatList', getChatList);

electron.ipcMain.on('getChat', getChat);

electron.ipcMain.on('confirmDeleteChat', confirmDeleteChat);

electron.ipcMain.on('getOlderMessages', (_, id) => {
  instagram.getOlderMessages(session, messagesThread, id)
    .then((data) => {
      messagesThread = data.thread;
      mainWindow.webContents.send('olderMessages', {chatId: id, messages: data.messages});
    });
});

function messageSent (chatId, trackerKey) {
  mainWindow.webContents.send('messageSent', {chatId, trackerKey});
}

electron.ipcMain.on('message', (_, data) => {
  const messageTracker = data.trackerKey;
  if (data.isNewChat) {
    instagram.sendNewChatMessage(session, data.message, data.users).then((chat) => {
      messageSent(chat[0].id, messageTracker);
      getChat(null, chat[0].id);
      getChatList();
    });
  } else {
    instagram.sendMessage(session, data.message, data.chatId).then(() => {
      messageSent(data.chatId, messageTracker);
      getChat(null, data.chatId);
      getChatList();
    });
  }
});

electron.ipcMain.on('upload', (_, data) => {
  instagram.uploadFile(session, data.filePath, data.recipients)
    .then((chat) => getChat(null, chat.threads.thread_id))
    .catch(() => mainWindow.webContents.send('upload-error', data.chatId));
});

electron.ipcMain.on('searchUsers', (_, search) => {
  instagram.searchUsers(session, search).then((users) => {
    mainWindow.webContents.send('searchResult', users);
  });
});

electron.ipcMain.on('markAsRead', (_, thread) => {
  instagram.seen(session, thread);
});

electron.ipcMain.on('increase-badge-count', () => {
  app.setBadgeCount(app.getBadgeCount() + 1);
});

electron.ipcMain.on('getUnfollowers', () => {
  instagram.getUnfollowers(session).then((users) => {
    mainWindow.webContents.send('unfollowers', users);
  });
});

electron.ipcMain.on('unfollow', (_, userId) => {
  instagram.unfollow(session, userId);
});

electron.ipcMain.on('getDisplayPictureUrl', (_, userId) => {
  instagram.getUser(session, userId).then((user) => {
    mainWindow.webContents.send('getDisplayPictureUrl', { userId: userId, url: user._params.profilePicUrl });
  });
});
