let darkModeButton=document.getElementById('darkMode');
darkModeButton.style.backgroundColor='black';
darkModeButton.style.color='white';
darkModeButton.addEventListener("click", function(){  
    let newstyle = document.createElement("link");
    newstyle.setAttribute("rel", "stylesheet");
    newstyle.setAttribute("type", "text/css");
    newstyle.setAttribute("href", "css/darkmode.css"); 
    newstyle.setAttribute("id","darkMode");
    document.getElementsByTagName("head")[0].appendChild(newstyle);
    darkModeButton.remove();
    mainWindow.reload();
});