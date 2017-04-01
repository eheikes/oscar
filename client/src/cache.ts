export default class Cache<T> {
  private cache: Map<string, T>;

  constructor() {
    this.cache = new Map<string, T>();
  }

  public get(key: string|number): Promise<T> {
    let k = String(key);
    return Promise.resolve(this.cache.get(k));
  }

  public has(key: string|number): boolean {
    let k = String(key);
    return typeof this.cache.get(k) !== 'undefined';
  }

  public save(key: string|number, val: T) {
    let k = String(key);
    this.cache.set(k, val);
  }
}
