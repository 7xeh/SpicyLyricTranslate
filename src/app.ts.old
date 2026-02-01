import { Icons } from './utils/icons';
import { storage } from './utils/storage';
import { translateLyrics, SUPPORTED_LANGUAGES, clearTranslationCache, setPreferredApi, isOffline, getCacheStats, getCachedTranslations, deleteCachedTranslation, getTrackCacheStats } from './utils/translator';
import { getCurrentTrackUri } from './utils/trackCache';
import { injectStyles } from './styles/main';
import { checkForUpdates, startUpdateChecker, getUpdateInfo, getCurrentVersion, VERSION, REPO_URL } from './utils/updater';
import { initConnectionIndicator, getConnectionState, refreshConnection, setViewingLyrics } from './utils/connectivity';
import { 
    enableOverlay, 
    disableOverlay, 
    updateOverlayContent, 
    clearOverlayContent,
    isOverlayActive,
    setOverlayConfig,
    OverlayMode
} from './utils/translationOverlay';
import { 
    detectLyricsLanguage, 
    shouldSkipTranslation, 
    getLanguageName 
} from './utils/languageDetection';
import { debug, warn, error, info } from './utils/debug';

interface ExtensionState {
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
}

const state: ExtensionState = {
    isEnabled: false,
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
    overlayMode: (storage.get('overlay-mode') as OverlayMode) || 'replace',
    detectedLanguage: null
};

let viewControlsObserver: MutationObserver | null = null;
let lyricsObserver: MutationObserver | null = null;
let translateDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let viewModeIntervalId: ReturnType<typeof setInterval> | null = null;

const TRANSLATION_DEBOUNCE_MS = 300;
const MAX_LYRICS_CACHE_SIZE = 100;

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function waitForElement(selector: string, timeout: number = 10000): Promise<Element | null> {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const el = document.querySelector(selector);
            if (el) {
                obs.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}

function isSpicyLyricsOpen(): boolean {
    return !!(document.querySelector('#SpicyLyricsPage') || 
              document.querySelector('.spicy-pip-wrapper #SpicyLyricsPage') ||
              document.querySelector('.Cinema--Container') ||
              document.querySelector('.spicy-lyrics-cinema'));
}

function getViewControls(): HTMLElement | null {
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        const pipViewControls = pipWindow.document.querySelector('#SpicyLyricsPage .ViewControls');
        if (pipViewControls) return pipViewControls as HTMLElement;
    }
    
    return document.querySelector('#SpicyLyricsPage .ViewControls') ||
           document.querySelector('.Cinema--Container .ViewControls') ||
           document.querySelector('.spicy-pip-wrapper .ViewControls') ||
           document.querySelector('.ViewControls');
}

function getPIPWindow(): Window | null {
    try {
        const docPiP = (globalThis as any).documentPictureInPicture;
        if (docPiP && docPiP.window) {
            return docPiP.window;
        }
    } catch (e) {
    }
    return null;
}

function getLyricsContent(): HTMLElement | null {
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        const pipContent = pipWindow.document.querySelector('#SpicyLyricsPage .LyricsContent') ||
                          pipWindow.document.querySelector('.LyricsContainer .LyricsContent');
        if (pipContent) return pipContent as HTMLElement;
    }
    
    return document.querySelector('#SpicyLyricsPage .LyricsContent') ||
           document.querySelector('.spicy-pip-wrapper .LyricsContent') ||
           document.querySelector('.Cinema--Container .LyricsContent') ||
           document.querySelector('.LyricsContainer .LyricsContent') ||
           document.querySelector('.LyricsContent');
}

function createTranslateButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.id = 'TranslateToggle';
    button.className = 'ViewControl';
    button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    
    if (state.isEnabled) {
        button.classList.add('active');
    }
    
    if (typeof Spicetify !== 'undefined' && Spicetify.Tippy) {
        try {
            Spicetify.Tippy(button, {
                ...Spicetify.TippyProps,
                content: state.isEnabled ? 'Disable Translation' : 'Enable Translation'
            });
        } catch (e) {
            warn('Failed to create tooltip:', e);
        }
    }
    
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleTranslateToggle();
    });
    
    button.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showSettingsModal();
        return false;
    });
    
    return button;
}

function insertTranslateButton(): void {
    insertTranslateButtonIntoDocument(document);
    
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        insertTranslateButtonIntoDocument(pipWindow.document);
    }
}

function insertTranslateButtonIntoDocument(doc: Document): void {
    const viewControls = doc.querySelector('#SpicyLyricsPage .ViewControls') ||
                         doc.querySelector('.ViewControls');
    
    if (!viewControls) return;
    
    if (viewControls.querySelector('#TranslateToggle')) return;
    
    const romanizeButton = viewControls.querySelector('#RomanizationToggle');
    const translateButton = createTranslateButton();
    
    if (romanizeButton) {
        romanizeButton.insertAdjacentElement('afterend', translateButton);
    } else {
        const firstChild = viewControls.firstChild;
        if (firstChild) {
            viewControls.insertBefore(translateButton, firstChild);
        } else {
            viewControls.appendChild(translateButton);
        }
    }
}

function updateButtonState(): void {
    const button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    if (button) {
        button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
        button.classList.toggle('active', state.isEnabled);
        
        const buttonWithTippy = button as HTMLButtonElement & { _tippy?: { setContent: (content: string) => void } };
        if (buttonWithTippy._tippy) {
            buttonWithTippy._tippy.setContent(state.isEnabled ? 'Disable Translation' : 'Enable Translation');
        }
    }
    
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        const pipButton = pipWindow.document.querySelector('#TranslateToggle') as HTMLButtonElement;
        if (pipButton) {
            pipButton.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
            pipButton.classList.toggle('active', state.isEnabled);
        }
    }
}

function restoreButtonState(): void {
    const button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    if (button) {
        button.classList.remove('loading');
        button.classList.remove('error');
        button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    }
    
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        const pipButton = pipWindow.document.querySelector('#TranslateToggle') as HTMLButtonElement;
        if (pipButton) {
            pipButton.classList.remove('loading');
            pipButton.classList.remove('error');
            pipButton.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
        }
    }
}

function setButtonErrorState(hasError: boolean): void {
    const button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    if (button) {
        button.classList.toggle('error', hasError);
    }
    
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        const pipButton = pipWindow.document.querySelector('#TranslateToggle') as HTMLButtonElement;
        if (pipButton) {
            pipButton.classList.toggle('error', hasError);
        }
    }
}

async function handleTranslateToggle(): Promise<void> {
    let button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    const pipWindow = getPIPWindow();
    if (!button && pipWindow) {
        button = pipWindow.document.querySelector('#TranslateToggle') as HTMLButtonElement;
    }
    
    if (state.isTranslating) {
        return;
    }
    
    state.isEnabled = !state.isEnabled;
    storage.set('translation-enabled', state.isEnabled.toString());
    
    updateButtonState();
    
    if (state.isEnabled) {
        await translateCurrentLyrics();
    } else {
        removeTranslations();
    }
}

