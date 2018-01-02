abstract class BaseCollector implements OscarCollector {
  abstract id: string
  abstract name: string
  logs: OscarCollectorLog[] = []

  get numErrors () {
    if (this.logs.length === 0) { return 0 }
    return this.logs[0].numErrors
  }

  abstract collect (source: OscarSource): Promise<OscarItem[]>
  abstract collect (itemId: string): Promise<OscarItem>
}
