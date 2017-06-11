const electron = require('electron');
const { Menu, MenuItem } = electron.remote
const ipcRenderer = electron.ipcRenderer;
const DUMMY_CHAT_ID = 'fake id';
const urlRegex = new RegExp(/(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/, 'i');

window.chats = [];
window.chatsHash = {};
window.unreadChats = {};
window.chat = {};
window.chatUsers = {};
window.currentChatId = null;
window.notifiedChatId = null;
window.loggedInUserId = null;
window.shouldSendSeenFlags = true;
