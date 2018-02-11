function getLoggedInUser () {
  ipcRenderer.send('getLoggedInUser');
}

function getChat (id) {
  window.currentChatId = id;
  ipcRenderer.send('getChat', id);
}

function getChatList () {
  ipcRenderer.send('getChatList');
}

function getUnfollowers () {
  ipcRenderer.send('getUnfollowers');
}

function unfollow (userId) {
  ipcRenderer.send('unfollow', userId);
}

// This code runs once the DOM is loaded (just in case you missed it).
document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.on('loggedInUser', (evt, user) => {
    window.loggedInUserId = user.id;
    window.loggedInUser = user;
    setProfilePic();
  });

  ipcRenderer.on('chatList', (evt, chats_) => {
    if (!window.chats.length || window.chats[0].items[0].id !== chats_[0].items[0].id) {
      window.chats = chats_
      renderChatList(window.chats)
    }
  });

  ipcRenderer.on('chat', (evt, chat_) => {
    let isNewMessage = (
      !window.chat.items || !window.chat.items.length ||
      !chat_.items.length || window.chat.items[0].id != chat_.items[0].id ||
      getIsSeenText(chat_) != getIsSeenText(window.chat)
    )

    if (isNewMessage && isCurrentChat(chat_)) renderChat(chat_);
  });

  ipcRenderer.on('searchResult', (evt, users) => {
    renderSearchResult(users);
  });

  ipcRenderer.on('unfollowers', (evt, users) => {
    renderUnfollowers(users);
  });

  document.querySelector('button.open-emoji').onclick = () => {
    const onEmojiSelected = (emoji) => {
      document.querySelector(MSG_INPUT_SELECTOR).value += emoji;
      document.querySelector('.emojis').classList.add('hide');
      document.querySelector(MSG_INPUT_SELECTOR).focus();
    }
    window.showEmojis(
      document.querySelector('.emojis-header'),
      document.querySelector('.emojis-body'),
      onEmojiSelected
    )
  }

  let searchForm = document.querySelector('.header input[name=search]');
  searchForm.onkeyup = (e) => {
    const value = searchForm.value;
    const trimmedValue = value.trim() 

    if (trimmedValue.length > 3) {
      ipcRenderer.send('searchUsers', searchForm.value)      
    } else if (trimmedValue.length === 0) {
      renderChatList(window.chats)
    }
  }

  document.querySelector('#unfollowers').onclick = () => getUnfollowers();
  document.querySelector('#logout').onclick = () => ipcRenderer.send('logout');

  document.querySelector('#seen-flagger').onclick = (e) => {
    window.shouldSendSeenFlags = !window.shouldSendSeenFlags;
    e.target.innerText = window.shouldSendSeenFlags
      ? `DON'T SEND "SEEN" RECEIPTS`
      : `SEND "SEEN" RECEIPTS`;
  }

  // close modal viewer when esc is pressed
  document.onkeyup = (e) => {
    if (e.keyCode == 27) { // ESC keycode
      document.querySelector('.viewer').classList.remove('active');
    }
  }

  window.onblur = () => {
    window.shouldNotify = true
  }

  window.onfocus = () => {
    window.shouldNotify = false
  }

  function OnInput() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight - 30) + 'px';
  }
  
  const tx = document.getElementById('messageText');
  const scrHeight = tx.scrollHeight - 6;
  tx.setAttribute('style', 'height:' + (scrHeight).toString() + 'px;overflow-y:hidden;');
  tx.addEventListener("input", OnInput, false);

  getLoggedInUser();
  getChatList();
});