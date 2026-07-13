---
phase: 5
title: In-App Update Toast
status: completed
priority: P1
effort: 2h
dependencies:
  - 4
---

# Phase 5: In-App Update Toast

## Overview
Client-side update flow: proactively check for a new service worker (on
load, on returning to foreground, every 30 min) and, when one takes over,
show a tappable toast "Có bản mới — Nhấn để cập nhật" that reloads the
page. Depends on Phase 4 — without the hashed SW, no update ever fires.

## Requirements
- Functional: `registration.update()` called on page load, on
  `visibilitychange` → visible, and on a 30-minute interval.
- Functional: when the new SW takes control (`controllerchange`), show a
  persistent toast; tapping it calls `location.reload()`. Never
  auto-reload (user decision: no forced mid-game reload).
- Functional: skip the toast on the very first SW install (page loads with
  no controller → controller appears; that's initial install, not an
  update).
- Functional: tapping the toast must NOT make the player jump (the game
  binds `mousedown`/`touchstart` on window — stopPropagation like the
  existing mute button at `js/hud-progress.js:25-26`).
- Non-functional: new logic in a small dedicated module
  `js/update-notifier.js` (keeps `main.js` ~200 lines); Vietnamese label
  matching existing UI (`Xóa`, `Ảnh`, `Tên` are already Vietnamese).

## Architecture
```
main.js (SW registration block, lines ~198-201)
  → register('./service-worker.js').then(reg => initUpdateNotifier(reg))

js/update-notifier.js
  initUpdateNotifier(registration):
    hadController = !!navigator.serviceWorker.controller   // false on first install
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) { hadController = true; return; } // initial install
      showToast();
    });
    registration.update() triggers:
      - immediately after init (covers "opened app, update deployed while closed")
      - document.addEventListener('visibilitychange', … state === 'visible')
      - setInterval 30 * 60 * 1000
    showToast(): creates #update-toast div (button role), text
      "Có bản mới — Nhấn để cập nhật", appended to body;
      click/touchend → location.reload();
      mousedown/touchstart → stopPropagation (no jump).
```
Because service-worker.js already does `skipWaiting()` + `clients.claim()`,
a found update activates immediately → `controllerchange` fires → toast.
No postMessage/SKIP_WAITING handshake needed.

## Related Code Files
- Create: `js/update-notifier.js` (~60 lines)
- Modify: `js/main.js` (registration block passes registration to initUpdateNotifier)
- Modify: `index.html` (nothing — toast is created dynamically; only if styling requires a container, prefer dynamic)
- Modify: `styles.css` (toast styling: fixed bottom-center, high z-index above canvas + overlays, game-consistent colors #0b1030 bg / accent border, padding, pointer cursor)
- Modify: `service-worker.js` APP_SHELL (add `./js/update-notifier.js`)
- Modify: `scripts/prepare-android-web-assets.js` — no change needed (copies whole `js/` dir)

## Implementation Steps
1. Write `js/update-notifier.js` per Architecture: export
   `initUpdateNotifier(registration)`; guard all DOM/interval setup so
   calling it twice is a no-op (defensive; registration happens once).
2. In `js/main.js`, change the existing registration `.catch(() => {})`
   chain to `.then((reg) => initUpdateNotifier(reg)).catch(() => {})` and
   import the module at top.
3. Add `#update-toast` styles to `styles.css` (hidden until created;
   `position: fixed; bottom: max(24px, env(safe-area-inset-bottom)); left: 50%;
   transform: translateX(-50%); z-index: 30` — verified existing maxima are
   20 (`styles-matching.css`) and 25 (`styles-about.css`), so 30 sits above
   every overlay).
<!-- Updated: Validation Session 1 - pinned z-index: 30 from verified existing values -->

4. Add `./js/update-notifier.js` to `service-worker.js` APP_SHELL array.
5. `npm test`.
6. End-to-end verification (requires Phase 4 deployed): open live site on
   a device/browser → push a trivial content change to main → wait for
   Action green → background+refocus the tab (or wait ≤30 min) → toast
   appears → tap → page reloads with new content. Also verify: tapping
   toast mid-run does not make the cube jump before reload.
7. Local smoke fallback (if not waiting on live deploy): serve `www/` from
   two different builds via local static server to force an SW byte-diff
   and observe the toast — same mechanics as production.

## Success Criteria
- [ ] Toast appears after a real deploy while app is open/refocused, not on first-ever visit
- [ ] Tapping toast reloads and the new version is live (no cache clear)
- [ ] Tap does not trigger a player jump
- [ ] Mute/overlay/other UI unaffected; toast readable on mobile widths
- [ ] `npm test` passes; update-notifier.js in APP_SHELL

## Risk Assessment
- `controllerchange` also fires if the user hard-refreshes with DevTools
  "update on reload" — dev-only, harmless.
- 30-min interval + visibility checks are conservative; if updates feel
  slow to surface, drop interval to 10 min later (one constant).
- Capacitor APK: SW registration on `capacitor://` may be unavailable —
  module already no-ops when registration fails (guarded by main.js's
  existing `.catch`); APK updates ship via new APK anyway.
