import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthForm } from "../AuthForm";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  return <AuthForm mode="login" />;
}
