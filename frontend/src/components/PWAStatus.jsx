import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Surfaces two things a PWA needs to communicate to the user:
//  1. "A new version is ready" (Workbox found an updated service worker)
//  2. "This app is ready to work offline" (first install finished precaching)
// Also exposes a manual "Install app" button, since browsers only fire
// `beforeinstallprompt` on their own timeline and hide it by default.
export default function PWAStatus() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Poll for updates periodically so long-lived tabs still notice new
      // deployments without the user having to close/reopen the app.
      if (registration) {
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000); // hourly
      }
    }
  });

  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault();
      setInstallEvent(e);
    }
    function handleInstalled() {
      setInstalled(true);
      setInstallEvent(null);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  function close() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  const showInstall = installEvent && !installed;
  const showToast = offlineReady || needRefresh;

  if (!showInstall && !showToast) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto sm:w-80 z-50 flex flex-col gap-2">
      {showToast && (
        <div className="card border-border bg-panel text-sm shadow-lg flex items-center justify-between gap-3">
          <span>
            {needRefresh
              ? 'A new version is available.'
              : 'App ready to work offline.'}
          </span>
          <div className="flex gap-2 shrink-0">
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="bg-accent text-black text-xs font-medium rounded-md px-3 py-1.5"
              >
                Reload
              </button>
            )}
            <button
              onClick={close}
              className="text-xs text-gray-500 hover:text-ink px-2"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showInstall && (
        <div className="card border-border bg-panel text-sm shadow-lg flex items-center justify-between gap-3">
          <span>Install this app for quick, offline-friendly access.</span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-accent text-black text-xs font-medium rounded-md px-3 py-1.5"
            >
              Install
            </button>
            <button
              onClick={() => setInstallEvent(null)}
              className="text-xs text-gray-500 hover:text-ink px-2"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
