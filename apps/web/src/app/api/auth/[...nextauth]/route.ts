import { NextRequest } from "next/server";

import { handlers } from "@/auth";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/http/rate-limit";

// Passkey options (GET) and register/authenticate callback (POST) are the abusable endpoints.
// Session/csrf/providers polling is left unlimited.
function limited(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.includes("/passkey") && !pathname.includes("/webauthn-options")) return null;
  const result = rateLimit(`auth:${clientIp(request)}`, 20, 60_000);
  return result.ok ? null : tooManyRequests(result.retryAfterSeconds);
}

export const GET = (request: NextRequest) => limited(request) ?? handlers.GET(request);
export const POST = (request: NextRequest) => limited(request) ?? handlers.POST(request);
