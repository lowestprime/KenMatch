import { redirect } from "next/navigation";

export default function ChangelogRedirectPage() {
  redirect("/about#changelog");
}
