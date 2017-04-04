const fs = require('fs');
const Client = require('instagram-private-api').V1;
let storage, device;

function checkAuth () {
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

function login (username, password) {
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

function logout () {
  // delete all session storage
  let files = fs.readdirSync(`${__dirname}/cookies`);
  files.forEach((filename) => {
    fs.unlinkSync(`${__dirname}/cookies/${filename}`);
  })
}

function getChatList (session) {
  return new Promise((resolve, reject) => {
    var feed = new Client.Feed.Inbox(session, 10);
    feed.all().then(resolve).catch(reject)
  })
}

function getChat (session, chatId) {
  return new Promise((resolve, reject) => {
    Client.Thread.getById(session, chatId).then(resolve).catch(reject)
  })
}

function sendMessage (session, message, recipients) {
  return new Promise((resolve, reject) => {
    Client.Thread.configureText(session, recipients, message).then(resolve).catch(reject)
  })
}

function searchUsers (session, search) {
  return new Promise((resolve, reject) => {
    Client.Account.search(session, search).then(resolve).catch(reject)
  })
}

function seen (session, thread) {
  (new Client.Thread(session, thread)).seen()
}

module.exports = { checkAuth, login, logout, getChatList, getChat, sendMessage, searchUsers, seen }
