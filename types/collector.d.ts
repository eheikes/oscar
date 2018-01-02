//
// A log is created when a source is collected.
//
interface OscarCollectorLog {
  id: number;
  timestamp: string;
  log: string;
  numErrors: number;
}

//
// Collectors gather items from a given source.
//
interface OscarCollector {
  id: string;
  name: string; // readable name
  logs: OscarCollectorLog[]; // ordered from newest -> oldest
  numErrors: number; // number of errors in most recent log

  // Retrieves the current item collection from the given source.
  collect(source: OscarSource): Promise<OscarItem[]>;

  // Collects the given item's details.
  collect(itemId: string): Promise<OscarItem>;
}
