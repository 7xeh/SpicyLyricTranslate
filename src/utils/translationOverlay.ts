import { debug, warn } from './debug';

export type OverlayMode = 'replace' | 'interleaved' | 'synced';

export interface OverlayConfig {
    mode: OverlayMode;
    opacity: number;
    fontSize: number;
    syncWordHighlight: boolean;
}

let currentConfig: OverlayConfig = {
    mode: 'replace',
    opacity: 0.85,
    fontSize: 0.9,
    syncWordHighlight: true
};

let isOverlayEnabled = false;
let translationMap: Map<number, string> = new Map();

let cachedLines: NodeListOf<Element> | null = null;
let cachedTranslationMap: Map<number, HTMLElement> | null = null;
let lastActiveIndex = -1;

function getPIPWindow(): Window | null {
    try {
        const docPiP = (globalThis as any).documentPictureInPicture;
        if (docPiP && docPiP.window) {
            return docPiP.window;
        }
    } catch (e) {}
    return null;
}

function getLyricLines(doc: Document): NodeListOf<Element> {
    const isPipDoc = !!doc.querySelector('.spicy-pip-wrapper');
    
    if (isPipDoc) {
        const pipLines = doc.querySelectorAll('.spicy-pip-wrapper #SpicyLyricsPage .SpicyLyricsScrollContainer .line:not(.musical-line)');
        if (pipLines.length > 0) return pipLines;
        
        const pipLinesAlt = doc.querySelectorAll('.spicy-pip-wrapper .SpicyLyricsScrollContainer .line:not(.musical-line)');
        if (pipLinesAlt.length > 0) return pipLinesAlt;
        
        const pipLinesFallback = doc.querySelectorAll('.spicy-pip-wrapper .line:not(.musical-line)');
        if (pipLinesFallback.length > 0) return pipLinesFallback;
    }
    
    const scrollContainerLines = doc.querySelectorAll('#SpicyLyricsPage .SpicyLyricsScrollContainer .line:not(.musical-line)');
    if (scrollContainerLines.length > 0) return scrollContainerLines;
    
    if (doc.body?.classList?.contains('SpicySidebarLyrics__Active')) {
        const sidebarLines = doc.querySelectorAll('.Root__right-sidebar #SpicyLyricsPage .line:not(.musical-line)');
        if (sidebarLines.length > 0) return sidebarLines;
    }
    
    const compactLines = doc.querySelectorAll('#SpicyLyricsPage.ForcedCompactMode .line:not(.musical-line)');
    if (compactLines.length > 0) return compactLines;

    const lyricsContentLines = doc.querySelectorAll('#SpicyLyricsPage .LyricsContent .line:not(.musical-line)');
    if (lyricsContentLines.length > 0) return lyricsContentLines;
    
    return doc.querySelectorAll('.SpicyLyricsScrollContainer .line:not(.musical-line), .LyricsContent .line:not(.musical-line), .LyricsContainer .line:not(.musical-line)');
}

function findLyricsContainer(doc: Document): Element | null {
    const pipWrapper = doc.querySelector('.spicy-pip-wrapper');
    if (pipWrapper) {
        const pipScrollContainer = pipWrapper.querySelector('#SpicyLyricsPage .SpicyLyricsScrollContainer');
        if (pipScrollContainer) return pipScrollContainer;
        
        const pipLyricsContent = pipWrapper.querySelector('#SpicyLyricsPage .LyricsContent');
        if (pipLyricsContent) return pipLyricsContent;
        
        const pipPage = pipWrapper.querySelector('#SpicyLyricsPage');
        if (pipPage) return pipPage;
        
        return pipWrapper;
    }
    
    const scrollContainer = doc.querySelector('#SpicyLyricsPage .SpicyLyricsScrollContainer');
    if (scrollContainer) return scrollContainer;
    
    if (doc.body?.classList?.contains('SpicySidebarLyrics__Active')) {
        const sidebarContainer = doc.querySelector('.Root__right-sidebar #SpicyLyricsPage .SpicyLyricsScrollContainer') ||
                                 doc.querySelector('.Root__right-sidebar #SpicyLyricsPage .LyricsContent');
        if (sidebarContainer) return sidebarContainer;
    }
    
    return doc.querySelector('#SpicyLyricsPage .LyricsContent') || 
           doc.querySelector('.LyricsContent') || 
           doc.querySelector('.LyricsContainer');
}

