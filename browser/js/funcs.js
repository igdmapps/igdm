function openInBrowser (url) {
  electron.shell.openExternal(url);
}

function copyToCliboard (text) {
  electron.clipboard.writeText(text);
}

function format (number) {
  return number > 9 ? '' + number: '0' + number;
}

function formatTime (unixTime) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let date = new Date(parseInt(unixTime.toString().slice(0, 13)));
  let hours = format(date.getHours());
  let minutes = format(date.getMinutes());
  let day = format(date.getDate());
  let month = MONTHS[date.getMonth()];
  return `${hours}:${minutes} - ${month} ${day}`;
}

function truncate (text, length) {
  return text.length > length ? `${text.substr(0, length)} ...` : text;
}

function dom (content) {
  let template = document.createElement('template');
  template.innerHTML = content;
  return template.content.firstChild;
}

function getUsernames (chat_, shouldTruncate) {
  let usernames = chat_.users.map((acc) => acc.username).join(', ');
  return usernames;
}

function getChatTitle (chat_) {
  return chat_.thread_title;
}

function isGroupChat (chat_) {
  if (chat_ && chat_.is_group) {
    return true;
  }
  return false;
}

function getChatThumbnail (chat_) {
  if (chat_.users[0] && !isGroupChat(chat_)) {
    return chat_.users[0].profile_pic_url;
  }
  return chat_.users.map((user) => {
    return user.profile_pic_url;
  });
}

function isCurrentChat (chat_) {
  if (window.currentChatId === DUMMY_CHAT_ID) {
    return !window.chatListHash[chat_.thread_id];
  } else {
    return chat_.thread_id === window.currentChatId;
  }
}

function setActive (el) {
  let currentActive = document.querySelector('.chat-list ul li.active');
  if (currentActive) {
    currentActive.classList.remove('active');
  }
  el.classList.add('active');

  // close opened emoji pane
  document.querySelector('.emojis').classList.add('hide');
}

function getMsgDirection (message) {
  if (message.user_id == window.loggedInUserId) return 'outward';
  else return 'inward';
}

