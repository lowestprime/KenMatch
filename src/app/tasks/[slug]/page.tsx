import { permanentRedirect } from "next/navigation";

export default async function TaskRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/kens/${slug}`);
}
