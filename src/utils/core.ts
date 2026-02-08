import { state } from './state';
import { Icons } from './icons';
import { storage } from './storage';
import { translateLyrics, isOffline, getCacheStats } from './translator';
import { getCurrentTrackUri } from './trackCache';
import { setViewingLyrics } from './connectivity';
import { 
    enableOverlay, 
    disableOverlay, 
    updateOverlayContent, 
    isOverlayActive 
} from './translationOverlay';
import { shouldSkipTranslation } from './languageDetection';
import { openSettingsModal } from './settings';
import { debug, warn, error } from './debug';

let viewControlsObserver: MutationObserver | null = null;
let lyricsObserver: MutationObserver | null = null;
let translateDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let viewModeIntervalId: ReturnType<typeof setInterval> | null = null;

function getPIPWindow(): Window | null {
    try {
        const docPiP = (globalThis as any).documentPictureInPicture;
        if (docPiP && docPiP.window) return docPiP.window;
    } catch (e) {}
    return null;
}

export function isSpicyLyricsOpen(): boolean {
    if (document.querySelector('#SpicyLyricsPage') || 
        document.querySelector('.spicy-pip-wrapper #SpicyLyricsPage') ||
        document.querySelector('.Cinema--Container') ||
        document.querySelector('.spicy-lyrics-cinema') ||
        document.body.classList.contains('SpicySidebarLyrics__Active')) {
        return true;
    }
    
    const pipWindow = getPIPWindow();
    if (pipWindow?.document.querySelector('#SpicyLyricsPage')) {
        return true;
    }
    
    return false;
}

export function getLyricsContent(): HTMLElement | null {
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        const pipContent = pipWindow.document.querySelector('#SpicyLyricsPage .LyricsContainer .LyricsContent') ||
                          pipWindow.document.querySelector('#SpicyLyricsPage .LyricsContent') ||
                          pipWindow.document.querySelector('.LyricsContent');
        if (pipContent) return pipContent as HTMLElement;
    }
    
    if (document.body.classList.contains('SpicySidebarLyrics__Active')) {
        const sidebarContent = document.querySelector('.Root__right-sidebar #SpicyLyricsPage .LyricsContainer .LyricsContent') ||
                              document.querySelector('.Root__right-sidebar #SpicyLyricsPage .LyricsContent');
        if (sidebarContent) return sidebarContent as HTMLElement;
    }
    
    return document.querySelector('#SpicyLyricsPage .LyricsContainer .LyricsContent') ||
           document.querySelector('#SpicyLyricsPage .LyricsContent') ||
           document.querySelector('.spicy-pip-wrapper .LyricsContent') ||
           document.querySelector('.Cinema--Container .LyricsContent') ||
           document.querySelector('.LyricsContainer .LyricsContent');
}

export function waitForElement(selector: string, timeout: number = 10000): Promise<Element | null> {
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
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}

export function updateButtonState(): void {
    const buttons = [
        document.querySelector('#TranslateToggle'),
        getPIPWindow()?.document.querySelector('#TranslateToggle')
    ];
    
    buttons.forEach(button => {
        if (button) {
            button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
            button.classList.toggle('active', state.isEnabled);
            const btnWithTippy = button as any;
            if (btnWithTippy._tippy) {
                btnWithTippy._tippy.setContent(state.isEnabled ? 'Disable Translation' : 'Enable Translation');
            }
        }
    });
}

export function restoreButtonState(): void {
    const buttons = [
        document.querySelector('#TranslateToggle'),
        getPIPWindow()?.document.querySelector('#TranslateToggle')
    ];
    
    buttons.forEach(button => {
        if (button) {
            button.classList.remove('loading', 'error');
            button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
        }
    });
}

export function setButtonErrorState(hasError: boolean): void {
    const buttons = [
        document.querySelector('#TranslateToggle'),
        getPIPWindow()?.document.querySelector('#TranslateToggle')
    ];
    buttons.forEach(button => {
        if (button) button.classList.toggle('error', hasError);
    });
}

function createTranslateButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.id = 'TranslateToggle';
    button.className = 'ViewControl';
    button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    
    if (state.isEnabled) button.classList.add('active');
    
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
        openSettingsModal();
        return false;
    });
    
    return button;
}

export function insertTranslateButton(): void {
    insertTranslateButtonIntoDocument(document);
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        insertTranslateButtonIntoDocument(pipWindow.document);
    }
}

function insertTranslateButtonIntoDocument(doc: Document): void {
    let viewControls = doc.querySelector('#SpicyLyricsPage .ContentBox .ViewControls') ||
                       doc.querySelector('#SpicyLyricsPage .ViewControls');
    
    if (!viewControls && doc.body.classList.contains('SpicySidebarLyrics__Active')) {
        viewControls = doc.querySelector('.Root__right-sidebar #SpicyLyricsPage .ViewControls');
    }
    
    if (!viewControls) {
        viewControls = doc.querySelector('.ViewControls');
    }
    
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

export async function handleTranslateToggle(): Promise<void> {
    if (state.isTranslating) return;
    
    state.isEnabled = !state.isEnabled;
    storage.set('translation-enabled', state.isEnabled.toString());
    
    updateButtonState();
    
    if (state.isEnabled) {
        await translateCurrentLyrics();
    } else {
        removeTranslations();
    }
}

export function extractLineText(lineElement: Element): string {
    if (lineElement.classList.contains('musical-line')) return '';
    
    const words = lineElement.querySelectorAll('.word:not(.dot), .syllable, .letterGroup');
    if (words.length > 0) {
        return Array.from(words)
            .map(w => w.textContent?.trim() || '')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    const letters = lineElement.querySelectorAll('.letter');
    if (letters.length > 0) {
        return Array.from(letters)
            .map(l => l.textContent || '')
            .join('')
            .trim();
    }
    
    return lineElement.textContent?.trim() || '';
}

function getLyricsLines(): NodeListOf<Element> {
    const docs: Document[] = [document];
    const pip = getPIPWindow();
    if (pip) docs.push(pip.document);

    for (const doc of docs) {
        const scrollContainer = doc.querySelectorAll('#SpicyLyricsPage .SpicyLyricsScrollContainer .line:not(.musical-line)');
        if (scrollContainer.length > 0) return scrollContainer;
        
        const lyricsContent = doc.querySelectorAll('#SpicyLyricsPage .LyricsContent .line:not(.musical-line)');
        if (lyricsContent.length > 0) return lyricsContent;
        
        if (doc.body.classList.contains('SpicySidebarLyrics__Active')) {
            const sidebar = doc.querySelectorAll('.Root__right-sidebar #SpicyLyricsPage .line:not(.musical-line)');
            if (sidebar.length > 0) return sidebar;
        }
        
        const generic = doc.querySelectorAll('.LyricsContent .line:not(.musical-line), .LyricsContainer .line:not(.musical-line)');
        if (generic.length > 0) return generic;
    }
    
    return document.querySelectorAll('.non-existent-selector');
}

export async function waitForLyricsAndTranslate(retries: number = 10, delay: number = 500): Promise<void> {
    debug('Waiting for lyrics to load...');
    
    for (let i = 0; i < retries; i++) {
        if (!isSpicyLyricsOpen() || state.isTranslating) return;

        const lines = getLyricsLines();
        if (lines.length > 0) {
            const firstLineText = lines[0].textContent?.trim();
            if (firstLineText && firstLineText.length > 0) {
                 await new Promise(resolve => setTimeout(resolve, delay));
                 await translateCurrentLyrics();
                 return;
            }
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

export async function translateCurrentLyrics(): Promise<void> {
    if (state.isTranslating) return;
    
    const currentTrackUri = getCurrentTrackUri();
    if (currentTrackUri && currentTrackUri === state.lastTranslatedSongUri && state.translatedLyrics.size > 0) {
        debug('Already translated this track, skipping');
        return;
    }
    
    if (isOffline()) {
        const cacheStats = getCacheStats();
        if (cacheStats.entries === 0) {
            if (state.showNotifications && Spicetify.showNotification) {
                Spicetify.showNotification('Offline - translations unavailable', true);
            }
            return;
        }
    }
    
    let lines = getLyricsLines();
    if (lines.length === 0) return;
    
    state.isTranslating = true;
    
    const buttons = [
        document.querySelector('#TranslateToggle'),
        getPIPWindow()?.document.querySelector('#TranslateToggle')
    ];
    buttons.forEach(b => {
        if(b) {
            b.classList.add('loading');
            b.innerHTML = Icons.Loading;
        }
    });
    
    try {
        const lineTexts: string[] = [];
        lines.forEach(line => lineTexts.push(extractLineText(line)));
        
        const nonEmptyTexts = lineTexts.filter(t => t.trim().length > 0);
        if (nonEmptyTexts.length === 0) {
            state.isTranslating = false;
            restoreButtonState();
            return;
        }
        
        const currentTrackUri = getCurrentTrackUri();
        const skipCheck = await shouldSkipTranslation(nonEmptyTexts, state.targetLanguage, currentTrackUri || undefined);
        
        if (skipCheck.detectedLanguage) state.detectedLanguage = skipCheck.detectedLanguage;
        
        if (skipCheck.skip) {
            state.isTranslating = false;
            state.lastTranslatedSongUri = currentTrackUri;
            restoreButtonState();
            if (state.showNotifications && Spicetify.showNotification) {
                Spicetify.showNotification(skipCheck.reason || 'Lyrics already in target language');
            }
            return;
        }
        
        const translations = await translateLyrics(lineTexts, state.targetLanguage, currentTrackUri || undefined, state.detectedLanguage || undefined);
        
        state.translatedLyrics.clear();
        translations.forEach((result, index) => {
            state.translatedLyrics.set(lineTexts[index], result.translatedText);
        });
        
        state.lastTranslatedSongUri = currentTrackUri;
        
        applyTranslations(lines);
        
        if (state.showNotifications && Spicetify.showNotification) {
            const wasActuallyTranslated = translations.some(t => t.wasTranslated === true);
            if (wasActuallyTranslated) Spicetify.showNotification('Lyrics translated successfully!');
        }
    } catch (err) {
        error('Translation failed:', err);
        if (state.showNotifications && Spicetify.showNotification) {
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
            enableOverlay({ 
                mode: state.overlayMode,
                syncWordHighlight: state.syncWordHighlight
            });
        }
        updateOverlayContent(translationMapByIndex);
        return;
    }
    
    lines.forEach((line, index) => {
        const originalText = extractLineText(line);
        const translatedText = state.translatedLyrics.get(originalText);
        
        if (translatedText && translatedText !== originalText) {
            const existingTranslation = line.querySelector('.spicy-translation-container');
            if (existingTranslation) existingTranslation.remove();
            
            restoreLineText(line);
            
            (line as HTMLElement).dataset.originalText = originalText;
            (line as HTMLElement).dataset.lineIndex = index.toString();
            line.classList.add('spicy-translated');
            
            const contentNodes = line.querySelectorAll('.word, .syllable, .letterGroup');
            if (contentNodes.length > 0) {
                contentNodes.forEach(el => el.classList.add('spicy-hidden-original'));
            } else {
                const wrapper = document.createElement('span');
                wrapper.className = 'spicy-original-wrapper spicy-hidden-original';
                wrapper.innerHTML = line.innerHTML;
                line.innerHTML = '';
                line.appendChild(wrapper);
            }
            
            const translationSpan = document.createElement('span');
            translationSpan.className = 'spicy-translation-container spicy-translation-text';
            translationSpan.textContent = translatedText;
            line.appendChild(translationSpan);
        }
    });
}

function restoreLineText(line: Element): void {
    const hiddenElements = line.querySelectorAll('.spicy-hidden-original');
    hiddenElements.forEach(el => el.classList.remove('spicy-hidden-original'));
    
    const translationTexts = line.querySelectorAll('.spicy-translation-container');
    translationTexts.forEach(el => el.remove());
    
    const wrapper = line.querySelector('.spicy-original-wrapper');
    if (wrapper) {
        const originalContent = wrapper.innerHTML;
        wrapper.remove();
        if (line.innerHTML.trim() === '') line.innerHTML = originalContent;
    }
}

export function removeTranslations(): void {
    if (isOverlayActive()) disableOverlay();
    
    const docs = [document];
    const pip = getPIPWindow();
    if (pip) docs.push(pip.document);
    
    docs.forEach(doc => {
        doc.querySelectorAll('.spicy-translation-container').forEach(el => el.remove());
        doc.querySelectorAll('.slt-interleaved-translation').forEach(el => el.remove());
        doc.querySelectorAll('.spicy-hidden-original').forEach(el => el.classList.remove('spicy-hidden-original'));
        doc.querySelectorAll('.spicy-translated').forEach(el => el.classList.remove('spicy-translated'));
        
        doc.querySelectorAll('.spicy-original-wrapper').forEach(wrapper => {
            const parent = wrapper.parentElement;
            if (parent) {
                const originalContent = wrapper.innerHTML;
                wrapper.remove();
                if (parent.innerHTML.trim() === '') parent.innerHTML = originalContent;
            }
        });
    });
    
    state.translatedLyrics.clear();
}

export function setupLyricsObserver(): void {
    if (lyricsObserver) {
        lyricsObserver.disconnect();
        lyricsObserver = null;
    }
    
    const lyricsContent = getLyricsContent();
    if (!lyricsContent) return;
    
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
                if (translateDebounceTimer) clearTimeout(translateDebounceTimer);
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
    } catch (e) {
        warn('Failed to setup Lyrics observer:', e);
    }
}

export async function onSpicyLyricsOpen(): Promise<void> {
    setViewingLyrics(true);
    
    let viewControls = await waitForElement('#SpicyLyricsPage .ViewControls', 3000);
    if (!viewControls && document.body.classList.contains('SpicySidebarLyrics__Active')) {
        viewControls = await waitForElement('.Root__right-sidebar #SpicyLyricsPage .ViewControls', 2000);
    }
    if (!viewControls) viewControls = await waitForElement('.ViewControls', 2000);
    
    if (viewControls) insertTranslateButton();
    setupLyricsObserver();
    
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        setTimeout(() => {
            insertTranslateButtonIntoDocument(pipWindow.document);
        }, 500);
    }
    
    if (state.isEnabled) {
        updateButtonState();
        state.lastTranslatedSongUri = null;
        waitForLyricsAndTranslate(20, 600);
    } else if (state.autoTranslate) {
        state.isEnabled = true;
        storage.set('translation-enabled', 'true');
        updateButtonState();
        waitForLyricsAndTranslate(20, 600);
    }
}

export function onSpicyLyricsClose(): void {
    setViewingLyrics(false);
    if (translateDebounceTimer) {
        clearTimeout(translateDebounceTimer);
        translateDebounceTimer = null;
    }
    state.isTranslating = false;
    if (lyricsObserver) {
        lyricsObserver.disconnect();
        lyricsObserver = null;
    }
}

export function setupViewModeObserver(): void {
    if (viewModeIntervalId) clearInterval(viewModeIntervalId);
    
    viewModeIntervalId = setInterval(() => {
        const isOpen = isSpicyLyricsOpen();
        if (isOpen) {
            if (!document.querySelector('#TranslateToggle')) {
                insertTranslateButton();
            }
            
            const pipWindow = getPIPWindow();
            if (pipWindow && !pipWindow.document.querySelector('#TranslateToggle')) {
                insertTranslateButtonIntoDocument(pipWindow.document);
            }
        }
    }, 2000);
}

export function setupKeyboardShortcut(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            e.stopPropagation();
            if (isSpicyLyricsOpen()) handleTranslateToggle();
        }
    });
}