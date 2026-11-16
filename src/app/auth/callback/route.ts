import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/stage";
import { linkApplicationsToUser } from "@/lib/auth/link-applications";

/** PKCE magic-link callback: exchanges the code for a session cookie. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/auth/continue");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await linkApplicationsToUser(data.user.id, data.user.email);
      return NextResponse.redirect(new URL(next, origin));
    }
    console.error("[auth/callback] exchange failed", error?.message);
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", origin));
}
