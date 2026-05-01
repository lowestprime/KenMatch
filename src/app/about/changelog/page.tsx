import { redirect } from "next/navigation";

export const metadata = {
  title: "Changelog",
  description: "Public KenMatch release notes covering product, data, security, and operations changes.",
};

export default function ChangelogPage() {
  redirect("/about#changelog");
}