async function waitForLyricsAndTranslate(retries: number = 15, delay: number = 600): Promise<void> {
    debug('Waiting for lyrics to load...');
    
    let previousContentHash = '';
    let stableCount = 0;
    const requiredStableIterations = 3;
    
    for (let i = 0; i < retries; i++) {
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (!isSpicyLyricsOpen()) {
            debug('SpicyLyrics not open, stopping retry');
            return;
        }
        
        if (state.isTranslating) {
            debug('Already translating, stopping retry');
            return;
        }
        
        const lines = getLyricsLines();
        if (lines.length === 0) {
            debug(`Attempt ${i + 1}/${retries}: No lyrics found yet`);
            previousContentHash = '';
            stableCount = 0;
            continue;
        }
        
        const currentContent = Array.from(lines).slice(0, 8).map(l => l.textContent?.trim() || '').join('|');
        const currentHash = currentContent.substring(0, 150);
        
        if (currentHash === previousContentHash && currentHash.length > 0) {
            stableCount++;
            debug(`Attempt ${i + 1}/${retries}: Lyrics stable (${stableCount}/${requiredStableIterations})`);
            
            if (stableCount >= requiredStableIterations) {
                debug(`Found ${lines.length} stable lyrics lines after ${i + 1} attempts`);
                await translateCurrentLyrics();
                return;
            }
        } else {
            debug(`Attempt ${i + 1}/${retries}: Lyrics content changed, resetting stability counter`);
            stableCount = 0;
        }
        
        previousContentHash = currentHash;
    }
    
    debug('Gave up waiting for stable lyrics after', retries, 'attempts');
    
    const lines = getLyricsLines();
    if (lines.length > 0 && !state.isTranslating) {
        debug('Attempting translation with current lyrics anyway');
        await translateCurrentLyrics();
    }
}

function getLyricsLines(): NodeListOf<Element> {
    let lines = document.querySelectorAll('#SpicyLyricsPage .LyricsContent .line:not(.musical-line)');
    
    if (lines.length === 0) {
        lines = document.querySelectorAll('.LyricsContent .line:not(.musical-line)');
    }
    if (lines.length === 0) {
        lines = document.querySelectorAll('.LyricsContainer .line:not(.musical-line)');
    }
    
    if (lines.length > 0) {
        debug(`Found ${lines.length} lyrics lines in main document`);
        return lines;
    }
    
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        lines = pipWindow.document.querySelectorAll('#SpicyLyricsPage .LyricsContent .line:not(.musical-line)');
        if (lines.length === 0) {
            lines = pipWindow.document.querySelectorAll('.LyricsContent .line:not(.musical-line)');
        }
        if (lines.length === 0) {
            lines = pipWindow.document.querySelectorAll('.LyricsContainer .line:not(.musical-line)');
        }
        if (lines.length > 0) {
            debug(`Found ${lines.length} lyrics lines in PIP`);
            return lines;
        }
    }
    
    debug('No lyrics lines found');
    return lines;
}

function getPIPLyricsLines(): NodeListOf<Element> | null {
    const pipWindow = getPIPWindow();
    if (!pipWindow) return null;
    
    let lines = pipWindow.document.querySelectorAll('#SpicyLyricsPage .LyricsContent .line:not(.musical-line)');
    if (lines.length === 0) {
        lines = pipWindow.document.querySelectorAll('.LyricsContainer .LyricsContent .line:not(.musical-line)');
    }
    if (lines.length === 0) {
        lines = pipWindow.document.querySelectorAll('.LyricsContent .line:not(.musical-line)');
    }
    
    return lines.length > 0 ? lines : null;
}

function extractLineText(lineElement: Element): string {
    if (lineElement.classList.contains('musical-line')) {
        return '';
    }
    
    const letterGroups = lineElement.querySelectorAll('.letterGroup');
    if (letterGroups.length > 0) {
        const parts: string[] = [];
        const children = lineElement.children;
        
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.classList.contains('letterGroup')) {
                const letters = child.querySelectorAll('.letter');
                const word = Array.from(letters)
                    .map(letter => letter.textContent || '')
                    .join('');
                if (word) parts.push(word);
            } else if (child.classList.contains('word') && !child.classList.contains('dot')) {
                const text = child.textContent?.trim();
                if (text && text !== '•') parts.push(text);
            } else if (child.classList.contains('word-group')) {
                const text = child.textContent?.trim();
                if (text && text !== '•') parts.push(text);
            }
        }
        
        if (parts.length > 0) {
            return parts.join(' ').trim();
        }
    }
    
    const wordElements = lineElement.querySelectorAll('.word:not(.dot)');
    
    if (wordElements.length > 0) {
        const text = Array.from(wordElements)
            .map(word => word.textContent?.trim() || '')
            .filter(t => t.length > 0 && t !== '•')
            .join(' ')
            .trim();
        if (text) return text;
    }
    
    const syllableElements = lineElement.querySelectorAll('.syllable');
    if (syllableElements.length > 0) {
        const text = Array.from(syllableElements)
            .map(syl => syl.textContent?.trim() || '')
            .filter(t => t.length > 0)
            .join('')
            .trim();
        if (text) return text;
    }
    
    const text = lineElement.textContent?.trim() || '';
    if (/^[•\s]+$/.test(text)) {
        return '';
    }
    return text;
}

