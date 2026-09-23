import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';

const DB_NAME = 'gym-scheduler-db';
const DB_VERSION = 1;
const STORE_NAME = 'files';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function putFile(key: string, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, blob, key);
}

export async function getFile(key: string): Promise<Blob | undefined> {
  const db = await getDb();
  return db.get(STORE_NAME, key);
}

export async function deleteFile(key: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, key);
}


// DBファイルごと削除して再作成する（物理ディスク領域を即座に解放する唯一の方法）
export async function resetDatabase(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    // ブロックされた場合もそのまま進む（ページリロードで接続が切れ削除が完了する）
    req.onblocked = () => resolve();
  });
}

export async function listFileKeys(): Promise<string[]> {
  const db = await getDb();
  const keys = await db.getAllKeys(STORE_NAME);
  return keys.filter((key): key is string => typeof key === 'string');
}
