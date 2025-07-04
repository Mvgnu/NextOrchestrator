import { Metadata } from "next"
import SignUpForm from "./signup-form"

export const metadata: Metadata = {
  title: "Sign Up - MARS Next",
  description: "Create a new MARS Next account",
}

export default function SignUpPage() {
  return <SignUpForm />
} 