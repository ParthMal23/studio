import { auth } from "@/auth";

export default auth;

// The matcher configuration prevents the middleware from running on specified paths.
// It protects all routes except for API routes, Next.js specific files, and public assets.
// It also explicitly allows access to the /login and /signup pages.
export const config = {
  matcher: ["/((?!api/auth/signup|_next/static|_next/image|favicon.ico|login|signup).*)"],
}

export const runtime = 'nodejs';
