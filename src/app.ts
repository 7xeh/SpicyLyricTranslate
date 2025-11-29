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
    translatedLyrics: new Map()
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
 * Check if Spicy Lyrics page is open (including Cinema View)
 */
function isSpicyLyricsOpen(): boolean {
    return !!(document.querySelector('#SpicyLyricsPage') || 
              document.querySelector('.Cinema--Container') ||
              document.querySelector('.spicy-lyrics-cinema'));
}

/**
 * Get the ViewControls element from Spicy Lyrics
 */
function getViewControls(): HTMLElement | null {
    return document.querySelector('#SpicyLyricsPage .ViewControls') ||
           document.querySelector('.Cinema--Container .ViewControls') ||
           document.querySelector('.ViewControls');
}

/**
 * Get the lyrics content container
 */
function getLyricsContent(): HTMLElement | null {
    return document.querySelector('#SpicyLyricsPage .LyricsContent') ||
           document.querySelector('.Cinema--Container .LyricsContent') ||
           document.querySelector('.LyricsContainer') ||
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
    const viewControls = getViewControls();
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
    const button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    if (!button) return;
    
    button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    button.classList.toggle('active', state.isEnabled);
    
    // Update tooltip
    const buttonWithTippy = button as HTMLButtonElement & { _tippy?: { setContent: (content: string) => void } };
    if (buttonWithTippy._tippy) {
        buttonWithTippy._tippy.setContent(state.isEnabled ? 'Disable Translation' : 'Enable Translation');
    }
}

/**
 * Handle translate toggle button click
 */
async function handleTranslateToggle(): Promise<void> {
    const button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    if (!button || state.isTranslating) {
        return;
    }
    
    state.isEnabled = !state.isEnabled;
    storage.set('translation-enabled', state.isEnabled.toString());
    
    // Only notify when disabling (enabling will show success notification after translation)
    
    // Update button state
    updateButtonState();
    
    if (state.isEnabled) {
        await translateCurrentLyrics();
    } else {
        removeTranslations();
    }
}

/**
 * Get lyrics lines from the content (supports both normal and Cinema View)
 */
function getLyricsLines(): NodeListOf<Element> {
    // Try multiple selectors for different views
    let lines = document.querySelectorAll('#SpicyLyricsPage .LyricsContent .line:not(.musical-line)');
    
    // Cinema View selectors
    if (lines.length === 0) {
        lines = document.querySelectorAll('.Cinema--Container .LyricsContent .line:not(.musical-line)');
    }
    if (lines.length === 0) {
        lines = document.querySelectorAll('.Cinema--Container .line:not(.musical-line)');
    }
    if (lines.length === 0) {
        lines = document.querySelectorAll('.LyricsContent .line:not(.musical-line)');
    }
    if (lines.length === 0) {
        lines = document.querySelectorAll('.LyricsContainer .line:not(.musical-line)');
    }
    // Generic fallback
    if (lines.length === 0) {
        lines = document.querySelectorAll('.line:not(.musical-line)');
    }
    
    console.log(`[SpicyLyricTranslater] Found ${lines.length} lyrics lines`);
    return lines;
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
    
    const lyricsContent = getLyricsContent();
    if (!lyricsContent) {
        console.log('[SpicyLyricTranslater] No lyrics content found');
        // Try to wait a bit for lyrics to load
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryContent = getLyricsContent();
        if (!retryContent) {
            console.log('[SpicyLyricTranslater] Still no lyrics content after retry');
            return;
        }
    }
    
    const lines = getLyricsLines();
    if (lines.length === 0) {
        console.log('[SpicyLyricTranslater] No lyrics lines found');
        return;
    }
    
    state.isTranslating = true;
    
    // Update button to show loading state
    const button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    if (button) {
        button.classList.add('loading');
        button.innerHTML = Icons.Loading;
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
        
        // Apply translations to DOM
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
        
        // Restore button state
        if (button) {
            button.classList.remove('loading');
            button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
        }
    }
}

/**
 * Apply translations to the lyrics DOM
 * Respects showOriginal setting while keeping line structure for Spicy Lyrics
 */
