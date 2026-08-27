export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

type PublicEnvironment = {
  [key: string]: string | undefined;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hasServiceRoleClaim(key: string): boolean {
  const payload = key.split(".")[1];
  if (!payload) {
    return false;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const claims: unknown = JSON.parse(globalThis.atob(padded));

    return (
      typeof claims === "object" &&
      claims !== null &&
      "role" in claims &&
      claims.role === "service_role"
    );
  } catch {
    return false;
  }
}

export function getSupabasePublicConfig(
  environment: PublicEnvironment = process.env,
): SupabasePublicConfig | null {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  if (!url || !publishableKey || !isHttpUrl(url)) {
    return null;
  }

  if (
    publishableKey.startsWith("sb_secret_") ||
    hasServiceRoleClaim(publishableKey)
  ) {
    return null;
  }

  return { url, publishableKey };
}

export function hasSupabasePublicConfig(): boolean {
  return getSupabasePublicConfig() !== null;
}
