/**
 * Translation Service for Spicy Lyric Translater
 * Uses multiple translation APIs with fallback support
 */

import storage from './storage';

export interface TranslationResult {
    originalText: string;
    translatedText: string;
    detectedLanguage?: string;
    targetLanguage: string;
    wasTranslated?: boolean; // false if source language matches target
}

export interface TranslationCache {
    [key: string]: {
        translation: string;
        timestamp: number;
    };
}

// API preference types
export type ApiPreference = 'google' | 'libretranslate' | 'custom';

// API settings
let preferredApi: ApiPreference = 'google';
let customApiUrl: string = '';

// Rate limiting configuration
const RATE_LIMIT = {
    minDelayMs: 100,      // Minimum delay between API calls
    maxDelayMs: 2000,     // Maximum delay (for exponential backoff)
    maxRetries: 3,        // Maximum retry attempts
    backoffMultiplier: 2  // Exponential backoff multiplier
};

// Last API call timestamp for rate limiting
let lastApiCallTime = 0;

// Use a unique separator that won't appear in lyrics
const BATCH_SEPARATOR = '\n\u200B\u2063\u200B\n'; // Zero-width space + invisible separator + zero-width space
const BATCH_SEPARATOR_REGEX = /\n?[\u200B\u2063]+\n?/g;

/**
 * Delay execution with rate limiting
 */
