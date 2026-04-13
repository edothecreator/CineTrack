import { notFound } from "next/navigation";
import { PersonView } from "@/components/PersonView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonPage({ params }: PageProps) {
  const { id: raw } = await params;
  const n = Math.floor(Number(decodeURIComponent(raw)));
  if (!Number.isFinite(n) || n <= 0) notFound();
  return <PersonView peopleId={n} />;
}
