import type { Dataset } from './csvAnalyzer'

const DB_NAME = 'crm-bigdata'
const DB_VERSION = 1
const STORE = 'datasets'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('No se pudo abrir el almacén de datos.'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = run(tx.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Fallo de almacenamiento local.'))
    tx.oncomplete = () => db.close()
  })
}

export async function saveDatasetToStore(dataset: Dataset): Promise<void> {
  await withStore('readwrite', (store) => store.put(dataset))
}

export async function getDatasetFromStore(id: string): Promise<Dataset | null> {
  const found = await withStore<Dataset | undefined>('readonly', (store) =>
    store.get(id),
  )
  return found ?? null
}
