/**
 * Spicy Lyric Translater
 * A Spicetify extension that adds translation functionality to Spicy Lyrics
 * 
 * @author Your Name
 * @version 1.0.0
 */

import { Icons } from './utils/icons';
import { storage } from './utils/storage';
import { translateLyrics, SUPPORTED_LANGUAGES, clearTranslationCache, setPreferredApi } from './utils/translator';
import { injectStyles } from './styles/main';

// Extension state
interface ExtensionState {
    isEnabled: boolean;
    isTranslating: boolean;
    targetLanguage: string;
    showOriginal: boolean;
    autoTranslate: boolean;
    showNotifications: boolean;
    preferredApi: 'google' | 'libretranslate' | 'custom';
    customApiUrl: string;
    lastTranslatedSongUri: string | null;
    translatedLyrics: Map<string, string>;
    lastViewMode: string | null;
}

const state: ExtensionState = {
    isEnabled: false,
    isTranslating: false,
    targetLanguage: storage.get('target-language') || 'en',
    showOriginal: storage.get('show-original') === 'true',
    autoTranslate: storage.get('auto-translate') === 'true',
    showNotifications: storage.get('show-notifications') !== 'false', // Default to true
    preferredApi: (storage.get('preferred-api') as 'google' | 'libretranslate' | 'custom') || 'google',
    customApiUrl: storage.get('custom-api-url') || '',
    lastTranslatedSongUri: null,
    translatedLyrics: new Map(),
    lastViewMode: null
};

