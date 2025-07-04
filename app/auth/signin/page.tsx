import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SignInForm from "./signin-form"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
}

export default async function SignInPage() {
  const session = await auth()

  if (session) {
    redirect("/")
  }

  return <SignInForm />
} 