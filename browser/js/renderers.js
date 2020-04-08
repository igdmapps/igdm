function renderMessage (message, direction, time, type) {
  let renderers = {
    media_share: renderMessageAsPost,
    text: renderMessageAsText,
    like: renderMessageAsLike,
    media: renderMessageAsMedia,
    raven_media: renderMessageAsRavenImage,
    reel_share: renderMessageAsUserStory, // replying to a user's story
    link: renderMessageAsLink,
    animated_media: renderMessageAsAnimatedMedia,
    action_log: renderMessageAsActionLog,
    voice_media: renderMessageAsVoiceMedia,
    placeholder: renderPlaceholderAsText,
  };

  let div = dom(`<div class="message clearfix ${direction}"></div>`);
  let divContent = dom('<div class="content"></div>');

  if (direction === 'inward') {
    let user = window.chat.users.find((user) => {
      return user.pk == message.user_id;
    });
    let senderUsername = '';
    if (user) {
      senderUsername = user.username;
    } 
    divContent.appendChild(dom(`<p class="message-sender">${senderUsername}</p>`));
  }

  if (!type && typeof message === 'string') type = 'text';

  if (renderers[type]) renderers[type](divContent, message);
  else renderUnsupportedMessage(divContent, message, type, direction, time);

  divContent.appendChild(dom(
    `<p class="message-time">${time ? formatTime(time) : 'Sending...'}</p>`)
  );

  if (message) renderMessageReactions(divContent, message.reactions);
  div.appendChild(divContent);

  return div;
}

function renderMessageAsActionLog (container, message) {
  renderMessageAsText(container, message.action_log.description);
}

function renderMessageReactions (container, reactions) {
  if (!reactions) return;

  let div = dom('<div class="reactions-likes"><img src="img/love.png"></div>');
  reactions.likes.forEach((like) => {
    div.appendChild(dom(`<img data-user-id="${like.sender_id}">`));
    getDisplayPictureUrl(like.sender_id);
  });
  container.appendChild(div);
}

function renderDisplayPicture (displayPicture) {
  document.querySelectorAll(`img[data-user-id="${displayPicture.userId}"]`).forEach((img) => {
    img.src = displayPicture.url;
  });
}

function renderMessageAsPost (container, message) {
  let post = message.media_share;
  let img = '';
  if (post.image_versions2) {
    img = dom(`<img class="chat-image" src="${post.image_versions2.candidates[0].url}">`);
  } else if (post.carousel_media) {
    img = dom(`<img class="chat-image" src="${post.carousel_media[0].image_versions2.candidates[0].url}">`); 
  }
  img.onload = conditionedScrollToBottom();
  container.appendChild(img);

  if (post.caption) {
    container.appendChild(dom(`<p class="post-caption">${truncate(post.caption.text, 30)}</p>`));
  }
  container.classList.add('ig-media');
  container.onclick = () => renderPost(post);
}

function renderPost (post) {
  const postDom = dom('<div class="center"></div>');
  if (post.video_versions) {
    postDom.appendChild(dom(`<video width="${post.video_versions[0].width}" controls>
                                <source src="${post.video_versions[0].url}" type="video/mp4">
                              </video>`));
  } else if (post.carousel_media && post.carousel_media.length) {
    window.carouselInit(postDom, post.carousel_media);
  } else {
    postDom.appendChild(dom(`<img src="${post.image_versions2.candidates[0].url}"/>`));
  }
  if (post.caption) {
    postDom.appendChild(dom(`<p class="post-caption">${post.caption.text}</p>`));
  }
  const browserLink = dom('<button class="view-on-ig">View on Instagram</button>');
  browserLink.onclick = () => openInBrowser(post.webLink);
  postDom.appendChild(browserLink);
  showInViewer(postDom);
}

function renderMessageAsUserStory (container, message) {
  container.classList.add('ig-media');
  if (message.reel_share.media.image_versions2) {
    let url = message.reel_share.media.image_versions2.candidates[0].url;
    let img = dom(`<img class="chat-image" src="${url}">`);
    img.onload = conditionedScrollToBottom();
    container.appendChild(img);

    container.addEventListener('click', () => {
      if (message.reel_share.media.video_versions) {
        const videoUrl = message.reel_share.media.video_versions[0].url;
        showInViewer(dom(`<video controls src="${videoUrl}">`));
      } else {
        showInViewer(dom(`<img src="${url}">`));
      }
    });
  }

  if (message.reel_share.text) {
    container.appendChild(dom(`<p class="post-caption">${message.reel_share.text}</p>`));
  }
}

