import { SearchResults } from "@/components/SearchResults";

export const metadata = {
  title: "Discover — CineTrack",
  description: "Discover movies, series, and anime via TMDB",
};

export default function SearchPage() {
  return (
    <div className="min-h-screen">
      <div className="page-header">
        <div className="container max-w-4xl">
          <p className="label-overline mb-3">Catalog</p>
          <h1 className="text-hero text-foreground">Discover</h1>
          <p className="text-body mt-3 max-w-md">
            Search TMDB — movies, series, and anime.
          </p>
        </div>
      </div>
      <div className="container max-w-7xl py-8 sm:py-10">
        <SearchResults />
      </div>
    </div>
  );
}
