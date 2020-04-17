function getLoggedInUser () {
  ipcRenderer.send('getLoggedInUser');
}

function getChat (id) {
  if (window.currentChatId !== id) {
    window.olderMessages = [];
  }
  window.currentChatId = id;
  ipcRenderer.send('getChat', id);
}

function confirmDeleteChat (id, li) {
  ipcRenderer.send('confirmDeleteChat', id);
}

function getChatList () {
  ipcRenderer.send('getChatList');
}

function getUnfollowers () {
  renderUnfollowers('loading');
  ipcRenderer.send('getUnfollowers');
}

function unfollow (userId) {
  ipcRenderer.send('unfollow', userId);
}

function getDisplayPictureUrl (userId) {
  ipcRenderer.send('getDisplayPictureUrl', userId);
}

function closeModalViewer () {
  document.querySelector('.viewer').classList.remove('active');
  document.querySelectorAll('.viewer .content')[0].innerHTML = '';
}

function updateDates () {
  let elements = document.querySelectorAll('time[data-time]');
  if (!elements) return;
  Array.prototype.forEach.call(elements, function (entry) {
    let igTime = entry.dataset.time;
    if (!igTime) return;
    entry.textContent = getMsgTimeSince(igTime);
  });
}

//Disable Drag and Drop on Electrum
document.addEventListener('dragover', function (event) {
  event.preventDefault();
  return false;
}, false);

document.addEventListener('drop', function (event) {
  event.preventDefault();
  return false;
}, false);

// This code runs once the DOM is loaded (just in case you missed it).
document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.on('loggedInUser', (evt, user) => {
    window.loggedInUserId = user.pk;
    window.loggedInUser = user;
    setProfilePic();
  });

  ipcRenderer.on('chatList', (evt, chats_) => {
    const lengthMismatch = window.chats.length !== chats_.length;
    if (!window.chats.length || lengthMismatch || window.chats[0].items[0].item_id !== chats_[0].items[0].item_id) {
      window.chats = chats_;
      renderChatList(window.chats);
    }
    updateDates();
  });

  ipcRenderer.on('deletedChat', (evt, chatId) => {
    animateChatDelete(chatId).then((delChatId) => {
      removeChatFromChats(delChatId);
      getChatList();
    });
  });

  ipcRenderer.on('chat', (evt, chat_) => {
    if (!chat_) return;
    let isNewMessage = (
      !window.chat.items || !window.chat.items.length ||
      !chat_.items.length || window.chat.items[0].item_id != chat_.items[0].item_id ||
      window.chat.items.length != chat_.items.length ||
      getIsSeenText(chat_) != getIsSeenText(window.chat) ||
      chat_.items[0].item_id != chat_.last_seen_at[window.loggedInUserId].item_id
    );
    let chatWithNewMessage = isNewMessage && isCurrentChat(chat_);
    if (chatWithNewMessage) {
      // reassign currentChatId, for cases of new chats/dummy chats.
      window.currentChatId = chat_.thread_id;
    }
    if (chatWithNewMessage && !window.gettingOlderMessages) {
      renderChat(chat_);
    }
  });

  ipcRenderer.on('olderMessages', (_, { chatId, messages }) => {
    const previous = window.olderMessages[chatId] || [];
    window.olderMessages[chatId] = previous.concat(messages);
    if (canRenderOlderMessages(chatId)) {
      renderOlderMessages(messages);
    }
    // reset the value only after all is done. So don't move this up
    window.gettingOlderMessages = false;
  });

  ipcRenderer.on('searchResult', (evt, users) => {
    renderSearchResult(users);
  });

  ipcRenderer.on('unfollowers', (evt, users) => {
    renderUnfollowers(users);
  });

  ipcRenderer.on('upload-error', (_, {chatId, type}) => {
    window.notifiedChatId = chatId;
    notify(`Failed to upload ${type} file. :( Please ensure your ${type} is in ${getValidFileType(type)} format.`, true);
  });

  ipcRenderer.on('getDisplayPictureUrl', (evt, displayPicture) => {
    renderDisplayPicture(displayPicture);
  });

  ipcRenderer.on('messageSent', (evt, messageToDequeue) => {
    dequeueFromSending(messageToDequeue);
  });

  document.querySelector('button.open-emoji').onclick = () => {
    const onEmojiSelected = (emoji) => {
      document.querySelector(MSG_INPUT_SELECTOR).value += emoji;
      document.querySelector('.emojis').classList.add('hide');
      document.querySelector(MSG_INPUT_SELECTOR).focus();
    };
    window.showEmojis(
      document.querySelector('.emojis-header'),
      document.querySelector('.emojis-body'),
      onEmojiSelected
    );
  };

  let searchForm = document.querySelector('.header input[name=search]');
  searchForm.onkeyup = (e) => {
    const value = searchForm.value;
    const trimmedValue = value.trim();

    if (trimmedValue.length > 3) {
      ipcRenderer.send('searchUsers', searchForm.value);
    } else if (trimmedValue.length === 0) {
      renderChatList(window.chats);
    }
  };

  document.querySelector('#unfollowers').onclick = () => getUnfollowers();
  document.querySelector('#logout').onclick = () => ipcRenderer.send('logout');

  document.querySelector('#seen-flagger').onclick = (e) => {
    window.shouldSendSeenFlags = !window.shouldSendSeenFlags;
    e.target.innerText = window.shouldSendSeenFlags
      ? 'Send "SEEN" receipts - currently Enabled'
      : 'Send "SEEN" receipts - currently Disabled';
  };

  document.querySelector('#notifier-settings').onclick = (e) => {
    window.shouldNotify = !window.shouldNotify;
    e.target.innerText = window.shouldNotify
      ? 'Disable Notifications'
      : 'Enable Notifications';
  };

  // close modal viewer when esc is pressed
  document.onkeyup = (e) => {
    if (e.keyCode == 27) { // ESC keycode
      closeModalViewer();
    }
  };

  window.onblur = () => {
    window.isWindowFocused = false;
  };

  window.onfocus = () => {
    window.isWindowFocused = true;
  };

  let textBoxHeight;
  function OnInput () {
    const maxHeight = window.innerHeight - 180 ; // Removing headers height
    const occupiedHeight = ((this.scrollHeight-30)/(maxHeight))*100;
    this.style.height = 'auto';
    if (occupiedHeight < 80) {
      textBoxHeight = (this.scrollHeight - 30) + 'px';
      this.style.overflow = 'hidden';
    } else {
      this.style.overflow = 'visible';
    }
    this.style.height =  textBoxHeight;
  }

  const tx = document.getElementById('messageText');
  const scrHeight = tx.scrollHeight - 6;
  tx.setAttribute('style', 'height:' + (scrHeight).toString() + 'px;overflow-y:hidden;');
  tx.addEventListener('input', OnInput, false);

  getLoggedInUser();
  getChatList();
});