async function translateCurrentLyrics(): Promise<void> {
    if (state.isTranslating) {
        debug('Already translating, skipping');
        return;
    }
    
    if (isOffline()) {
        const cacheStats = getCacheStats();
        if (cacheStats.entries > 0) {
            debug('Offline - will use cached translations only');
            if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
                Spicetify.showNotification('Offline - using cached translations');
            }
        } else {
            debug('Offline with no cache available');
            if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
                Spicetify.showNotification('Offline - translations unavailable', true);
            }
            return;
        }
    }
    
    let lines = getLyricsLines();
    
    if (lines.length === 0) {
        debug('No lyrics lines found, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
        lines = getLyricsLines();
        if (lines.length === 0) {
            debug('Still no lyrics lines found');
            return;
        }
        // Continue with the found lines instead of recursive call
    }
    
    state.isTranslating = true;
    
    const button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    if (button) {
        button.classList.add('loading');
        button.innerHTML = Icons.Loading;
    }
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        const pipButton = pipWindow.document.querySelector('#TranslateToggle') as HTMLButtonElement;
        if (pipButton) {
            pipButton.classList.add('loading');
            pipButton.innerHTML = Icons.Loading;
        }
    }
    
    try {
        const lineTexts: string[] = [];
        lines.forEach(line => {
            const text = extractLineText(line);
            lineTexts.push(text);
        });
        
        debug('Extracted lyrics:', lineTexts.slice(0, 3), '...');
        
        const nonEmptyTexts = lineTexts.filter(t => t.trim().length > 0);
        if (nonEmptyTexts.length === 0) {
            debug('No non-empty lyrics found');
            state.isTranslating = false;
            restoreButtonState();
            return;
        }
        
        const currentTrackUri = getCurrentTrackUri();
        
        const skipCheck = await shouldSkipTranslation(nonEmptyTexts, state.targetLanguage, currentTrackUri || undefined);
        
        if (skipCheck.detectedLanguage) {
            state.detectedLanguage = skipCheck.detectedLanguage;
        }
        
        if (skipCheck.skip) {
            debug(`Skipping translation: ${skipCheck.reason}`);
            state.isTranslating = false;
            restoreButtonState();
            
            if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
                Spicetify.showNotification(skipCheck.reason || 'Lyrics already in target language');
            }
            return;
        }
        
        debug('Translating', nonEmptyTexts.length, 'lines for track:', currentTrackUri);
        
        const translations = await translateLyrics(lineTexts, state.targetLanguage, currentTrackUri || undefined, state.detectedLanguage || undefined);
        debug('Translation complete, got', translations.length, 'results');
        
        const wasActuallyTranslated = translations.some(t => t.wasTranslated === true);
        
        state.translatedLyrics.clear();
        translations.forEach((result, index) => {
            state.translatedLyrics.set(lineTexts[index], result.translatedText);
        });
        
        applyTranslations(lines);
        
        if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
            if (wasActuallyTranslated) {
                Spicetify.showNotification('Lyrics translated successfully!');
            } else {
                Spicetify.showNotification('Lyrics are already in the target language');
            }
        }
    } catch (err) {
        error('Translation failed:', err);
        if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
            Spicetify.showNotification('Translation failed. Please try again.', true);
        }
        
        setButtonErrorState(true);
        
        setTimeout(() => setButtonErrorState(false), 3000);
    } finally {
        state.isTranslating = false;
        
        restoreButtonState();
    }
}

function applyTranslations(lines: NodeListOf<Element>): void {
    if (state.overlayMode === 'interleaved') {
        const translationMapByIndex = new Map<number, string>();
        lines.forEach((line, index) => {
            const originalText = extractLineText(line);
            const translatedText = state.translatedLyrics.get(originalText);
            if (translatedText && translatedText !== originalText) {
                translationMapByIndex.set(index, translatedText);
            }
        });
        
        if (!isOverlayActive()) {
            enableOverlay({ mode: state.overlayMode });
        }
        updateOverlayContent(translationMapByIndex);
        correctLyricsScroll();
        return;
    }
    
    lines.forEach((line, index) => {
        const originalText = extractLineText(line);
        const translatedText = state.translatedLyrics.get(originalText);
        
        if (translatedText && translatedText !== originalText) {
            const existingTranslation = line.querySelector('.spicy-translation-container');
            if (existingTranslation) {
                existingTranslation.remove();
            }
            
            restoreLineText(line);
            
            (line as HTMLElement).dataset.originalText = originalText;
            (line as HTMLElement).dataset.lineIndex = index.toString();
            
            line.classList.add('spicy-translated');
            
            const letterGroups = line.querySelectorAll('.letterGroup');
            const otherElements = line.querySelectorAll('.word:not(.letterGroup .word), .syllable:not(.letterGroup .syllable), .word-group:not(.letterGroup .word-group)');
            
            if (letterGroups.length > 0 || otherElements.length > 0) {
                letterGroups.forEach((el) => {
                    (el as HTMLElement).classList.add('spicy-hidden-original');
                });
                otherElements.forEach((el) => {
                    (el as HTMLElement).classList.add('spicy-hidden-original');
                });
            } else {
                const existingWrapper = line.querySelector('.spicy-original-wrapper');
                if (!existingWrapper) {
                    const originalContent = line.innerHTML;
                    const wrapper = document.createElement('span');
                    wrapper.className = 'spicy-original-wrapper spicy-hidden-original';
                    wrapper.innerHTML = originalContent;
                    line.innerHTML = '';
                    line.appendChild(wrapper);
                }
            }
            
            const translationSpan = document.createElement('span');
            translationSpan.className = 'spicy-translation-container spicy-translation-text';
            translationSpan.textContent = translatedText;
            line.appendChild(translationSpan);
        }
    });
    
    correctLyricsScroll();
}

