/**
 * Spicy Lyric Translater
 * A Spicetify extension that adds translation functionality to Spicy Lyrics
 * 
 * @author 7xeh
 * @version 1.4.3
 */

import { Icons } from './utils/icons';
import { storage } from './utils/storage';
import { translateLyrics, SUPPORTED_LANGUAGES, clearTranslationCache, setPreferredApi, isOffline, getCacheStats, getCachedTranslations, deleteCachedTranslation } from './utils/translator';
import { injectStyles } from './styles/main';
import { checkForUpdates, startUpdateChecker, getUpdateInfo, getCurrentVersion, VERSION, REPO_URL } from './utils/updater';
import { initConnectionIndicator, getConnectionState, refreshConnection, setViewingLyrics } from './utils/connectivity';

// Extension state
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
    translationAbortController: AbortController | null;  // For cancelling translations
}

const state: ExtensionState = {
    isEnabled: false,
    isTranslating: false,
    targetLanguage: storage.get('target-language') || 'en',
    autoTranslate: storage.get('auto-translate') === 'true',
    showNotifications: storage.get('show-notifications') !== 'false', // Default to true
    preferredApi: (storage.get('preferred-api') as 'google' | 'libretranslate' | 'custom') || 'google',
    customApiUrl: storage.get('custom-api-url') || '',
    lastTranslatedSongUri: null,
    translatedLyrics: new Map(),
    lastViewMode: null,
    translationAbortController: null
};

// DOM observer for Spicy Lyrics
let viewControlsObserver: MutationObserver | null = null;
let lyricsObserver: MutationObserver | null = null;
let translateDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Constants
const TRANSLATION_DEBOUNCE_MS = 300;
const MAX_LYRICS_CACHE_SIZE = 100;  // Max lyrics per song to keep in memory

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Debounce function to prevent rapid API calls
 */
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

/**
 * Wait for an element to exist in the DOM
 */
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

/**
 * Check if Spicy Lyrics page is open (including Cinema View and PIP popout)
 */
function isSpicyLyricsOpen(): boolean {
    return !!(document.querySelector('#SpicyLyricsPage') || 
              document.querySelector('.spicy-pip-wrapper #SpicyLyricsPage') ||
              document.querySelector('.Cinema--Container') ||
              document.querySelector('.spicy-lyrics-cinema'));
}

/**
 * Get the ViewControls element from Spicy Lyrics (supports main page, Cinema View, and PIP)
 */