function scrollToChatBottom () {
  let msgContainer = document.querySelector(CHAT_WINDOW_SELECTOR);
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

function conditionedScrollToBottom () {
  if (!window.gettingOlderMessages) {
    return scrollToChatBottom;
  }
}

function loadOlderMsgsOnScrollTop (chatId) {
  let msgContainer = document.querySelector(CHAT_WINDOW_SELECTOR);
  msgContainer.onscroll = (e) => {
    if (e.target.scrollTop < 200 && !window.gettingOlderMessages && window.currentChatId == chatId) {
      ipcRenderer.send('getOlderMessages', chatId);
      window.gettingOlderMessages = true;
      window.olderMessagesChatId = window.currentChatId;
    }
  };
}

function canRenderOlderMessages (chatId) {
  chatId = chatId || window.olderMessagesChatId;
  return chatId === window.currentChatId;
}

function getMsgPreview (chat_) {
  let msgPreview = chat_.items[0].text || 'Media message';
  return truncate(msgPreview, 25);
}

function isActive (chat_) {
  return chat_.thread_id === window.chat.thread_id;
}

function markAsRead (id, li) {
  let chat_ = unreadChats[id];
  if (chat_) {
    if (window.shouldSendSeenFlags) {
      ipcRenderer.send('markAsRead', chat_);      
    }
    delete unreadChats[id];
  }
  li.classList.remove('notification');
}

function resetMessageTextArea () {
  let input = document.querySelector(MSG_INPUT_SELECTOR);
  input.value = '';

  let event = document.createEvent('Event');
  event.initEvent('input', true, true);
  input.dispatchEvent(event);
}

function sendMessage (message, accounts, chatId, trackerKey) { 
  const isNewChat = !chatId;
  let users = accounts.map((account) => account.pk);
  ipcRenderer.send('message', { message, isNewChat, users, chatId, trackerKey });
}

function submitMessage (chat_) {
  let input = document.querySelector(MSG_INPUT_SELECTOR);
  let message = input.value;
  const sendingAt = new Date();
  const tackerKey = sendingAt.getTime();
  if (message.trim()) {
    sendMessage(message, chat_.users, chat_.thread_id, tackerKey);
    resetMessageTextArea();
    const sendingNow = createSendingMessage(message, 'text', tackerKey);
    queueInSending(chat_.thread_id, sendingNow);

    //Rendering current text
    let div = renderMessage(message, 'outward');
    let msgContainer = document.querySelector('.chat .messages');
    msgContainer.appendChild(div);
    scrollToChatBottom();
  }
}

function addSubmitHandler (chat_) {
  const input = document.querySelector(MSG_INPUT_SELECTOR);
  input.onkeypress = (evt) => {
    // allow new line when shift key is pressed
    if (evt.keyCode == 13 && !evt.shiftKey) {
      evt.preventDefault();
      submitMessage(chat_);
    }
  };
}

function removeSubmitHandler () {
  const input = document.querySelector(MSG_INPUT_SELECTOR);
  input.onkeypress = () => {};
}

function sendAttachment (filePath, chat_) {
  // @todo: pass this as argument instead
  window.notifiedChatId = chat_.thread_id;
  notify('Your file is being uploaded', true);

  let recipients = chat_.users.map((user) => user.pk);
  ipcRenderer.send('upload', { filePath, recipients, isNewChat: !chat_.thread_id, chatId: chat_.thread_id });
}

function addAttachmentSender (chat_) {
  document.querySelector('.send-attachment').onclick = () => {
    const fileInput = document.querySelector('.file-input');
    fileInput.click();
    fileInput.onchange = () => {
      sendAttachment(fileInput.files[0].path, chat_);
      fileInput.value = '';
    };
  };
}

function addNotification (el, chat_) {
  if (chat_.items[0].user_id == window.loggedInUserId) {
    return;
  }

  const isNew = (
    (window.chatListHash[chat_.thread_id] &&
      window.chatListHash[chat_.thread_id].items[0].item_id !== chat_.items[0].item_id) ||
    (chat_.last_seen_at &&
      chat_.last_seen_at[window.loggedInUserId] &&
      chat_.items[0].item_id != chat_.last_seen_at[window.loggedInUserId].item_id
    ));
  if (isNew) {
    unreadChats[chat_.thread_id] = chat_;
  }

  if (unreadChats[chat_.thread_id]) {
    if (chat_.thread_id === window.chat.thread_id && document.hasFocus()) {
      markAsRead(chat_.thread_id, el);
    } else {
      el.classList.add('notification');
      // @todo pass this as an argument instead
      window.notifiedChatId = el.getAttribute('id');
      if (isNew && window.shouldNotify && !window.isWindowFocused) {
        notify(`new message from ${getChatTitle(chat_)}`);
      }
    }
  }
}

function notify (message, noBadgeCountIncrease) {
  if (!noBadgeCountIncrease) {
    ipcRenderer.send('increase-badge-count');
  }
  const notification = new Notification('IG:dm Desktop', {
    body: message
  });

  notification.onclick = () => {
    document.querySelector(`#${window.notifiedChatId}`).click();
  };
}

function registerChatUser (chat_) {
  if (chat_.users.length === 1) {
    window.chatUsers[chat_.users[0].pk] = chat_.thread_id;
  }
}

function getIsSeenText (chat_) {
  let text = '';
  if (!chat_.items || !chat_.items.length || chat_.items[0].user_id != window.loggedInUserId) {
    return '';
  }

  let seenBy = chat_.users.filter((user) => {
    return (
      chat_.last_seen_at[user.pk] &&
      chat_.last_seen_at[user.pk].item_id === chat_.items[0].item_id
    );
  });

  if (seenBy.length === chat_.users.length) {
    text = 'seen';
  } else if (seenBy.length) {
    text = `👁 ${getUsernames({users: seenBy})}`;
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
  let input = document.querySelector(MSG_INPUT_SELECTOR);
  input.value = `${text}\n==================\n${input.value}`;
  input.focus();
}

function setProfilePic () {
  const url = window.loggedInUser.profile_pic_url;
  const settingsButton = document.querySelector('.settings');
  settingsButton.style.backgroundImage = `url(${url})`;
}

function getLoadingGif () {
  const loadingGIF = dom(
    `<div class="center">
      <img src="img/loading.gif" width="50px" />
    </div>`);

  return loadingGIF;
}

function downloadFile (urlOfFile) {
  let element = document.createElement('a');
  element.setAttribute('href', urlOfFile);
  element.setAttribute('download', true);
  element.style.display = 'none';

  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function getHTMLElement (media) {
  let mediaContent;
  if (media.video_versions) {
    mediaContent = `<video width="${media.video_versions[0].width}" controls>
      <source src="${media.video_versions[0].url}" type="video/mp4">
    </video>`;
  } else {
    mediaContent = `<img src="${media.image_versions2[0].url}">`;
  }
  return mediaContent;
}

function animateChatDelete (chatId) {
  return new Promise((resolve) => {
    const element = document.getElementById(`chatlist-${chatId}`);
    element.classList.add('delete-chat');
    setTimeout(() => {
      element.style.display = 'none';
      resolve(chatId);
    }, 600);
  });
}

function removeChatFromChats (chatId) {
  if (window.currentChatId === chatId || window.currentChatId === DUMMY_CHAT_ID) {
    resetChatScreen();
  }
  
  let chatUsers = Object.getOwnPropertyNames(window.chatUsers);
  chatUsers.forEach((userPk) => {
    if (window.chatUsers[userPk] === chatId) {
      delete window.chatUsers[userPk];
    }
  });

  delete window.chatListHash[chatId];

  window.chats = window.chats.filter((chat) => {
    if (chat.thread_id !== chatId) {
      return true;
    }
    return false;
  });

  window.chats = window.chats.filter((chat) => {
    if (chat.thread_id !== chatId) {
      return true;
    }
    return false;
  });
}

function resetChatScreen () {
  renderEmptyChat();
  removeSubmitHandler();
  window.currentChatId = null;
  window.chat = {};
}

function queueInSending (chatId, message) {
  if (!chatId) {
    chatId = 'new-chat';
  }
  if (!window.messageInQueue[chatId]) {
    window.messageInQueue[chatId] = [];
  }
  window.messageInQueue[chatId].push(message);
}

function dequeueFromSending (sentObj) {
  const { chatId, trackerKey } = sentObj;
  if (!window.messageInQueue[chatId]) {
    window.messageInQueue[chatId] = window.messageInQueue['new-chat'].slice();
    delete window.messageInQueue['new-chat'];
  }
  let queue = window.messageInQueue[chatId];
  queue = queue.filter((messageQueued) => messageQueued.trackerKey !== trackerKey);
  window.messageInQueue[chatId] = queue;
}

function createSendingMessage (message, type, trackerKey) {
  return { 
    text: message,
    item_type: type, 
    user_id: window.loggedInUserId, 
    timestamp: undefined,
    trackerKey
  };
}
