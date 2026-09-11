/**
 * ManuView Native IndexedDB Storage Engine
 * Provides virtually unlimited, high-performance local storage for manuscript
 * full-text, PDF extractions, citation audits, and 5-persona diagnostic reports.
 * Completely eliminates the 5MB-10MB localStorage QuotaExceededError limitation.
 */

const DB_NAME = "manuview_database_v1";
const DB_VERSION = 1;
const STORE_PROJECTS = "projects";
const STORE_CACHE = "document_cache";

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment"));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error("IndexedDB open error:", error);
        reject(error);
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbPromise;
}

/**
 * Save an item to IndexedDB store
 */
export async function idbSet<T extends { id: string }>(item: T, storeName: string = STORE_PROJECTS): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("idbSet error (falling back to memory):", err);
  }
}

/**
 * Get an item from IndexedDB store by ID
 */
export async function idbGet<T>(id: string, storeName: string = STORE_PROJECTS): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("idbGet error:", err);
    return null;
  }
}

/**
 * Get all items from an IndexedDB store
 */
export async function idbGetAll<T>(storeName: string = STORE_PROJECTS): Promise<T[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("idbGetAll error:", err);
    return [];
  }
}

/**
 * Delete an item from IndexedDB store
 */
export async function idbDelete(id: string, storeName: string = STORE_PROJECTS): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("idbDelete error:", err);
  }
}
