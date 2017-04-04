var electron = require('electron');
var ipcRenderer = electron.ipcRenderer;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('form').onsubmit = (e) => {
    e.preventDefault()
    let button = document.querySelector('button[type=submit]');
    button.innerText = 'Please wait ...'
    button.classList.add('wait');

    var username = document.querySelector('input[name=username]').value;
    var password = document.querySelector('input[name=password]').value;
 
    ipcRenderer.send('login', { username, password })
  }

  document.querySelector('a').onclick = () => electron.shell.openExternal("https://github.com/ifedapoolarewaju/igdm")
})