const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const DUMMY_CHAT_ID = 'fake id'

window.chats = [];
window.chatsHash = {};
window.unreadChats = {};
window.chat = {};
window.chatUsers = {};

function openInBrowser (url) {
  electron.shell.openExternal(url);
}

function format (n) {
  return n > 9 ? "" + n: "0" + n;
}

function getUsernames (chat_) {
  return chat_.accounts.map((acc) => acc._params.username).join(', ')
}

function isCurrentChat (chat_) {
  if (window.currentChatId === DUMMY_CHAT_ID) {
    return  !chatsHash[chat_.id]
  } else {
    return chat_.id === window.currentChatId
  }
}

function setActive (el) {
  let currentActive = document.querySelector('.chat-list ul li.active');
  if (currentActive) currentActive.classList.remove('active')
  el.classList.add('active');
}

function scrollToChatBottom () {
  let msgContainer = document.querySelector('.chat .messages');
  msgContainer.scrollTop = msgContainer.scrollHeight
}

function markAsRead (id, li) {
  let chat_ = unreadChats[id]
  if (chat_) {
    chat_.thread_id = chat_.id
    ipcRenderer.send('markAsRead', chat_)

    delete unreadChats[id]
  }
  li.classList.remove('notification') // or whatever
}

function sendMessage (message, accounts, isNewChat) {
  ipcRenderer.send('message', { message, isNewChat, users: accounts.map((account) => account.id) })
}

function getChat (id) {
  window.currentChatId = id
  ipcRenderer.send('getChat', id)
}

function getChatList () {
  ipcRenderer.send('getChatList')
}

function addNotification (li, chat_) {
  const isNew = chatsHash && chatsHash[chat_.id] && chatsHash[chat_.id].items[0].id !== chat_.items[0].id
  if (isNew) unreadChats[chat_.id] = chat_

  if (unreadChats[chat_.id]) {
    if (chat_.id === window.chat.id) {
      markAsRead(chat_.id, li)
    } else {
      li.classList.add('notification')

      if (isNew) ipcRenderer.send('notify', `new message from ${getUsernames(chat_)}`);
    }
  }
}

function registerChatUser (chat_) {
  if (chat_.accounts.length === 1) {
    window.chatUsers[chat_.accounts[0].id] = chat_.id;
  }
}

function renderChatListItem (username, msgPreview, thumbnail) {
  var li = document.createElement('li');
  var imgSpan = document.createElement('div');
  var span = document.createElement('div');
  var img = document.createElement('img');
  span.className = 'username';
  span.innerHTML = `<b>${username}</b><br>${msgPreview}`;
  img.className = 'thumb';
  img.setAttribute('src', thumbnail);
  imgSpan.appendChild(img);
  li.appendChild(imgSpan);
  li.appendChild(span);

  return li;
}

function renderSearchResult (users) {
  var ul = document.querySelector('.chat-list ul');
  ul.innerHTML = "";
  users.forEach((user) => {
    var li = renderChatListItem(user._params.username, 'send a message', user._params.picture);
    li.onclick = () => {
      setActive(li)
      if (window.chatUsers[user.id]) {
        getChat(window.chatUsers[user.id])
      } else {
        window.currentChatId = DUMMY_CHAT_ID
        renderChat({items: [], accounts: [user]})
      }
    }
    ul.appendChild(li);
  })
}

function renderChatList (chatList) {
  var ul = document.querySelector('.chat-list ul');
  ul.innerHTML = "";
  chatList.forEach((chat_) => {
    var msgPreview = chat_.items[0]._params.text || 'IG Post'
    msgPreview = msgPreview.length > 30 ? `${msgPreview.substr(0, 30)} ...` : msgPreview 
    var usernames = getUsernames(chat_);
    usernames = usernames.length <= 20 ? usernames : (usernames.substr(0, 20) + ' ...')

    var li = renderChatListItem(usernames, msgPreview, chat_.accounts[0]._params.picture);

    registerChatUser(chat_)
    if (chat_.id === window.chat.id) setActive(li)
    // don't move this down!
    addNotification(li, chat_);
    chatsHash[chat_.id] = chat_

    li.onclick = () => {
      markAsRead(chat_.id, li);
      setActive(li);
      getChat(chat_.id);
    }
    ul.appendChild(li);
  })
}

