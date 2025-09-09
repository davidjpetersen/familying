import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <header className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto border-b border-gray-200">
      {/* Logo */}
      <SignedOut>
        <Link href="/" className="text-2xl font-bold text-purple-600 hover:text-purple-700 transition-colors">
          Familying.org
        </Link>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className="text-2xl font-bold text-purple-600 hover:text-purple-700 transition-colors">
          Familying.org
        </Link>
      </SignedIn>

      {/* Navigation */}
      <nav className="flex gap-6 items-center">
        <SignedOut>
          {/* Unauthenticated: Simple navigation */}
          <Link href="/subscription" className="text-gray-600 hover:text-purple-600 transition-colors">
            Subscribe
          </Link>
          <SignInButton>
            <Button variant="default">Sign In</Button>
          </SignInButton>
        </SignedOut>
        
        <SignedIn>
          {/* Authenticated: Dashboard-focused navigation */}
          <Link href="/my-cookbook" className="text-gray-600 hover:text-purple-600 transition-colors">
            My Cookbook
          </Link>
          <UserButton />
        </SignedIn>
      </nav>
    </header>
  );
};

export default Navbar;