function getViewControls(): HTMLElement | null {
    // Try PIP window first
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

/**
 * Get the PIP (Picture-in-Picture) window if available
 */
function getPIPWindow(): Window | null {
    try {
        // @ts-ignore: documentPictureInPicture is not yet standard
        const docPiP = (globalThis as any).documentPictureInPicture;
        if (docPiP && docPiP.window) {
            return docPiP.window;
        }
    } catch (e) {
        // PIP not available
    }
    return null;
}

/**
 * Get the lyrics content container (supports main page, Cinema View, and PIP)
 */
function getLyricsContent(): HTMLElement | null {
    // Try PIP window first
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

/**
 * Create the translate toggle button
 */
function createTranslateButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.id = 'TranslateToggle';
    button.className = 'ViewControl';
    button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    
    if (state.isEnabled) {
        button.classList.add('active');
    }
    
    // Add tooltip using Spicetify's Tippy
    if (typeof Spicetify !== 'undefined' && Spicetify.Tippy) {
        try {
            Spicetify.Tippy(button, {
                ...Spicetify.TippyProps,
                content: state.isEnabled ? 'Disable Translation' : 'Enable Translation'
            });
        } catch (e) {
            console.warn('[SpicyLyricTranslater] Failed to create tooltip:', e);
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

/**
 * Insert translate button into ViewControls
 */
function insertTranslateButton(): void {
    // Insert into main document
    insertTranslateButtonIntoDocument(document);
    
    // Also insert into PIP window if available
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        insertTranslateButtonIntoDocument(pipWindow.document);
    }
}

/**
 * Insert translate button into a specific document's ViewControls
 */
function insertTranslateButtonIntoDocument(doc: Document): void {
    const viewControls = doc.querySelector('#SpicyLyricsPage .ViewControls') ||
                         doc.querySelector('.ViewControls');
    
    if (!viewControls) return;
    
    // Check if button already exists
    if (viewControls.querySelector('#TranslateToggle')) return;
    
    // Find the romanization button to insert next to it
    const romanizeButton = viewControls.querySelector('#RomanizationToggle');
    const translateButton = createTranslateButton();
    
    if (romanizeButton) {
        // Insert after romanization button
        romanizeButton.insertAdjacentElement('afterend', translateButton);
    } else {
        // Insert at the beginning of ViewControls
        const firstChild = viewControls.firstChild;
        if (firstChild) {
            viewControls.insertBefore(translateButton, firstChild);
        } else {
            viewControls.appendChild(translateButton);
        }
    }
}

/**
 * Update the translate button visual state
 */
function updateButtonState(): void {
    // Update in main document
    const button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    if (button) {
        button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
        button.classList.toggle('active', state.isEnabled);
        
        // Update tooltip
        const buttonWithTippy = button as HTMLButtonElement & { _tippy?: { setContent: (content: string) => void } };
        if (buttonWithTippy._tippy) {
            buttonWithTippy._tippy.setContent(state.isEnabled ? 'Disable Translation' : 'Enable Translation');
        }
    }
    
    // Also update in PIP window if available
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        const pipButton = pipWindow.document.querySelector('#TranslateToggle') as HTMLButtonElement;
        if (pipButton) {
            pipButton.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
            pipButton.classList.toggle('active', state.isEnabled);
        }
    }
}

/**
 * Restore button state after loading (removes loading spinner)
 */
function restoreButtonState(): void {
    // Restore in main document
    const button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    if (button) {
        button.classList.remove('loading');
        button.classList.remove('error');
        button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    }
    
    // Also restore in PIP window if available
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

/**
 * Set button to error state for visual feedback on translation failure
 */
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

/**
 * Handle translate toggle button click
 */
async function handleTranslateToggle(): Promise<void> {
    // Check for button in main document or PIP
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
    
    // Update button state
    updateButtonState();
    
    if (state.isEnabled) {
        await translateCurrentLyrics();
    } else {
        removeTranslations();
    }
}

/**
 * Wait for lyrics to load and then translate
 * Uses content hash to detect when lyrics actually change
 */
async function waitForLyricsAndTranslate(retries: number = 10, delay: number = 500): Promise<void> {
    console.log('[SpicyLyricTranslater] Waiting for lyrics to load...');
    
    // Store initial content hash to detect changes
    let previousContentHash = '';
    let stableCount = 0;
    const requiredStableIterations = 2; // Lyrics must be stable for 2 iterations
    
    for (let i = 0; i < retries; i++) {
        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Check if SpicyLyrics is open
        if (!isSpicyLyricsOpen()) {
            console.log('[SpicyLyricTranslater] SpicyLyrics not open, stopping retry');
            return;
        }
        
        // Check if we're already translating
        if (state.isTranslating) {
            console.log('[SpicyLyricTranslater] Already translating, stopping retry');
            return;
        }
        
        // Try to get lyrics lines
        const lines = getLyricsLines();
        if (lines.length === 0) {
            console.log(`[SpicyLyricTranslater] Attempt ${i + 1}/${retries}: No lyrics found yet`);
            previousContentHash = '';
            stableCount = 0;
            continue;
        }
        
        // Calculate content hash to detect when lyrics have actually changed/stabilized
        const currentContent = Array.from(lines).slice(0, 5).map(l => l.textContent?.trim() || '').join('|');
        const currentHash = currentContent.substring(0, 100);
        
        if (currentHash === previousContentHash && currentHash.length > 0) {
            stableCount++;
            console.log(`[SpicyLyricTranslater] Attempt ${i + 1}/${retries}: Lyrics stable (${stableCount}/${requiredStableIterations})`);
            
            if (stableCount >= requiredStableIterations) {
                console.log(`[SpicyLyricTranslater] Found ${lines.length} stable lyrics lines after ${i + 1} attempts`);
                await translateCurrentLyrics();
                return;
            }
        } else {
            console.log(`[SpicyLyricTranslater] Attempt ${i + 1}/${retries}: Lyrics content changed, resetting stability counter`);
            stableCount = 0;
        }
        
        previousContentHash = currentHash;
    }
    
    console.log('[SpicyLyricTranslater] Gave up waiting for stable lyrics after', retries, 'attempts');
}

/**
 * Get lyrics lines from the content (supports normal, Cinema View, and PIP)
 */
function getLyricsLines(): NodeListOf<Element> {
    // Try main document first with various selectors
    let lines = document.querySelectorAll('#SpicyLyricsPage .LyricsContent .line:not(.musical-line)');
    
    if (lines.length === 0) {
        lines = document.querySelectorAll('.LyricsContent .line:not(.musical-line)');
    }
    if (lines.length === 0) {
        lines = document.querySelectorAll('.LyricsContainer .line:not(.musical-line)');
    }
    
    // If found in main document, return those
    if (lines.length > 0) {
        console.log(`[SpicyLyricTranslater] Found ${lines.length} lyrics lines in main document`);
        return lines;
    }
    
    // Try PIP window
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
            console.log(`[SpicyLyricTranslater] Found ${lines.length} lyrics lines in PIP`);
            return lines;
        }
    }
    
    console.log('[SpicyLyricTranslater] No lyrics lines found');
    return lines;
}

/**
 * Get lyrics lines specifically from PIP window
 */
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

/**
 * Extract text from a lyrics line element
 * Handles various Spicy Lyrics formats: word-synced, syllable-synced, letter-synced (TTML), and line-synced
 */
function extractLineText(lineElement: Element): string {
    // Skip musical lines (dots only)
    if (lineElement.classList.contains('musical-line')) {
        return '';
    }
    
    // For letter-synced TTML lyrics with letterGroup elements
    const letterGroups = lineElement.querySelectorAll('.letterGroup');
    if (letterGroups.length > 0) {
        // Get text from letterGroups and standalone words
        const parts: string[] = [];
        const children = lineElement.children;
        
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.classList.contains('letterGroup')) {
                // Extract text from letter elements
                const letters = child.querySelectorAll('.letter');
                const word = Array.from(letters)
                    .map(letter => letter.textContent || '')
                    .join('');
                if (word) parts.push(word);
            } else if (child.classList.contains('word') && !child.classList.contains('dot')) {
                const text = child.textContent?.trim();
                if (text && text !== '•') parts.push(text);
            } else if (child.classList.contains('word-group')) {
                // Handle word-group containers (multi-syllable words)
                const text = child.textContent?.trim();
                if (text && text !== '•') parts.push(text);
            }
        }
        
        if (parts.length > 0) {
            return parts.join(' ').trim();
        }
    }
    
    // For word-synced lyrics, check for word elements
    const wordElements = lineElement.querySelectorAll('.word:not(.dot)');
    
    if (wordElements.length > 0) {
        const text = Array.from(wordElements)
            .map(word => word.textContent?.trim() || '')
            .filter(t => t.length > 0 && t !== '•')
            .join(' ')
            .trim();
        if (text) return text;
    }
    
    // For syllable lyrics
    const syllableElements = lineElement.querySelectorAll('.syllable');
    if (syllableElements.length > 0) {
        const text = Array.from(syllableElements)
            .map(syl => syl.textContent?.trim() || '')
            .filter(t => t.length > 0)
            .join('')
            .trim();
        if (text) return text;
    }
    
    // Fallback to direct text content (for line-synced lyrics)
    const text = lineElement.textContent?.trim() || '';
    // Filter out lines that are just dots
    if (/^[•\s]+$/.test(text)) {
        return '';
    }
    return text;
}

