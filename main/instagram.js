const { IgApiClient, IgCheckpointError, IgLoginTwoFactorRequiredError } = require('instagram-private-api');
const utils = require('./utils');
const { readFile } = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(readFile);

const igClient = new IgApiClient();

function storeLoggedInSession (username) {
  return new Promise((resolve) => {
    igClient.state.serialize().then((cookies) => {
      delete cookies.constants;
      utils.storeCookies(username, cookies);
      resolve();
    });
  });
}

function loadCookieInSession () {
  return new Promise((resolve, reject) => {
    const savedCookie = utils.getStoredCookie();
    if (savedCookie) {
      igClient.state.deserialize(savedCookie).then(() => {
        resolve(true);
      }).catch(reject);
    } else {
      reject('No session saved');
    }
  });
}

exports.hasActiveSession = function () {
  return new Promise((resolve) => {
    loadCookieInSession().then((isLoaded) => {
      const userId = igClient.state.cookieUserId;
      if (isLoaded && userId) {
        igClient.user.info(userId).then((userInfo) => {
          resolve({ isLoggedIn: true, userInfo });
        });
      }
    }).catch(() => {
      resolve({ isLoggedIn: false });
    });
  });
};

exports.login = function (username, password) {
  return new Promise((resolve, reject) => {
    utils.clearCookieFiles();
    igClient.state.generateDevice(username);
    igClient.simulate.preLoginFlow().then(() => {
      igClient.account.login(username, password).then((userData) => {
        storeLoggedInSession(username).then(() => {
          resolve(userData);
        }).catch(reject);
      }).catch(reject);
    }).catch(reject);
  });
};

exports.twoFactorLogin = function (username, code, twoFactorIdentifier, trustThisDevice, verificationMethod) {
  return new Promise((resolve, reject) => {
    igClient.account.twoFactorLogin({
      username,
      verificationCode: code,
      twoFactorIdentifier: twoFactorIdentifier,
      verificationMethod,
      trustThisDevice,
    }).then((twoFactorResponse) => {
      storeLoggedInSession(username).then(() => {
        const userId = twoFactorResponse.logged_in_user.pk;
        igClient.user.info(userId).then(resolve).catch(reject);
      });
    }).catch(reject);
  });
};

exports.logout = function () {
  igClient.account.logout();
  utils.clearCookieFiles();
};

exports.isCheckpointError = (error) => {
  return (error instanceof IgCheckpointError);
};

exports.isTwoFactorError = (error) => {
  return (error instanceof IgLoginTwoFactorRequiredError);
};

exports.startCheckpoint = () => {
  return new Promise((resolve) => {
    igClient.challenge.auto(true).then(() => {
      resolve(igClient.challenge);
    });
  });
};

exports.getChatList = function () {
  const chatsFeed = igClient.feed.directInbox();
  return new Promise((resolve, reject) => {
    chatsFeed.items().then(resolve).catch(reject);
  });
};

exports.getChat = function (chatId) {
  const thread = igClient.entity.directThread();
  return new Promise((resolve, reject) => {
    const threadF = igClient.feed.directThread(thread);
    threadF.cursor = undefined;
    threadF.id = chatId;
    threadF.request().then((response) => resolve(response.thread)).catch(reject);
  });
};

let threadFeed;
exports.getOlderMessages = function (thread, chatId) {
  const needsNewThreadFeed = !thread || thread.thread_id !== chatId;

  const getOlderMessages = (thread, resolve) => {
    if (!needsNewThreadFeed && !threadFeed.isMoreAvailable()) {
      //there aren't any older messages
      resolve({ thread, messages: [] });
    } else {
      threadFeed.items().then((messages) => {
        resolve({ thread, messages });
      });
    }
  };

  return new Promise((resolve) => {
    if (needsNewThreadFeed) {
      const feed = igClient.feed.directInbox();
      feed.items().then((directChats) => {
        const thread = directChats.find(chat => chat.thread_id === chatId);
        threadFeed = igClient.feed.directThread(thread);
        getOlderMessages(thread, resolve);
      });
    } else {
      getOlderMessages(thread, resolve);
    }
  });
};

