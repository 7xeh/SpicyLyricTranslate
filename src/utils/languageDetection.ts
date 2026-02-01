

import storage from './storage';
import { debug, warn } from './debug';


const detectionCache: Map<string, { language: string; confidence: number; timestamp: number }> = new Map();
const DETECTION_CACHE_TTL = 30 * 60 * 1000;  


const LANGUAGE_PATTERNS: { code: string; patterns: RegExp[]; scripts?: RegExp }[] = [
    
    { code: 'ja', patterns: [/[\u3040-\u309F]/, /[\u30A0-\u30FF]/], scripts: /[\u3040-\u30FF\u4E00-\u9FAF]/ },  
    { code: 'zh', patterns: [/[\u4E00-\u9FFF]/], scripts: /[\u4E00-\u9FFF]/ },  
    { code: 'ko', patterns: [/[\uAC00-\uD7AF]/, /[\u1100-\u11FF]/], scripts: /[\uAC00-\uD7AF\u1100-\u11FF]/ },  
    
    
    { code: 'ar', patterns: [/[\u0600-\u06FF]/], scripts: /[\u0600-\u06FF]/ },
    { code: 'he', patterns: [/[\u0590-\u05FF]/], scripts: /[\u0590-\u05FF]/ },
    
    
    { code: 'ru', patterns: [/[\u0400-\u04FF]/], scripts: /[\u0400-\u04FF]/ },
    
    
    { code: 'th', patterns: [/[\u0E00-\u0E7F]/], scripts: /[\u0E00-\u0E7F]/ },
    
    
    { code: 'hi', patterns: [/[\u0900-\u097F]/], scripts: /[\u0900-\u097F]/ },
    
    
    { code: 'el', patterns: [/[\u0370-\u03FF]/], scripts: /[\u0370-\u03FF]/ },
];


