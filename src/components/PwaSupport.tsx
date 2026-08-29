"use client";

import { useEffect, useState } from "react";
import {
  isIosDevice,
  isStandaloneMode,
  PWA_INSTALL_DISMISSED_KEY,
} from "@/lib/pwa";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function PwaSupport() {
  const [isOnline, setIsOnline] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const navigatorWithStandalone = navigator as NavigatorWithStandalone;
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setIsDismissed(false);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    const initialStateTimer = window.setTimeout(() => {
      setIsIos(
        isIosDevice(
          navigator.userAgent,
          navigator.platform,
          navigator.maxTouchPoints,
        ),
      );
      setIsStandalone(
        isStandaloneMode(
          displayMode.matches,
          navigatorWithStandalone.standalone,
        ),
      );
      try {
        setIsDismissed(
          window.localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "1",
        );
      } catch {
        setIsDismissed(false);
      }
      updateOnlineStatus();
      setIsReady(true);
    }, 0);

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(initialStateTimer);
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsStandalone(true);
    }
    setInstallPrompt(null);
  }

  function handleDismiss() {
    setIsDismissed(true);
    try {
      window.localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "1");
    } catch {
      // Storage may be unavailable in privacy modes. Dismissing still works for this view.
    }
  }

  const showInstallGuide =
    isReady && !isStandalone && !isDismissed && (isIos || installPrompt);

  return (
    <>
      {isReady && !isOnline && (
        <div className="offline-banner" role="status">
          <span aria-hidden="true">!</span>
          オフラインです。表示中の内容は確認できますが、クラウド保存は通信復旧後に行ってください。
        </div>
      )}

      {showInstallGuide && (
        <aside className="install-card" aria-label="アプリをホーム画面に追加">
          <div className="install-card-icon" aria-hidden="true">NS</div>
          <div className="install-card-copy">
            <strong>勤務表をアプリとして使えます</strong>
            <span>
              {isIos
                ? "共有ボタンから「ホーム画面に追加」を選んでください。"
                : "ホーム画面からすぐ勤務表を開けます。"}
            </span>
          </div>
          {!isIos && installPrompt && (
            <button
              className="install-button"
              onClick={() => void handleInstall()}
              type="button"
            >
              追加する
            </button>
          )}
          <button
            aria-label="ホーム画面追加の案内を閉じる"
            className="install-dismiss"
            onClick={handleDismiss}
            type="button"
          >
            ×
          </button>
        </aside>
      )}
    </>
  );
}
