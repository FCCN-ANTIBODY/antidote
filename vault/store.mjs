// vault/store.mjs — the injectable storage seam (the reducer/store.mjs contract): an async
// { get, set, delete } over one primitive. memoryStore for tests, idbStore for the browser.
//
// idbStore holds VALUES STRUCTURED-CLONED, never stringified — that is the whole point: a
// non-extractable CryptoKey survives a structured clone into IndexedDB but cannot survive JSON.
// This is how the vault persists an identity without the private half ever existing as bytes the
// page (or an extension) could read (composer/sign.mjs's documented production posture,
// implemented here for the first time in the constellation).

export function memoryStore() {
  const m = new Map();
  return {
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async set(k, v) { m.set(k, v); },
    async delete(k) { m.delete(k); },
  };
}

export function idbStore(dbName = "antidote", storeName = "vault") {
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open(dbName, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(storeName);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const tx = async (mode, op) => {
    const db = await open();
    try {
      return await new Promise((res, rej) => {
        const t = db.transaction(storeName, mode);
        const rq = op(t.objectStore(storeName));
        rq.onsuccess = () => res(rq.result ?? null);
        rq.onerror = () => rej(rq.error);
      });
    } finally { db.close(); }
  };
  return {
    get: (k) => tx("readonly", (s) => s.get(k)),
    set: (k, v) => tx("readwrite", (s) => s.put(v, k)),
    delete: (k) => tx("readwrite", (s) => s.delete(k)),
  };
}
