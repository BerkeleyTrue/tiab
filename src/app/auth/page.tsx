import { api } from "@/trpc/server";
import { SignUpForm } from "./login";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await api.auth.getUser();

  if (user) {
    redirect("/");
  }

  return <SignUpForm />;
}
