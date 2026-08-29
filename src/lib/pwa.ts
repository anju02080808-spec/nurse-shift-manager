export const PWA_INSTALL_DISMISSED_KEY =
  "nurse-shift-manager:pwa-install-dismissed:v1";

export function isIosDevice(
  userAgent: string,
  platform = "",
  maxTouchPoints = 0,
): boolean {
  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  );
}

export function isStandaloneMode(
  displayModeStandalone: boolean,
  navigatorStandalone: boolean | undefined,
): boolean {
  return displayModeStandalone || navigatorStandalone === true;
}
