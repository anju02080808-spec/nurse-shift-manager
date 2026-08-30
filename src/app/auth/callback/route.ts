import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const destination = new URL("/", requestUrl.origin);

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        destination.searchParams.set("auth", "success");
        return NextResponse.redirect(destination);
      }
    }
  }

  destination.searchParams.set("auth", "error");
  return NextResponse.redirect(destination);
}
