interface OscarItem {
  uuid: string; // UUID in string form
  uri: string; // source-specific ID
  title: string;
  author: string | null;
  summary: string | null;
  language: string | null;
  imageUri: string | null;
  length: number | null;
  rating: number | null;
  due: Date | null;
  rank: number | null;
  expectedRank: number | null;
  categories: string[];
  createdAt: Date;
  deletedAt: Date | null;
}
