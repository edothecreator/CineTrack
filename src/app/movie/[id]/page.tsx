import { notFound } from "next/navigation";
import { MovieDetailView } from "@/components/MovieDetailView";
import { resolveMovieDetail } from "@/lib/movieQueries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const movie = await resolveMovieDetail(id);
  if (!movie) return { title: "Not Found" };

  const description = movie.description?.slice(0, 160) ?? "";
  const image = movie.backdropUrl ?? movie.posterUrl;

  return {
    title: movie.title,
    description,
    openGraph: {
      title: `${movie.title} — CineTrack`,
      description,
      images: [{ url: image, width: 1280, height: 720, alt: movie.title }],
      type: movie.kind === "series" ? "video.tv_show" : "video.movie",
    },
    twitter: {
      card: "summary_large_image",
      title: `${movie.title} — CineTrack`,
      description,
      images: [image],
    },
  };
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { id } = await params;
  const movie = await resolveMovieDetail(id);

  if (!movie) {
    notFound();
  }

  const seriesMatch = /^tv-(\d+)$/i.exec(movie.id);
  const seriesNumeric =
    seriesMatch && movie.kind === "series" ? Number(seriesMatch[1]) : null;

  return <MovieDetailView movie={movie} seriesNumeric={seriesNumeric} />;
}
