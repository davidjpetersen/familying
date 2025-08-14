"use client"

import { SignIn } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="flex justify-center py-10">
  <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  )
}