function renderMessageAsMedia (container, message) {
  let media = message.media;
  try {
    renderImageOrVideo(container, media);
  } catch (err) {
    renderUnsupportedMessage(container, message, 'media');
  }
}

function renderMessageAsRavenImage (container, message) {
  let media = message.visual_media.media;
  try {
    renderImageOrVideo(container, media);
  } catch (err) {
    renderUnsupportedMessage(container, message, 'raven_media');
  }
}

function renderImageOrVideo (container, media) {
  if (media && media.video_versions) {
    let bestMedia = media.video_versions.reduce((prev, curr) => (prev.height > curr.height) ? prev : curr);
    let url = bestMedia.url;
    let thumbUrl = media.image_versions2.candidates[0].url;
    let thumbImg = dom(`<div class="container-thumb-with-vid"><img class="chat-image" src="${thumbUrl}"></div>`);
    thumbImg.onload = conditionedScrollToBottom();
    container.appendChild(thumbImg);
    container.classList.add('ig-media');

    container.addEventListener('click', () => {
      showInViewer(dom(`<video controls autoplay src="${url}">`));
    });
    container.oncontextmenu = () => renderVideoContextMenu(thumbUrl, url);
  } else if (media && media.image_versions2) {
    let url = media.image_versions2.candidates[0].url;
    let img = dom(`<img class="chat-image" src="${url}">`);
    img.onload = conditionedScrollToBottom();
    container.appendChild(img);
    container.classList.add('ig-media');

    container.addEventListener('click', () => {
      showInViewer(dom(`<img src="${url}">`));
    });
    container.oncontextmenu = () => renderImageContextMenu(url);
  } else {
    throw 'not supported';
  }
}

function renderMessageAsLike (container) {
  let heart = dom('<img class="heart" src="img/heart.svg" >');
  heart.onload = conditionedScrollToBottom();
  container.appendChild(heart);
  container.classList.add('ig-media');
}

function renderMessageAsText (container, message, noContext) {
  let text = typeof message === 'string' ? message : message.text;
  container.appendChild(document.createTextNode(text));
  if (!noContext) container.oncontextmenu = () => renderContextMenu(text);
}

function linkUsernames (text) {
  return text.replace(/@([\w.]+)/g, '<a class="link-in-message" onclick="openInBrowser(\'https://instagram.com/$1\')">@$1</a>');
}

function renderPlaceholderAsText (container, message) {
  let html = '';
  if (!message.placeholder.is_linked) {
    html = message.placeholder.message;
  } else {
    html = linkUsernames(message.placeholder.message);
  }
  let placeholderDom = dom('<p>' + html + '</p>');
  placeholderDom.classList.add('placeholder');

  container.appendChild(placeholderDom);
}

function renderMessageAsLink (container, message) {
  const { link_context } = message.link;
  const text = message.link.text;
  container.innerHTML += text;
  if (link_context.link_image_url) {
    let img = dom(`<img src="${link_context.link_image_url}" />`);
    img.onload = conditionedScrollToBottom();
    container.appendChild(img);
  }
  // Check if this is a YouTube link.
  if (link_context.link_image_url && link_context.link_title && link_context.link_summary) {
    container.innerHTML += `<a class="link-in-message" src="${link_context.link_url}">${link_context.link_title}</a><p class="link-in-message-summary">${link_context.link_summary}</p>`;
  } else {
    // replace all contained links with anchor tags
    container.innerHTML += `<a class="link-in-message" src="${link_context.link_url}">${link_context.link_url}</a>`;
  }
  container.classList.add('ig-media');
  container.onclick = () => {
    // for links that don't have protocol included
    const url = /^(http|https):\/\//.test(link_context.link_url) ? link_context.link_url : `http://${link_context.link_url}`;
    openInBrowser(url);
  };
}

function renderMessageAsAnimatedMedia (container, message) {
  let { url } = message.animated_media.images.fixed_height;
  let img = dom(`<img src="${url}">`);
  img.onload = conditionedScrollToBottom();
  container.appendChild(img);
  container.classList.add('ig-media');

  container.addEventListener('click', () => {
    showInViewer(dom(`<img src="${url}">`));
  });
}

