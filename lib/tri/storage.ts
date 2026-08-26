// Persistance locale (IndexedDB) pour l'outil de tri — remplace le
// `window.storage` propre à l'environnement Claude, qui n'existe pas dans un
// navigateur classique. Même esprit : best-effort, l'appli continue de
// fonctionner si le stockage échoue (mode navigation privée, quota atteint...).

const DB_NAME = "hpr-tri";
const STORE_NAME = "kv";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storageSave(key: string, value: unknown): Promise<boolean> {
  try {
    await withStore("readwrite", (store) => store.put(JSON.stringify(value), key));
    return true;
  } catch {
    return false;
  }
}

export async function storageLoad<T>(key: string): Promise<T | null> {
  try {
    const raw = await withStore<string | undefined>("readonly", (store) => store.get(key));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function storageDelete(key: string): Promise<void> {
  try {
    await withStore("readwrite", (store) => store.delete(key));
  } catch {
    // ignore — rien à supprimer ou déjà absent
  }
}

export async function storageListKeys(prefix: string): Promise<string[]> {
  try {
    const db = await openDB();
    return await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const range = IDBKeyRange.bound(prefix, prefix + "￿", false, false);
      const request = store.getAllKeys(range);
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}
