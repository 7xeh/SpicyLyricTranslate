import storage from './storage';
import { debug, warn, error as logError, info } from './debug';
import { 
    getTrackCache, 
    setTrackCache, 
    clearAllTrackCache, 
    getTrackCacheStats, 
    getAllCachedTracks, 
    deleteTrackCache,
    getCurrentTrackUri 
} from './trackCache';

export interface TranslationResult {
    originalText: string;
    translatedText: string;
    detectedLanguage?: string;
    targetLanguage: string;
    wasTranslated?: boolean;
}

export interface TranslationCache {
    [key: string]: {
        translation: string;
        timestamp: number;
        api?: string;
    };
}

export type ApiPreference = 'google' | 'libretranslate' | 'custom';

let preferredApi: ApiPreference = 'google';
let customApiUrl: string = '';

const RATE_LIMIT = {
    minDelayMs: 100,
    maxDelayMs: 2000,
    maxRetries: 3,
    backoffMultiplier: 2
};

let lastApiCallTime = 0;

const BATCH_SEPARATOR = ' ||| ';
const BATCH_SEPARATOR_REGEX = /\s*\|\|\|\s*/g;
const BATCH_MARKER_PREFIX = '[[SLT_BATCH_';
const BATCH_CHUNK_SIZE = 6;

async function rateLimitedDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    if (timeSinceLastCall < RATE_LIMIT.minDelayMs) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.minDelayMs - timeSinceLastCall));
    }
    lastApiCallTime = Date.now();
}

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
            
            if (error instanceof Error && error.message.includes('40')) {
                throw error;
            }
            
            if (attempt < maxRetries) {
                const delay = Math.min(
                    baseDelay * Math.pow(RATE_LIMIT.backoffMultiplier, attempt),
                    RATE_LIMIT.maxDelayMs
                );
                debug(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError || new Error('All retry attempts failed');
}

export function setPreferredApi(api: ApiPreference, customUrl?: string): void {
    preferredApi = api;
    if (customUrl !== undefined) {
        customApiUrl = customUrl;
    }
    info(`API preference set to: ${api}${api === 'custom' ? ` (${customUrl})` : ''}`);
}

export function getPreferredApi(): { api: ApiPreference; customUrl: string } {
    return { api: preferredApi, customUrl: customApiUrl };
}

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

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

function getCachedTranslation(text: string, targetLang: string): string | null {
    const cache = storage.getJSON<TranslationCache>('translation-cache', {});
    const key = `${targetLang}:${text}`;
    const cached = cache[key];
    
    if (cached) {
        if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
            const normalized = normalizeTranslatedLine(cached.translation || '');
            if (normalized !== cached.translation) {
                cache[key] = {
                    ...cached,
                    translation: normalized,
                    timestamp: Date.now()
                };
                storage.setJSON('translation-cache', cache);
            }
            return normalized;
        }
    }
    
    return null;
}

function cacheTranslation(text: string, targetLang: string, translation: string, api?: string): void {
    const cache = storage.getJSON<TranslationCache>('translation-cache', {});
    const key = `${targetLang}:${text}`;
    const normalizedTranslation = normalizeTranslatedLine(translation || '');
    
    cache[key] = {
        translation: normalizedTranslation,
        timestamp: Date.now(),
        api
    };
    
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
        const now = Date.now();
        const sorted = keys
            .map(k => ({ key: k, entry: cache[k] }))
            .sort((a, b) => a.entry.timestamp - b.entry.timestamp);
        
        const toRemove = sorted.filter(item => 
            now - item.entry.timestamp > CACHE_EXPIRY
        ).map(item => item.key);
        
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

async function translateWithGoogle(text: string, targetLang: string): Promise<{ translation: string; detectedLang: string }> {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodedText}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
    }
    
    const data = await response.json();
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