function renderMessage (message, direction, time, isPost) {
  var div = document.createElement('div');
  var divContent = document.createElement('div');
  divContent.className = 'content';
  div.classList.add('message');
  div.classList.add(direction);

  if (isPost) {
    renderPost(divContent, message)
  } else {
    divContent.innerText = message
  }

  if (time) {
    var p = document.createElement('p');
    p.className = 'message-time'
    var msgDate = new Date(time);
    p.innerText = `${format(msgDate.getHours())}:${format(msgDate.getMinutes())}  ${format(msgDate.getMonth())}/${msgDate.getFullYear()}`
    divContent.appendChild(p);
  }
  div.appendChild(divContent);
  
  return div
}

function renderChatHeader (chat_) {
  let usernames = getUsernames(chat_);
  let chatTitleContainer = document.querySelector('.chat-title');
  let b = document.createElement('b');
  b.innerText = `${usernames}`
  chatTitleContainer.innerHTML = ''
  chatTitleContainer.appendChild(b)

  if (chat_.accounts.length === 1) {
    // open user profile in browser
    b.onclick = () => openInBrowser(`https://instagram.com/${usernames}`)
  }
}

function renderChat (chat_) {
  window.chat = chat_;

  var msgContainer = document.querySelector('.chat .messages');
  msgContainer.innerHTML = '';
  renderChatHeader(chat_);
  chat_.items.slice().reverse().forEach((message) => {
    var loggedInuserId = message._session._cookiesStore.storage.idx['i.instagram.com']['/'].ds_user_id.value;

    if (message.mediaShare) {
      var renderableMessage = message.mediaShare._params
    } else {
      var renderableMessage = message._params.text ? message._params.text : '<private post>';
    }

    var div = renderMessage(
      renderableMessage,
      message._params.accountId == loggedInuserId ? 'outward' : 'inward',
      message._params.created, message.mediaShare
    );

    msgContainer.appendChild(div);
  })
  scrollToChatBottom();

  document.querySelector('.new-message form').onsubmit = (e) => {
    e.preventDefault();
    var input = document.querySelector('.new-message form input');
    var message = input.value;
    if (message.trim()) {
      sendMessage(message, chat_.accounts, !chat_.id)
      input.value = '';
      var div = renderMessage(message, 'outward');
      var msgContainer = document.querySelector('.chat .messages');

      msgContainer.appendChild(div);
      scrollToChatBottom();
    }
  }
  document.querySelector('.new-message form input').focus();
}

function renderPost (container, post) {
  var p = document.createElement('p');
  var a = document.createElement('a');

  a.innerText = 'view post';
  a.onclick = () => openInBrowser(post.webLink)
  if (post.caption) {
    p.className = 'post-caption'
    p.innerText = post.caption.length > 30 ? `${post.caption.substr(0, 30)} ...` : post.caption;
  }

  if (post.images) {
    var img = document.createElement('img');
    img.setAttribute('src', post.images[0].url);
    img.onload = () => scrollToChatBottom();
    container.appendChild(img);
  }

  container.appendChild(p);
  container.appendChild(a);
  container.classList.add('ig-post');
}

// This code runs once the DOM is loaded (just in case you missed it).
document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.on('chatList', (evt, chats_) => {
    if (!window.chats.length || window.chats[0].items[0].id !== chats_[0].items[0].id) {
      window.chats = chats_
      renderChatList(window.chats)
    }
  });

  ipcRenderer.on('chat', (evt, chat_) => {
    let isNewMessage = !chat.items || !chat.items.length || !chat_.items.length || chat.items[0].id != chat_.items[0].id
    if (isNewMessage && isCurrentChat(chat_)) {
      renderChat(chat_)      
    }
  });

  ipcRenderer.on('searchResult', (evt, users) => {
    renderSearchResult(users);
  })

  document.querySelector('button.open-emoji').onclick = () => {
    document.querySelector('.emojis').classList.toggle('hide');
    window.showEmojis(
      document.querySelector('.emojis-header'),
      document.querySelector('.emojis-body'),
      (emoji) => {
        document.querySelector('.new-message form input').value += emoji
        document.querySelector('.emojis').classList.add('hide');
        document.querySelector('.new-message form input').focus();
      }
    )
  }

  let searchForm = document.querySelector('.chat-list input[name=search]');
  searchForm.onkeyup = (e) => {
    const value = searchForm.value;
    const trimmedValue = value.trim() 

    if (trimmedValue.length > 3) {
      ipcRenderer.send('searchUsers', searchForm.value)      
    } else if (trimmedValue.length === 0) {
      renderChatList(window.chats)
    }
  }

  document.querySelector('.logout').onclick = () => ipcRenderer.send('logout')
  document.querySelector('.new-message form').onsubmit = (e) => e.preventDefault()

  getChatList()
})