function correctLyricsScroll(): void {
    requestAnimationFrame(() => {
        const activeLine = document.querySelector('.LyricsContent .line.active, .LyricsContent .line.current') ||
                           document.querySelector('.LyricsContainer .line.active, .LyricsContainer .line.current');
        
        if (activeLine) {
            activeLine.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
        
        const pipWindow = getPIPWindow();
        if (pipWindow) {
            const pipActiveLine = pipWindow.document.querySelector('.LyricsContent .line.active, .LyricsContent .line.current') ||
                                  pipWindow.document.querySelector('.LyricsContainer .line.active, .LyricsContainer .line.current');
            if (pipActiveLine) {
                pipActiveLine.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        }
    });
}

function clearRenderedTranslations(lines: NodeListOf<Element>): void {
    lines.forEach(line => {
        restoreLineText(line);
        line.classList.remove('spicy-translated');
    });
}

function restoreLineText(line: Element): void {
    const hiddenElements = line.querySelectorAll('.spicy-hidden-original');
    hiddenElements.forEach(el => {
        el.classList.remove('spicy-hidden-original');
    });
    
    const translationTexts = line.querySelectorAll('.spicy-translation-container');
    translationTexts.forEach(el => el.remove());
    
    const wrapper = line.querySelector('.spicy-original-wrapper');
    if (wrapper) {
        const originalContent = wrapper.innerHTML;
        wrapper.remove();
        if (line.innerHTML.trim() === '' || !line.querySelector('.word, .syllable, .letterGroup, .letter')) {
            line.innerHTML = originalContent;
        }
    }
    
    const wordElements = line.querySelectorAll('.word[data-original-word]');
    wordElements.forEach(wordEl => {
        const el = wordEl as HTMLElement;
        if (el.dataset.originalWord !== undefined) {
            el.textContent = el.dataset.originalWord;
            delete el.dataset.originalWord;
        }
    });
}

function removeTranslations(): void {
    if (isOverlayActive()) {
        disableOverlay();
    }
    
    const documents: Document[] = [document];
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        documents.push(pipWindow.document);
    }
    
    documents.forEach(doc => {
        const translations = doc.querySelectorAll('.spicy-translation-container');
        translations.forEach(el => el.remove());
        
        doc.querySelectorAll('.slt-interleaved-translation').forEach(el => el.remove());
        
        const hiddenElements = doc.querySelectorAll('.spicy-hidden-original');
        hiddenElements.forEach(el => {
            el.classList.remove('spicy-hidden-original');
        });
        
        const wrappers = doc.querySelectorAll('.spicy-original-wrapper');
        wrappers.forEach(wrapper => {
            const parent = wrapper.parentElement;
            if (parent) {
                const originalContent = wrapper.innerHTML;
                wrapper.remove();
                if (parent.innerHTML.trim() === '' || !parent.querySelector('.word, .syllable, .letterGroup, .letter')) {
                    parent.innerHTML = originalContent;
                }
            }
        });
        
        const translatedLines = doc.querySelectorAll('.spicy-translated, .slt-overlay-parent');
        translatedLines.forEach(line => {
            line.classList.remove('spicy-translated', 'slt-overlay-parent');
        });
        
        const wordElements = doc.querySelectorAll('.word[data-original-word]');
        wordElements.forEach(wordEl => {
            const el = wordEl as HTMLElement;
            if (el.dataset.originalWord !== undefined) {
                el.textContent = el.dataset.originalWord;
                delete el.dataset.originalWord;
            }
        });
    });
    
    state.translatedLyrics.clear();
}

function showSettingsModal(): void {
    if (typeof Spicetify === 'undefined' || !Spicetify.PopupModal) {
        alert('Settings not available - Spicetify PopupModal not found');
        return;
    }
    
    const languageOptions = SUPPORTED_LANGUAGES
        .map(lang => `<option value="${lang.code}" ${lang.code === state.targetLanguage ? 'selected' : ''}>${lang.name}</option>`)
        .join('');
    
    const apiOptions = `
        <option value="google" ${state.preferredApi === 'google' ? 'selected' : ''}>Google Translate</option>
        <option value="libretranslate" ${state.preferredApi === 'libretranslate' ? 'selected' : ''}>LibreTranslate</option>
        <option value="custom" ${state.preferredApi === 'custom' ? 'selected' : ''}>Custom API</option>
    `;
    
    const overlayModeOptions = `
        <option value="replace" ${state.overlayMode === 'replace' ? 'selected' : ''}>Replace (default)</option>
        <option value="interleaved" ${state.overlayMode === 'interleaved' ? 'selected' : ''}>Below each line</option>
    `;

    const content = document.createElement('div');
    content.className = 'spicy-translate-settings';
    content.innerHTML = `
        <div class="setting-item">
            <div>
                <div class="setting-label">Target Language</div>
                <div class="setting-description">Select the language to translate lyrics to</div>
            </div>
            <select id="spicy-translate-lang-select">
                ${languageOptions}
            </select>
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Translation Display</div>
                <div class="setting-description">How to show translated lyrics</div>
            </div>
            <select id="spicy-translate-overlay-mode">
                ${overlayModeOptions}
            </select>
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Preferred API</div>
                <div class="setting-description">Select the translation service to use</div>
            </div>
            <select id="spicy-translate-api-select">
                ${apiOptions}
            </select>
        </div>
        <div class="setting-item" id="spicy-translate-custom-api-container" style="display: ${state.preferredApi === 'custom' ? 'flex' : 'none'}">
            <div>
                <div class="setting-label">Custom API URL</div>
                <div class="setting-description">Enter your custom translation API endpoint</div>
            </div>
            <input type="text" id="spicy-translate-custom-api-url" placeholder="https://your-api.com/translate" value="${state.customApiUrl}" />
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Auto-Translate</div>
                <div class="setting-description">Automatically translate lyrics when they load</div>
            </div>
            <div class="toggle-switch ${state.autoTranslate ? 'active' : ''}" id="spicy-translate-auto"></div>
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Show Notifications</div>
                <div class="setting-description">Show notifications for translation status</div>
            </div>
            <div class="toggle-switch ${state.showNotifications ? 'active' : ''}" id="spicy-translate-notifications"></div>
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Translation Cache</div>
                <div class="setting-description">${getCacheStats().trackCount || 0} tracks cached (${formatBytes(getCacheStats().sizeBytes)})</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="spicy-translate-view-cache">View Cache</button>
                <button id="spicy-translate-clear-cache">Clear All</button>
            </div>
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Version</div>
                <div class="setting-description">v${VERSION} • <a href="${REPO_URL}" target="_blank" style="color: var(--spice-button-active);">View on GitHub</a></div>
            </div>
            <button id="spicy-translate-check-updates">Check for Updates</button>
        </div>
        <div class="setting-item" style="border-bottom: none; opacity: 0.7; font-size: 12px;">
            <div>
                <div class="setting-description">Keyboard shortcut: Alt+T to toggle translation</div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const langSelect = document.getElementById('spicy-translate-lang-select') as HTMLSelectElement;
        const overlayModeSelect = document.getElementById('spicy-translate-overlay-mode') as HTMLSelectElement;
        const apiSelect = document.getElementById('spicy-translate-api-select') as HTMLSelectElement;
        const customApiContainer = document.getElementById('spicy-translate-custom-api-container');
        const customApiUrlInput = document.getElementById('spicy-translate-custom-api-url') as HTMLInputElement;
        const autoToggle = document.getElementById('spicy-translate-auto');
        const notificationsToggle = document.getElementById('spicy-translate-notifications');
        const viewCacheBtn = document.getElementById('spicy-translate-view-cache');
        const clearCacheBtn = document.getElementById('spicy-translate-clear-cache');
        
        if (langSelect) {
            langSelect.addEventListener('change', () => {
                state.targetLanguage = langSelect.value;
                storage.set('target-language', state.targetLanguage);
                
                if (state.isEnabled) {
                    state.translatedLyrics.clear();
                    removeTranslations();
                    translateCurrentLyrics();
                }
            });
        }
        
        if (overlayModeSelect) {
            overlayModeSelect.addEventListener('change', () => {
                state.overlayMode = overlayModeSelect.value as OverlayMode;
                storage.set('overlay-mode', state.overlayMode);
                setOverlayConfig({ mode: state.overlayMode });
                
                if (state.isEnabled) {
                    state.translatedLyrics.clear();
                    removeTranslations();
                    translateCurrentLyrics();
                }
            });
        }
        
        if (apiSelect) {
            apiSelect.addEventListener('change', () => {
                state.preferredApi = apiSelect.value as 'google' | 'libretranslate' | 'custom';
                storage.set('preferred-api', state.preferredApi);
                setPreferredApi(state.preferredApi, state.customApiUrl);
                
                if (customApiContainer) {
                    customApiContainer.style.display = state.preferredApi === 'custom' ? 'flex' : 'none';
                }
            });
        }
        
        if (customApiUrlInput) {
            customApiUrlInput.addEventListener('change', () => {
                state.customApiUrl = customApiUrlInput.value;
                storage.set('custom-api-url', state.customApiUrl);
                setPreferredApi(state.preferredApi, state.customApiUrl);
            });
        }
        
        if (autoToggle) {
            autoToggle.addEventListener('click', () => {
                state.autoTranslate = !state.autoTranslate;
                storage.set('auto-translate', state.autoTranslate.toString());
                autoToggle.classList.toggle('active', state.autoTranslate);
            });
        }
        
        if (notificationsToggle) {
            notificationsToggle.addEventListener('click', () => {
                state.showNotifications = !state.showNotifications;
                storage.set('show-notifications', state.showNotifications.toString());
                notificationsToggle.classList.toggle('active', state.showNotifications);
            });
        }
        
        if (viewCacheBtn) {
            viewCacheBtn.addEventListener('click', () => {
                Spicetify.PopupModal.hide();
                setTimeout(() => showCacheViewerModal(), 150);
            });
        }
        
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                clearTranslationCache();
                if (state.showNotifications && Spicetify.showNotification) {
                    Spicetify.showNotification('Translation cache cleared!');
                }
                Spicetify.PopupModal.hide();
                setTimeout(() => showSettingsModal(), 100);
            });
        }
        
        const checkUpdatesBtn = document.getElementById('spicy-translate-check-updates');
        if (checkUpdatesBtn) {
            checkUpdatesBtn.addEventListener('click', async () => {
                checkUpdatesBtn.textContent = 'Checking...';
                checkUpdatesBtn.setAttribute('disabled', 'true');
                try {
                    const info = await getUpdateInfo();
                    if (info?.hasUpdate) {
                        Spicetify.PopupModal.hide();
                        setTimeout(() => checkForUpdates(true), 150);
                    } else {
                        if (Spicetify.showNotification) {
                            Spicetify.showNotification('You\'re on the latest version!');
                        }
                        checkUpdatesBtn.textContent = 'Check for Updates';
                        checkUpdatesBtn.removeAttribute('disabled');
                    }
                } catch (error) {
                    checkUpdatesBtn.textContent = 'Check for Updates';
                    checkUpdatesBtn.removeAttribute('disabled');
                    if (Spicetify.showNotification) {
                        Spicetify.showNotification('Failed to check for updates', true);
                    }
                }
            });
        }
    }, 100);
    
    Spicetify.PopupModal.display({
        title: 'Spicy Lyric Translater Settings',
        content: content,
        isLarge: false
    });
}

function showCacheViewerModal(): void {
    if (typeof Spicetify === 'undefined' || !Spicetify.PopupModal) {
        return;
    }
    
    const cachedItems = getCachedTranslations();
    const stats = getCacheStats();
    
    const content = document.createElement('div');
    content.className = 'spicy-translate-settings';
    
    if (cachedItems.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 20px; opacity: 0.7;">
                <p>No cached translations yet.</p>
                <p style="font-size: 12px;">Translations will be cached here as you use the extension.</p>
            </div>
            <div class="setting-item" style="border-bottom: none;">
                <button id="spicy-cache-back">Back to Settings</button>
            </div>
        `;
    } else {
        const itemsHtml = cachedItems.slice(0, 50).map((item, index) => `
            <div class="cache-item" data-index="${index}" style="padding: 8px 0; border-bottom: 1px solid var(--spice-misc, #535353);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 11px; opacity: 0.6; margin-bottom: 2px;">${item.language.toUpperCase()} • ${item.api ? item.api.toUpperCase() + ' • ' : ''}${item.date.toLocaleDateString()}</div>
                        <div style="font-size: 13px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.original}">${truncateText(item.original, 40)}</div>
                        <div style="font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.translated}">${truncateText(item.translated, 40)}</div>
                    </div>
                    <button class="cache-delete-btn" data-original="${encodeURIComponent(item.original)}" data-lang="${item.language}" style="padding: 4px 8px; font-size: 12px; flex-shrink: 0;">✕</button>
                </div>
            </div>
        `).join('');
        
        content.innerHTML = `
            <div style="margin-bottom: 12px; opacity: 0.7; font-size: 12px;">
                Showing ${Math.min(cachedItems.length, 50)} of ${stats.entries} cached translations (${formatBytes(stats.sizeBytes)})
            </div>
            <div id="spicy-cache-list" style="max-height: 300px; overflow-y: auto;">
                ${itemsHtml}
            </div>
            <div class="setting-item" style="border-bottom: none; margin-top: 12px; display: flex; gap: 8px;">
                <button id="spicy-cache-back">Back to Settings</button>
                <button id="spicy-cache-clear-all" style="background: #e74c3c;">Clear All</button>
            </div>
        `;
    }
    
    setTimeout(() => {
        const backBtn = document.getElementById('spicy-cache-back');
        const clearAllBtn = document.getElementById('spicy-cache-clear-all');
        const deleteButtons = document.querySelectorAll('.cache-delete-btn');
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                Spicetify.PopupModal.hide();
                setTimeout(() => showSettingsModal(), 100);
            });
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                clearTranslationCache();
                if (state.showNotifications && Spicetify.showNotification) {
                    Spicetify.showNotification('Translation cache cleared!');
                }
                Spicetify.PopupModal.hide();
                setTimeout(() => showSettingsModal(), 100);
            });
        }
        
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.target as HTMLButtonElement;
                const original = decodeURIComponent(button.dataset.original || '');
                const lang = button.dataset.lang || '';
                
                if (deleteCachedTranslation(original, lang)) {
                    const cacheItem = button.closest('.cache-item');
                    if (cacheItem) {
                        cacheItem.remove();
                    }
                    
                    const newStats = getCacheStats();
                    const countDisplay = content.querySelector('div[style*="margin-bottom: 12px"]');
                    if (countDisplay) {
                        const remaining = getCachedTranslations().length;
                        countDisplay.textContent = `Showing ${Math.min(remaining, 50)} of ${newStats.entries} cached translations (${formatBytes(newStats.sizeBytes)})`;
                    }
                }
            });
        });
    }, 100);
    
    Spicetify.PopupModal.display({
        title: 'Translation Cache',
        content: content,
        isLarge: true
    });
}