function extractLineText(line: Element): string {
    const words = line.querySelectorAll('.word:not(.dot), .syllable, .letterGroup');
    if (words.length > 0) {
        return Array.from(words).map(w => w.textContent?.trim() || '').join(' ').replace(/\s+/g, ' ').trim();
    }
    
    const letters = line.querySelectorAll('.letter');
    if (letters.length > 0) {
        return Array.from(letters).map(l => l.textContent || '').join('').trim();
    }
    
    return line.textContent?.trim() || '';
}

function isLineActive(line: Element): boolean {

    const classList = line.classList;
    if (classList.contains('Active')) return true;
    if (classList.contains('active')) return true;
    if (classList.contains('current')) return true;
    if (classList.contains('is-active')) return true;
    
    if (!classList.contains('Sung') && !classList.contains('NotSung') && !classList.contains('musical-line')) {
        return true;
    }
    
    return line.classList.contains('Active') ||
           line.classList.contains('playing') ||
           line.getAttribute('data-active') === 'true' ||
           (line as HTMLElement).dataset.active === 'true';
}

function applyReplaceMode(doc: Document): void {
    const lines = getLyricLines(doc);
    
    lines.forEach((line, index) => {
        const existingTranslation = line.querySelector('.spicy-translation-container');
        if (existingTranslation) existingTranslation.remove();
        
        const translation = translationMap.get(index);
        if (!translation) return;
        
        const originalText = extractLineText(line);
        if (translation === originalText) return;
        
        line.classList.add('spicy-translated');
        (line as HTMLElement).dataset.lineIndex = index.toString();
        
        const contentElements = line.querySelectorAll('.word, .syllable, .letterGroup, .word-group, .letter');
        if (contentElements.length > 0) {
            contentElements.forEach(el => el.classList.add('spicy-hidden-original'));
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
        translationSpan.textContent = translation;
        line.appendChild(translationSpan);
    });
}

let interleavedScrollHandler: (() => void) | null = null;
let interleavedResizeObserver: ResizeObserver | null = null;
let interleavedAnimationFrame: number | null = null;

function setupInterleavedTracking(doc: Document): void {
    cleanupInterleavedTracking();
}

function cleanupInterleavedTracking(): void {
    if (interleavedAnimationFrame) {
        cancelAnimationFrame(interleavedAnimationFrame);
        interleavedAnimationFrame = null;
    }
    
    if (interleavedScrollHandler) {
        const docs = [document];
        const pipWin = getPIPWindow();
        if (pipWin) docs.push(pipWin.document);
        
        docs.forEach(doc => {
            const container = findLyricsContainer(doc);
            if (container) {
                container.removeEventListener('scroll', interleavedScrollHandler!);
            }
        });
        window.removeEventListener('resize', interleavedScrollHandler);
        interleavedScrollHandler = null;
    }
    
    if (interleavedResizeObserver) {
        interleavedResizeObserver.disconnect();
        interleavedResizeObserver = null;
    }
}

function applyInterleavedMode(doc: Document): void {
    cachedLines = null;
    cachedTranslationMap = null;
    lastActiveIndex = -1;

    try {
        const lines = getLyricLines(doc);
        if (!lines || lines.length === 0) {
            debug('No lyrics lines found for interleaved mode');
            return;
        }
        
        doc.querySelectorAll('.slt-interleaved-translation').forEach(el => el.remove());
        doc.querySelectorAll('.slt-sync-translation').forEach(el => el.remove());
        
        lines.forEach((line, index) => {
            try {
                const translation = translationMap.get(index);
                const originalText = extractLineText(line);
                
                const isBreak = !originalText.trim() || /^[♪♫•\-–—\s]+$/.test(originalText.trim());
                
                if (!translation && !isBreak) return;
                if (translation === originalText) return;
                
                if (!line.parentNode) {
                    return;
                }
                
                line.classList.add('slt-overlay-parent');
                (line as HTMLElement).dataset.sltIndex = index.toString();
                
                const translationEl = doc.createElement('div');
                translationEl.className = 'slt-interleaved-translation';
                translationEl.dataset.forLine = index.toString();
                translationEl.dataset.lineIndex = index.toString();
                
                if (isBreak) {
                    translationEl.textContent = '• • •';
                    translationEl.classList.add('slt-music-break');
                } else if (currentConfig.syncWordHighlight) {
                    translationEl.classList.add('slt-sync-translation');
                    
                    const lyricsContainer = doc.querySelector('.SpicyLyricsScrollContainer');
                    const lyricsType = lyricsContainer?.getAttribute('data-lyrics-type') || 'Line';
                    
                    const originalWords = line.querySelectorAll('.word:not(.dot), .letterGroup .letter, .syllable');
                    const translatedWords = translation?.trim().split(/\s+/) || [];
                    
                    debug(`Line ${index}: Type=${lyricsType}, Found ${originalWords.length} original words, ${translatedWords.length} translated words`);
                    
                    if (lyricsType === 'Syllable' && originalWords.length > 0 && translatedWords.length > 0) {
                        const ratio = translatedWords.length / Math.max(originalWords.length, 1);
                        
                        translatedWords.forEach((word, wordIndex) => {
                            const originalIndex = Math.min(
                                Math.floor(wordIndex / Math.max(ratio, 0.01)),
                                originalWords.length - 1
                            );
                            
                            const span = doc.createElement('span');
                            span.className = 'slt-sync-word slt-word-future';
                            span.textContent = wordIndex < translatedWords.length - 1 ? word + ' ' : word;
                            span.dataset.originalIndex = originalIndex.toString();
                            span.dataset.wordIndex = wordIndex.toString();
                            
                            translationEl.appendChild(span);
                        });
                    } else {
                        translationEl.textContent = translation || '';
                    }
                } else {
                    translationEl.textContent = translation || '';
                }
                
                if (isLineActive(line)) translationEl.classList.add('active');
                
                line.parentNode.insertBefore(translationEl, line.nextSibling);
            } catch (lineErr) {
                warn('Failed to process line', index, ':', lineErr);
            }
        });
        
        setupInterleavedTracking(doc);
    } catch (err) {
        warn('Failed to apply interleaved mode:', err);
    }
}

function initOverlayContainer(doc: Document): HTMLElement | null {
    let container = doc.getElementById('spicy-translate-overlay');
    
    if (!container) {
        container = doc.createElement('div');
        container.id = 'spicy-translate-overlay';
        container.className = 'spicy-translate-overlay';
    }
    
    container.className = `spicy-translate-overlay overlay-mode-${currentConfig.mode}`;
    container.style.setProperty('--slt-overlay-opacity', currentConfig.opacity.toString());
    container.style.setProperty('--slt-overlay-font-scale', currentConfig.fontSize.toString());
    
    return container;
}

function applySyncedMode(doc: Document): void {
    try {
        const lines = getLyricLines(doc);
        if (!lines || lines.length === 0) {
            debug('No lyrics lines found for synced mode');
            return;
        }
        
        doc.querySelectorAll('.slt-sync-translation').forEach(el => el.remove());
        
        lines.forEach((line, index) => {
            try {
                const translation = translationMap.get(index);
                const originalText = extractLineText(line);
                
                const isBreak = !originalText.trim() || /^[♪♫•\-–—\s]+$/.test(originalText.trim());
                
                if (!translation && !isBreak) return;
                if (translation === originalText) return;
                
                if (!line.parentNode) return;
                
                line.classList.add('slt-overlay-parent');
                (line as HTMLElement).dataset.sltIndex = index.toString();
                
                const translationEl = doc.createElement('div');
                translationEl.className = 'slt-sync-translation slt-interleaved-translation';
                translationEl.dataset.lineIndex = index.toString();
                
                if (isBreak) {
                    translationEl.textContent = '• • •';
                    translationEl.classList.add('slt-music-break');
                } else if (currentConfig.syncWordHighlight) {
                    const originalWords = line.querySelectorAll('.word:not(.dot), .syllable');
                    const translatedWords = translation?.trim().split(/\s+/) || [];
                    
                    if (originalWords.length > 0 && translatedWords.length > 0) {
                        const ratio = translatedWords.length / Math.max(originalWords.length, 1);
                        
                        translatedWords.forEach((word, wordIndex) => {
                            const originalIndex = Math.min(
                                Math.floor(wordIndex / Math.max(ratio, 0.01)),
                                originalWords.length - 1
                            );
                            
                            const span = doc.createElement('span');
                            span.className = 'slt-sync-word slt-word-future';
                            span.textContent = wordIndex < translatedWords.length - 1 ? word + ' ' : word;
                            span.dataset.originalIndex = originalIndex.toString();
                            span.dataset.wordIndex = wordIndex.toString();
                            
                            translationEl.appendChild(span);
                        });
                    } else {
                        translationEl.textContent = translation || '';
                    }
                } else {
                    translationEl.textContent = translation || '';
                }
                
                if (isLineActive(line)) {
                    translationEl.classList.add('active');
                }
                
                line.parentNode.insertBefore(translationEl, line.nextSibling);
            } catch (lineErr) {
                warn('Failed to process line for synced mode', index, ':', lineErr);
            }
        });
        
    } catch (err) {
        warn('Failed to apply synced mode:', err);
    }
}

function updateSyncedWordStates(doc: Document): void {
    if (!isOverlayEnabled || !currentConfig.syncWordHighlight) return;
    
    const lyricsContainer = doc.querySelector('.SpicyLyricsScrollContainer');
    const lyricsType = lyricsContainer?.getAttribute('data-lyrics-type') || 'Line';
    
    doc.querySelectorAll('.slt-sync-translation').forEach((transLine) => {
        const transLineEl = transLine as HTMLElement;
        const lineIndex = parseInt(transLineEl.dataset.lineIndex || '-1');
        if (lineIndex < 0) return;
        
        const lines = getLyricLines(doc);
        if (lineIndex >= lines.length) return;
        
        const originalLine = lines[lineIndex] as HTMLElement;
        if (!originalLine) return;
        
        const isActive = isLineActive(originalLine);
        transLine.classList.toggle('active', isActive);
        
        if (lyricsType === 'Line') {
            const isSung = originalLine.classList.contains('Sung');
            const isLineActiveClass = originalLine.classList.contains('Active');
            
            const gradientPos = originalLine.style.getPropertyValue('--gradient-position');
            const blurRadius = originalLine.style.getPropertyValue('--text-shadow-blur-radius');
            const shadowOpacity = originalLine.style.getPropertyValue('--text-shadow-opacity');
            
            if (gradientPos && gradientPos.trim()) {
                transLineEl.style.setProperty('--gradient-position', gradientPos);
            } else if (isSung) {
                transLineEl.style.setProperty('--gradient-position', '100%');
            } else if (!isLineActiveClass) {
                transLineEl.style.setProperty('--gradient-position', '-20%');
            }
            
            if (blurRadius && blurRadius.trim()) {
                transLineEl.style.setProperty('--text-shadow-blur-radius', blurRadius);
            }
            if (shadowOpacity && shadowOpacity.trim()) {
                transLineEl.style.setProperty('--text-shadow-opacity', shadowOpacity);
                const opacityValue = parseFloat(shadowOpacity);
                if (!isNaN(opacityValue)) {
                    transLineEl.style.setProperty('--text-shadow-opacity-decimal', (opacityValue / 100).toString());
                }
            }
            return;
        }
        
        const transWords = transLine.querySelectorAll('.slt-sync-word');
        const originalWords = originalLine.querySelectorAll('.word:not(.dot), .letterGroup .letter, .syllable');
        
        transWords.forEach((transWord) => {
            const transWordEl = transWord as HTMLElement;
            const originalIndex = parseInt(transWordEl.dataset.originalIndex || '0');
            
            if (originalIndex < originalWords.length) {
                const originalWord = originalWords[originalIndex] as HTMLElement;
                
                const isSung = originalWord.classList.contains('Sung') || 
                               originalWord.classList.contains('sung');
                const isWordActive = originalWord.classList.contains('Active') ||
                                    originalWord.classList.contains('active');
                
                transWord.classList.remove('slt-word-past', 'slt-word-active', 'slt-word-future');
                
                if (isSung) {
                    transWord.classList.add('slt-word-past');
                    transWordEl.style.setProperty('--gradient-position', '100%');
                } else if (isWordActive) {
                    transWord.classList.add('slt-word-active');
                    const gradientPos = originalWord.style.getPropertyValue('--gradient-position');
                    if (gradientPos && gradientPos.trim()) {
                        transWordEl.style.setProperty('--gradient-position', gradientPos);
                    }
                } else {
                    transWord.classList.add('slt-word-future');
                    transWordEl.style.setProperty('--gradient-position', '-20%');
                }
                
                const blurRadius = originalWord.style.getPropertyValue('--text-shadow-blur-radius');
                const shadowOpacity = originalWord.style.getPropertyValue('--text-shadow-opacity');
                
                if (blurRadius && blurRadius.trim()) {
                    transWordEl.style.setProperty('--text-shadow-blur-radius', blurRadius);
                }
                if (shadowOpacity && shadowOpacity.trim()) {
                    const opacityValue = parseFloat(shadowOpacity);
                    if (!isNaN(opacityValue)) {
                        transWordEl.style.setProperty('--text-shadow-opacity-decimal', (opacityValue / 100).toString());
                    }
                    transWordEl.style.setProperty('--text-shadow-opacity', shadowOpacity);
                }
            }
        });
    });
}

function renderTranslations(doc: Document): void {
    if (!isOverlayEnabled || translationMap.size === 0) return;
    
    switch (currentConfig.mode) {
        case 'replace':
            applyReplaceMode(doc);
            break;
        case 'interleaved':
            applyInterleavedMode(doc);
            break;
        case 'synced':
            applySyncedMode(doc);
            break;
    }
}

let lastActiveLineUpdate = 0;
const ACTIVE_LINE_THROTTLE_MS = 50;

function isDocumentValid(doc: Document): boolean {
    try {
        return doc && doc.body !== null && doc.defaultView !== null;
    } catch {
        return false;
    }
}

function onActiveLineChanged(doc: Document): void {
    if (!isOverlayEnabled) return;
    
    if (!isDocumentValid(doc)) {
        const observer = activeLineObservers.get(doc);
        if (observer) {
            try { observer.disconnect(); } catch {}
            activeLineObservers.delete(doc);
        }
        return;
    }
    
    const now = Date.now();
    if (now - lastActiveLineUpdate < ACTIVE_LINE_THROTTLE_MS) {
        return;
    }
    lastActiveLineUpdate = now;
    
    try {
        if (currentConfig.mode === 'interleaved') {
            if (!cachedLines) {
                cachedLines = getLyricLines(doc);
            }
            
            if (!cachedLines || cachedLines.length === 0) return;

            if (!cachedTranslationMap) {
                cachedTranslationMap = new Map();
                const translationEls = doc.querySelectorAll('.slt-interleaved-translation');
                translationEls.forEach(el => {
                    const idx = parseInt((el as HTMLElement).dataset.forLine || '-1', 10);
                    if (idx >= 0) cachedTranslationMap!.set(idx, el as HTMLElement);
                });
            }

            let currentActiveIndex = -1;
            for (let i = 0; i < cachedLines.length; i++) {
                if (isLineActive(cachedLines[i])) {
                    currentActiveIndex = i;
                    break;
                }
            }

            if (currentActiveIndex !== lastActiveIndex) {
                if (lastActiveIndex !== -1) {
                    const oldEl = cachedTranslationMap.get(lastActiveIndex);
                    if (oldEl) oldEl.classList.remove('active');
                }

                if (currentActiveIndex !== -1) {
                    const newEl = cachedTranslationMap.get(currentActiveIndex);
                    if (newEl) newEl.classList.add('active');
                }

                lastActiveIndex = currentActiveIndex;
            }
        }
    } catch (err) { }
}

const activeLineObservers = new Map<Document, MutationObserver>();
let activeSyncIntervalId: ReturnType<typeof setInterval> | null = null;

function startActiveSyncInterval(): void {
    if (activeSyncIntervalId) return;
    
    activeSyncIntervalId = setInterval(() => {
        if (!isOverlayEnabled) return;
        
        try {
            onActiveLineChanged(document);
            updateSyncedWordStates(document);
            
            const pipWindow = getPIPWindow();
            if (pipWindow) {
                try {
                    const pipDoc = pipWindow.document;
                    if (pipDoc && pipDoc.body) {
                        onActiveLineChanged(pipDoc);
                        updateSyncedWordStates(pipDoc);
                        
                        if (!activeLineObservers.has(pipDoc)) {
                            setupActiveLineObserver(pipDoc);
                        }
                    }
                } catch (pipErr) {
                }
            }
        } catch (e) { }
    }, 80);
}

function stopActiveSyncInterval(): void {
    if (activeSyncIntervalId) {
        clearInterval(activeSyncIntervalId);
        activeSyncIntervalId = null;
    }
}

function setupActiveLineObserver(doc: Document): void {
    try {
        if (!isDocumentValid(doc)) {
            debug('Document not valid for observer setup');
            return;
        }
        
        const existingObserver = activeLineObservers.get(doc);
        if (existingObserver) {
            existingObserver.disconnect();
            activeLineObservers.delete(doc);
        }
        
        let lyricsContainer = findLyricsContainer(doc);
        
        if (!lyricsContainer && doc.body.classList.contains('SpicySidebarLyrics__Active')) {
            lyricsContainer = doc.querySelector('.Root__right-sidebar #SpicyLyricsPage');
        }
        
        if (!lyricsContainer) {
            lyricsContainer = doc.querySelector('.spicy-pip-wrapper #SpicyLyricsPage');
        }
        
        if (!lyricsContainer) {
            lyricsContainer = doc.querySelector('#SpicyLyricsPage');
        }
        
        if (!lyricsContainer) {
            debug('No lyrics container found for observer setup');
            startActiveSyncInterval();
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            try {
                let activeChanged = false;
                let structureChanged = false;
                
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        structureChanged = true;
                        if (mutation.addedNodes.length > 0) activeChanged = true;
                    } else if (mutation.type === 'attributes') {
                        const target = mutation.target as HTMLElement;
                        if (target && (target.classList?.contains('line') || target.closest?.('.line'))) {
                            activeChanged = true;
                        }
                    }
                }

                if (structureChanged) {
                    cachedLines = null;
                    cachedTranslationMap = null;
                    lastActiveIndex = -1;
                }
                
                if (activeChanged) {
                    onActiveLineChanged(doc);
                }
            } catch (e) { }
        });
        
        observer.observe(lyricsContainer, {
            attributes: true,
            attributeFilter: ['class', 'data-active', 'style'],
            subtree: true,
            childList: true
        });
        
        activeLineObservers.set(doc, observer);
        
        startActiveSyncInterval();

        setTimeout(() => onActiveLineChanged(doc), 50);
        
    } catch (err) {
        warn('Failed to setup active line observer:', err);
        startActiveSyncInterval();
    }
}

