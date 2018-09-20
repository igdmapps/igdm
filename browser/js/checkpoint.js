var electron = require('electron');
var ipcRenderer = electron.ipcRenderer;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('form').onsubmit = (e) => {
    e.preventDefault()
    let button = document.querySelector('button[type=submit]');
    button.innerText = 'Submitting code...'
    button.classList.add('loggingIn', 'disabled');
    const code = document.querySelector('input[name=code]').value;
    ipcRenderer.send('checkpointCode', {code})
  }
})