function setupViewControlsObserver(): void {
    if (viewControlsObserver) {
        viewControlsObserver.disconnect();
        viewControlsObserver = null;
    }
    
    const viewControls = getViewControls();
    if (!viewControls) {
        debug('ViewControls not found, skipping observer setup');
        return;
    }
    
    try {
        viewControlsObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const vc = getViewControls();
                    if (vc && !vc.querySelector('#TranslateToggle')) {
                        insertTranslateButton();
                    }
                }
            }
        });
        
        viewControlsObserver.observe(viewControls, {
            childList: true,
            subtree: true
        });
        debug('ViewControls observer attached');
    } catch (e) {
        warn('Failed to setup ViewControls observer:', e);
    }
}

function setupLyricsObserver(): void {
    if (lyricsObserver) {
        lyricsObserver.disconnect();
        lyricsObserver = null;
    }
    
    const lyricsContent = getLyricsContent();
    if (!lyricsContent) {
        debug('LyricsContent not found, skipping observer setup');
        return;
    }
    
    try {
        lyricsObserver = new MutationObserver((mutations) => {
            if (!state.isEnabled || state.isTranslating) return;
            
            const hasNewContent = mutations.some(m => 
                m.type === 'childList' && 
                m.addedNodes.length > 0 &&
                Array.from(m.addedNodes).some(n => 
                    n.nodeType === Node.ELEMENT_NODE && 
                    (n as Element).classList?.contains('line')
                )
            );
            
            if (hasNewContent && state.autoTranslate && !state.isTranslating) {
                if (translateDebounceTimer) {
                    clearTimeout(translateDebounceTimer);
                }
                translateDebounceTimer = setTimeout(() => {
                    translateDebounceTimer = null;
                    if (!state.isTranslating) {
                        if (!state.isEnabled) {
                            state.isEnabled = true;
                            storage.set('translation-enabled', 'true');
                            updateButtonState();
                        }
                        translateCurrentLyrics();
                    }
                }, 500);
            }
        });
        
        lyricsObserver.observe(lyricsContent, {
            childList: true,
            subtree: true
        });
        debug('Lyrics observer attached');
    } catch (e) {
        warn('Failed to setup Lyrics observer:', e);
    }
}
async function onSpicyLyricsOpen(): Promise<void> {
    info('Lyrics view detected, initializing...');
    
    setViewingLyrics(true);
    
    let viewControls = await waitForElement('#SpicyLyricsPage .ViewControls', 3000);
    if (!viewControls) {
        viewControls = await waitForElement('.spicy-pip-wrapper .ViewControls', 3000);
    }
    if (!viewControls) {
        viewControls = await waitForElement('.Cinema--Container .ViewControls', 3000);
    }
    if (!viewControls) {
        viewControls = await waitForElement('.ViewControls', 3000);
    }
    
    if (!viewControls) {
        const pipWindow = getPIPWindow();
        if (pipWindow) {
            viewControls = pipWindow.document.querySelector('#SpicyLyricsPage .ViewControls');
        }
    }
    
    if (viewControls) {
        debug('ViewControls found, inserting button');
        insertTranslateButton();
        injectStylesIntoPIP();
        setupViewControlsObserver();
    } else {
        debug('ViewControls not found, will retry...');
    }
    
    setupLyricsObserver();
    
    if (state.autoTranslate) {
        if (!state.isEnabled) {
            state.isEnabled = true;
            storage.set('translation-enabled', 'true');
            updateButtonState();
        }
        waitForLyricsAndTranslate(20, 600);
    }
}

