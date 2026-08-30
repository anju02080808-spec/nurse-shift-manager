import { describe, expect, it } from "vitest";
import {
  getSupabasePublicConfig,
  isGoogleAuthEnabled,
} from "@/lib/supabase/config";

function jwtWithRole(role: string): string {
  const payload = globalThis.btoa(JSON.stringify({ role }));
  return `header.${payload}.signature`;
}

describe("Supabase public configuration", () => {
  it("accepts a valid project URL and publishable key", () => {
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });
  });

  it("treats missing or malformed values as unconfigured", () => {
    expect(getSupabasePublicConfig({})).toBeNull();
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toBeNull();
  });

  it("rejects secret and legacy service-role keys", () => {
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_example",
      }),
    ).toBeNull();
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwtWithRole("service_role"),
      }),
    ).toBeNull();
  });

  it("enables Google login only when explicitly configured", () => {
    expect(isGoogleAuthEnabled({})).toBe(false);
    expect(
      isGoogleAuthEnabled({ NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "false" }),
    ).toBe(false);
    expect(
      isGoogleAuthEnabled({ NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: " true " }),
    ).toBe(true);
  });
});
