export function initAboutScreen({ openButton, overlay }) {
  const closeButton = overlay.querySelector('#about-close-btn');
  const links = overlay.querySelectorAll('a');

  stopGameInput(openButton);
  stopGameInput(closeButton);
  for (const link of links) stopGameInput(link);

  openButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    overlay.classList.remove('hidden');
  });

  closeButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    overlay.classList.add('hidden');
  });

  overlay.addEventListener('mousedown', (event) => event.stopPropagation());
  overlay.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });
}

function stopGameInput(element) {
  element.addEventListener('mousedown', (event) => event.stopPropagation());
  element.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });
}