/**
 * Translate current lyrics
 */
async function translateCurrentLyrics(): Promise<void> {
    if (state.isTranslating) {
        console.log('[SpicyLyricTranslater] Already translating, skipping');
        return;
    }
    
    // Check if offline and show appropriate message
    if (isOffline()) {
        const cacheStats = getCacheStats();
        if (cacheStats.entries > 0) {
            console.log('[SpicyLyricTranslater] Offline - will use cached translations only');
            if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
                Spicetify.showNotification('Offline - using cached translations');
            }
        } else {
            console.log('[SpicyLyricTranslater] Offline with no cache available');
            if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
                Spicetify.showNotification('Offline - translations unavailable', true);
            }
            return;
        }
    }
    
    // Get all available lines from any context
    const lines = getLyricsLines();
    
    if (lines.length === 0) {
        console.log('[SpicyLyricTranslater] No lyrics lines found, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryLines = getLyricsLines();
        if (retryLines.length === 0) {
            console.log('[SpicyLyricTranslater] Still no lyrics lines found');
            return;
        }
        // Use retry lines
        return translateCurrentLyrics();
    }
    
    state.isTranslating = true;
    
    // Update button to show loading state in both main and PIP
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
        // Extract text from all lines
        const lineTexts: string[] = [];
        lines.forEach(line => {
            const text = extractLineText(line);
            lineTexts.push(text);
        });
        
        console.log('[SpicyLyricTranslater] Extracted lyrics:', lineTexts.slice(0, 3), '...');
        
        // Filter out empty lines for translation
        const nonEmptyTexts = lineTexts.filter(t => t.trim().length > 0);
        if (nonEmptyTexts.length === 0) {
            console.log('[SpicyLyricTranslater] No non-empty lyrics found');
            state.isTranslating = false;
            restoreButtonState();
            return;
        }
        
        // Translate all lines
        console.log('[SpicyLyricTranslater] Translating', nonEmptyTexts.length, 'lines...');
        const translations = await translateLyrics(lineTexts, state.targetLanguage);
        console.log('[SpicyLyricTranslater] Translation complete, got', translations.length, 'results');
        
        // Check if any actual translation was performed
        const wasActuallyTranslated = translations.some(t => t.wasTranslated === true);
        
        // Store translations
        state.translatedLyrics.clear();
        translations.forEach((result, index) => {
            state.translatedLyrics.set(lineTexts[index], result.translatedText);
        });
        
        // Apply translations to the lines we found
        applyTranslations(lines);
        
        // Show notification if enabled and actual translation occurred
        if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
            if (wasActuallyTranslated) {
                Spicetify.showNotification('Lyrics translated successfully!');
            } else {
                // Lyrics are already in the target language
                Spicetify.showNotification('Lyrics are already in the target language');
            }
        }
    } catch (error) {
        console.error('[SpicyLyricTranslater] Translation failed:', error);
        if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
            Spicetify.showNotification('Translation failed. Please try again.', true);
        }
        
        // Set button to error state for visual feedback
        setButtonErrorState(true);
        
        // Clear error state after 3 seconds
        setTimeout(() => setButtonErrorState(false), 3000);
    } finally {
        state.isTranslating = false;
        
        // Restore button state in both main and PIP
        restoreButtonState();
    }
}

