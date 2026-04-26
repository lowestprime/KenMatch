import { redirect } from "next/navigation";

export const metadata = {
  title: "Profiles",
  description: "KenMatch profiles are opened from contributor references on Kens, comments, and governance records.",
};

export default function PeoplePage() {
  redirect("/kens");
}