export function enableOverlay(config?: Partial<OverlayConfig>): void {
    if (config) {
        currentConfig = { ...currentConfig, ...config };
    }
    
    isOverlayEnabled = true;
    
    initOverlayContainer(document);
    setupActiveLineObserver(document);
    
    if (translationMap.size > 0) {
        renderTranslations(document);
    }
    
    document.body.classList.add('slt-overlay-active');
    
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        initOverlayContainer(pipWindow.document);
        setupActiveLineObserver(pipWindow.document);
        if (translationMap.size > 0) {
            renderTranslations(pipWindow.document);
        }
    }
    
    debug('Overlay enabled:', currentConfig.mode);
}

export function disableOverlay(): void {
    isOverlayEnabled = false;
    
    cleanupInterleavedTracking();
    stopActiveSyncInterval();
    
    activeLineObservers.forEach((observer, doc) => {
        observer.disconnect();
    });
    activeLineObservers.clear();
    
    const cleanup = (doc: Document) => {
        const overlay = doc.getElementById('spicy-translate-overlay');
        if (overlay) overlay.remove();
        
        const interleavedOverlay = doc.getElementById('slt-interleaved-overlay');
        if (interleavedOverlay) interleavedOverlay.remove();
        
        doc.querySelectorAll('.slt-interleaved-translation').forEach(el => el.remove());
        doc.querySelectorAll('.slt-sync-translation').forEach(el => el.remove());
        doc.querySelectorAll('.spicy-translation-container').forEach(el => el.remove());
        
        doc.querySelectorAll('.spicy-hidden-original').forEach(el => {
            el.classList.remove('spicy-hidden-original');
        });
        
        doc.querySelectorAll('.spicy-original-wrapper').forEach(wrapper => {
            const parent = wrapper.parentElement;
            if (parent) {
                const originalContent = wrapper.innerHTML;
                wrapper.remove();
                if (parent.innerHTML.trim() === '' || !parent.querySelector('.word, .syllable, .letterGroup, .letter')) {
                    parent.innerHTML = originalContent;
                }
            }
        });
        
        doc.querySelectorAll('.slt-overlay-parent, .spicy-translated').forEach(el => {
            el.classList.remove('slt-overlay-parent', 'spicy-translated');
        });
        
        doc.querySelectorAll('.slt-sync-word').forEach(el => {
            el.classList.remove('slt-word-past', 'slt-word-active', 'slt-word-future');
        });
    };
    
    cleanup(document);
    
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        cleanup(pipWindow.document);
    }
    
    translationMap.clear();
    document.body.classList.remove('slt-overlay-active');
    
    debug('Overlay disabled');
}

