import { describe, expect, it, vi } from "vitest";
import {
  downloadCsvFile,
  OBJECT_URL_REVOKE_DELAY_MS,
  type CsvDownloadEnvironment,
} from "@/lib/csvDownload";

describe("CSV download", () => {
  it("starts a download and revokes the Object URL after a Safari-safe delay", () => {
    const link = {
      href: "",
      download: "",
      hidden: false,
      click: vi.fn(),
      remove: vi.fn(),
    };
    let scheduledCallback: (() => void) | undefined;
    let scheduledDelay = 0;
    const revokeObjectUrl = vi.fn();
    const environment: CsvDownloadEnvironment = {
      createBlob: vi.fn(() => ({}) as Blob),
      createObjectUrl: vi.fn(() => "blob:test-csv"),
      revokeObjectUrl,
      createLink: vi.fn(() => link),
      appendLink: vi.fn(),
      schedule: (callback, delayMs) => {
        scheduledCallback = callback;
        scheduledDelay = delayMs;
      },
    };

    expect(downloadCsvFile("csv-data", "shifts.csv", environment)).toBe(true);
    expect(link.href).toBe("blob:test-csv");
    expect(link.download).toBe("shifts.csv");
    expect(link.click).toHaveBeenCalledOnce();
    expect(link.remove).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).not.toHaveBeenCalled();
    expect(scheduledDelay).toBe(OBJECT_URL_REVOKE_DELAY_MS);
    expect(scheduledDelay).toBeGreaterThanOrEqual(1_000);

    scheduledCallback?.();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:test-csv");
  });

  it("returns false when browser download APIs are unavailable", () => {
    expect(downloadCsvFile("csv-data", "shifts.csv", null)).toBe(false);
  });
});
