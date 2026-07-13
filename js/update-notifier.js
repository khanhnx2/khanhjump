// Update flow: the service worker uses skipWaiting + clients.claim, so a
// newly deployed SW takes control as soon as an update check finds it. We
// check proactively and, when control changes hands, offer a reload — never
// force one mid-run.

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

let initialized = false;

export function initUpdateNotifier(registration) {
  if (initialized || !registration) return;
  initialized = true;

  // A page that loads with no controller is the very first install — the
  // controllerchange that follows is not an update.
  let hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    showUpdateToast();
  });

  const check = () => registration.update().catch(() => {
    // Offline or transient failure — the next check will retry.
  });

  check();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  setInterval(check, CHECK_INTERVAL_MS);
}

function showUpdateToast() {
  if (document.getElementById('update-toast')) return;

  const toast = document.createElement('button');
  toast.id = 'update-toast';
  toast.type = 'button';
  toast.textContent = 'Có bản mới — Nhấn để cập nhật';

  // The game jumps on window mousedown/touchstart; keep toast taps out of it.
  toast.addEventListener('mousedown', (event) => event.stopPropagation());
  toast.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });
  toast.addEventListener('click', (event) => {
    event.stopPropagation();
    window.location.reload();
  });

  document.body.appendChild(toast);
}