function renderUnsupportedMessage (container, message, type=null, direction=null, time=null) {
  renderMessageAsText(container, `<unsupported message format: ${type}>`, true);
}

function renderContextMenu (text) {
  const menu = new Menu();
  const menuItem = new MenuItem({
    label: 'Quote Message',
    click: () => quoteText(text)
  });
  menu.append(menuItem);
  menu.popup({});
}

function renderImageContextMenu (url) {
  const menu = new Menu();
  const copyImageUrl = new MenuItem({
    label: 'Copy URL to clipboard',
    click: () => copyToCliboard(url)
  });
  const saveItem = new MenuItem({
    label: 'Save image as...',
    click: () => downloadFile(url)
  });
  menu.append(copyImageUrl);
  menu.append(saveItem);
  menu.popup({});
}

function renderChatContextMenu (chatId, li) {
  const menu = new Menu();
  const deleteConversation = new MenuItem({
    label: 'Delete this conversation',
    click: () => confirmDeleteChat(chatId, li)
  });
  menu.append(deleteConversation);
  menu.popup({});
}

function createThumbnailDom (imageUrls) {
  if (typeof imageUrls === 'string') {
    return dom(`<div><img class="thumb" src="${imageUrls}"></div>`); 
  }
  let html = '<div>';
  imageUrls.forEach((imageUrl, index) => {
    if (index < 5) {
      html += `<img class="thumb ${ index === 0 ? '' : 'group'}" src="${imageUrl}"></img>`;
    }  
  });
  html += '</div>';
  return dom(html);
}

function renderVideoContextMenu (thumbUrl, videoUrl) {
  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'Copy thumbnail URL to clipboard',
    click: () => copyToCliboard(thumbUrl)
  }));
  menu.append(new MenuItem({
    label: 'Copy video URL to clipboard',
    click: () => copyToCliboard(videoUrl)
  }));
  menu.popup({});
}

function renderChatListItem (chatTitle, msgPreview, thumbnail, id, direction) {
  let li = document.createElement('li');
  li.classList.add('col-12', 'p-3');

  const msgPreviewClass = (direction == 'outward') ? 'outward' : 'inward';

  li.appendChild(createThumbnailDom(thumbnail));

  li.appendChild(dom(`<div class="username ml-3 d-none d-sm-inline-block"><b>${chatTitle}</b><br><span class="${msgPreviewClass}">${msgPreview}</span></div>`));
  if (id) li.setAttribute('id', `chatlist-${id}`);

  return li;
}

function renderSearchResult (users) {
  let ul = document.querySelector('.chat-list ul');
  ul.innerHTML = '';
  users.forEach((user) => {
    let li = renderChatListItem(user.username, 'Send a message', user.profile_pic_url);
    li.onclick = () => {
      setActive(li);
      if (window.chatUsers[user.pk]) {
        getChat(window.chatUsers[user.pk]);
      } else {
        window.currentChatId = DUMMY_CHAT_ID;
        renderChat({items: [], users: [user]});
      }
    };
    ul.appendChild(li);
  });
}

function renderChatList (chatList) {
  let ul = document.querySelector('.chat-list ul');
  ul.innerHTML = '';
  chatList.forEach((chat_) => {
    let msgPreview = getMsgPreview(chat_);
    let chatTitle = getChatTitle(chat_);
    const direction = getMsgDirection(chat_.items[0]);
    let thumbnail = getChatThumbnail(chat_);
    let li = renderChatListItem(chatTitle, msgPreview, thumbnail, chat_.thread_id, direction);

    registerChatUser(chat_);
    if (isActive(chat_)) setActive(li);
    // don't move this down!
    addNotification(li, chat_);
    window.chatListHash[chat_.thread_id] = chat_;

    li.onclick = () => {
      markAsRead(chat_.thread_id, li);
      setActive(li);
      // render the cached chat before fetching latest
      // to avoid visible latency
      if (window.chatCache[chat_.thread_id]) {
        renderChat(window.chatCache[chat_.thread_id]);
      } else {
        window.currentChatId = chat_.thread_id;
        renderChat(chat_, true);
      }
      getChat(chat_.thread_id);
    };
    li.oncontextmenu = () => renderChatContextMenu(chat_.thread_id, li);
    ul.appendChild(li);
  });
}

