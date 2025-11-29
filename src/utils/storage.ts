/**
 * Storage utility for Spicy Lyric Translater
 * Handles localStorage operations with proper namespacing
 */

const STORAGE_PREFIX = "spicy-lyric-translater:";

export const storage = {
    get(key: string): string | null {
        try {
            return localStorage.getItem(STORAGE_PREFIX + key);
        } catch (e) {
            console.error("[SpicyLyricTranslater] Storage get error:", e);
            return null;
        }
    },

    set(key: string, value: string): void {
        try {
            localStorage.setItem(STORAGE_PREFIX + key, value);
        } catch (e) {
            console.error("[SpicyLyricTranslater] Storage set error:", e);
        }
    },

    remove(key: string): void {
        try {
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

    setJSON<T>(key: string, value: T): void {
        try {
            this.set(key, JSON.stringify(value));
        } catch (e) {
            console.error("[SpicyLyricTranslater] Storage setJSON error:", e);
        }
    }
};

export default storage;
