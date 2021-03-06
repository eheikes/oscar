import * as uuid from 'uuid/v4'

export abstract class BaseCollector implements OscarCollector {
  abstract id: string   // internal alphanumeric ID
  abstract name: string // human-readable name
  logs: OscarCollectorLog[] = [] // logs in descending order

  get numErrors () {
    if (this.logs.length === 0) { return 0 }
    return this.logs[0].numErrors
  }

  // The constructor for a collector usually takes a URI.
  // It can also take an optional object with options.
  constructor () {
    // base class does nothing
  }

  addLog (log: OscarCollectorLog) {
    this.logs.unshift(log)
  }

  createLog (message: string = '', numErrors = 0): OscarCollectorLog {
    return {
      id: uuid(),
      timestamp: new Date(),
      log: message,
      numErrors: numErrors
    }
  }

  // Returns the items from the collector.
  // It should add a log to this.logs (whether successful or not).
  // If an error occurs, it should return an empty array.
  abstract async retrieve (): Promise<OscarItem[]>
}
