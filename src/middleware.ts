import { auth } from "@/auth";

export default auth;

// The matcher configuration prevents the middleware from running on specified paths.
// It protects all routes except for the auth API routes, Next.js specific files, public assets, and the login/signup pages.
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login|signup).*)"],
  runtime: 'nodejs',
}