export function updateOverlayContent(translations: Map<number, string>): void {
    translationMap = new Map(translations);
    
    if (isOverlayEnabled) {
        renderTranslations(document);
        
        const pipWindow = getPIPWindow();
        if (pipWindow) {
            renderTranslations(pipWindow.document);
        }
    }
}

export function clearOverlayContent(): void {
    translationMap.clear();
    
    const clearDoc = (doc: Document) => {
        const container = doc.getElementById('spicy-translate-overlay');
        if (container) container.innerHTML = '';
        
        doc.querySelectorAll('.slt-interleaved-translation').forEach(el => el.remove());
        doc.querySelectorAll('.spicy-translation-container').forEach(el => el.remove());
        
        doc.querySelectorAll('.spicy-hidden-original').forEach(el => {
            el.classList.remove('spicy-hidden-original');
        });
    };
    
    clearDoc(document);
    
    const pipWindow = getPIPWindow();
    if (pipWindow) {
        clearDoc(pipWindow.document);
    }
}

export function isOverlayActive(): boolean {
    return isOverlayEnabled;
}

export function getOverlayConfig(): OverlayConfig {
    return { ...currentConfig };
}

export function setOverlayConfig(config: Partial<OverlayConfig>): void {
    const wasEnabled = isOverlayEnabled;
    
    const savedTranslations = new Map(translationMap);
    
    if (wasEnabled) {
        disableOverlay();
    }
    
    currentConfig = { ...currentConfig, ...config };
    
    translationMap = savedTranslations;
    
    if (wasEnabled) {
        enableOverlay();
    }
}

