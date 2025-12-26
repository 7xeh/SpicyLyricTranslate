/**
 * Storage utility for Spicy Lyric Translater
 * Handles localStorage operations with proper namespacing
 */

const STORAGE_PREFIX = "spicy-lyric-translater:";

// Max storage size to prevent quota exceeded errors (5MB typical limit)
const MAX_STORAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB to leave buffer

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Get approximate size of all extension storage
 */
function getStorageSize(): number {
    let total = 0;
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) {
                const value = localStorage.getItem(key);
                if (value) {
                    total += key.length + value.length;
                }
            }
        }
    } catch (e) {
        // Ignore errors
    }
    return total * 2; // UTF-16 uses 2 bytes per character
}

export const storage = {
    get(key: string): string | null {
        try {
            if (!isLocalStorageAvailable()) return null;
            return localStorage.getItem(STORAGE_PREFIX + key);
        } catch (e) {
            console.error("[SpicyLyricTranslater] Storage get error:", e);
            return null;
        }
    },

    set(key: string, value: string): boolean {
        try {
            if (!isLocalStorageAvailable()) return false;
            
            // Check storage size before writing large values
            if (value.length > 10000) {
                const currentSize = getStorageSize();
                if (currentSize + value.length * 2 > MAX_STORAGE_SIZE_BYTES) {
                    console.warn("[SpicyLyricTranslater] Storage limit approaching, clearing old cache");
                    this.remove('translation-cache');
                }
            }
            
            localStorage.setItem(STORAGE_PREFIX + key, value);
            return true;
        } catch (e) {
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                console.warn("[SpicyLyricTranslater] Storage quota exceeded, clearing cache");
                this.remove('translation-cache');
                try {
                    localStorage.setItem(STORAGE_PREFIX + key, value);
                    return true;
                } catch {
                    return false;
                }
            }
            console.error("[SpicyLyricTranslater] Storage set error:", e);
            return false;
        }
    },

    remove(key: string): void {
        try {
            if (!isLocalStorageAvailable()) return;
            localStorage.removeItem(STORAGE_PREFIX + key);
        } catch (e) {
            console.error("[SpicyLyricTranslater] Storage remove error:", e);
        }
    },

    getJSON<T>(key: string, defaultValue: T): T {
        try {
            const value = this.get(key);
            if (value === null) return defaultValue;
            return JSON.parse(value) as T;
        } catch (e) {
            console.error("[SpicyLyricTranslater] Storage getJSON error:", e);
            return defaultValue;
        }
    },

    setJSON<T>(key: string, value: T): boolean {
        try {
            return this.set(key, JSON.stringify(value));
        } catch (e) {
            console.error("[SpicyLyricTranslater] Storage setJSON error:", e);
            return false;
        }
    },
    
    /**
     * Get storage usage statistics
     */
    getStats(): { usedBytes: number; maxBytes: number; percentUsed: number } {
        const used = getStorageSize();
        return {
            usedBytes: used,
            maxBytes: MAX_STORAGE_SIZE_BYTES,
            percentUsed: Math.round((used / MAX_STORAGE_SIZE_BYTES) * 100)
        };
    },
    
    /**
     * Clear all extension storage
     */
    clearAll(): void {
        try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(STORAGE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.error("[SpicyLyricTranslater] Storage clearAll error:", e);
        }
    }
};

export default storage;
