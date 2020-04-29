function getHTMLElement (media) {
  let mediaContent;
  if (media.video_versions) {
    mediaContent = `<video width="${media.video_versions[0].width}" controls>
      <source src="${media.video_versions[0].url}" type="video/mp4">
    </video>`;
  } else {
    mediaContent = `<img src="${media.image_versions2.candidates[0].url}">`;
  }
  return mediaContent;
}

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
  };

  rightButton.onclick = () => {
    activeMedia++;
    activeMedia = activeMedia > media.length - 1 ? 0 : activeMedia;
    carousel.innerHTML = getHTMLElement(media[activeMedia]);
  };

  carousel.innerHTML = getHTMLElement(media[activeMedia]);
};
