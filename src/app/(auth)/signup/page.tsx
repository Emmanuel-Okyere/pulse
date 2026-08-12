import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthForm } from "../AuthForm";

export default async function SignupPage() {
  if (await getSession()) redirect("/dashboard");
  return <AuthForm mode="signup" />;
}
