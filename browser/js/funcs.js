function openInBrowser (url) {
  electron.shell.openExternal(url);
}

function copyToCliboard (text) {
  electron.clipboard.writeText(text);
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

function getChatTitle(chat_) {
  return chat_._params.threadTitle;
}

function getChatThumbnail (chat_) {
  return chat_.accounts[0]._params.picture;
}

function isCurrentChat (chat_) {
  if (window.currentChatId === DUMMY_CHAT_ID) {
    return !window.chatListHash[chat_.id];
  } else {
    return chat_.id === window.currentChatId;
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
  if (message._params.accountId == window.loggedInUserId) return 'outward';
  else return 'inward';
}

function scrollToChatBottom () {
  let msgContainer = document.querySelector(CHAT_WINDOW_SELECTOR);
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

function conditionedScrollToBottom () {
  if (!window.gettingOlderMessages) {
    return scrollToChatBottom
  }
}

function loadOlderMsgsOnScrollTop(chatId) {
  let msgContainer = document.querySelector(CHAT_WINDOW_SELECTOR);
  msgContainer.onscroll = (e) => {
    if (e.target.scrollTop < 200 && !window.gettingOlderMessages && window.currentChatId == chatId) {
      ipcRenderer.send('getOlderMessages', chatId);
      window.gettingOlderMessages = true;
      window.olderMessagesChatId = window.currentChatId;
    }
  }
}

function canRenderOlderMessages(chatId) {
  chatId = chatId || window.olderMessagesChatId;
  return chatId === window.currentChatId;
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

function resetMessageTextArea(){
  var input = document.querySelector(MSG_INPUT_SELECTOR);
  input.value = '';

  var event = document.createEvent('Event');
  event.initEvent('input', true, true);
  input.dispatchEvent(event);
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
    resetMessageTextArea();
    var div = renderMessage(message, 'outward');
    var msgContainer = document.querySelector('.chat .messages');

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
  }
}

function sendAttachment(filePath, chat_) {
  // @todo: pass this as argument instead
  window.notifiedChatId = chat_.id
  notify('Your file is being uploaded', true)

  var recipients = chat_.accounts.map((account) => account.id)
  ipcRenderer.send('upload', { filePath, recipients, isNewChat: !chat_.id, chatId: chat_.id })
}

function addAttachmentSender(chat_) {
  document.querySelector('.send-attachment').onclick = () => {
    const fileInput = document.querySelector('.file-input');
    fileInput.click();
    fileInput.onchange = () => {
      sendAttachment(fileInput.files[0].path, chat_);
      fileInput.value = '';
    }
  }
}

function addNotification (el, chat_) {
  if (chat_.items[0]._params.accountId == window.loggedInUserId) {
    return
  }

  const isNew = (
    ( window.chatListHash[chat_.id] &&
      window.chatListHash[chat_.id].items[0].id !== chat_.items[0].id) ||
    ( chat_._params.lastSeenAt &&
      chat_._params.lastSeenAt[window.loggedInUserId] &&
      chat_.items[0].id != chat_._params.lastSeenAt[window.loggedInUserId].item_id
    ));
  if (isNew) unreadChats[chat_.id] = chat_;

  if (unreadChats[chat_.id]) {
    if (chat_.id === window.chat.id && document.hasFocus()) {
      markAsRead(chat_.id, el);
    } else {
      el.classList.add('notification');
      // @todo pass this as an argument instead
      window.notifiedChatId = el.getAttribute("id");
      if (isNew && window.shouldNotify && !window.isWindowFocused) {
        notify(`new message from ${getChatTitle(chat_)}`);
      }
    }
  }
}

function notify(message, noBadgeCountIncrease) {
  if (!noBadgeCountIncrease) {
    ipcRenderer.send('increase-badge-count');
  }
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

function getLoadingGif () {
  const loadingGIF = dom(
    `<div class="center">
      <img src="img/loading.gif" width="50px" />
    </div>`);

  return loadingGIF;
}

function downloadFile(urlOfFile) {
  var element = document.createElement('a');
  element.setAttribute('href', urlOfFile);
  element.setAttribute('download', true);
  element.style.display = 'none';

  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function getHTMLElement(media) {
  var mediaContent;
  if (media.videos) {
    mediaContent = `<video width="${media.videos[0].width}" controls>
      <source src="${media.videos[0].url}" type="video/mp4">
    </video>`;
  } else {
    mediaContent = `<img src="${media.images[0].url}">`;
  }
  return mediaContent;
}
