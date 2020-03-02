window.carouselInit = (element, media) => {
  const carousel = dom('<div class="carousel"></div>');
  let activeMedia = 0;
  const leftButton = dom('<button class="carousel-left"></button>');
  const rightButton = dom('<button class="carousel-right"></button>');
  element.appendChild(carousel);
  element.appendChild(leftButton);
  element.appendChild(rightButton);

  leftButton.onclick = () => {
    activeMedia--;
    activeMedia = activeMedia < 0 ? media.length - 1 : activeMedia;
    carousel.innerHTML = getHTMLElement(media[activeMedia]);
  }

  rightButton.onclick = () => {
    activeMedia++;
    activeMedia = activeMedia > media.length - 1 ? 0 : activeMedia;
    carousel.innerHTML = getHTMLElement(media[activeMedia]);
  }

  carousel.innerHTML = getHTMLElement(media[activeMedia]);
}
