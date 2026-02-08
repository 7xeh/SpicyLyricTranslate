import { storage } from './storage';
import { OverlayMode } from './translationOverlay';

export interface ExtensionState {
    isEnabled: boolean;
    isTranslating: boolean;
    targetLanguage: string;
    autoTranslate: boolean;
    showNotifications: boolean;
    preferredApi: 'google' | 'libretranslate' | 'custom';
    customApiUrl: string;
    lastTranslatedSongUri: string | null;
    translatedLyrics: Map<string, string>;
    lastViewMode: string | null;
    translationAbortController: AbortController | null;
    overlayMode: OverlayMode;
    detectedLanguage: string | null;
    syncWordHighlight: boolean;
}

export const state: ExtensionState = {
    isEnabled: storage.get('translation-enabled') === 'true',
    isTranslating: false,
    targetLanguage: storage.get('target-language') || 'en',
    autoTranslate: storage.get('auto-translate') === 'true',
    showNotifications: storage.get('show-notifications') !== 'false',
    preferredApi: (storage.get('preferred-api') as 'google' | 'libretranslate' | 'custom') || 'google',
    customApiUrl: storage.get('custom-api-url') || '',
    lastTranslatedSongUri: null,
    translatedLyrics: new Map(),
    lastViewMode: null,
    translationAbortController: null,
    overlayMode: (storage.get('overlay-mode') as OverlayMode) || 'interleaved',
    detectedLanguage: null,
    syncWordHighlight: storage.get('sync-word-highlight') !== 'false'
};