export function initPIPOverlay(): void {
    if (!isOverlayEnabled) return;
    
    const pipWindow = getPIPWindow();
    if (!pipWindow) return;
    
    initOverlayContainer(pipWindow.document);
    setupActiveLineObserver(pipWindow.document);
    
    if (translationMap.size > 0) {
        renderTranslations(pipWindow.document);
    }
}

export function getOverlayStyles(): string {
    return `
body.slt-overlay-active .LyricsContent {}

.spicy-translate-overlay {
    pointer-events: none;
    user-select: none;
    z-index: 10;
}

.slt-interleaved-translation {
    display: block;
    font-size: calc(0.45em * var(--slt-overlay-font-scale, 1));
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
    padding: 4px 0 12px 0;
    line-height: 1.2;
    pointer-events: none;
    transition: color 0.3s ease, opacity 0.3s ease, text-shadow 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), filter 0.3s ease;
    letter-spacing: 0.01em;
    text-shadow: none;
    filter: blur(var(--slt-blur-amount, 1.5px));
}

.slt-interleaved-translation.slt-music-break {
    color: rgba(255, 255, 255, 0.3);
    font-size: calc(0.35em * var(--slt-overlay-font-scale, 1));
    letter-spacing: 0.3em;
    padding: 8px 0 16px 0;
}

.slt-interleaved-translation:not(.active) {
    opacity: 0.6;
    filter: blur(var(--slt-blur-amount, 1.5px));
    text-shadow: 0 0 0 transparent;
}

.slt-interleaved-translation.active {
    color: #fff;
    opacity: 1;
    font-weight: 600;
    filter: blur(0px);
    text-shadow: 
        0 0 8px rgba(255, 255, 255, 0.6),
        0 0 16px rgba(255, 255, 255, 0.4),
        0 0 24px rgba(255, 255, 255, 0.2);
}

.slt-interleaved-translation.slt-music-break.active {
    color: rgba(255, 255, 255, 0.6);
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

@keyframes slt-ttml-glow {
    0% {
        text-shadow: 
            0 0 4px rgba(255, 255, 255, 0.4),
            0 0 8px rgba(255, 255, 255, 0.2);
        filter: blur(0.2px);
    }
    50% {
        text-shadow: 
            0 0 12px rgba(255, 255, 255, 0.9),
            0 0 24px rgba(255, 255, 255, 0.7),
            0 0 40px rgba(255, 255, 255, 0.5);
    }
    100% {
        text-shadow: 
            0 0 8px rgba(255, 255, 255, 0.8),
            0 0 16px rgba(255, 255, 255, 0.6),
            0 0 32px rgba(255, 255, 255, 0.4),
            0 0 48px rgba(255, 255, 255, 0.2);
        filter: none;
    }
}

.spicy-pip-wrapper .slt-interleaved-translation {
    font-size: calc(0.82em * var(--slt-overlay-font-scale, 1));
    margin-top: 2px;
    margin-bottom: 4px;
}

.Cinema--Container .slt-interleaved-translation,
#SpicyLyricsPage.ForcedCompactMode .slt-interleaved-translation {
    font-size: calc(0.88em * var(--slt-overlay-font-scale, 1));
}

#SpicyLyricsPage.SidebarMode .slt-interleaved-translation {
    font-size: calc(0.78em * var(--slt-overlay-font-scale, 1));
    margin-top: 2px;
    margin-bottom: 4px;
}

body.SpicySidebarLyrics__Active #SpicyLyricsPage .slt-interleaved-translation {
    font-size: calc(0.65em * var(--slt-overlay-font-scale, 1));
    margin-top: 1px;
    margin-bottom: 3px;
}

body.SpicySidebarLyrics__Active #SpicyLyricsPage .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

.spicy-pip-wrapper .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}
`;
}

export default {
    enableOverlay,
    disableOverlay,
    updateOverlayContent,
    clearOverlayContent,
    isOverlayActive,
    getOverlayConfig,
    setOverlayConfig,
    initPIPOverlay,
    getOverlayStyles
};