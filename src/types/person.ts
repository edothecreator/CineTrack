export type PersonCredit = {
  slug: string;
  title: string;
  kind: "movie" | "series";
};

export type PersonPublicDetail = {
  id: number;
  name: string;
  imageUrl: string | null;
  credits: PersonCredit[];
};