/**
 * Apply translations to the lyrics DOM
 * Hides original content and shows only translated text
 */
function applyTranslations(lines: NodeListOf<Element>): void {
    lines.forEach((line, index) => {
        const originalText = extractLineText(line);
        const translatedText = state.translatedLyrics.get(originalText);
        
        if (translatedText && translatedText !== originalText) {
            // Remove existing translation elements first
            const existingTranslation = line.querySelector('.spicy-translation-container');
            if (existingTranslation) {
                existingTranslation.remove();
            }
            
            // Restore any previously hidden content first
            restoreLineText(line);
            
            // Store original text as data attribute for restoration
            (line as HTMLElement).dataset.originalText = originalText;
            (line as HTMLElement).dataset.lineIndex = index.toString();
            
            // Mark line as translated
            line.classList.add('spicy-translated');
            
            // Hide original content completely, show only translation
            // Get all direct content elements (words, syllables, letterGroups, word-groups, or text nodes)
            // This handles all Spicy Lyrics formats including custom TTML with letter-synced lyrics
            const contentElements = line.querySelectorAll('.word, .syllable, .letterGroup, .word-group, .letter');
            
            if (contentElements.length > 0) {
                // Hide all content elements
                // For TTML, we need to hide letterGroups (which contain letters) and standalone words
                contentElements.forEach((el) => {
                    (el as HTMLElement).classList.add('spicy-hidden-original');
                });
            } else {
                // For line-synced lyrics without word elements, wrap content
                const existingWrapper = line.querySelector('.spicy-original-wrapper');
                if (!existingWrapper) {
                    // Save original innerHTML and create wrapper
                    const originalContent = line.innerHTML;
                    const wrapper = document.createElement('span');
                    wrapper.className = 'spicy-original-wrapper spicy-hidden-original';
                    wrapper.innerHTML = originalContent;
                    line.innerHTML = '';
                    line.appendChild(wrapper);
                }
            }
            
            // Add translation as the visible content
            const translationSpan = document.createElement('span');
            translationSpan.className = 'spicy-translation-container spicy-translation-text';
            translationSpan.textContent = translatedText;
            line.appendChild(translationSpan);
        }
    });
    
    // Trigger scroll correction to keep the active lyric line centered
    // This prevents the view from "jumping" when translations change line heights
    correctLyricsScroll();
}

