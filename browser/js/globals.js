const electron = require('electron');
const { Menu, MenuItem } = electron.remote
const ipcRenderer = electron.ipcRenderer;
const DUMMY_CHAT_ID = 'fake id'

window.chats = [];
window.chatsHash = {};
window.unreadChats = {};
window.chat = {};
window.chatUsers = {};
window.currentChatId = null;
window.notifiedChatId = null;
window.loggedInUserId = null;
window.shouldSendSeenFlags = true;
