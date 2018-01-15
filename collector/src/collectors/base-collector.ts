export abstract class BaseCollector implements OscarCollector {
  abstract id: string
  abstract name: string
  logs: OscarCollectorLog[] = []

  get numErrors () {
    if (this.logs.length === 0) { return 0 }
    return this.logs[0].numErrors
  }

  abstract retrieve (): Promise<OscarItem[]>
}
