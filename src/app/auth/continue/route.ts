import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { homeForStage } from "@/lib/auth/stage";

/** Routes a freshly signed-in user to the right place for their stage. */
export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  const target = viewer ? homeForStage(viewer.stage) : "/sign-in";
  return NextResponse.redirect(new URL(target, request.nextUrl.origin));
}