async function rateLimitedDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    if (timeSinceLastCall < RATE_LIMIT.minDelayMs) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.minDelayMs - timeSinceLastCall));
    }
    lastApiCallTime = Date.now();
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = RATE_LIMIT.maxRetries,
    baseDelay: number = RATE_LIMIT.minDelayMs
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            await rateLimitedDelay();
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            // Don't retry on client errors (4xx)
            if (error instanceof Error && error.message.includes('40')) {
                throw error;
            }
            
            if (attempt < maxRetries) {
                const delay = Math.min(
                    baseDelay * Math.pow(RATE_LIMIT.backoffMultiplier, attempt),
                    RATE_LIMIT.maxDelayMs
                );
                console.log(`[SpicyLyricTranslater] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError || new Error('All retry attempts failed');
}

/**
 * Set the preferred API for translations
 */
export function setPreferredApi(api: ApiPreference, customUrl?: string): void {
    preferredApi = api;
    if (customUrl !== undefined) {
        customApiUrl = customUrl;
    }
    console.log(`[SpicyLyricTranslater] API preference set to: ${api}${api === 'custom' ? ` (${customUrl})` : ''}`);
}

/**
 * Get current API preference
 */
export function getPreferredApi(): { api: ApiPreference; customUrl: string } {
    return { api: preferredApi, customUrl };
}

// Cache expiry time: 7 days
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500; // Reduced from 1000 to prevent excessive storage use

// Supported languages (sorted alphabetically by name)
export const SUPPORTED_LANGUAGES: { code: string; name: string }[] = [
    { code: 'af', name: 'Afrikaans' },
    { code: 'sq', name: 'Albanian' },
    { code: 'am', name: 'Amharic' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hy', name: 'Armenian' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'eu', name: 'Basque' },
    { code: 'be', name: 'Belarusian' },
    { code: 'bn', name: 'Bengali' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'ceb', name: 'Cebuano' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
    { code: 'eo', name: 'Esperanto' },
    { code: 'et', name: 'Estonian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'gl', name: 'Galician' },
    { code: 'ka', name: 'Georgian' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'ht', name: 'Haitian Creole' },
    { code: 'ha', name: 'Hausa' },
    { code: 'haw', name: 'Hawaiian' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hmn', name: 'Hmong' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'ig', name: 'Igbo' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ga', name: 'Irish' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'jv', name: 'Javanese' },
    { code: 'kn', name: 'Kannada' },
    { code: 'kk', name: 'Kazakh' },
    { code: 'km', name: 'Khmer' },
    { code: 'rw', name: 'Kinyarwanda' },
    { code: 'ko', name: 'Korean' },
    { code: 'ku', name: 'Kurdish' },
    { code: 'ky', name: 'Kyrgyz' },
    { code: 'lo', name: 'Lao' },
    { code: 'la', name: 'Latin' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'lb', name: 'Luxembourgish' },
    { code: 'mk', name: 'Macedonian' },
    { code: 'mg', name: 'Malagasy' },
    { code: 'ms', name: 'Malay' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'mt', name: 'Maltese' },
    { code: 'mi', name: 'Maori' },
    { code: 'mr', name: 'Marathi' },
    { code: 'mn', name: 'Mongolian' },
    { code: 'my', name: 'Myanmar (Burmese)' },
    { code: 'ne', name: 'Nepali' },
    { code: 'no', name: 'Norwegian' },
    { code: 'ny', name: 'Nyanja (Chichewa)' },
    { code: 'or', name: 'Odia (Oriya)' },
    { code: 'ps', name: 'Pashto' },
    { code: 'fa', name: 'Persian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sm', name: 'Samoan' },
    { code: 'gd', name: 'Scots Gaelic' },
    { code: 'sr', name: 'Serbian' },
    { code: 'st', name: 'Sesotho' },
    { code: 'sn', name: 'Shona' },
    { code: 'sd', name: 'Sindhi' },
    { code: 'si', name: 'Sinhala' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'so', name: 'Somali' },
    { code: 'es', name: 'Spanish' },
    { code: 'su', name: 'Sundanese' },
    { code: 'sw', name: 'Swahili' },
    { code: 'sv', name: 'Swedish' },
    { code: 'tl', name: 'Tagalog (Filipino)' },
    { code: 'tg', name: 'Tajik' },
    { code: 'ta', name: 'Tamil' },
    { code: 'tt', name: 'Tatar' },
    { code: 'te', name: 'Telugu' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'tk', name: 'Turkmen' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'ug', name: 'Uyghur' },
    { code: 'uz', name: 'Uzbek' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'cy', name: 'Welsh' },
    { code: 'xh', name: 'Xhosa' },
    { code: 'yi', name: 'Yiddish' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'zu', name: 'Zulu' },
];

/**
 * Get cached translation
 */
function getCachedTranslation(text: string, targetLang: string): string | null {
    const cache = storage.getJSON<TranslationCache>('translation-cache', {});
    const key = `${targetLang}:${text}`;
    const cached = cache[key];
    
    if (cached) {
        // Check if cache is still valid
        if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
            return cached.translation;
        }
    }
    
    return null;
}

/**
 * Cache a translation
 */
function cacheTranslation(text: string, targetLang: string, translation: string): void {
    const cache = storage.getJSON<TranslationCache>('translation-cache', {});
    const key = `${targetLang}:${text}`;
    
    cache[key] = {
        translation,
        timestamp: Date.now()
    };
    
    // Limit cache size
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
        // Remove oldest entries + expired entries
        const now = Date.now();
        const sorted = keys
            .map(k => ({ key: k, entry: cache[k] }))
            .sort((a, b) => a.entry.timestamp - b.entry.timestamp);
        
        // Remove expired first, then oldest if still over limit
        const toRemove = sorted.filter(item => 
            now - item.entry.timestamp > CACHE_EXPIRY
        ).map(item => item.key);
        
        // If still over limit, remove oldest non-expired
        const remaining = keys.length - toRemove.length;
        if (remaining > MAX_CACHE_ENTRIES) {
            const validSorted = sorted.filter(item => 
                now - item.entry.timestamp <= CACHE_EXPIRY
            );
            const additionalRemove = validSorted
                .slice(0, remaining - MAX_CACHE_ENTRIES)
                .map(item => item.key);
            toRemove.push(...additionalRemove);
        }
        
        toRemove.forEach(k => delete cache[k]);
    }
    
    storage.setJSON('translation-cache', cache);
}

/**
 * Translate using Google Translate (free API via scraping)
 * Returns both the translation and detected source language
 */
async function translateWithGoogle(text: string, targetLang: string): Promise<{ translation: string; detectedLang: string }> {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodedText}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the response - Google returns an array of arrays
    // data[0] contains translation segments, data[2] contains detected language
    const detectedLang = data[2] || 'unknown';
    
    if (data && data[0]) {
        let translation = '';
        for (const sentence of data[0]) {
            if (sentence && sentence[0]) {
                translation += sentence[0];
            }
        }
        if (translation) {
            return { translation, detectedLang };
        }
    }
    
    throw new Error('Invalid response from Google Translate');
}

/**
 * Translate using LibreTranslate (fallback)
 */
async function translateWithLibreTranslate(text: string, targetLang: string): Promise<string> {
    // Using a public LibreTranslate instance
    const url = 'https://libretranslate.de/translate';
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: text,
            source: 'auto',
            target: targetLang,
            format: 'text'
        })
    });
    
    if (!response.ok) {
        throw new Error(`LibreTranslate API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.translatedText;
}

/**
 * Translate using a custom 3rd party API
 * Supports common translation API formats
 */
async function translateWithCustomApi(text: string, targetLang: string): Promise<{ translation: string; detectedLang?: string }> {
    if (!customApiUrl) {
        throw new Error('Custom API URL not configured');
    }
    
    // Try to detect API format and make appropriate request
    // Format 1: POST with JSON body (most common)
    try {
        const response = await fetch(customApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                q: text, // Alternative field name
                source: 'auto',
                source_lang: 'auto',
                sourceLang: 'auto',
                target: targetLang,
                target_lang: targetLang,
                targetLang: targetLang,
                to: targetLang,
                format: 'text'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Custom API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Try to extract translation from common response formats
        const translation = data.translatedText || 
                          data.translated_text || 
                          data.translation || 
                          data.result || 
                          data.text ||
                          (data.translations && data.translations[0]?.text) ||
                          (data.data && data.data.translatedText) ||
                          (Array.isArray(data) && data[0]?.translatedText);
        
        if (translation) {
            return { 
                translation,
                detectedLang: data.detectedLanguage || data.detected_language || data.sourceLang || data.src
            };
        }
        
        throw new Error('Could not parse translation from API response');
    } catch (error) {
        console.error('[SpicyLyricTranslater] Custom API error:', error);
        throw error;
    }
}

/**
 * Check if detected language matches target language
 * Handles language variants (e.g., zh and zh-TW both start with 'zh')
 */
function isSameLanguage(detected: string, target: string): boolean {
    if (!detected || detected === 'unknown') return false;
    
    const normalizedDetected = detected.toLowerCase().split('-')[0];
    const normalizedTarget = target.toLowerCase().split('-')[0];
    
    return normalizedDetected === normalizedTarget;
}

/**
 * Main translation function with caching and fallback
 * Skips translation if source language matches target language
 * Uses preferred API based on settings
 */
export async function translateText(text: string, targetLang: string): Promise<TranslationResult> {
    // Check cache first
    const cached = getCachedTranslation(text, targetLang);
    if (cached) {
        return {
            originalText: text,
            translatedText: cached,
            targetLanguage: targetLang
        };
    }
    
    // Define translation attempts based on preferred API
    const tryGoogle = async () => {
        const result = await translateWithGoogle(text, targetLang);
        return { translation: result.translation, detectedLang: result.detectedLang };
    };
    
    const tryLibreTranslate = async () => {
        const translation = await translateWithLibreTranslate(text, targetLang);
        return { translation, detectedLang: undefined };
    };
    
    const tryCustom = async () => {
        const result = await translateWithCustomApi(text, targetLang);
        return { translation: result.translation, detectedLang: result.detectedLang };
    };
    
    // Order APIs based on preference
    let primaryApi: () => Promise<{ translation: string; detectedLang?: string }>;
    let fallbackApis: (() => Promise<{ translation: string; detectedLang?: string }>)[] = [];
    
    switch (preferredApi) {
        case 'libretranslate':
            primaryApi = tryLibreTranslate;
            fallbackApis = [tryGoogle];
            break;
        case 'custom':
            primaryApi = tryCustom;
            fallbackApis = [tryGoogle, tryLibreTranslate];
            break;
        case 'google':
        default:
            primaryApi = tryGoogle;
            fallbackApis = [tryLibreTranslate];
            break;
    }
    
    // Try primary API first
    try {
        const result = await primaryApi();
        
        // Skip if source language is same as target
        if (result.detectedLang && isSameLanguage(result.detectedLang, targetLang)) {
            cacheTranslation(text, targetLang, text);
            return {
                originalText: text,
                translatedText: text,
                detectedLanguage: result.detectedLang,
                targetLanguage: targetLang,
                wasTranslated: false
            };
        }
        
        cacheTranslation(text, targetLang, result.translation);
        return {
            originalText: text,
            translatedText: result.translation,
            detectedLanguage: result.detectedLang,
            targetLanguage: targetLang,
            wasTranslated: true
        };
    } catch (primaryError) {
        console.warn(`[SpicyLyricTranslater] Primary API (${preferredApi}) failed, trying fallbacks:`, primaryError);
        
        // Try fallback APIs
        for (const fallbackApi of fallbackApis) {
            try {
                const result = await fallbackApi();
                
                if (result.detectedLang && isSameLanguage(result.detectedLang, targetLang)) {
                    cacheTranslation(text, targetLang, text);
                    return {
                        originalText: text,
                        translatedText: text,
                        detectedLanguage: result.detectedLang,
                        targetLanguage: targetLang,
                        wasTranslated: false
                    };
                }
                
                cacheTranslation(text, targetLang, result.translation);
                return {
                    originalText: text,
                    translatedText: result.translation,
                    detectedLanguage: result.detectedLang,
                    targetLanguage: targetLang,
                    wasTranslated: true
                };
            } catch (fallbackError) {
                console.warn('[SpicyLyricTranslater] Fallback API failed:', fallbackError);
                continue;
            }
        }
        
        console.error('[SpicyLyricTranslater] All translation services failed');
        throw new Error('Translation failed. Please try again later.');
    }
}

/**
 * Translate multiple lines of lyrics
 * Uses batching with invisible separators for efficiency
 */
export async function translateLyrics(lines: string[], targetLang: string): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];
    
    // Check cache first and separate cached vs uncached lines
    const cachedResults: Map<number, TranslationResult> = new Map();
    const uncachedLines: { index: number; text: string }[] = [];
    
    lines.forEach((line, index) => {
        if (!line.trim()) {
            cachedResults.set(index, {
                originalText: line,
                translatedText: line,
                targetLanguage: targetLang,
                wasTranslated: false
            });
        } else {
            const cached = getCachedTranslation(line, targetLang);
            if (cached) {
                cachedResults.set(index, {
                    originalText: line,
                    translatedText: cached,
                    targetLanguage: targetLang,
                    wasTranslated: cached !== line
                });
            } else {
                uncachedLines.push({ index, text: line });
            }
        }
    });
    
    // If all lines are cached, return early
    if (uncachedLines.length === 0) {
        console.log('[SpicyLyricTranslater] All lines found in cache');
        return lines.map((_, index) => cachedResults.get(index)!);
    }
    
    console.log(`[SpicyLyricTranslater] ${cachedResults.size} cached, ${uncachedLines.length} to translate`);
    
    // Batch translate uncached lines using invisible separator
    const combinedText = uncachedLines.map(l => l.text).join(BATCH_SEPARATOR);
    
    try {
        const result = await retryWithBackoff(() => translateText(combinedText, targetLang));
        const translatedLines = result.translatedText.split(BATCH_SEPARATOR_REGEX);
        
        // Map translations back to their indices
        uncachedLines.forEach((item, i) => {
            const translation = translatedLines[i]?.trim() || item.text;
            cachedResults.set(item.index, {
                originalText: item.text,
                translatedText: translation,
                targetLanguage: targetLang,
                wasTranslated: result.wasTranslated && translation !== item.text
            });
        });
    } catch (error) {
        console.error('[SpicyLyricTranslater] Batch translation failed, falling back to line-by-line:', error);
        
        // Fall back to translating line by line with delay between calls
        for (const item of uncachedLines) {
            try {
                const result = await retryWithBackoff(() => translateText(item.text, targetLang));
                cachedResults.set(item.index, result);
            } catch {
                cachedResults.set(item.index, {
                    originalText: item.text,
                    translatedText: item.text,
                    targetLanguage: targetLang,
                    wasTranslated: false
                });
            }
        }
    }
    
    // Build final results array in order
    for (let i = 0; i < lines.length; i++) {
        results.push(cachedResults.get(i)!);
    }
    
    return results;
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
    storage.remove('translation-cache');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { entries: number; oldestTimestamp: number | null; sizeBytes: number } {
    const cache = storage.getJSON<TranslationCache>('translation-cache', {});
    const keys = Object.keys(cache);
    
    if (keys.length === 0) {
        return { entries: 0, oldestTimestamp: null, sizeBytes: 0 };
    }
    
    const timestamps = keys.map(k => cache[k].timestamp);
    const sizeBytes = JSON.stringify(cache).length * 2; // UTF-16
    
    return {
        entries: keys.length,
        oldestTimestamp: Math.min(...timestamps),
        sizeBytes
    };
}

/**
 * Get all cached translations for viewing
 */
export function getCachedTranslations(): Array<{ original: string; translated: string; language: string; date: Date }> {
    const cache = storage.getJSON<TranslationCache>('translation-cache', {});
    const entries: Array<{ original: string; translated: string; language: string; date: Date }> = [];
    
    for (const key of Object.keys(cache)) {
        const [lang, ...textParts] = key.split(':');
        const original = textParts.join(':'); // Rejoin in case text had colons
        entries.push({
            original,
            translated: cache[key].translation,
            language: lang,
            date: new Date(cache[key].timestamp)
        });
    }
    
    // Sort by date, newest first
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return entries;
}

/**
 * Delete a specific cached translation
 */
export function deleteCachedTranslation(original: string, language: string): boolean {
    const cache = storage.getJSON<TranslationCache>('translation-cache', {});
    const key = `${language}:${original}`;
    
    if (cache[key]) {
        delete cache[key];
        storage.setJSON('translation-cache', cache);
        return true;
    }
    return false;
}

/**
 * Check if we're likely offline
 */
export function isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
}

export default {
    translateText,
    translateLyrics,
    clearTranslationCache,
    getCacheStats,
    getCachedTranslations,
    deleteCachedTranslation,
    isOffline,
    setPreferredApi,
    getPreferredApi,
    SUPPORTED_LANGUAGES
};
