export const OBJECT_URL_REVOKE_DELAY_MS = 1_500;

interface DownloadLink {
  href: string;
  download: string;
  hidden: boolean;
  click: () => void;
  remove: () => void;
}

export interface CsvDownloadEnvironment {
  createBlob: (csv: string) => Blob;
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  createLink: () => DownloadLink;
  appendLink: (link: DownloadLink) => void;
  schedule: (callback: () => void, delayMs: number) => void;
}

function getBrowserDownloadEnvironment(): CsvDownloadEnvironment | null {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof Blob === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return null;
  }

  return {
    createBlob: (csv) => new Blob([csv], { type: "text/csv;charset=utf-8" }),
    createObjectUrl: (blob) => URL.createObjectURL(blob),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
    createLink: () => document.createElement("a"),
    appendLink: (link) => document.body.appendChild(link as HTMLAnchorElement),
    schedule: (callback, delayMs) => {
      window.setTimeout(callback, delayMs);
    },
  };
}

export function downloadCsvFile(
  csv: string,
  filename: string,
  environment: CsvDownloadEnvironment | null = getBrowserDownloadEnvironment(),
): boolean {
  if (!environment) {
    return false;
  }

  let objectUrl: string | null = null;

  try {
    const blob = environment.createBlob(csv);
    objectUrl = environment.createObjectUrl(blob);
    const link = environment.createLink();
    link.href = objectUrl;
    link.download = filename;
    link.hidden = true;
    environment.appendLink(link);
    link.click();
    link.remove();

    const urlToRevoke = objectUrl;
    environment.schedule(
      () => environment.revokeObjectUrl(urlToRevoke),
      OBJECT_URL_REVOKE_DELAY_MS,
    );
    return true;
  } catch {
    if (objectUrl) {
      environment.revokeObjectUrl(objectUrl);
    }
    return false;
  }
}
