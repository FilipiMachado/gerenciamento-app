// IndexedDB para cache offline da lista de compras

const DB_NAME = 'GerenciamentoDB'
const DB_VERSION = 1
const STORE_NAME = 'shopping_list'

export interface ShoppingListItemOffline {
  id?: string
  user_id: string
  item_name: string
  quantity: number
  estimated_value: number
  is_purchased: boolean
  created_at: string
  updated_at: string
  synced: boolean
  pendingAction: 'create' | 'update' | 'delete' | null
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('user_id', 'user_id', { unique: false })
        store.createIndex('synced', 'synced', { unique: false })
      }
    }
  })
}

export const addItemToOfflineCache = async (item: ShoppingListItemOffline): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(item)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const updateItemInOfflineCache = async (item: ShoppingListItemOffline): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(item)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const deleteItemFromOfflineCache = async (id: string): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const getOfflineItems = async (userId: string): Promise<ShoppingListItemOffline[]> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('user_id')
    const request = index.getAll(userId)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getPendingSyncItems = async (userId: string): Promise<ShoppingListItemOffline[]> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('user_id')
    const request = index.getAll(userId)

    request.onsuccess = () => {
      const items = request.result.filter(item => !item.synced && item.pendingAction)
      resolve(items)
    }
    request.onerror = () => reject(request.error)
  })
}

export const markItemAsSynced = async (id: string): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const item = getRequest.result
      if (item) {
        item.synced = true
        item.pendingAction = null
        const putRequest = store.put(item)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        resolve()
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

export const clearOfflineCache = async (): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
