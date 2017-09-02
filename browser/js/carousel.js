window.carouselInit = (element, images) => {
  const carousel = dom('<div class="carousel"></div>');
  let activeImage = 0;
  const leftButton = dom('<button class="carousel-left"></button>');
  const rightButton = dom('<button class="carousel-right"></button>');
  element.appendChild(carousel);
  element.appendChild(leftButton);
  element.appendChild(rightButton);

  leftButton.onclick = () => {
    activeImage--;
    activeImage = activeImage < 0 ? images.length - 1 : activeImage;
    carousel.innerHTML = `<img src="${images[activeImage]}">`;
  }

  rightButton.onclick = () => {
    activeImage++;
    activeImage = activeImage > images.length - 1 ? 0 : activeImage;
    carousel.innerHTML = `<img src="${images[activeImage]}">`;
  }
  carousel.innerHTML = `<img src="${images[activeImage]}">`;
}