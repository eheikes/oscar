export default class Cache<T> {
  private cache: Map<string, T|Promise<T>>;

  constructor() {
    this.cache = new Map<string, T>();
  }

  public get(key: string|number): Promise<T|undefined> {
    let k = String(key);
    let val = this.cache.get(k);
    if (val instanceof Promise) {
      return val;
    }
    return Promise.resolve(val);
  }

  public has(key: string|number): boolean {
    let k = String(key);
    return this.cache.has(k);
  }

  public save(key: string|number, val: T) {
    let k = String(key);
    this.cache.set(k, val);
  }

  public savePromise(key: string|number, promise: Promise<T>) {
    let k = String(key);
    this.cache.set(k, promise);
  }
}
