const fs = require('fs');
const Client = require('instagram-private-api').V1;
let storage, device;

exports.checkAuth = function () {
  return new Promise((resolve, reject) => {
    let files = fs.readdirSync(`${__dirname}/cookies`);

    if (files.length && files[0].endsWith('.json')) {
      let filename = files[0]
      device = new Client.Device(filename.slice(0, -5)); // remove .json extension
      storage = new Client.CookieFileStorage(`${__dirname}/cookies/${filename}`);

      const session = new Client.Session(device, storage);
      // see if IG allows this session to make request
      return session.getAccountId()
        .then(() => resolve({ isLoggedIn: true, session }))
        .catch(Client.Exceptions.CookieNotValidError, () => resolve({ isLoggedIn: false }))
    } else {
      resolve({ isLoggedIn: false })
    }
  })
}

exports.login = function (username, password) {
  // delete all session storage
  let files = fs.readdirSync(`${__dirname}/cookies`);
  files.forEach((filename) => {
    fs.unlinkSync(`${__dirname}/cookies/${filename}`);
  })

  return new Promise((resolve, reject) => {
    // create file
    device = new Client.Device(username);
    storage = new Client.CookieFileStorage(`${__dirname}/cookies/${username}.json`);

    Client.Session.create(device, storage, username, password).then(resolve).catch(reject)
  })
}

exports.logout = function () {
  // delete all session storage
  let files = fs.readdirSync(`${__dirname}/cookies`);
  files.forEach((filename) => {
    fs.unlinkSync(`${__dirname}/cookies/${filename}`);
  })
}

exports.getChatList = function (session) {
  return new Promise((resolve, reject) => {
    var feed = new Client.Feed.Inbox(session, 10);
    feed.all().then(resolve).catch(reject)
  })
}

exports.getChat = function (session, chatId) {
  return new Promise((resolve, reject) => {
    Client.Thread.getById(session, chatId).then(resolve).catch(reject)
  })
}

exports.sendMessage = function (session, message, recipients) {
  return new Promise((resolve, reject) => {
    Client.Thread.configureText(session, recipients, message).then(resolve).catch(reject)
  })
}

exports.searchUsers = function (session, search) {
  return new Promise((resolve, reject) => {
    Client.Account.search(session, search).then(resolve).catch(reject)
  })
}

exports.seen = function (session, thread) {
  (new Client.Thread(session, thread)).seen()
}

exports.getUnfollowers = function (session) {
  return new Promise((resolve, reject) => {
    let followers = [];
    let following = [];
    const accountId = session._cookiesStore.storage.idx['i.instagram.com']['/'].ds_user_id.value;

    const compare = () => {
      hashedFollowers = {}
      followers.forEach((user) => hashedFollowers[user.id] = true);

      let unfollowers = following.filter((user) => !hashedFollowers[user.id]);
      resolve(unfollowers);
    }

    const getUsers = (newUsers, allUsers, usersGetter, otherUsersGetter) => {
      newUsers.forEach((user) => allUsers.push(user))
      // moreAvailable maybe null. We are dodging that.
      if (usersGetter.moreAvailable === false && otherUsersGetter.moreAvailable === false){
        compare();
      } else if (usersGetter.moreAvailable !== false) {
        usersGetter.get()
          .then((users) => getUsers(users, allUsers, usersGetter, otherUsersGetter))
          .catch(reject);
      }
    }

    const followersGetter = new Client.Feed.AccountFollowers(session, accountId);
    const followingGetter = new Client.Feed.AccountFollowing(session, accountId)

    getUsers([], followers, followersGetter, followingGetter);
    getUsers([], following, followingGetter, followersGetter);
  })
}

exports.unfollow = function (session, userId) {
  Client.Relationship.destroy(session, userId);
}