/**
 * Correct scroll position after translations are applied
 * Ensures the active/current lyric line remains visible and centered
 */
function correctLyricsScroll(): void {
    requestAnimationFrame(() => {
        // Find the active/current lyric line
        const activeLine = document.querySelector('.LyricsContent .line.active, .LyricsContent .line.current') ||
                           document.querySelector('.LyricsContainer .line.active, .LyricsContainer .line.current');
        
        if (activeLine) {
            // Scroll the active line into view smoothly
            activeLine.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
        
        // Also handle PIP window
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

// Remove rendered translations from given lines without clearing the cache
function clearRenderedTranslations(lines: NodeListOf<Element>): void {
    lines.forEach(line => {
        restoreLineText(line);
        line.classList.remove('spicy-translated');
    });
}

/**
 * Restore original text/visibility to a line's elements
 */
function restoreLineText(line: Element): void {
    // Restore visibility of hidden word/syllable elements
    const hiddenElements = line.querySelectorAll('.spicy-hidden-original');
    hiddenElements.forEach(el => {
        el.classList.remove('spicy-hidden-original');
    });
    
    // Remove translation text elements
    const translationTexts = line.querySelectorAll('.spicy-translation-container');
    translationTexts.forEach(el => el.remove());
    
    // Restore wrapped content for line-synced lyrics (spicy-original-wrapper)
    const wrapper = line.querySelector('.spicy-original-wrapper');
    if (wrapper) {
        const originalContent = wrapper.innerHTML;
        wrapper.remove();
        // Only restore if line is now empty
        if (line.innerHTML.trim() === '' || !line.querySelector('.word, .syllable, .letterGroup, .letter')) {
            line.innerHTML = originalContent;
        }
    }
    
    // Legacy: restore word elements with data-original-word
    const wordElements = line.querySelectorAll('.word[data-original-word]');
    wordElements.forEach(wordEl => {
        const el = wordEl as HTMLElement;
        if (el.dataset.originalWord !== undefined) {
            el.textContent = el.dataset.originalWord;
            delete el.dataset.originalWord;
        }
    });
}

/**
 * Remove translations from lyrics and restore original content
 */
function removeTranslations(): void {
    // Get all documents to clean (main document + PIP if available)
    const documents: Document[] = [document];
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        documents.push(pipWindow.document);
    }
    
    documents.forEach(doc => {
        // Remove translation containers first
        const translations = doc.querySelectorAll('.spicy-translation-container');
        translations.forEach(el => el.remove());
        
        // Restore visibility of hidden elements
        const hiddenElements = doc.querySelectorAll('.spicy-hidden-original');
        hiddenElements.forEach(el => {
            el.classList.remove('spicy-hidden-original');
        });
        
        // Restore wrapped content for line-synced lyrics (spicy-original-wrapper)
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
        
        // Remove translated class
        const translatedLines = doc.querySelectorAll('.spicy-translated');
        translatedLines.forEach(line => {
            line.classList.remove('spicy-translated');
        });
        
        // Legacy: restore word elements with data-original-word
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

/**
 * Show settings modal
 */
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
                <div class="setting-description">${getCacheStats().entries} cached translations (${formatBytes(getCacheStats().sizeBytes)})</div>
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
    
    // Add event listeners
    setTimeout(() => {
        const langSelect = document.getElementById('spicy-translate-lang-select') as HTMLSelectElement;
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
                
                // Re-translate if enabled
                if (state.isEnabled) {
                    translateCurrentLyrics();
                }
            });
        }
        
        if (apiSelect) {
            apiSelect.addEventListener('change', () => {
                state.preferredApi = apiSelect.value as 'google' | 'libretranslate' | 'custom';
                storage.set('preferred-api', state.preferredApi);
                setPreferredApi(state.preferredApi, state.customApiUrl);
                
                // Show/hide custom API URL input
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
                // Close and reopen to refresh cache count
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

/**
 * Show cache viewer modal with all cached translations
 */
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
    
    // Add event listeners
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
                    // Remove the item from the list
                    const cacheItem = button.closest('.cache-item');
                    if (cacheItem) {
                        cacheItem.remove();
                    }
                    
                    // Update the count display
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

/**
 * Setup observer for ViewControls changes
 */
function setupViewControlsObserver(): void {
    if (viewControlsObserver) {
        viewControlsObserver.disconnect();
    }
    
    viewControlsObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // Check if our button was removed
                const viewControls = getViewControls();
                if (viewControls && !viewControls.querySelector('#TranslateToggle')) {
                    insertTranslateButton();
                }
            }
        }
    });
    
    const viewControls = getViewControls();
    if (viewControls) {
        viewControlsObserver.observe(viewControls, {
            childList: true,
            subtree: true
        });
    }
}

/**
 * Setup observer for lyrics content changes
 */
function setupLyricsObserver(): void {
    if (lyricsObserver) {
        lyricsObserver.disconnect();
    }
    
    lyricsObserver = new MutationObserver((mutations) => {
        if (!state.isEnabled || state.isTranslating) return;
        
        // Check if new lyrics were loaded
        const hasNewContent = mutations.some(m => 
            m.type === 'childList' && 
            m.addedNodes.length > 0 &&
            Array.from(m.addedNodes).some(n => 
                n.nodeType === Node.ELEMENT_NODE && 
                (n as Element).classList?.contains('line')
            )
        );
        
        if (hasNewContent && state.autoTranslate && !state.isTranslating) {
            // Debounce to avoid multiple rapid translations
            setTimeout(() => {
                if (!state.isTranslating) {
                    // Auto-enable translation if auto-translate is on
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
    
    const lyricsContent = getLyricsContent();
    if (lyricsContent) {
        lyricsObserver.observe(lyricsContent, {
            childList: true,
            subtree: true
        });
    }
}

/**
 * Handle Spicy Lyrics page open (including Cinema View and PIP)
 */
async function onSpicyLyricsOpen(): Promise<void> {
    console.log('[SpicyLyricTranslater] Lyrics view detected, initializing...');
    
    // Mark user as actively viewing lyrics
    setViewingLyrics(true);
    
    // Wait for ViewControls to be available - try multiple selectors including PIP
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
    
    // Also check PIP window
    if (!viewControls) {
        const pipWindow = getPIPWindow();
        if (pipWindow) {
            viewControls = pipWindow.document.querySelector('#SpicyLyricsPage .ViewControls');
        }
    }
    
    if (viewControls) {
        console.log('[SpicyLyricTranslater] ViewControls found, inserting button');
        // Insert our button
        insertTranslateButton();
        // Inject styles into PIP window if needed
        injectStylesIntoPIP();
        // Setup observers
        setupViewControlsObserver();
    } else {
        console.log('[SpicyLyricTranslater] ViewControls not found, will retry...');
    }
    
    setupLyricsObserver();
    
    // Auto-translate if auto-translate setting is on
    if (state.autoTranslate) {
        // Auto-enable translation
        if (!state.isEnabled) {
            state.isEnabled = true;
            storage.set('translation-enabled', 'true');
            updateButtonState();
        }
        // Wait for lyrics to stabilize before translating
        waitForLyricsAndTranslate(10, 800);
    }
}

/**
 * Inject styles into PIP (Picture-in-Picture) window
 */
function injectStylesIntoPIP(): void {
    const pipWindow = getPIPWindow();
    if (!pipWindow) return;
    
    // Check if styles already injected
    if (pipWindow.document.getElementById('spicy-lyric-translater-styles')) return;
    
    // Get styles from main document
    const mainStyles = document.getElementById('spicy-lyric-translater-styles');
    if (mainStyles) {
        const pipStyles = pipWindow.document.createElement('style');
        pipStyles.id = 'spicy-lyric-translater-styles';
        pipStyles.textContent = mainStyles.textContent;
        pipWindow.document.head.appendChild(pipStyles);
        console.log('[SpicyLyricTranslater] Injected styles into PIP window');
    }
}

/**
 * Handle Spicy Lyrics page close
 */
function onSpicyLyricsClose(): void {
    // Mark user as no longer actively viewing lyrics
    setViewingLyrics(false);
    
    if (viewControlsObserver) {
        viewControlsObserver.disconnect();
        viewControlsObserver = null;
    }
    
    if (lyricsObserver) {
        lyricsObserver.disconnect();
        lyricsObserver = null;
    }
    
    // Connection indicator stays visible in top left bar
}

/**
 * Register settings in Spicetify's settings menu
 */
async function registerSettingsMenu(): Promise<void> {
    // Wait for React to be available
    while (!Spicetify.React || !Spicetify.ReactDOM) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
        // Try to dynamically import spcr-settings (used by Spicy Lyrics and other extensions)
        const { SettingsSection } = await import('spcr-settings') as any;
        
        if (SettingsSection) {
            const settings = new SettingsSection('Spicy Lyric Translater', 'spicy-lyric-translater-settings');
            
            // Target Language dropdown
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
            
            // Auto-Translate toggle
            settings.addToggle(
                'auto-translate',
                'Auto-Translate on Song Change',
                state.autoTranslate,
                () => {
                    state.autoTranslate = settings.getFieldValue('auto-translate') === 'true';
                    storage.set('auto-translate', state.autoTranslate.toString());
                }
            );
            
            // Clear Cache button
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
            console.log('[SpicyLyricTranslater] Settings registered in Spicetify settings menu');
        }
    } catch (e) {
        console.log('[SpicyLyricTranslater] spcr-settings not available, using built-in settings modal');
    }
}

/**
 * Setup page observer to detect Spicy Lyrics open/close (including Cinema View and PIP)
 */
function setupPageObserver(): void {
    console.log('[SpicyLyricTranslater] Setting up page observer...');
    
    // Check if already open
    if (isSpicyLyricsOpen()) {
        console.log('[SpicyLyricTranslater] Lyrics view already open');
        onSpicyLyricsOpen();
    }
    
    // Try to scope observer to a more specific container for better performance
    const mainView = document.querySelector('.Root__main-view') || document.body;
    const observerTarget = mainView;
    
    // Setup observer for page changes
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // Check for Spicy Lyrics page, Cinema View, or PIP
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
                    console.log('[SpicyLyricTranslater] Lyrics view opened');
                    onSpicyLyricsOpen();
                }
                
                if (removed) {
                    console.log('[SpicyLyricTranslater] Lyrics view closed');
                    onSpicyLyricsClose();
                }
            }
        }
    });
    
    observer.observe(observerTarget, {
        childList: true,
        subtree: true
    });
    
    console.log(`[SpicyLyricTranslater] Observer attached to ${observerTarget === document.body ? 'document.body' : '.Root__main-view'}`);
    
    // Also setup listener for PIP window changes
    setupPIPObserver();
}

/**
 * Setup observer specifically for PIP (Picture-in-Picture) window
 */
function setupPIPObserver(): void {
    // @ts-ignore: documentPictureInPicture is not yet standard
    const docPiP = (globalThis as any).documentPictureInPicture;
    if (!docPiP) return;
    
    // Listen for PIP window entering
    docPiP.addEventListener('enter', (event: any) => {
        console.log('[SpicyLyricTranslater] PIP window opened');
        const pipWindow = event.window;
        if (pipWindow) {
            // Wait for content to be ready, then setup PIP-specific observers
            setTimeout(() => {
                injectStylesIntoPIP();
                insertTranslateButton();
                setupPIPLyricsObserver(pipWindow);
                
                // If already translating, apply to PIP
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

/**
 * Setup observer for lyrics changes in PIP window
 */
function setupPIPLyricsObserver(pipWindow: Window): void {
    const lyricsContent = pipWindow.document.querySelector('.LyricsContent');
    if (!lyricsContent) {
        // Retry after a delay
        setTimeout(() => setupPIPLyricsObserver(pipWindow), 500);
        return;
    }
    
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
            setTimeout(() => {
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
}

/**
 * Get current view mode (normal, fullscreen, cinema, pip, sidebar)
 */
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
    
    // Check for cinema view
    const isInFullscreenContainer = !!document.querySelector('.Cinema--Container #SpicyLyricsPage');
    if (isInFullscreenContainer) return 'cinema';
    
    return 'normal';
}

/**
 * Setup view mode change detection
 */
function setupViewModeObserver(): void {
    // Check view mode periodically
    setInterval(() => {
        const currentMode = getCurrentViewMode();
        
        if (state.lastViewMode !== null && state.lastViewMode !== currentMode && currentMode !== 'none') {
            console.log(`[SpicyLyricTranslater] View mode changed: ${state.lastViewMode} -> ${currentMode}`);
            
            // Re-inject button and re-apply translations when mode changes
            setTimeout(() => {
                insertTranslateButton();
                
                // If translation is enabled, re-apply after mode change
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
    }, 1000);
}

/**
 * Setup keyboard shortcut for quick toggle
 * Alt+T = Toggle translation on/off (Ctrl+Shift+T conflicts with DevTools)
 */
function setupKeyboardShortcut(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        // Alt+T to toggle translation (avoids Ctrl+Shift+T DevTools conflict)
        if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            e.stopPropagation();
            if (isSpicyLyricsOpen()) {
                handleTranslateToggle();
            }
        }
    });
}

/**
 * Initialize the extension
 */
async function initialize(): Promise<void> {
    // Wait for Spicetify to be ready
    while (typeof Spicetify === 'undefined' || !Spicetify.Platform) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('[SpicyLyricTranslater] Initializing...');
    
    // Load saved state
    state.isEnabled = storage.get('translation-enabled') === 'true';
    state.targetLanguage = storage.get('target-language') || 'en';
    state.autoTranslate = storage.get('auto-translate') === 'true';
    state.showNotifications = storage.get('show-notifications') !== 'false';
    state.preferredApi = (storage.get('preferred-api') as 'google' | 'libretranslate' | 'custom') || 'google';
    state.customApiUrl = storage.get('custom-api-url') || '';
    
    // Set the preferred API in translator
    setPreferredApi(state.preferredApi, state.customApiUrl);
    
    // Inject styles
    injectStyles();
    
    // Initialize connection indicator (always visible in top left)
    // This tracks users who have the extension installed, not just active viewers
    initConnectionIndicator();
    
    // Register settings menu
    registerSettingsMenu();
    
    // Start auto-update checker (checks every 30 minutes)
    startUpdateChecker(30 * 60 * 1000);
    
    // Setup keyboard shortcut (Ctrl+Shift+T to toggle translation)
    setupKeyboardShortcut();
    
    // Setup page observer
    setupPageObserver();
    
    // Setup view mode observer for detecting mode switches
    setupViewModeObserver();
    
    // Listen for navigation changes
    if (Spicetify.Platform?.History?.listen) {
        Spicetify.Platform.History.listen(() => {
            // Check if navigated to Spicy Lyrics
            setTimeout(() => {
                if (isSpicyLyricsOpen() && !document.querySelector('#TranslateToggle')) {
                    onSpicyLyricsOpen();
                }
            }, 100);
        });
    }
    
    // Listen for song changes
    if (Spicetify.Player?.addEventListener) {
        Spicetify.Player.addEventListener('songchange', () => {
            console.log('[SpicyLyricTranslater] Song changed');
            // Clear translations on song change
            state.translatedLyrics.clear();
            removeTranslations();
            
            // Re-translate if auto-translate is on
            if (state.autoTranslate) {
                // Auto-enable translation
                if (!state.isEnabled) {
                    state.isEnabled = true;
                    storage.set('translation-enabled', 'true');
                    updateButtonState();
                }
                // Wait longer for new lyrics to load (old lyrics need to be replaced first)
                // Use increased initial delay and more retries
                waitForLyricsAndTranslate(15, 1000);
            }
        });
    }
    
    console.log('[SpicyLyricTranslater] Initialized successfully!');
}

// Export for external access
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
    // Connectivity features
    connectivity: {
        getState: getConnectionState,
        refresh: refreshConnection
    }
};

// Start initialization
initialize().catch(console.error);

export default initialize;