function renderChatHeader (chat_) {
  let chatTitle = (chat_.thread_id ? getChatTitle(chat_) : getUsernames(chat_)); // if chat_.thread_id is not defined, it is a new contact
  let b = dom(`<b class="ml-2 mt-2">${chatTitle}</b>`);
  const thumbnail = createThumbnailDom(getChatThumbnail(chat_));

  if (chat_.users.length === 1) {
    // open user profile in browser
    b.onclick = () =>
      openInBrowser(
        `https://instagram.com/${getUsernames(chat_)}`
      );
  }
  let chatTitleContainer = document.querySelector(CHAT_TITLE_SELECTOR);
  chatTitleContainer.innerHTML = '';
  chatTitleContainer.appendChild(thumbnail);
  chatTitleContainer.appendChild(b);
}

function renderChat (chat_) {
  window.chat = chat_;
  window.chatCache[chat_.thread_id] = chat_;

  let msgContainer = document.querySelector(CHAT_WINDOW_SELECTOR);
  msgContainer.innerHTML = '';
  renderChatHeader(chat_);
  let messages = chat_.items.slice().reverse();
  // load older messages if they exist too
  messages = (window.olderMessages[chat_.thread_id] || []).slice().reverse().concat(messages);
  messages = window.messageInQueue[chat_.thread_id] ? messages.concat(window.messageInQueue[chat_.thread_id]): messages;
  messages.forEach((message) => {
    let div = renderMessage(message, getMsgDirection(message),
      message.timestamp, message.item_type
    );
    msgContainer.appendChild(div);
  });
  renderMessageSeenText(msgContainer, chat_);
  scrollToChatBottom();
  loadOlderMsgsOnScrollTop(chat_.thread_id);
  addSubmitHandler(chat_);
  addAttachmentSender(chat_);
  document.querySelector(MSG_INPUT_SELECTOR).focus();
}

function renderOlderMessages (messages) {
  const msgContainer = document.querySelector(CHAT_WINDOW_SELECTOR);
  const domPostion = msgContainer.firstChild;
  messages.forEach((message) => {
    let div = renderMessage(message, getMsgDirection(message),
      message.timestamp, message.item_type
    );
    msgContainer.prepend(div);
  });
  // scroll back to dom position before the older messages were rendered
  if (messages.length > 0) domPostion.scrollIntoView();
}

function renderMessageAsVoiceMedia (container, message) {
  let src = message.voice_media.media.audio.audio_src;
  let audio = dom(`<audio controls src="${src}"/>`);
  container.appendChild(audio);
}

function renderMessageSeenText (container, chat_) {
  container.appendChild(dom(`<div class="seen italic outward"><p>${getIsSeenText(chat_)}</p></div>`));
}

function renderUnfollowers (users) {
  let div = dom('<div id="unfollowers-view"></div>');
  if (typeof users === 'string' && users === 'loading') {  
    div.appendChild(getLoadingGif());
    showInViewer(div);
    return;
  } 
  let ul = dom('<ul class="unfollowers"></ul>');
  users.forEach((user) => {
    let li = dom(
      `<li class="col-12 col-md-4 col-lg-3">
        <img class="thumb" src="${user.profile_pic_url}">
        <div class="">${user.username}</div>
      </li>`
    );
    let unfollowButton = dom('<button class="unfollow-button">Unfollow</button>');
    unfollowButton.onclick = () => {
      unfollow(user.pk);
      li.remove();
    };
    li.appendChild(unfollowButton);
    ul.appendChild(li);
  });
  const unfollowers = document.querySelector('div#unfollowers-view');
  if (unfollowers) {
    unfollowers.innerHTML = '';
    unfollowers.appendChild(ul);
  }
}

function renderEmptyChat () {
  let chatArea = document.querySelector(CHAT_WINDOW_SELECTOR);
  chatArea.innerHTML = '<div class="center cover"><img src="img/icon.png" width="300px"><p class="italic">Search and select a chat to start.</p></div>';
  let chatTitle = document.querySelector(CHAT_TITLE_SELECTOR);
  chatTitle.innerHTML = '';
}
