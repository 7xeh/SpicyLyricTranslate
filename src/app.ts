/**
 * Spicy Lyric Translater
 * A Spicetify extension that adds translation functionality to Spicy Lyrics
 * 
 * @author Your Name
 * @version 1.0.0
 */

import { Icons } from './utils/icons';
import { storage } from './utils/storage';
import { translateLyrics, SUPPORTED_LANGUAGES, clearTranslationCache } from './utils/translator';
import { injectStyles } from './styles/main';

// Extension state
interface ExtensionState {
    isEnabled: boolean;
    isTranslating: boolean;
    targetLanguage: string;
    showOriginal: boolean;
    autoTranslate: boolean;
    lastTranslatedSongUri: string | null;
    translatedLyrics: Map<string, string>;
}

const state: ExtensionState = {
    isEnabled: false,
    isTranslating: false,
    targetLanguage: storage.get('target-language') || 'en',
    showOriginal: storage.get('show-original') === 'true',
    autoTranslate: storage.get('auto-translate') === 'true',
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
 * Check if Spicy Lyrics page is open
 */
function isSpicyLyricsOpen(): boolean {
    return !!document.querySelector('#SpicyLyricsPage');
}

/**
 * Get the ViewControls element from Spicy Lyrics
 */
function getViewControls(): HTMLElement | null {
    return document.querySelector('#SpicyLyricsPage .ViewControls');
}

/**
 * Get the lyrics content container
 */
function getLyricsContent(): HTMLElement | null {
    return document.querySelector('#SpicyLyricsPage .LyricsContent');
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
 * Handle translate toggle button click
 */
async function handleTranslateToggle(): Promise<void> {
    const button = document.querySelector('#TranslateToggle') as HTMLButtonElement;
    if (!button || state.isTranslating) {
        if (state.isTranslating) {
            Spicetify.showNotification('Translation in progress, please wait...');
        }
        return;
    }
    
    state.isEnabled = !state.isEnabled;
    storage.set('translation-enabled', state.isEnabled.toString());
    
    Spicetify.showNotification(state.isEnabled ? 'Translation enabled - translating...' : 'Translation disabled');
    
    // Update button state
    button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    button.classList.toggle('active', state.isEnabled);
    
    // Update tooltip
    const buttonWithTippy = button as HTMLButtonElement & { _tippy?: { setContent: (content: string) => void } };
    if (buttonWithTippy._tippy) {
        buttonWithTippy._tippy.setContent(state.isEnabled ? 'Disable Translation' : 'Enable Translation');
    }
    
    if (state.isEnabled) {
        await translateCurrentLyrics();
    } else {
        removeTranslations();
    }
}

/**
 * Get lyrics lines from the content
 */
function getLyricsLines(): NodeListOf<Element> {
    // Spicy Lyrics uses lowercase 'line' class
    const lines = document.querySelectorAll('#SpicyLyricsPage .LyricsContent .line:not(.musical-line)');
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
    
    Spicetify.showNotification(`Translating ${lines.length} lines to ${state.targetLanguage}...`);
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
        
        // Show notification
        if (typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
            Spicetify.showNotification('Lyrics translated successfully!');
        }
    } catch (error) {
        console.error('[SpicyLyricTranslater] Translation failed:', error);
        if (typeof Spicetify !== 'undefined' && Spicetify.showNotification) {
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
 */
function applyTranslations(lines: NodeListOf<Element>): void {
    lines.forEach(line => {
        const originalText = extractLineText(line);
        const translatedText = state.translatedLyrics.get(originalText);
        
        if (translatedText && translatedText !== originalText) {
            // Remove existing translation if any
            const existingTranslation = line.querySelector('.spicy-translation-container');
            if (existingTranslation) {
                existingTranslation.remove();
            }
            
            // Store original text as data attribute for restoration
            (line as HTMLElement).dataset.originalText = originalText;
            
            if (state.showOriginal) {
                // Show both: original + translation below
                const translationSpan = document.createElement('span');
                translationSpan.className = 'spicy-translation-container spicy-inline-translation';
                translationSpan.textContent = translatedText;
                line.appendChild(translationSpan);
            } else {
                // Hide original content and show only translation
                // Get all direct children that contain the lyrics (words, syllables, or text)
                const originalElements = line.querySelectorAll('.word, .syllable');
                
                if (originalElements.length > 0) {
                    // Hide all original word/syllable elements
                    originalElements.forEach(el => {
                        (el as HTMLElement).classList.add('spicy-hidden-original');
                    });
                } else {
                    // For line-synced lyrics, wrap original content
                    const originalContent = line.innerHTML;
                    // Check if we already wrapped it
                    if (!line.querySelector('.spicy-original-content')) {
                        const wrapper = document.createElement('span');
                        wrapper.className = 'spicy-original-content spicy-hidden-original';
                        wrapper.innerHTML = originalContent;
                        line.innerHTML = '';
                        line.appendChild(wrapper);
                    }
                }
                
                // Add translation as replacement text
                const translationSpan = document.createElement('span');
                translationSpan.className = 'spicy-translation-container spicy-translation-replacement';
                translationSpan.textContent = translatedText;
                line.appendChild(translationSpan);
            }
            
            // Mark line as translated
            line.classList.add('spicy-translated');
        }
    });
}

/**
 * Remove translations from lyrics
 */
function removeTranslations(): void {
    // Remove translation containers
    const translations = document.querySelectorAll('.spicy-translation-container');
    translations.forEach(el => el.remove());
    
    // Show hidden original elements
    const hiddenElements = document.querySelectorAll('.spicy-hidden-original');
    hiddenElements.forEach(el => {
        el.classList.remove('spicy-hidden-original');
    });
    
    // Remove wrapped original content and restore
    const wrappedContent = document.querySelectorAll('.spicy-original-content');
    wrappedContent.forEach(wrapper => {
        const parent = wrapper.parentElement;
        if (parent) {
            const content = wrapper.innerHTML;
            wrapper.remove();
            // Only restore if parent is now empty
            if (parent.innerHTML.trim() === '') {
                parent.innerHTML = content;
            }
        }
    });
    
    // Remove translated class from lines
    const translatedLines = document.querySelectorAll('.spicy-translated');
    translatedLines.forEach(line => {
        line.classList.remove('spicy-translated');
    });
    
    state.translatedLyrics.clear();
    
    const page = document.querySelector('#SpicyLyricsPage');
    if (page) {
        page.classList.remove('show-both-lyrics');
    }
}

/**
 * Show settings modal
 */
function showSettingsModal(): void {
    if (typeof Spicetify === 'undefined' || !Spicetify.PopupModal) {
        alert('Settings not available - Spicetify PopupModal not found');
        return;
    }
    
    Spicetify.showNotification('Opening settings...');
    
    const languageOptions = SUPPORTED_LANGUAGES
        .map(lang => `<option value="${lang.code}" ${lang.code === state.targetLanguage ? 'selected' : ''}>${lang.name}</option>`)
        .join('');
    
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
                <div class="setting-label">Clear Cache</div>
                <div class="setting-description">Clear cached translations to free up space</div>
            </div>
            <button id="spicy-translate-clear-cache">Clear Cache</button>
        </div>
    `;
    
    // Add event listeners
    setTimeout(() => {
        const langSelect = document.getElementById('spicy-translate-lang-select') as HTMLSelectElement;
        const showOriginalToggle = document.getElementById('spicy-translate-show-original');
        const autoToggle = document.getElementById('spicy-translate-auto');
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
        
        if (showOriginalToggle) {
            showOriginalToggle.addEventListener('click', () => {
                state.showOriginal = !state.showOriginal;
                storage.set('show-original', state.showOriginal.toString());
                showOriginalToggle.classList.toggle('active', state.showOriginal);
            });
        }
        
        if (autoToggle) {
            autoToggle.addEventListener('click', () => {
                state.autoTranslate = !state.autoTranslate;
                storage.set('auto-translate', state.autoTranslate.toString());
                autoToggle.classList.toggle('active', state.autoTranslate);
            });
        }
        
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                clearTranslationCache();
                if (Spicetify.showNotification) {
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
                (n as Element).classList?.contains('Line')
            )
        );
        
        if (hasNewContent && state.autoTranslate) {
            // Debounce to avoid multiple rapid translations
            setTimeout(() => {
                if (state.isEnabled && !state.isTranslating) {
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
 * Handle Spicy Lyrics page open
 */
async function onSpicyLyricsOpen(): Promise<void> {
    // Wait for ViewControls to be available
    await waitForElement('#SpicyLyricsPage .ViewControls');
    
    // Insert our button
    insertTranslateButton();
    
    // Setup observers
    setupViewControlsObserver();
    setupLyricsObserver();
    
    // Auto-translate if enabled
    if (state.isEnabled && state.autoTranslate) {
        // Wait a bit for lyrics to load
        setTimeout(() => {
            if (state.isEnabled && !state.isTranslating) {
                translateCurrentLyrics();
            }
        }, 1000);
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
 * Setup page observer to detect Spicy Lyrics open/close
 */
function setupPageObserver(): void {
    // Check if already open
    if (isSpicyLyricsOpen()) {
        onSpicyLyricsOpen();
    }
    
    // Setup observer for page changes
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // Check for Spicy Lyrics page
                const added = Array.from(mutation.addedNodes).some(
                    node => node.nodeType === Node.ELEMENT_NODE && 
                    ((node as Element).id === 'SpicyLyricsPage' || 
                     (node as Element).querySelector('#SpicyLyricsPage'))
                );
                
                const removed = Array.from(mutation.removedNodes).some(
                    node => node.nodeType === Node.ELEMENT_NODE && 
                    ((node as Element).id === 'SpicyLyricsPage' || 
                     (node as Element).querySelector('#SpicyLyricsPage'))
                );
                
                if (added) {
                    onSpicyLyricsOpen();
                }
                
                if (removed) {
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
            
            // Re-translate if enabled and auto-translate is on
            if (state.isEnabled && state.autoTranslate && isSpicyLyricsOpen()) {
                setTimeout(() => {
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
