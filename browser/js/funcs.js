function openInBrowser (url) {
  electron.shell.openExternal(url);
}

function format (number) {
  return number > 9 ? "" + number: "0" + number;
}

function formatTime (time) {
  var date = new Date(time);
  var hours = format(date.getHours());
  var minutes = format(date.getMinutes());
  var month = format(date.getMonth());
  var year = date.getFullYear();
  return `${hours}:${minutes}  ${month}/${year}`
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
  return shouldTruncate ? truncate(usernames, 20) : usernames;
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
  li.classList.remove('notification'); // or whatever
}

function sendMessage (message, accounts, isNewChat) {
  var users = accounts.map((account) => account.id);
  ipcRenderer.send('message', { message, isNewChat, users })
}

function submitMessage (e, chat_) {
  e.preventDefault();
  var input = document.querySelector('.new-message form input');
  var message = input.value;
  if (message.trim()) {
    sendMessage(message, chat_.accounts, !chat_.id);
    input.value = '';
    var div = renderMessage(message, 'outward');
    var msgContainer = document.querySelector('.chat .messages');

    msgContainer.appendChild(div);
    scrollToChatBottom();
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
      if (isNew) ipcRenderer.send('notify', `new message from ${getUsernames(chat_)}`);
    }
  }
}

function registerChatUser (chat_) {
  if (chat_.accounts.length === 1) {
    window.chatUsers[chat_.accounts[0].id] = chat_.id;
  }
}

function getIsSeenText (chat_) {
  var text = '';
  if (!chat_.items || !chat_.items.length || chat_.items[0]._params.accountId != window.loggedInuserId) {
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
  var input = document.querySelector('.new-message form input');
  input.value = `${text} ==================== ${input.value}`
  input.focus();
}
