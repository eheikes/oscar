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

export interface Cache {
  collectorLogs: {[id: string]: CollectorLog[]};
  collectors: Collector[]|null;
  itemDetails: {[id: number]: Item};
  items: {[type: string]: Item[]};
  types: Type[]|null;
}

const cache: Cache = {
  collectorLogs: {},
  collectors: null,
  itemDetails: {},
  items: {},
  types: null
};

class Database {
  public getCollectorLogs(collectorId: string): Promise<CollectorLog[]> {
    if (cache.collectorLogs[collectorId]) {
      return Promise.resolve(cache.collectorLogs[collectorId]);
    }
    return fetch(`${apiUrl}/collectors/${collectorId}/logs`).then(response => {
      if (!response.ok) {
        throw new Error('Could not retrieve collector logs from server');
      }
      return response.json() as Promise<CollectorLog[]>;
    }).then(logs => {
      cache.collectorLogs[collectorId] = logs;
      return logs;
    });
  }

  public getCollectors(): Promise<Collector[]> {
    if (cache.collectors) {
      return Promise.resolve(cache.collectors);
    }
    return fetch(`${apiUrl}/collectors`).then(response => {
      if (!response.ok) {
        throw new Error('Could not retrieve collectors from server');
      }
      return response.json() as Promise<Collector[]>;
    }).then(collectors => {
      cache.collectors = collectors;
      return collectors;
    });
  }

  public getItem(typeId: string, itemId: number): Promise<Item> {
    if (cache.itemDetails[itemId]) {
      return Promise.resolve(cache.itemDetails[itemId]);
    }
    return fetch(`${apiUrl}/types/${typeId}/${itemId}`).then(response => {
      if (!response.ok) {
        throw new Error('Could not retrieve item details from server');
      }
      return response.json() as Promise<Item>;
    }).then(item => {
      cache.itemDetails[itemId] = item;
      return item;
    });
  }

  public getItems(typeId: string): Promise<Item[]> {
    if (cache.items[typeId]) {
      return Promise.resolve(cache.items[typeId]);
    }
    return fetch(`${apiUrl}/types/${typeId}`).then(response => {
      if (!response.ok) {
        throw new Error('Could not retrieve items from server');
      }
      return response.json() as Promise<Item[]>;
    }).then(items => {
      cache.items[typeId] = items;
      return items;
    });
  }

  public getTypes(): Promise<Type[]> {
    if (cache.types) {
      return Promise.resolve(cache.types);
    }
    return fetch(`${apiUrl}/types`).then(response => {
      if (!response.ok) {
        throw new Error('Could not retrieve types from server');
      }
      return response.json() as Promise<Type[]>;
    }).then(types => {
      cache.types = types;
      return types;
    });
  }
}

export const database = new Database();