function applyTranslations(lines: NodeListOf<Element>): void {
    lines.forEach((line, index) => {
        const originalText = extractLineText(line);
        const translatedText = state.translatedLyrics.get(originalText);
        
        if (translatedText && translatedText !== originalText) {
            // Remove existing translation elements
            const existingTranslation = line.querySelector('.spicy-translation-container');
            if (existingTranslation) {
                existingTranslation.remove();
            }
            
            // Restore any previously replaced text first
            restoreLineText(line);
            
            // Store original text as data attribute for restoration
            (line as HTMLElement).dataset.originalText = originalText;
            (line as HTMLElement).dataset.lineIndex = index.toString();
            
            if (state.showOriginal) {
                // Show both: original stays visible, translation appears below
                const translationSpan = document.createElement('span');
                translationSpan.className = 'spicy-translation-container spicy-inline-translation';
                translationSpan.textContent = translatedText;
                line.appendChild(translationSpan);
            } else {
                // Replace text content but keep the element structure
                // This preserves Spicy Lyrics' highlighting
                const wordElements = line.querySelectorAll('.word:not(.dot)');
                
                if (wordElements.length > 0) {
                    // Split translation into words to map to word elements
                    const translatedWords = translatedText.split(/\s+/);
                    
                    wordElements.forEach((wordEl, i) => {
                        const el = wordEl as HTMLElement;
                        // Store original text
                        if (!el.dataset.originalWord) {
                            el.dataset.originalWord = el.textContent || '';
                        }
                        // Replace with translated word (or empty if we run out)
                        if (i < translatedWords.length) {
                            el.textContent = translatedWords[i] + (i < translatedWords.length - 1 ? ' ' : '');
                        } else {
                            el.textContent = '';
                        }
                    });
                    
                    // If translation has more words than elements, append rest to last element
                    if (translatedWords.length > wordElements.length && wordElements.length > 0) {
                        const lastEl = wordElements[wordElements.length - 1] as HTMLElement;
                        const extraWords = translatedWords.slice(wordElements.length).join(' ');
                        lastEl.textContent = (lastEl.textContent || '') + ' ' + extraWords;
                    }
                } else {
                    // For syllable or line-synced lyrics, just add translation below
                    // since we can't easily map syllables
                    const translationSpan = document.createElement('span');
                    translationSpan.className = 'spicy-translation-container spicy-inline-translation';
                    translationSpan.textContent = translatedText;
                    line.appendChild(translationSpan);
                }
            }
        }
    });
}

/**
 * Restore original text to a line's word elements
 */
function restoreLineText(line: Element): void {
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
    // Remove translation containers
    const translations = document.querySelectorAll('.spicy-translation-container');
    translations.forEach(el => el.remove());
    
    // Restore original word text
    const wordElements = document.querySelectorAll('.word[data-original-word]');
    wordElements.forEach(wordEl => {
        const el = wordEl as HTMLElement;
        if (el.dataset.originalWord !== undefined) {
            el.textContent = el.dataset.originalWord;
            delete el.dataset.originalWord;
        }
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
 * Handle Spicy Lyrics page open (including Cinema View)
 */
async function onSpicyLyricsOpen(): Promise<void> {
    console.log('[SpicyLyricTranslater] Lyrics view detected, initializing...');
    
    // Wait for ViewControls to be available - try multiple selectors
    let viewControls = await waitForElement('#SpicyLyricsPage .ViewControls', 3000);
    if (!viewControls) {
        viewControls = await waitForElement('.Cinema--Container .ViewControls', 3000);
    }
    if (!viewControls) {
        viewControls = await waitForElement('.ViewControls', 3000);
    }
    
    if (viewControls) {
        console.log('[SpicyLyricTranslater] ViewControls found, inserting button');
        // Insert our button
        insertTranslateButton();
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
 * Setup page observer to detect Spicy Lyrics open/close (including Cinema View)
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
                // Check for Spicy Lyrics page or Cinema View
                const isLyricsNode = (node: Node): boolean => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return false;
                    const el = node as Element;
                    return el.id === 'SpicyLyricsPage' || 
                           el.classList?.contains('Cinema--Container') ||
                           el.classList?.contains('spicy-lyrics-cinema') ||
                           !!el.querySelector('#SpicyLyricsPage') ||
                           !!el.querySelector('.Cinema--Container');
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
            // Clear translations on song change
            state.translatedLyrics.clear();
            removeTranslations();
            
            // Re-translate if auto-translate is on
            if (state.autoTranslate && isSpicyLyricsOpen()) {
                setTimeout(() => {
                    // Auto-enable translation
                    if (!state.isEnabled) {
                        state.isEnabled = true;
                        storage.set('translation-enabled', 'true');
                        updateButtonState();
                    }
                    translateCurrentLyrics();
                }, 1500);
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
