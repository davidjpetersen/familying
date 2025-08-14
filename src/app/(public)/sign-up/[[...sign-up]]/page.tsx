"use client"

import { SignUp } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="flex justify-center py-10">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  )
}