const LATIN_LANGUAGE_WORDS: { code: string; words: string[] }[] = [
    { code: 'es', words: ['el', 'la', 'los', 'las', 'que', 'de', 'en', 'un', 'una', 'es', 'no', 'por', 'con', 'para', 'como', 'pero', 'más', 'yo', 'tu', 'mi'] },
    { code: 'fr', words: ['le', 'la', 'les', 'de', 'et', 'en', 'un', 'une', 'est', 'que', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ne', 'pas', 'pour', 'avec'] },
    { code: 'de', words: ['der', 'die', 'das', 'und', 'ist', 'ich', 'du', 'er', 'sie', 'wir', 'ihr', 'nicht', 'ein', 'eine', 'mit', 'auf', 'für', 'von'] },
    { code: 'pt', words: ['o', 'a', 'os', 'as', 'de', 'que', 'e', 'em', 'um', 'uma', 'é', 'não', 'eu', 'tu', 'ele', 'ela', 'nós', 'você', 'com', 'para'] },
    { code: 'it', words: ['il', 'la', 'lo', 'gli', 'le', 'di', 'che', 'e', 'un', 'una', 'è', 'non', 'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'con', 'per'] },
    { code: 'nl', words: ['de', 'het', 'een', 'en', 'van', 'is', 'dat', 'op', 'te', 'in', 'voor', 'niet', 'met', 'zijn', 'maar', 'ook', 'als', 'dit'] },
    { code: 'pl', words: ['i', 'w', 'na', 'nie', 'do', 'to', 'że', 'co', 'jest', 'się', 'ja', 'ty', 'on', 'my', 'wy', 'ale', 'jak', 'tak'] },
    { code: 'en', words: ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'i', 'you', 'he', 'she', 'it', 'we', 'they'] },
];


export function detectLanguageHeuristic(text: string): { code: string; confidence: number } | null {
    if (!text || text.length < 10) {
        return null;
    }
    
    const normalizedText = text.toLowerCase().trim();
    
    
    let totalChars = 0;
    const scriptCounts: { [code: string]: number } = {};
    
    for (const char of normalizedText) {
        if (/\s/.test(char)) continue;
        totalChars++;
        
        for (const lang of LANGUAGE_PATTERNS) {
            if (lang.scripts?.test(char)) {
                scriptCounts[lang.code] = (scriptCounts[lang.code] || 0) + 1;
            }
        }
    }
    
    
    for (const [code, count] of Object.entries(scriptCounts)) {
        const ratio = count / totalChars;
        if (ratio > 0.3) {  
            
            if (code === 'zh') {
                
                const japaneseKana = (normalizedText.match(/[\u3040-\u30FF]/g) || []).length;
                if (japaneseKana > 0) {
                    return { code: 'ja', confidence: 0.85 };
                }
            }
            return { code, confidence: Math.min(0.95, 0.5 + ratio) };
        }
    }
    
    
    const words = normalizedText.split(/\s+/).filter(w => w.length > 1);
    if (words.length < 5) {
        return null;  
    }
    
    const wordCounts: { [code: string]: number } = {};
    let maxCount = 0;
    let maxLang = 'en';
    
    for (const lang of LATIN_LANGUAGE_WORDS) {
        const count = words.filter(w => lang.words.includes(w)).length;
        wordCounts[lang.code] = count;
        
        if (count > maxCount) {
            maxCount = count;
            maxLang = lang.code;
        }
    }
    
    
    const matchRatio = maxCount / words.length;
    
    if (matchRatio > 0.15 && maxCount >= 3) {
        
        const sortedCounts = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1]);
        
        if (sortedCounts.length >= 2 && sortedCounts[0][1] >= sortedCounts[1][1] * 1.5) {
            return { code: maxLang, confidence: Math.min(0.8, 0.4 + matchRatio) };
        }
    }
    
    return null;  
}


async function detectLanguageViaAPI(text: string): Promise<{ code: string; confidence: number }> {
    const sample = text.slice(0, 500);
    const encodedText = encodeURIComponent(sample);
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodedText}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Language detection API error: ${response.status}`);
    }
    
    const data = await response.json();
    const detectedLang = data[2] || 'unknown';
    
    
    const confidence = detectedLang !== 'unknown' ? 0.9 : 0.5;
    
    return { code: detectedLang, confidence };
}


export async function detectLyricsLanguage(
    lyrics: string[],
    trackUri?: string
): Promise<{ code: string; confidence: number }> {
    
    if (trackUri) {
        const cached = detectionCache.get(trackUri);
        if (cached && Date.now() - cached.timestamp < DETECTION_CACHE_TTL) {
            debug(`Language detection cache hit: ${cached.language}`);
            return { code: cached.language, confidence: cached.confidence };
        }
    }
    
    
    const sampleIndices = [
        0, 1, 2,  
        Math.floor(lyrics.length / 2),  
        Math.floor(lyrics.length / 2) + 1,
        lyrics.length - 3, lyrics.length - 2, lyrics.length - 1  
    ].filter(i => i >= 0 && i < lyrics.length);
    
    const sampleText = sampleIndices
        .map(i => lyrics[i])
        .filter(line => line && line.trim().length > 0 && !/^[•\s]+$/.test(line))
        .join(' ');
    
    if (sampleText.length < 20) {
        return { code: 'unknown', confidence: 0 };
    }
    
    
    const heuristic = detectLanguageHeuristic(sampleText);
    if (heuristic && heuristic.confidence >= 0.7) {
        debug(`Heuristic language detection: ${heuristic.code} (${(heuristic.confidence * 100).toFixed(0)}%)`);
        
        
        if (trackUri) {
            detectionCache.set(trackUri, { 
                language: heuristic.code, 
                confidence: heuristic.confidence,
                timestamp: Date.now() 
            });
        }
        
        return heuristic;
    }
    
    
    try {
        const apiResult = await detectLanguageViaAPI(sampleText);
        debug(`API language detection: ${apiResult.code} (${(apiResult.confidence * 100).toFixed(0)}%)`);
        
        
        if (trackUri) {
            detectionCache.set(trackUri, { 
                language: apiResult.code, 
                confidence: apiResult.confidence,
                timestamp: Date.now() 
            });
        }
        
        return apiResult;
    } catch (error) {
        warn('API language detection failed:', error);
        
        
        return heuristic || { code: 'unknown', confidence: 0 };
    }
}


export function isSameLanguage(source: string, target: string): boolean {
    if (!source || source === 'unknown') return false;
    
    const normalizeCode = (code: string): string => {
        return code.toLowerCase().split('-')[0].split('_')[0];
    };
    
    return normalizeCode(source) === normalizeCode(target);
}


export async function shouldSkipTranslation(
    lyrics: string[],
    targetLanguage: string,
    trackUri?: string
): Promise<{ skip: boolean; reason?: string; detectedLanguage?: string }> {
    
    const detection = await detectLyricsLanguage(lyrics, trackUri);
    
    if (detection.code === 'unknown' || detection.confidence < 0.5) {
        
        return { skip: false };
    }
    
    
    if (isSameLanguage(detection.code, targetLanguage)) {
        return {
            skip: true,
            reason: `Lyrics already in ${detection.code.toUpperCase()}`,
            detectedLanguage: detection.code
        };
    }
    
    return { 
        skip: false, 
        detectedLanguage: detection.code 
    };
}


export function clearDetectionCache(): void {
    detectionCache.clear();
}


export function getLanguageName(code: string): string {
    const languageNames: { [key: string]: string } = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'nl': 'Dutch',
        'pl': 'Polish',
        'ru': 'Russian',
        'ja': 'Japanese',
        'zh': 'Chinese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'he': 'Hebrew',
        'hi': 'Hindi',
        'th': 'Thai',
        'el': 'Greek',
        'tr': 'Turkish',
        'vi': 'Vietnamese',
        'id': 'Indonesian',
        'ms': 'Malay',
        'tl': 'Tagalog',
        'sv': 'Swedish',
        'no': 'Norwegian',
        'da': 'Danish',
        'fi': 'Finnish',
        'uk': 'Ukrainian',
        'cs': 'Czech',
        'ro': 'Romanian',
        'hu': 'Hungarian',
        'unknown': 'Unknown'
    };
    
    const baseCode = code.toLowerCase().split('-')[0];
    return languageNames[baseCode] || code.toUpperCase();
}

export default {
    detectLanguageHeuristic,
    detectLyricsLanguage,
    isSameLanguage,
    shouldSkipTranslation,
    clearDetectionCache,
    getLanguageName
};
