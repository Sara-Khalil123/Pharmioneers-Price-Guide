import { medications as defaultMedications, Medication } from './data';

const STORAGE_KEY = 'med_price_guide_data_v2';
const STORAGE_TIMESTAMP_KEY = 'med_price_guide_last_sync_v2';
const STORAGE_VERSION_KEY = 'med_price_guide_version_v2';
const CURRENT_APP_DATA_VERSION = '2.1.0';

export interface StorageMetadata {
  lastSync: number | null;
  version: string;
  totalItems: number;
  isCustom: boolean;
}

/**
 * Register Service Worker for true Offline PWA capabilities
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('Offline ServiceWorker registered successfully with scope:', registration.scope);
        },
        (error) => {
          console.warn('ServiceWorker registration failed:', error);
        }
      );
    });
  }
}

/**
 * Load medications from localStorage with instant fallback to default data.
 */
export function loadStoredMedications(): { data: Medication[]; isOfflineLoaded: boolean; metadata: StorageMetadata } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    const storedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

    if (stored) {
      const parsed = JSON.parse(stored) as Medication[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          data: parsed,
          isOfflineLoaded: true,
          metadata: {
            lastSync: storedTimestamp ? parseInt(storedTimestamp, 10) : Date.now(),
            version: storedVersion || CURRENT_APP_DATA_VERSION,
            totalItems: parsed.length,
            isCustom: false
          }
        };
      }
    }
  } catch (err) {
    console.warn('Failed reading from localStorage, falling back to bundled dataset', err);
  }

  // If no cache or error, initialize cache with default dataset
  persistMedications(defaultMedications, CURRENT_APP_DATA_VERSION);

  return {
    data: defaultMedications,
    isOfflineLoaded: false,
    metadata: {
      lastSync: Date.now(),
      version: CURRENT_APP_DATA_VERSION,
      totalItems: defaultMedications.length,
      isCustom: false
    }
  };
}

/**
 * Save medication list into localStorage
 */
export function persistMedications(data: Medication[], version = CURRENT_APP_DATA_VERSION): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_VERSION_KEY, version);
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (err) {
    console.error('Failed saving to localStorage', err);
  }
}

/**
 * Background sync logic:
 * When online, verifies that the latest updates and additions are synced to local storage.
 */
export async function syncMedicationsInBackground(): Promise<{
  success: boolean;
  updated: boolean;
  totalCount: number;
  syncedAt: number;
}> {
  return new Promise((resolve) => {
    try {
      // Compare current stored data with the latest bundled version
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);

      let needUpdate = false;

      if (!stored || storedVersion !== CURRENT_APP_DATA_VERSION) {
        needUpdate = true;
      } else {
        const parsed = JSON.parse(stored) as Medication[];
        // If the bundled data has more items or updated values, refresh
        if (parsed.length !== defaultMedications.length) {
          needUpdate = true;
        }
      }

      if (needUpdate) {
        persistMedications(defaultMedications, CURRENT_APP_DATA_VERSION);
        resolve({
          success: true,
          updated: true,
          totalCount: defaultMedications.length,
          syncedAt: Date.now()
        });
      } else {
        // Just refresh the sync timestamp to show that verification succeeded
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
        resolve({
          success: true,
          updated: false,
          totalCount: defaultMedications.length,
          syncedAt: Date.now()
        });
      }
    } catch (err) {
      console.warn('Background sync warning:', err);
      resolve({
        success: false,
        updated: false,
        totalCount: defaultMedications.length,
        syncedAt: Date.now()
      });
    }
  });
}

/**
 * Format timestamp into friendly Arabic text
 */
export function formatSyncTime(timestamp: number | null): string {
  if (!timestamp) return 'غير محدد';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'منذ لحظات';
  if (diffSec < 3600) return `منذ ${Math.floor(diffSec / 60)} دقيقة`;
  if (diffSec < 86400) return `منذ ${Math.floor(diffSec / 3600)} ساعة`;
  const date = new Date(timestamp);
  return date.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
