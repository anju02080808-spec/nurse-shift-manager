import { describe, expect, it } from "vitest";
import { isIosDevice, isStandaloneMode } from "@/lib/pwa";

describe("PWA environment helpers", () => {
  it("iPhoneとiPadをiOSとして判定する", () => {
    expect(isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)")).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (iPad; CPU OS 18_0)")).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Macintosh)", "MacIntel", 5)).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Linux; Android 15)")).toBe(false);
  });

  it("display-modeまたはiOS standaloneのどちらでもインストール済みと判定する", () => {
    expect(isStandaloneMode(true, undefined)).toBe(true);
    expect(isStandaloneMode(false, true)).toBe(true);
    expect(isStandaloneMode(false, false)).toBe(false);
  });
});