function injectStylesIntoPIP(): void {
    const pipWindow = getPIPWindow();
    if (!pipWindow) return;
    
    if (pipWindow.document.getElementById('spicy-lyric-translater-styles')) return;
    
    const mainStyles = document.getElementById('spicy-lyric-translater-styles');
    if (mainStyles) {
        const pipStyles = pipWindow.document.createElement('style');
        pipStyles.id = 'spicy-lyric-translater-styles';
        pipStyles.textContent = mainStyles.textContent;
        pipWindow.document.head.appendChild(pipStyles);
        debug('Injected styles into PIP window');
    }
}

function onSpicyLyricsClose(): void {
    setViewingLyrics(false);
    
    if (translateDebounceTimer) {
        clearTimeout(translateDebounceTimer);
        translateDebounceTimer = null;
    }
    
    if (state.translationAbortController) {
        state.translationAbortController.abort();
        state.translationAbortController = null;
    }
    
    state.isTranslating = false;
    
    if (viewControlsObserver) {
        viewControlsObserver.disconnect();
        viewControlsObserver = null;
    }
    
    if (lyricsObserver) {
        lyricsObserver.disconnect();
        lyricsObserver = null;
    }
}

async function registerSettingsMenu(): Promise<void> {
    while (!Spicetify.React || !Spicetify.ReactDOM) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
        const { SettingsSection } = await import('spcr-settings') as any;
        
        if (SettingsSection) {
            const settings = new SettingsSection('Spicy Lyric Translater', 'spicy-lyric-translater-settings');
            
            const languageNames = SUPPORTED_LANGUAGES.map(l => l.name);
            const currentLangIndex = SUPPORTED_LANGUAGES.findIndex(
                l => l.code === state.targetLanguage
            );
            
            settings.addDropDown(
                'target-language',
                'Target Language',
                languageNames,
                currentLangIndex >= 0 ? currentLangIndex : 0,
                () => {
                    const selectedIndex = settings.getFieldValue('target-language');
                    const lang = SUPPORTED_LANGUAGES[selectedIndex];
                    if (lang) {
                        state.targetLanguage = lang.code;
                        storage.set('target-language', lang.code);
                    }
                }
            );
            
            settings.addToggle(
                'auto-translate',
                'Auto-Translate on Song Change',
                state.autoTranslate,
                () => {
                    state.autoTranslate = settings.getFieldValue('auto-translate') === 'true';
                    storage.set('auto-translate', state.autoTranslate.toString());
                }
            );
            
            settings.addButton(
                'clear-cache',
                'Clear Translation Cache',
                'Clear Cache',
                () => {
                    clearTranslationCache();
                    Spicetify.showNotification('Translation cache cleared!');
                }
            );
            
            settings.pushSettings();
            debug('Settings registered in Spicetify settings menu');
        }
    } catch (e) {
        debug('spcr-settings not available, using built-in settings modal');
    }
}

