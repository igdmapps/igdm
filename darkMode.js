let darkModeButton=document.getElementById('darkMode');
darkModeButton.style.backgroundColor='black';
darkModeButton.style.color='white';
darkModeButton.addEventListener("click", function(){
    darkModeButton.innerHTML="Done";   
    let list=['emojis','listStrapper','appBody','header','dropdown-menu','dropdown-item'];
    list.forEach((item)=>{
     for(let i=0;i<=document.getElementsByClassName(`${item}`).length;i++)
     {
          document.getElementsByClassName(`${item}`)[i].style.backgroundColor='black';
          document.getElementsByClassName(`${item}`)[i].style.color='white';
     }
    });
   
});