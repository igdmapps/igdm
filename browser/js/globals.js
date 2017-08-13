const electron = require('electron');
const { Menu, MenuItem } = electron.remote
const ipcRenderer = electron.ipcRenderer;
const DUMMY_CHAT_ID = 'fake id';
const URL_REGEX = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, 'i');

window.chats = [];
window.chatsHash = {};
window.unreadChats = {};
window.chat = {};
window.chatUsers = {};
window.currentChatId = null;
window.notifiedChatId = null;
window.loggedInUserId = null;
window.shouldSendSeenFlags = true;
