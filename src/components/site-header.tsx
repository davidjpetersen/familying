"use client"

import Link from "next/link"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">Familying</Link>
        <nav className="flex items-center gap-3">
          <SignedOut>
            <Button asChild variant="ghost">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <UserButton appearance={{ elements: { userButtonAvatarBox: "size-8" } }} />
          </SignedIn>
        </nav>
      </div>
    </header>
  )
}
