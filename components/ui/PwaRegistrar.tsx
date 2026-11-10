'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaRegistrar() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // The SW takes over immediately (skipWaiting in sw.js). After a
          // new worker activates, reload once so the UI runs the fresh
          // build instead of a stale shell. The sessionStorage guard
          // prevents reload loops.
          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            worker?.addEventListener('statechange', () => {
              if (
                worker.state === 'activated' &&
                navigator.serviceWorker.controller &&
                !sessionStorage.getItem('cw_sw_reloaded')
              ) {
                sessionStorage.setItem('cw_sw_reloaded', '1');
                window.location.reload();
              }
            });
          });
          // Check for updates on every open.
          registration.update().catch(() => {});
        })
        .catch(() => {});
    }

    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // iOS never fires `beforeinstallprompt`, so show the banner there directly.
    if (isIosDevice && !localStorage.getItem('cw_pwa_dismissed')) {
      setShowBanner(true);
    }

    // Capture standard install prompt on Android / Chromium
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user dismissed banner recently
      const dismissed = localStorage.getItem('cw_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosPrompt(true);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem('cw_pwa_dismissed', '1');
  }

  if (installed || (!showBanner && !showIosPrompt)) return null;

  return (
    <>
      {/* Subtle floating Mobile Install Banner */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in sm:left-auto sm:right-6">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-3.5 text-white shadow-2xl backdrop-blur-lg">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                <Smartphone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold leading-tight">Install ClaimWise App</p>
                <p className="text-[10px] text-blue-200">Fast access to vault &amp; Emergency SOS</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg p-1 text-gray-400 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Manual Add to Home Screen Instructions Modal */}
      {showIosPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Install on iPhone / iPad</h3>
              <p className="text-xs text-gray-500 mt-1">
                To install ClaimWise as an app on iOS Safari:
              </p>
            </div>

            <ol className="text-left text-xs space-y-2.5 rounded-xl bg-gray-50 p-3.5 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  1
                </span>
                <span>Tap the <strong>Share</strong> button at bottom of Safari</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  2
                </span>
                <span>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  3
                </span>
                <span>Tap <strong>Add</strong> in the top-right corner</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosPrompt(false)}
              className="w-full btn-primary text-xs font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
