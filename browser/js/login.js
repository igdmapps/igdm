var electron = require('electron');
var ipcRenderer = electron.ipcRenderer;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('form').onsubmit = (e) => {
    e.preventDefault()
    let button = document.querySelector('button[type=submit]');
    button.innerText = 'Logging In...'
    button.classList.add('loggingIn', 'disabled');

    var username = document.querySelector('input[name=username]').value;
    var password = document.querySelector('input[name=password]').value;
 
    ipcRenderer.send('login', { username, password })
  }

  ipcRenderer.on('loginError', (evt, errorMessage) => {
    let button = document.querySelector('button[type=submit]');
    button.classList.remove('loggingIn', 'disabled');
    button.innerText = 'Login to Instagram'
    const errorElement = document.getElementById('error');
    errorElement.innerHTML = errorMessage;
  });

  document.querySelector('a').onclick = () => electron.shell.openExternal("https://github.com/ifedapoolarewaju/igdm")
})