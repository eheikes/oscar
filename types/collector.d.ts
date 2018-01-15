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
  id: string; // internal ID
  name: string; // readable name
  logs: OscarCollectorLog[]; // ordered from newest -> oldest
  numErrors: number; // number of errors in most recent log

  // Retrieves the collection of items.
  retrieve(): Promise<OscarItem[]>;
}