function injectSettingsIntoSpotifySettings(): void {
    const existingSection = document.getElementById('slt-settings-section');
    if (existingSection) return;
    
    const spicyLyricsSettings = document.getElementById('spicy-lyrics-settings') || 
                                 document.getElementById('spicy-lyrics-dev-settings');
    
    const settingsContainer = document.querySelector('.x-settings-container');
    if (!settingsContainer) return;
    
    const targetElement = spicyLyricsSettings || settingsContainer.lastElementChild;
    if (!targetElement) return;
    
    const stats = getCacheStats();
    
    const section = document.createElement('div');
    section.id = 'slt-settings-section';
    section.innerHTML = `
        <div class="x-settings-section">
            <h2 class="e-91000-text encore-text-body-medium-bold encore-internal-color-text-base" data-encore-id="text">Spicy Lyric Translater</h2>
            <div class="x-settings-row">
                <div class="x-settings-firstColumn">
                    <label class="e-91000-text encore-text-body-small encore-internal-color-text-subdued" data-encore-id="text">Target Language</label>
                </div>
                <div class="x-settings-secondColumn">
                    <select class="main-dropDown-dropDown" id="slt-settings-language">
                        ${SUPPORTED_LANGUAGES.map(l => 
                            `<option value="${l.code}" ${l.code === state.targetLanguage ? 'selected' : ''}>${l.name}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="x-settings-row">
                <div class="x-settings-firstColumn">
                    <label class="e-91000-text encore-text-body-small encore-internal-color-text-subdued" data-encore-id="text">Auto-Translate</label>
                </div>
                <div class="x-settings-secondColumn">
                    <label class="x-toggle-wrapper">
                        <input id="slt-settings-autotranslate" class="x-toggle-input" type="checkbox" ${state.autoTranslate ? 'checked' : ''}>
                        <span class="x-toggle-indicatorWrapper"><span class="x-toggle-indicator"></span></span>
                    </label>
                </div>
            </div>
            <div class="x-settings-row">
                <div class="x-settings-firstColumn">
                    <label class="e-91000-text encore-text-body-small encore-internal-color-text-subdued" data-encore-id="text">Show Notifications</label>
                </div>
                <div class="x-settings-secondColumn">
                    <label class="x-toggle-wrapper">
                        <input id="slt-settings-notifications" class="x-toggle-input" type="checkbox" ${state.showNotifications ? 'checked' : ''}>
                        <span class="x-toggle-indicatorWrapper"><span class="x-toggle-indicator"></span></span>
                    </label>
                </div>
            </div>
            <div class="x-settings-row">
                <div class="x-settings-firstColumn">
                    <div>
                        <label class="e-91000-text encore-text-body-small encore-internal-color-text-base" data-encore-id="text">Translation Cache</label>
                        <label class="e-91000-text encore-text-body-small encore-internal-color-text-subdued" data-encore-id="text" id="slt-cache-stats"> ${stats.trackCount} tracks cached (${formatBytes(stats.sizeBytes)})</label>
                    </div>
                </div>
                <div class="x-settings-secondColumn">
                    <button id="slt-settings-clear-cache" class="Button-sc-y0gtbx-0 Button-buttonSecondary-small-useBrowserDefaultFocusStyle encore-text-body-small-bold e-91000-button--small">Clear Cache</button>
                </div>
            </div>
            <div class="x-settings-row">
                <div class="x-settings-firstColumn">
                    <label class="e-91000-text encore-text-body-small encore-internal-color-text-subdued" data-encore-id="text">Version v${VERSION}</label>
                </div>
                <div class="x-settings-secondColumn">
                    <button id="slt-settings-open-modal" class="Button-sc-y0gtbx-0 Button-buttonSecondary-small-useBrowserDefaultFocusStyle encore-text-body-small-bold e-91000-button--small">Open Settings</button>
                </div>
            </div>
        </div>
    `;
    
    if (spicyLyricsSettings) {
        spicyLyricsSettings.parentNode?.insertBefore(section, spicyLyricsSettings.nextSibling);
    } else {
        settingsContainer.appendChild(section);
    }
    
    const langSelect = document.getElementById('slt-settings-language') as HTMLSelectElement;
    langSelect?.addEventListener('change', () => {
        state.targetLanguage = langSelect.value;
        storage.set('target-language', langSelect.value);
        if (typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
            Spicetify.showNotification(`Language set to ${SUPPORTED_LANGUAGES.find(l => l.code === langSelect.value)?.name}`);
        }
    });
    
    const autoTranslateToggle = document.getElementById('slt-settings-autotranslate') as HTMLInputElement;
    autoTranslateToggle?.addEventListener('change', () => {
        state.autoTranslate = autoTranslateToggle.checked;
        storage.set('auto-translate', state.autoTranslate.toString());
    });
    
    const notificationsToggle = document.getElementById('slt-settings-notifications') as HTMLInputElement;
    notificationsToggle?.addEventListener('change', () => {
        state.showNotifications = notificationsToggle.checked;
        storage.set('show-notifications', state.showNotifications.toString());
    });
    
    const clearCacheBtn = document.getElementById('slt-settings-clear-cache');
    clearCacheBtn?.addEventListener('click', () => {
        clearTranslationCache();
        const statsLabel = document.getElementById('slt-cache-stats');
        if (statsLabel) {
            statsLabel.textContent = ' 0 tracks cached (0 B)';
        }
        if (typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
            Spicetify.showNotification('Translation cache cleared!');
        }
    });
    
    const openModalBtn = document.getElementById('slt-settings-open-modal');
    openModalBtn?.addEventListener('click', () => {
        showSettingsModal();
    });
    
    debug('Injected settings into Spotify settings page');
}

let settingsPageObserver: MutationObserver | null = null;

function setupSettingsPageObserver(): void {
    // Clean up existing observer
    if (settingsPageObserver) {
        settingsPageObserver.disconnect();
        settingsPageObserver = null;
    }
    
    // Initial injection if settings page is already open
    if (document.querySelector('.x-settings-container')) {
        injectSettingsIntoSpotifySettings();
        return; // Settings already visible, no need for observer
    }
    
    // Use a more targeted approach - only observe main content area
    const mainView = document.querySelector('.Root__main-view') || document.querySelector('[data-testid="main-view-container"]');
    const observerTarget = mainView || document.body;
    
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    settingsPageObserver = new MutationObserver((mutations) => {
        // Debounce to prevent excessive calls
        if (debounceTimer) return;
        
        const hasSettingsChange = mutations.some(m => 
            m.type === 'childList' && 
            Array.from(m.addedNodes).some(node => 
                node.nodeType === Node.ELEMENT_NODE && 
                ((node as Element).classList?.contains('x-settings-container') ||
                 (node as Element).querySelector?.('.x-settings-container'))
            )
        );
        
        if (hasSettingsChange) {
            debounceTimer = setTimeout(() => {
                debounceTimer = null;
                const settingsContainer = document.querySelector('.x-settings-container');
                if (settingsContainer && !document.getElementById('slt-settings-section')) {
                    injectSettingsIntoSpotifySettings();
                }
            }, 200);
        }
    });
    
    settingsPageObserver.observe(observerTarget, {
        childList: true,
        subtree: true
    });
}

function setupPageObserver(): void {
    debug('Setting up page observer...');
    
    if (isSpicyLyricsOpen()) {
        debug('Lyrics view already open');
        onSpicyLyricsOpen();
    }
    
    const mainView = document.querySelector('.Root__main-view') || document.body;
    const observerTarget = mainView;
    
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const isLyricsNode = (node: Node): boolean => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return false;
                    const el = node as Element;
                    return el.id === 'SpicyLyricsPage' || 
                           el.classList?.contains('Cinema--Container') ||
                           el.classList?.contains('spicy-lyrics-cinema') ||
                           el.classList?.contains('spicy-pip-wrapper') ||
                           !!el.querySelector('#SpicyLyricsPage') ||
                           !!el.querySelector('.Cinema--Container') ||
                           !!el.querySelector('.spicy-pip-wrapper');
                };
                
                const added = Array.from(mutation.addedNodes).some(isLyricsNode);
                const removed = Array.from(mutation.removedNodes).some(isLyricsNode);
                
                if (added) {
                    debug('Lyrics view opened');
                    onSpicyLyricsOpen();
                }
                
                if (removed) {
                    debug('Lyrics view closed');
                    onSpicyLyricsClose();
                }
            }
        }
    });
    
    observer.observe(observerTarget, {
        childList: true,
        subtree: true
    });
    
    debug(`Observer attached to ${observerTarget === document.body ? 'document.body' : '.Root__main-view'}`);
    
    setupPIPObserver();
}

function setupPIPObserver(): void {
    const docPiP = (globalThis as any).documentPictureInPicture;
    if (!docPiP) return;
    
    docPiP.addEventListener('enter', (event: any) => {
        debug('PIP window opened');
        const pipWindow = event.window;
        if (pipWindow) {
            setTimeout(() => {
                injectStylesIntoPIP();
                insertTranslateButton();
                setupPIPLyricsObserver(pipWindow);
                
                if (state.isEnabled && state.translatedLyrics.size > 0) {
                    const lines = getLyricsLines();
                    if (lines.length > 0) {
                        applyTranslations(lines);
                    }
                }
            }, 1000);
        }
    });
}

function setupPIPLyricsObserver(pipWindow: Window, retryCount: number = 0): void {
    const MAX_RETRIES = 6;
    
    if (retryCount >= MAX_RETRIES) {
        debug('Max retries reached for PIP lyrics observer setup');
        return;
    }
    
    let lyricsContent: Element | null = null;
    try {
        lyricsContent = pipWindow.document?.querySelector('.LyricsContent');
    } catch (e) {
        debug('PIP window no longer accessible');
        return;
    }
    
    if (!lyricsContent) {
        setTimeout(() => setupPIPLyricsObserver(pipWindow, retryCount + 1), 500);
        return;
    }
    
    try {
        const pipObserver = new MutationObserver((mutations) => {
            if (!state.isEnabled || state.isTranslating) return;
            
            const hasNewContent = mutations.some(m => 
                m.type === 'childList' && 
                m.addedNodes.length > 0 &&
                Array.from(m.addedNodes).some(n => 
                    n.nodeType === Node.ELEMENT_NODE && 
                    (n as Element).classList?.contains('line')
                )
            );
            
            if (hasNewContent && !state.isTranslating) {
                if (translateDebounceTimer) {
                    clearTimeout(translateDebounceTimer);
                }
                translateDebounceTimer = setTimeout(() => {
                    translateDebounceTimer = null;
                    if (!state.isTranslating && state.isEnabled) {
                        translateCurrentLyrics();
                    }
                }, 300);
            }
        });
        
        pipObserver.observe(lyricsContent, {
            childList: true,
            subtree: true
        });
        debug('PIP lyrics observer attached');
    } catch (e) {
        warn('Failed to setup PIP lyrics observer:', e);
    }
}

function getCurrentViewMode(): string {
    const pipWindow = getPIPWindow();
    if (pipWindow && pipWindow.document.querySelector('#SpicyLyricsPage')) {
        return 'pip';
    }
    
    const page = document.querySelector('#SpicyLyricsPage');
    if (!page) return 'none';
    
    if (page.classList.contains('SidebarMode')) return 'sidebar';
    if (page.classList.contains('ForcedCompactMode')) return 'compact';
    if (document.fullscreenElement) return 'fullscreen';
    
    const isInFullscreenContainer = !!document.querySelector('.Cinema--Container #SpicyLyricsPage');
    if (isInFullscreenContainer) return 'cinema';
    
    return 'normal';
}

function setupViewModeObserver(): void {
    if (viewModeIntervalId) {
        clearInterval(viewModeIntervalId);
        viewModeIntervalId = null;
    }
    
    viewModeIntervalId = setInterval(() => {
        const currentMode = getCurrentViewMode();
        
        if (state.lastViewMode !== null && state.lastViewMode !== currentMode && currentMode !== 'none') {
            debug(`View mode changed: ${state.lastViewMode} -> ${currentMode}`);
            
            setTimeout(() => {
                insertTranslateButton();
                
                if (state.isEnabled && state.translatedLyrics.size > 0) {
                    const lines = getLyricsLines();
                    if (lines.length > 0) {
                        applyTranslations(lines);
                    }
                } else if (state.isEnabled) {
                    translateCurrentLyrics();
                }
            }, 500);
        }
        
        state.lastViewMode = currentMode;
    }, 3000);
}

function setupKeyboardShortcut(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            e.stopPropagation();
            if (isSpicyLyricsOpen()) {
                handleTranslateToggle();
            }
        }
    });
}

async function initialize(): Promise<void> {
    while (typeof Spicetify === 'undefined' || !Spicetify.Platform) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    info('Initializing...');
    
    state.isEnabled = storage.get('translation-enabled') === 'true';
    state.targetLanguage = storage.get('target-language') || 'en';
    state.autoTranslate = storage.get('auto-translate') === 'true';
    state.showNotifications = storage.get('show-notifications') !== 'false';
    state.preferredApi = (storage.get('preferred-api') as 'google' | 'libretranslate' | 'custom') || 'google';
    state.customApiUrl = storage.get('custom-api-url') || '';
    
    setPreferredApi(state.preferredApi, state.customApiUrl);
    
    injectStyles();
    
    initConnectionIndicator();
    
    registerSettingsMenu();
    
    setupSettingsPageObserver();
    
    startUpdateChecker(30 * 60 * 1000);
    
    setupKeyboardShortcut();
    
    setupPageObserver();
    
    setupViewModeObserver();
    
    if (Spicetify.Platform?.History?.listen) {
        Spicetify.Platform.History.listen(() => {
            setTimeout(() => {
                if (isSpicyLyricsOpen() && !document.querySelector('#TranslateToggle')) {
                    onSpicyLyricsOpen();
                }
            }, 100);
        });
    }
    
    if (Spicetify.Player?.addEventListener) {
        Spicetify.Player.addEventListener('songchange', () => {
            debug('Song changed');
            
            if (translateDebounceTimer) {
                clearTimeout(translateDebounceTimer);
                translateDebounceTimer = null;
            }
            
            if (state.translationAbortController) {
                state.translationAbortController.abort();
                state.translationAbortController = null;
            }
            
            state.isTranslating = false;
            
            state.translatedLyrics.clear();
            removeTranslations();
            
            if (state.autoTranslate) {
                if (!state.isEnabled) {
                    state.isEnabled = true;
                    storage.set('translation-enabled', 'true');
                    updateButtonState();
                }
                waitForLyricsAndTranslate(20, 800);
            }
        });
    }
    
    info('Initialized successfully!');
}

window.SpicyLyricTranslater = {
    enable: () => {
        state.isEnabled = true;
        storage.set('translation-enabled', 'true');
        translateCurrentLyrics();
    },
    disable: () => {
        state.isEnabled = false;
        storage.set('translation-enabled', 'false');
        removeTranslations();
    },
    toggle: () => {
        if (isSpicyLyricsOpen()) {
            handleTranslateToggle();
        }
    },
    setLanguage: (lang: string) => {
        state.targetLanguage = lang;
        storage.set('target-language', lang);
    },
    translate: translateCurrentLyrics,
    showSettings: showSettingsModal,
    showCacheViewer: showCacheViewerModal,
    clearCache: clearTranslationCache,
    getCacheStats: getCacheStats,
    getCachedTranslations: getCachedTranslations,
    deleteCachedTranslation: deleteCachedTranslation,
    getState: () => ({ ...state }),
    checkForUpdates: () => checkForUpdates(true),
    getUpdateInfo: getUpdateInfo,
    version: VERSION,
    connectivity: {
        getState: getConnectionState,
        refresh: refreshConnection
    }
};

initialize().catch(error);

export default initialize;