// DOM observer for Spicy Lyrics
let viewControlsObserver: MutationObserver | null = null;
let lyricsObserver: MutationObserver | null = null;

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
        button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    }
    
    // Also restore in PIP window if available
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        const pipButton = pipWindow.document.querySelector('#TranslateToggle') as HTMLButtonElement;
        if (pipButton) {
            pipButton.classList.remove('loading');
            pipButton.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
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
 */
async function waitForLyricsAndTranslate(retries: number = 10, delay: number = 500): Promise<void> {
    console.log('[SpicyLyricTranslater] Waiting for lyrics to load...');
    
    for (let i = 0; i < retries; i++) {
        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Check if SpicyLyrics is open
        if (!isSpicyLyricsOpen()) {
            console.log('[SpicyLyricTranslater] SpicyLyrics not open, stopping retry');
            return;
        }
        
        // Try to get lyrics lines
        const lines = getLyricsLines();
        if (lines.length > 0) {
            console.log(`[SpicyLyricTranslater] Found ${lines.length} lyrics lines after ${i + 1} attempts`);
            await translateCurrentLyrics();
            return;
        }
        
        console.log(`[SpicyLyricTranslater] Attempt ${i + 1}/${retries}: No lyrics found yet`);
    }
    
    console.log('[SpicyLyricTranslater] Gave up waiting for lyrics after', retries, 'attempts');
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
 */
function extractLineText(lineElement: Element): string {
    // Skip musical lines (dots only)
    if (lineElement.classList.contains('musical-line')) {
        return '';
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
        
        // Store translations
        state.translatedLyrics.clear();
        translations.forEach((result, index) => {
            state.translatedLyrics.set(lineTexts[index], result.translatedText);
        });
        
        // Apply translations to the lines we found
        applyTranslations(lines);
        
        // Show notification if enabled
        if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
            Spicetify.showNotification('Lyrics translated successfully!');
        }
    } catch (error) {
        console.error('[SpicyLyricTranslater] Translation failed:', error);
        if (state.showNotifications && typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
            Spicetify.showNotification('Translation failed. Please try again.', true);
        }
    } finally {
        state.isTranslating = false;
        
        // Restore button state in both main and PIP
        restoreButtonState();
    }
}

/**
 * Apply translations to the lyrics DOM
 * When showOriginal is false: hides original content and shows only translated text
 * When showOriginal is true: shows both original and translated text
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
            
            if (state.showOriginal) {
                // Show both: original stays visible, translation appears below
                const translationSpan = document.createElement('span');
                translationSpan.className = 'spicy-translation-container spicy-inline-translation';
                translationSpan.textContent = translatedText;
                line.appendChild(translationSpan);
            } else {
                // Hide original content completely, show only translation
                // Get all direct content elements (words, syllables, or text nodes)
                const contentElements = line.querySelectorAll('.word, .syllable');
                
                if (contentElements.length > 0) {
                    // Hide all word/syllable elements
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
        }
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
    
    // Restore wrapped content for line-synced lyrics
    const wrapper = line.querySelector('.spicy-original-wrapper');
    if (wrapper) {
        const originalContent = wrapper.innerHTML;
        wrapper.remove();
        // Only restore if line is now empty
        if (line.innerHTML.trim() === '' || !line.querySelector('.word, .syllable')) {
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
        // Remove translation containers
        const translations = doc.querySelectorAll('.spicy-translation-container');
        translations.forEach(el => el.remove());
        
        // Restore visibility of hidden elements
        const hiddenElements = doc.querySelectorAll('.spicy-hidden-original');
        hiddenElements.forEach(el => {
            el.classList.remove('spicy-hidden-original');
        });
        
        // Restore wrapped content for line-synced lyrics
        const wrappers = doc.querySelectorAll('.spicy-original-wrapper');
        wrappers.forEach(wrapper => {
            const parent = wrapper.parentElement;
            if (parent) {
                const originalContent = wrapper.innerHTML;
                wrapper.remove();
                if (parent.innerHTML.trim() === '' || !parent.querySelector('.word, .syllable')) {
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
                <div class="setting-label">Show Original</div>
                <div class="setting-description">Show original lyrics alongside translations</div>
            </div>
            <div class="toggle-switch ${state.showOriginal ? 'active' : ''}" id="spicy-translate-show-original"></div>
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
                <div class="setting-label">Clear Cache</div>
                <div class="setting-description">Clear cached translations to free up space</div>
            </div>
            <button id="spicy-translate-clear-cache">Clear Cache</button>
        </div>
    `;
    
    // Add event listeners
    setTimeout(() => {
        const langSelect = document.getElementById('spicy-translate-lang-select') as HTMLSelectElement;
        const apiSelect = document.getElementById('spicy-translate-api-select') as HTMLSelectElement;
        const customApiContainer = document.getElementById('spicy-translate-custom-api-container');
        const customApiUrlInput = document.getElementById('spicy-translate-custom-api-url') as HTMLInputElement;
        const showOriginalToggle = document.getElementById('spicy-translate-show-original');
        const autoToggle = document.getElementById('spicy-translate-auto');
        const notificationsToggle = document.getElementById('spicy-translate-notifications');
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
        
        if (showOriginalToggle) {
            showOriginalToggle.addEventListener('click', () => {
                state.showOriginal = !state.showOriginal;
                storage.set('show-original', state.showOriginal.toString());
                showOriginalToggle.classList.toggle('active', state.showOriginal);
                
                // Re-apply translations with new setting if enabled
                if (state.isEnabled && state.translatedLyrics.size > 0) {
                    removeTranslations();
                    // Restore the stored translations
                    const lines = getLyricsLines();
                    applyTranslations(lines);
                }
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
        
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                clearTranslationCache();
                if (state.showNotifications && Spicetify.showNotification) {
                    Spicetify.showNotification('Translation cache cleared!');
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
        // Wait a bit for lyrics to load
        setTimeout(() => {
            if (!state.isTranslating) {
                // Auto-enable translation
                if (!state.isEnabled) {
                    state.isEnabled = true;
                    storage.set('translation-enabled', 'true');
                    updateButtonState();
                }
                translateCurrentLyrics();
            }
        }, 1500);
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
    if (viewControlsObserver) {
        viewControlsObserver.disconnect();
        viewControlsObserver = null;
    }
    
    if (lyricsObserver) {
        lyricsObserver.disconnect();
        lyricsObserver = null;
    }
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
            
            // Show Original toggle
            settings.addToggle(
                'show-original',
                'Show Original Lyrics (alongside translation)',
                state.showOriginal,
                () => {
                    state.showOriginal = settings.getFieldValue('show-original') === 'true';
                    storage.set('show-original', state.showOriginal.toString());
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
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
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
    state.showOriginal = storage.get('show-original') === 'true';
    state.autoTranslate = storage.get('auto-translate') === 'true';
    state.showNotifications = storage.get('show-notifications') !== 'false';
    state.preferredApi = (storage.get('preferred-api') as 'google' | 'libretranslate' | 'custom') || 'google';
    state.customApiUrl = storage.get('custom-api-url') || '';
    
    // Set the preferred API in translator
    setPreferredApi(state.preferredApi, state.customApiUrl);
    
    // Inject styles
    injectStyles();
    
    // Register settings menu
    registerSettingsMenu();
    
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
                // Wait for lyrics to load with retry
                waitForLyricsAndTranslate();
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
    setLanguage: (lang: string) => {
        state.targetLanguage = lang;
        storage.set('target-language', lang);
    },
    translate: translateCurrentLyrics,
    showSettings: showSettingsModal,
    clearCache: clearTranslationCache,
    getState: () => ({ ...state })
};

// Start initialization
initialize().catch(console.error);

export default initialize;
