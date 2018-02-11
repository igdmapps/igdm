const electron = require('electron');
const { Menu, MenuItem } = electron.remote
const ipcRenderer = electron.ipcRenderer;
const DUMMY_CHAT_ID = 'fake id';
const MSG_INPUT_SELECTOR = '.new-message form textarea';
const URL_REGEX = new RegExp(/(http:\/\/|https:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, 'i');

window.chats = [];
window.chatsHash = {};
window.unreadChats = {};
window.chat = {};
window.chatUsers = {};
window.currentChatId = null;
window.notifiedChatId = null;
window.loggedInUserId = null;
window.loggedInUser = null;
window.shouldSendSeenFlags = true;
window.shouldNotify = false;