async function translateWithLibreTranslate(text: string, targetLang: string): Promise<string> {
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

async function translateWithCustomApi(text: string, targetLang: string): Promise<{ translation: string; detectedLang?: string }> {
    if (!customApiUrl) {
        throw new Error('Custom API URL not configured');
    }
    
    try {
        const response = await fetch(customApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                q: text,
                source: 'auto',
                target: targetLang,
                format: 'text'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Custom API error: ${response.status}`);
        }
        
        const data = await response.json();
        
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
        logError('Custom API error:', error);
        throw error;
    }
}

function extractDetectedLanguage(data: any): string | undefined {
    return data?.detectedLanguage || data?.detected_language || data?.sourceLang || data?.src;
}

function normalizeBatchTranslations(data: any): { translations: string[]; detectedLang?: string } | null {
    const candidates: unknown[] = [
        data?.translatedText,
        data?.translated_text,
        data?.translation,
        data?.result,
        data?.text,
        data?.data?.translatedText,
        data?.translations,
        data
    ];

    for (const candidate of candidates) {
        if (!Array.isArray(candidate)) continue;

        if (candidate.every(item => typeof item === 'string')) {
            return {
                translations: (candidate as string[]).map(item => item ?? ''),
                detectedLang: extractDetectedLanguage(data)
            };
        }

        if (candidate.every(item => typeof item === 'object' && item !== null && ('text' in item || 'translatedText' in item))) {
            const translations = candidate.map(item => {
                const value = (item as any).translatedText ?? (item as any).text ?? '';
                return String(value);
            });
            return {
                translations,
                detectedLang: extractDetectedLanguage(data)
            };
        }
    }

    return null;
}

async function translateBatchArray(texts: string[], targetLang: string): Promise<{ translations: string[]; detectedLang?: string }> {
    if (texts.length === 0) {
        return { translations: [], detectedLang: undefined };
    }

    const url = preferredApi === 'libretranslate'
        ? 'https://libretranslate.de/translate'
        : customApiUrl;

    if (!url) {
        throw new Error('Custom API URL not configured');
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: texts,
            text: texts,
            source: 'auto',
            target: targetLang,
            format: 'text'
        })
    });

    if (!response.ok) {
        throw new Error(`Batch API error: ${response.status}`);
    }

    const data = await response.json();
    const normalized = normalizeBatchTranslations(data);
    if (!normalized) {
        throw new Error('Batch API returned non-array payload');
    }

    return normalized;
}

function buildMarkedBatchPayload(lines: string[]): { combinedText: string; markerNonce: string } {
    const markerNonce = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const combinedText = lines
        .map((line, index) => `${BATCH_MARKER_PREFIX}${markerNonce}_${index}]]${line}`)
        .join('\n');
    return { combinedText, markerNonce };
}

function parseMarkedBatchResponse(translatedText: string, expectedCount: number, markerNonce: string): string[] | null {
    const markerRegex = new RegExp(`\\[\\[SLT_BATCH_${markerNonce}_(\\d+)\\]\\]`, 'g');
    const matches: Array<{ index: number; start: number; markerEnd: number }> = [];

    let match: RegExpExecArray | null;
    while ((match = markerRegex.exec(translatedText)) !== null) {
        matches.push({
            index: Number.parseInt(match[1], 10),
            start: match.index,
            markerEnd: markerRegex.lastIndex
        });
    }

    if (matches.length !== expectedCount) {
        return null;
    }

    const seen = new Set<number>();
    const byIndex = new Array<string>(expectedCount).fill('');

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];

        if (current.index < 0 || current.index >= expectedCount || seen.has(current.index)) {
            return null;
        }
        seen.add(current.index);

        const segment = translatedText.slice(current.markerEnd, next ? next.start : translatedText.length);
        byIndex[current.index] = segment.replace(/^\s+/, '').trimEnd();
    }

    if (seen.size !== expectedCount) {
        return null;
    }

    return byIndex;
}

function normalizeTranslatedLine(text: string): string {
    return text
    .replace(/\[\[\s*SLT[\s_-]*BATCH[^\]]*\]\]/gi, '')
        .replace(/\r?\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseBatchTextFallbacks(translatedText: string, expectedCount: number): string[] | null {
    const separatorSplit = translatedText
        .split(BATCH_SEPARATOR_REGEX)
        .map(s => normalizeTranslatedLine(s));
    if (separatorSplit.length === expectedCount) {
        return separatorSplit;
    }

    const newlineSplit = translatedText
        .split(/\r?\n+/)
        .map(s => normalizeTranslatedLine(s))
        .filter(Boolean);
    if (newlineSplit.length === expectedCount) {
        return newlineSplit;
    }

    return null;
}

async function translateChunkedBatch(
    lines: string[],
    targetLang: string,
    chunkSize: number = BATCH_CHUNK_SIZE
): Promise<{ translations: string[]; detectedLang?: string }> {
    const translations: string[] = [];
    let detectedLang: string | undefined;

    for (let start = 0; start < lines.length; start += chunkSize) {
        const chunk = lines.slice(start, start + chunkSize);
        const { combinedText, markerNonce } = buildMarkedBatchPayload(chunk);
        const result = await retryWithBackoff(() => translateText(combinedText, targetLang));

        const parsed =
            parseMarkedBatchResponse(result.translatedText, chunk.length, markerNonce) ||
            parseBatchTextFallbacks(result.translatedText, chunk.length);

        if (!parsed || parsed.length !== chunk.length) {
            throw new Error(`Chunked batch mismatch: Sent ${chunk.length}, got ${parsed?.length ?? 0}`);
        }

        if (!detectedLang && result.detectedLanguage) {
            detectedLang = result.detectedLanguage;
        }

        translations.push(...parsed);
    }

    return { translations, detectedLang };
}

export async function translateText(text: string, targetLang: string): Promise<TranslationResult> {
    const cached = getCachedTranslation(text, targetLang);
    if (cached) {
        return {
            originalText: text,
            translatedText: cached,
            targetLanguage: targetLang
        };
    }
    
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
    
    let primaryApi: () => Promise<{ translation: string; detectedLang?: string }>;
    let fallbackApis: { name: string, fn: () => Promise<{ translation: string; detectedLang?: string }> }[] = [];
    
    switch (preferredApi) {
        case 'libretranslate':
            primaryApi = tryLibreTranslate;
            fallbackApis = [{ name: 'google', fn: tryGoogle }];
            break;
        case 'custom':
            primaryApi = tryCustom;
            fallbackApis = [{ name: 'google', fn: tryGoogle }, { name: 'libretranslate', fn: tryLibreTranslate }];
            break;
        case 'google':
        default:
            primaryApi = tryGoogle;
            fallbackApis = [{ name: 'libretranslate', fn: tryLibreTranslate }];
            break;
    }
    
    try {
        const result = await primaryApi();
        
        cacheTranslation(text, targetLang, result.translation, preferredApi);
        return {
            originalText: text,
            translatedText: result.translation,
            detectedLanguage: result.detectedLang,
            targetLanguage: targetLang,
            wasTranslated: true
        };
    } catch (primaryError) {
        warn(`Primary API (${preferredApi}) failed, trying fallbacks:`, primaryError);
        
        for (const fallbackApi of fallbackApis) {
            try {
                const result = await fallbackApi.fn();
                
                cacheTranslation(text, targetLang, result.translation, fallbackApi.name);
                return {
                    originalText: text,
                    translatedText: result.translation,
                    detectedLanguage: result.detectedLang,
                    targetLanguage: targetLang,
                    wasTranslated: true
                };
            } catch (fallbackError) {
                warn(`Fallback API (${fallbackApi.name}) failed:`, fallbackError);
                continue;
            }
        }
        
        logError('All translation services failed');
        throw new Error('Translation failed. Please try again later.');
    }
}

export async function translateLyrics(
    lines: string[], 
    targetLang: string, 
    trackUri?: string,
    detectedSourceLang?: string
): Promise<TranslationResult[]> {
    const currentTrackUri = trackUri || getCurrentTrackUri();
    
    if (currentTrackUri) {
        const trackCache = getTrackCache(currentTrackUri, targetLang);
        if (trackCache && trackCache.lines.length === lines.length) {
            debug(`Full track cache hit: ${currentTrackUri} (${trackCache.lines.length} lines)`);
            return lines.map((line, index) => ({
                originalText: line,
                translatedText: trackCache.lines[index] || line,
                targetLanguage: targetLang,
                wasTranslated: trackCache.lines[index] !== line
            }));
        }
    }
    
    const results: TranslationResult[] = [];
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
    
    if (uncachedLines.length === 0) {
        debug('All lines found in cache');
        const finalResults = lines.map((_, index) => cachedResults.get(index)!);
        
        if (currentTrackUri) {
            const translatedLines = finalResults.map(r => r.translatedText);
            setTrackCache(currentTrackUri, targetLang, detectedSourceLang || 'auto', translatedLines, preferredApi);
        }
        
        return finalResults;
    }
    
    debug(`${cachedResults.size} cached, ${uncachedLines.length} to translate`);
    
    let detectedLang = detectedSourceLang || 'auto';
    
    try {
        let translatedLines: string[] | null = null;

        if ((preferredApi === 'custom' || preferredApi === 'libretranslate') && uncachedLines.length > 1) {
            try {
                const batchResult = await retryWithBackoff(() => translateBatchArray(uncachedLines.map(l => l.text), targetLang));
                translatedLines = batchResult.translations;
                if (batchResult.detectedLang) {
                    detectedLang = batchResult.detectedLang;
                }
            } catch (batchArrayError) {
                warn('Batch-array translation unavailable, falling back to marker batching:', batchArrayError);
            }
        }

        if (!translatedLines) {
            const { combinedText, markerNonce } = buildMarkedBatchPayload(uncachedLines.map(l => l.text));
            const result = await retryWithBackoff(() => translateText(combinedText, targetLang));
            translatedLines =
                parseMarkedBatchResponse(result.translatedText, uncachedLines.length, markerNonce) ||
                parseBatchTextFallbacks(result.translatedText, uncachedLines.length);

            if (result.detectedLanguage) {
                detectedLang = result.detectedLanguage;
            }
        }

        if ((!translatedLines || translatedLines.length !== uncachedLines.length) && uncachedLines.length > 1) {
            warn(`Primary batch parse failed for ${uncachedLines.length} lines, trying chunked batch mode (${BATCH_CHUNK_SIZE}/request)`);
            const chunked = await translateChunkedBatch(uncachedLines.map(l => l.text), targetLang);
            translatedLines = chunked.translations;
            if (chunked.detectedLang) {
                detectedLang = chunked.detectedLang;
            }
        }

        if (!translatedLines || translatedLines.length !== uncachedLines.length) {
            throw new Error(`Batch translation mismatch: Sent ${uncachedLines.length} lines, got ${translatedLines?.length ?? 0}. API might have stripped delimiters.`);
        }
        
        uncachedLines.forEach((item, i) => {
            const normalized = normalizeTranslatedLine(translatedLines[i] || '');
            const translation = normalized || item.text;
            cacheTranslation(item.text, targetLang, translation, preferredApi);
            cachedResults.set(item.index, {
                originalText: item.text,
                translatedText: translation,
                targetLanguage: targetLang,
                wasTranslated: translation !== item.text
            });
        });
    } catch (error) {
        logError('Batch translation failed (fallback disabled to prevent rate limits):', error);
        
        for (const item of uncachedLines) {
            cachedResults.set(item.index, {
                originalText: item.text,
                translatedText: item.text,
                targetLanguage: targetLang,
                wasTranslated: false
            });
        }
    }
    
    for (let i = 0; i < lines.length; i++) {
        results.push(cachedResults.get(i)!);
    }
    
    const someTranslated = results.some(r => r.wasTranslated);
    if (currentTrackUri && results.length > 0 && someTranslated) {
        const translatedLines = results.map(r => r.translatedText);
        setTrackCache(currentTrackUri, targetLang, detectedLang, translatedLines, preferredApi);
    }
    
    return results;
}

export function clearTranslationCache(): void {
    storage.remove('translation-cache');
    clearAllTrackCache();
}

export function getCacheStats(): { 
    entries: number; 
    oldestTimestamp: number | null; 
    sizeBytes: number;
    trackCount?: number;
    totalLines?: number;
} {
    const lineCache = storage.getJSON<TranslationCache>('translation-cache', {});
    const lineKeys = Object.keys(lineCache);
    
    const trackStats = getTrackCacheStats();
    
    let lineSizeBytes = 0;
    let lineOldestTimestamp: number | null = null;
    
    if (lineKeys.length > 0) {
        const timestamps = lineKeys.map(k => lineCache[k].timestamp);
        lineSizeBytes = JSON.stringify(lineCache).length * 2;
        lineOldestTimestamp = Math.min(...timestamps);
    }
    
    const oldestTimestamp = lineOldestTimestamp !== null && trackStats.oldestTimestamp !== null
        ? Math.min(lineOldestTimestamp, trackStats.oldestTimestamp)
        : lineOldestTimestamp || trackStats.oldestTimestamp;
    
    return {
        entries: lineKeys.length + trackStats.trackCount,
        oldestTimestamp,
        sizeBytes: lineSizeBytes + trackStats.sizeBytes,
        trackCount: trackStats.trackCount,
        totalLines: trackStats.totalLines
    };
}

export function getCachedTranslations(): Array<{ original: string; translated: string; language: string; date: Date; api?: string }> {
    const cache = storage.getJSON<TranslationCache>('translation-cache', {});
    const entries: Array<{ original: string; translated: string; language: string; date: Date; api?: string }> = [];
    
    for (const key of Object.keys(cache)) {
        const [lang, ...textParts] = key.split(':');
        const original = textParts.join(':');
        entries.push({
            original,
            translated: cache[key].translation,
            language: lang,
            date: new Date(cache[key].timestamp),
            api: cache[key].api
        });
    }
    
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return entries;
}

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

export function deleteTrackCacheEntry(trackUri: string, targetLang?: string): void {
    deleteTrackCache(trackUri, targetLang);
}

export function isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
}

export { getAllCachedTracks, getTrackCacheStats };

export default {
    translateText,
    translateLyrics,
    clearTranslationCache,
    getCacheStats,
    getCachedTranslations,
    deleteCachedTranslation,
    deleteTrackCacheEntry,
    getAllCachedTracks,
    getTrackCacheStats,
    isOffline,
    setPreferredApi,
    getPreferredApi,
    SUPPORTED_LANGUAGES
};