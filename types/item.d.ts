interface OscarItem {
  uuid: string; // UUID in string form
  uri: string; // source-specific ID
  title: string;
  author: string | null;
  summary: string | null;
  length: number | null;
  rating: number | null;
  due: Date | null;
  rank: number;
  expectedRank: number | null;
  categories: string;
  createdAt: Date;
  deletedAt: Date | null;
}
