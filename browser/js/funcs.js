function openInBrowser (url) {
  electron.shell.openExternal(url);
}

function format (number) {
  return number > 9 ? "" + number: "0" + number;
}

function formatTime (time) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let date = new Date(time);
  let hours = format(date.getHours());
  let minutes = format(date.getMinutes());
  let day = format(date.getDate());
  let month = MONTHS[date.getMonth()];
  return `${hours}:${minutes} - ${month} ${day}`
}

function truncate (text, length) {
  return text.length > length ? `${text.substr(0, length)} ...` : text;
}

function dom(content) {
  var template = document.createElement('template');
  template.innerHTML = content;
  return template.content.firstChild;
}

function getUsernames (chat_, shouldTruncate) {
  var usernames = chat_.accounts.map((acc) => acc._params.username).join(', ');
  return usernames;
}

function isCurrentChat (chat_) {
  if (window.currentChatId === DUMMY_CHAT_ID) {
    return  !chatsHash[chat_.id];
  } else {
    return chat_.id === window.currentChatId;
  }
}

function setActive (el) {
  let currentActive = document.querySelector('.chat-list ul li.active');
  if (currentActive) currentActive.classList.remove('active');
  el.classList.add('active');

  // close opened emoji pane
  document.querySelector('.emojis').classList.add('hide');
}

function scrollToChatBottom () {
  let msgContainer = document.querySelector('.chat .messages');
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

function getMsgPreview (chat_) {
  var msgPreview = chat_.items[0]._params.text || 'Media message';
  return truncate(msgPreview, 25);
}

function isActive (chat_) {
  return chat_.id === window.chat.id;
}

function markAsRead (id, li) {
  let chat_ = unreadChats[id];
  if (chat_) {
    chat_.thread_id = chat_.id;
    if (window.shouldSendSeenFlags) {
      ipcRenderer.send('markAsRead', chat_);      
    }

    delete unreadChats[id];
  }
  li.classList.remove('notification');
}

function sendMessage (message, accounts, chatId) {
  const isNewChat = !chatId;
  var users = accounts.map((account) => account.id);
  ipcRenderer.send('message', { message, isNewChat, users, chatId });
}

function submitMessage (chat_) {
  var input = document.querySelector(MSG_INPUT_SELECTOR);
  var message = input.value;
  if (message.trim()) {
    sendMessage(message, chat_.accounts, chat_.id);
    input.value = '';
    var div = renderMessage(message, 'outward');
    var msgContainer = document.querySelector('.chat .messages');

    msgContainer.appendChild(div);
    scrollToChatBottom();
  }
}

function addSubmitHandler (chat_) {
  const input = document.querySelector(MSG_INPUT_SELECTOR);
  input.onkeyup = (evt) => {
    // allow new line when shift key is pressed
    if (evt.keyCode == 13 && !evt.shiftKey) {
      evt.preventDefault();
      submitMessage(chat_);
    }
  }
}

function sendAttachment(filePath, chat_) {
  var recipients = chat_.accounts.map((account) => account.id)
  ipcRenderer.send('upload', { filePath, recipients, isNewChat: !chat_.id })
}

function addAttachmentSender(chat_) {
  document.querySelector('.send-attachment').onclick = () => {
    const fileInput = document.querySelector('.file-input');
    fileInput.click();
    fileInput.onchange = () => {
      sendAttachment(fileInput.files[0].path, chat_);
    }
  }
}

function addNotification (el, chat_) {
  if (chat_.items[0]._params.accountId == window.loggedInUserId) {
    return
  }

  const isNew = (chatsHash && chatsHash[chat_.id] &&
    chatsHash[chat_.id].items[0].id !== chat_.items[0].id
  );
  if (isNew) unreadChats[chat_.id] = chat_;

  if (unreadChats[chat_.id]) {
    if (chat_.id === window.chat.id && document.hasFocus()) {
      markAsRead(chat_.id, el);
    } else {
      el.classList.add('notification');
      window.notifiedChatId = el.getAttribute("id");
      if (isNew && window.shouldNotify) {
        notify(`new message from ${getUsernames(chat_)}`);
      }
    }
  }
}

function notify (message) {
  ipcRenderer.send('increase-badge-count');
  const notification = new Notification('IG:dm Desktop', {
    body: message
  });

  notification.onclick = () => {
    document.querySelector(`#${window.notifiedChatId}`).click();
  }
}

function registerChatUser (chat_) {
  if (chat_.accounts.length === 1) {
    window.chatUsers[chat_.accounts[0].id] = chat_.id;
  }
}

function getIsSeenText (chat_) {
  var text = '';
  if (!chat_.items || !chat_.items.length || chat_.items[0]._params.accountId != window.loggedInUserId) {
    return '';
  }

  var seenBy = chat_.accounts.filter((account) => {
    return (
      chat_._params.itemsSeenAt[account.id] &&
      chat_._params.itemsSeenAt[account.id].itemId === chat_.items[0].id
    )
  })

  if (seenBy.length === chat_.accounts.length) {
    text = 'seen'
  } else if (seenBy.length) {
    text = `👁 ${getUsernames({accounts: seenBy})}`
  }
  return text;
}

function showInViewer (dom) {
  const viewer = document.querySelector('.viewer');
  const viewerContent = viewer.querySelector('.content');
  viewer.classList.add('active');

  viewerContent.innerHTML = '';
  viewerContent.appendChild(dom);
}

function quoteText (text) {
  var input = document.querySelector(MSG_INPUT_SELECTOR);
  input.value = `${text}\n==================\n${input.value}`
  input.focus();
}

function setProfilePic () {
  const url = window.loggedInUser._params.profilePicUrl;
  const settingsButton = document.querySelector('.settings');
  settingsButton.style.backgroundImage = `url(${url})`;
}
