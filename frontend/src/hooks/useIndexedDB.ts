import { useEffect, useCallback } from 'react';
import { useCurationStore } from '../stores/curationStore';
import { APP_CONFIG } from '../utils/constants';

export function useIndexedDB() {
  const { groups, setGroups } = useCurationStore();

  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(APP_CONFIG.DB_NAME, APP_CONFIG.DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(APP_CONFIG.STORE_GROUPS)) {
          db.createObjectStore(APP_CONFIG.STORE_GROUPS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, []);

  // Save state checkpoint
  const saveCheckpoint = useCallback(async () => {
    if (groups.length === 0) return;
    try {
      const db = await openDB();
      const tx = db.transaction(APP_CONFIG.STORE_GROUPS, 'readwrite');
      const store = tx.objectStore(APP_CONFIG.STORE_GROUPS);

      // Save serializable group metadata (excluding raw File and Blob to prevent quota overflow)
      for (const group of groups) {
        const serializableGroup = {
          ...group,
          images: group.images.map((img) => ({
            id: img.id,
            name: img.name,
            size: img.size,
            type: img.type,
            lastModified: img.lastModified,
            dateTimeOriginal: img.dateTimeOriginal,
            thumbnailUrl: img.thumbnailUrl,
          })),
        };
        store.put(serializableGroup);
      }
    } catch (err) {
      console.warn('IndexedDB checkpoint save failed:', err);
    }
  }, [groups, openDB]);

  // Load checkpoint on initial mount
  const restoreCheckpoint = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(APP_CONFIG.STORE_GROUPS, 'readonly');
      const store = tx.objectStore(APP_CONFIG.STORE_GROUPS);
      const req = store.getAll();

      req.onsuccess = () => {
        if (req.result && req.result.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setGroups(req.result as any);
        }
      };
    } catch (err) {
      console.warn('IndexedDB restore failed:', err);
    }
  }, [openDB, setGroups]);

  // Auto-save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCheckpoint();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveCheckpoint]);

  return { saveCheckpoint, restoreCheckpoint };
}
