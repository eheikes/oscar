import Cache from './cache';

const apiUrl = 'http://localhost:8080';

export interface Collector {
  id: string;
  name: string;
  numErrors: number;
}

export interface CollectorLog {
  id: number;
  timestamp: string;
  log: string;
  numErrors: number;
}

export interface Item {
  id: number;
  added: string;
  deleted: string|null;
  url: string;
  title: string;
  author: string|null;
  summary: string|null;
  categories: string[];
  length: number|null;
  rating: number|null;
  due: string|null;
  rank: number;
  expectedRank: number|null;
}

export interface Type {
  id: string;
  readable: string|null;
}

const genericRoot = 'all';

class Database {
  private collectorLogs: Cache<CollectorLog[]>;
  private collectors: Cache<Collector[]>;
  private itemDetails: Cache<Item>;
  private items: Cache<Item[]>;
  private types: Cache<Type[]>;

  constructor() {
    this.collectorLogs = new Cache<CollectorLog[]>();
    this.collectors = new Cache<Collector[]>();
    this.itemDetails = new Cache<Item>();
    this.items = new Cache<Item[]>();
    this.types = new Cache<Type[]>();
  }

  public deleteItem(typeId: string, itemId: number): Promise<Item> {
    return fetch(`${apiUrl}/types/${typeId}/${itemId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    }).then(response => {
      if (!response.ok) {
        throw new Error('Could not delete item');
      }
      return response.json() as Promise<Item>;
    }).then(item => {
      this.itemDetails.save(itemId, item);
      return item;
    });
  }

  public getCollectorLogs(collectorId: string): Promise<CollectorLog[]> {
    if (this.collectorLogs.has(collectorId)) {
      return this.collectorLogs.get(collectorId);
    }
    return fetch(`${apiUrl}/collectors/${collectorId}/logs`).then(response => {
      if (!response.ok) {
        throw new Error('Could not retrieve collector logs from server');
      }
      return response.json() as Promise<CollectorLog[]>;
    }).then(logs => {
      this.collectorLogs.save(collectorId, logs);
      return logs;
    });
  }

  public getCollectors(): Promise<Collector[]> {
    if (this.collectors.has(genericRoot)) {
      return this.collectors.get(genericRoot);
    }
    return fetch(`${apiUrl}/collectors`).then(response => {
      if (!response.ok) {
        throw new Error('Could not retrieve collectors from server');
      }
      return response.json() as Promise<Collector[]>;
    }).then(collectors => {
      this.collectors.save(genericRoot, collectors);
      return collectors;
    });
  }

  public getItem(typeId: string, itemId: number): Promise<Item> {
    if (this.itemDetails.has(itemId)) {
      return this.itemDetails.get(itemId);
    }
    return fetch(`${apiUrl}/types/${typeId}/${itemId}`).then(response => {
      if (!response.ok) {
        throw new Error('Could not retrieve item details from server');
      }
      return response.json() as Promise<Item>;
    }).then(item => {
      this.itemDetails.save(itemId, item);
      return item;
    });
  }

  public getItems(typeId: string): Promise<Item[]> {
    if (this.items.has(typeId)) {
      return this.items.get(typeId);
    }
    return fetch(`${apiUrl}/types/${typeId}`).then(response => {
      if (!response.ok) {
        throw new Error('Could not retrieve items from server');
      }
      return response.json() as Promise<Item[]>;
    }).then(items => {
      this.items.save(typeId, items);
      return items;
    });
  }

  public getTypes(): Promise<Type[]> {
    if (this.types.has(genericRoot)) {
      return this.types.get(genericRoot);
    }
    return fetch(`${apiUrl}/types`).then(response => {
      if (!response.ok) {
        throw new Error('Could not retrieve types from server');
      }
      return response.json() as Promise<Type[]>;
    }).then(types => {
      this.types.save(genericRoot, types);
      return types;
    });
  }

  public setRank(typeId: string, itemId: number, rank: number): Promise<Item> {
    let request = JSON.stringify({
      expectedRank: rank
    });
    return fetch(`${apiUrl}/types/${typeId}/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: request
    }).then(response => {
      if (!response.ok) {
        throw new Error('Could not save rank');
      }
      return response.json() as Promise<Item>;
    }).then(item => {
      this.itemDetails.save(String(itemId), item);
      return item;
    });
  }
}

export const database = new Database();
