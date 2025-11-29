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
}

export interface TranslationCache {
    [key: string]: {
        translation: string;
        timestamp: number;
    };
}

// Cache expiry time: 7 days
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

// Supported languages
export const SUPPORTED_LANGUAGES: { code: string; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'id', name: 'Indonesian' },
    { code: 'uk', name: 'Ukrainian' },
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
    
    // Limit cache size to 1000 entries
    const keys = Object.keys(cache);
    if (keys.length > 1000) {
        // Remove oldest entries
        const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
        const toRemove = sorted.slice(0, keys.length - 1000);
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
    
    // Try Google Translate first
    try {
        const result = await translateWithGoogle(text, targetLang);
        
        // Skip if source language is same as target
        if (isSameLanguage(result.detectedLang, targetLang)) {
            // Cache as-is to avoid re-checking
            cacheTranslation(text, targetLang, text);
            return {
                originalText: text,
                translatedText: text,
                detectedLanguage: result.detectedLang,
                targetLanguage: targetLang
            };
        }
        
        cacheTranslation(text, targetLang, result.translation);
        return {
            originalText: text,
            translatedText: result.translation,
            detectedLanguage: result.detectedLang,
            targetLanguage: targetLang
        };
    } catch (googleError) {
        console.warn('[SpicyLyricTranslater] Google Translate failed, trying fallback:', googleError);
        
        // Try LibreTranslate as fallback
        try {
            const translation = await translateWithLibreTranslate(text, targetLang);
            cacheTranslation(text, targetLang, translation);
            return {
                originalText: text,
                translatedText: translation,
                targetLanguage: targetLang
            };
        } catch (libreError) {
            console.error('[SpicyLyricTranslater] All translation services failed:', libreError);
            throw new Error('Translation failed. Please try again later.');
        }
    }
}

/**
 * Translate multiple lines of lyrics
 */
export async function translateLyrics(lines: string[], targetLang: string): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];
    
    // Batch translate to reduce API calls
    // Join lines with a unique separator and translate together
    const separator = '\n###LYRIC_LINE###\n';
    const combinedText = lines.filter(l => l.trim()).join(separator);
    
    if (!combinedText.trim()) {
        return lines.map(line => ({
            originalText: line,
            translatedText: line,
            targetLanguage: targetLang
        }));
    }
    
    try {
        const result = await translateText(combinedText, targetLang);
        const translatedLines = result.translatedText.split(/\n?###LYRIC_LINE###\n?/);
        
        let translatedIndex = 0;
        for (const line of lines) {
            if (line.trim()) {
                results.push({
                    originalText: line,
                    translatedText: translatedLines[translatedIndex] || line,
                    targetLanguage: targetLang
                });
                translatedIndex++;
            } else {
                results.push({
                    originalText: line,
                    translatedText: line,
                    targetLanguage: targetLang
                });
            }
        }
    } catch (error) {
        console.error('[SpicyLyricTranslater] Batch translation failed, falling back to line-by-line:', error);
        
        // Fall back to translating line by line
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const result = await translateText(line, targetLang);
                    results.push(result);
                } catch {
                    results.push({
                        originalText: line,
                        translatedText: line,
                        targetLanguage: targetLang
                    });
                }
            } else {
                results.push({
                    originalText: line,
                    translatedText: line,
                    targetLanguage: targetLang
                });
            }
        }
    }
    
    return results;
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
    storage.remove('translation-cache');
}

export default {
    translateText,
    translateLyrics,
    clearTranslationCache,
    SUPPORTED_LANGUAGES
};
