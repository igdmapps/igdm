const { IgApiClient, IgCheckpointError, IgLoginTwoFactorRequiredError } = require('instagram-private-api');
const utils = require('./utils');

const igClient = new IgApiClient();
let threadFeed;

async function storeLoggedInSession(username) {
  const cookies = await igClient.state.serialize();
  delete cookies.constants;
  utils.storeCookies(username, cookies);
}

async function loadCookieInSession() {
  const savedCookie = utils.getStoredCookie();
  if (!savedCookie) {
    throw new Error('No session saved');
  }
  await igClient.state.deserialize(savedCookie);
  return true;
}

exports.hasActiveSession = async function () {
  try {
    await loadCookieInSession();
    const userId = igClient.state.cookieUserId;
    if (userId) {
      const userInfo = await igClient.user.info(userId);
      return { isLoggedIn: true, userInfo };
    }
  } catch (_) {
    return { isLoggedIn: false };
  }
  return { isLoggedIn: false };
};

exports.login = async function (username, password) {
  utils.clearCookieFiles();
  igClient.state.generateDevice(username);
  await igClient.simulate.preLoginFlow();
  const userData = await igClient.account.login(username, password);
  await storeLoggedInSession(username);
  return userData;
};

exports.twoFactorLogin = async function (username, code, twoFactorIdentifier, trustThisDevice, verificationMethod) {
  const response = await igClient.account.twoFactorLogin({
    username,
    verificationCode: code,
    twoFactorIdentifier,
    verificationMethod,
    trustThisDevice,
  });
  await storeLoggedInSession(username);
  return igClient.user.info(response.logged_in_user.pk);
};

exports.logout = async function () {
  try {
    await igClient.account.logout();
  } catch (_) {
    // ignore logout errors for stale sessions
  }
  utils.clearCookieFiles();
};

exports.isCheckpointError = (error) => error instanceof IgCheckpointError;
exports.isTwoFactorError = (error) => error instanceof IgLoginTwoFactorRequiredError;

exports.startCheckpoint = async function () {
  await igClient.challenge.auto(true);
  return igClient.challenge;
};

exports.getChatList = async function () {
  return igClient.feed.directInbox().items();
};

exports.getChat = async function (chatId) {
  const thread = igClient.entity.directThread();
  const threadF = igClient.feed.directThread(thread);
  threadF.cursor = undefined;
  threadF.id = chatId;
  return threadF.request().then((response) => response.thread);
};

exports.getOlderMessages = async function (thread, chatId) {
  const needsNewThreadFeed = !thread || thread.thread_id !== chatId;

  const getOlderMessages = async () => {
    if (!threadFeed.isMoreAvailable()) {
      return { thread, messages: [] };
    }
    const messages = await threadFeed.items();
    return { thread, messages };
  };

  if (needsNewThreadFeed) {
    const directChats = await igClient.feed.directInbox().items();
    const found = directChats.find((chat) => chat.thread_id === chatId);
    if (!found) {
      return { thread: null, messages: [] };
    }
    threadFeed = igClient.feed.directThread(found);
    return getOlderMessages();
  }

  return getOlderMessages();
};

exports.deleteChat = async function (chatId) {
  const thread = igClient.entity.directThread(chatId);
  return thread.hide(chatId);
};

exports.sendNewChatMessage = async function (message, recipients) {
  const directThread = igClient.entity.directThread(recipients);
  return directThread.broadcastText(message);
};

exports.sendMessage = async function (message, chatId) {
  const directThread = igClient.entity.directThread(chatId);
  return directThread.broadcastText(message);
};

exports.searchUsers = async function (search) {
  return igClient.user.search(search);
};

exports.uploadFile = async function (filePath, fileType, recipients) {
  const directThread = igClient.entity.directThread(recipients);
  if (fileType === 'image') {
    return directThread.broadcastPhoto({ file: filePath });
  }
  if (fileType === 'video') {
    return directThread.broadcastVideo({ video: filePath });
  }
  if (fileType === 'audio') {
    return directThread.broadcastVoice({ file: filePath });
  }
  throw new Error('Unsupported upload type');
};

exports.getUnfollowers = async function () {
  const followers = [];
  const following = [];
  const compare = () => {
    const hashedFollowers = {};
    followers.forEach((user) => {
      hashedFollowers[user.pk] = true;
    });
    return following.filter((user) => !hashedFollowers[user.pk]);
  };
  const getUsers = async (newUsers, allUsers, usersGetter, otherUsersGetter) => {
    newUsers.forEach((user) => allUsers.push(user));
    if (usersGetter.moreAvailable === false && otherUsersGetter.moreAvailable === false) {
      return compare();
    }
    if (usersGetter.moreAvailable !== false) {
      const nextUsers = await usersGetter.items();
      return getUsers(nextUsers, allUsers, usersGetter, otherUsersGetter);
    }
    return compare();
  };
  const followersGetter = igClient.feed.accountFollowers();
  const followingGetter = igClient.feed.accountFollowing();
  return Promise.all([
    getUsers([], followers, followersGetter, followingGetter),
    getUsers([], following, followingGetter, followersGetter),
  ]).then(() => {
    const hashedFollowers = {};
    followers.forEach((user) => {
      hashedFollowers[user.pk] = true;
    });
    return following.filter((user) => !hashedFollowers[user.pk]);
  });
};

exports.unfollow = async function (userId) {
  const thread = igClient.entity.directThread(userId);
  return thread.hide(userId);
};

exports.getUser = async function (userId) {
  return igClient.user.info(userId);
};

exports.getPresence = async function () {
  return igClient.direct.getPresence();
};