exports.deleteChat = function (chatId) {
  return new Promise((resolve, reject) => {
    const thread = igClient.entity.directThread(chatId);
    thread.hide(chatId).then(resolve).catch(reject);
  });
};

exports.sendNewChatMessage = function (message, recipients) {
  return new Promise((resolve, reject) => {
    const directThread = igClient.entity.directThread(recipients);
    directThread.broadcastText(message).then(resolve).catch(reject);
  });
};

exports.sendMessage = function (message, chatId) {
  return new Promise((resolve, reject) => {
    const directThread = igClient.entity.directThread(chatId);
    directThread.broadcastText(message).then(resolve).catch(reject);
  });
};

exports.searchUsers = function (search) {
  return new Promise((resolve, reject) => {
    igClient.user.search(search).then(resolve).catch(reject);
  });
};

function uploadImage (filePath, recipients) {
  return new Promise((resolve, reject) => {
    const directThread = igClient.entity.directThread(recipients);
    readFileAsync(filePath).then((buffer) => {
      directThread.broadcastPhoto({
        file: buffer,
      }).then(resolve).catch(reject);
    }).catch(reject);
  });
}

function uploadVideo (filePath, recipients) {
  return new Promise((resolve, reject) => {
    const directThread = igClient.entity.directThread(recipients);
    readFileAsync(filePath).then((buffer) => {
      directThread.broadcastVideo({
        video: buffer,
      }).then(resolve).catch(reject);
    }).catch(reject);
  });
}

function uploadAudio (filePath, recipients) {
  return new Promise((resolve, reject) => {
    const directThread = igClient.entity.directThread(recipients);
    readFileAsync(filePath).then((buffer) => {
      directThread.broadcastVoice({
        file: buffer,
      }).then(resolve).catch(reject);
    }).catch(reject);
  });
}

exports.uploadFile = function (filePath, fileType, recipients) {
  if (fileType === 'image') {
    return uploadImage(filePath, recipients);
  }
  if (fileType === 'video') {
    return uploadVideo(filePath, recipients);
  }
  if (fileType === 'audio') {
    return uploadAudio(filePath, recipients);
  }
};

exports.seen = function (thread) {
  const { thread_id } = thread;
  const { item_id } = thread.items[0];
  const directThread = igClient.entity.directThread(thread_id);
  directThread.markItemSeen(item_id);
};

exports.getUnfollowers = function () {
  return new Promise((resolve, reject) => {
    const followers = [];
    const following = [];

    const compare = () => {
      const hashedFollowers = {};
      followers.forEach((user) => hashedFollowers[user.pk] = true);

      const unfollowers = following.filter((user) => !hashedFollowers[user.pk]);
      resolve(unfollowers);
    };

    const getUsers = (newUsers, allUsers, usersGetter, otherUsersGetter) => {
      newUsers.forEach((user) => allUsers.push(user));
      // moreAvailable maybe null. We are dodging that.
      if (usersGetter.moreAvailable === false && otherUsersGetter.moreAvailable === false) {
        compare();
      } else if (usersGetter.moreAvailable !== false) {
        usersGetter.items()
          .then((users) => getUsers(users, allUsers, usersGetter, otherUsersGetter))
          .catch(reject);
      }
    };

    const followersGetter = igClient.feed.accountFollowers();
    const followingGetter = igClient.feed.accountFollowing();

    getUsers([], followers, followersGetter, followingGetter);
    getUsers([], following, followingGetter, followersGetter);
  });
};

exports.unfollow = function (userId) {
  igClient.friendship.destroy(userId);
};

exports.getUser = function (userId) {
  return new Promise((resolve, reject) => {
    igClient.user.info(userId).then(resolve).catch(reject);
  });
};

exports.getPresence = function () {
  return new Promise((resolve, reject) => {
    igClient.direct.getPresence().then(resolve).catch(reject);
  });
};
