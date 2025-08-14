import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/legal(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()
  const a = await auth()
  if (a.isAuthenticated) return NextResponse.next()
  // If not authenticated, Clerk will handle redirect to sign-in
  return a.redirectToSignIn()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files, match all other routes
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}
