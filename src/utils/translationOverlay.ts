import { debug, warn } from './debug';

export type OverlayMode = 'replace' | 'interleaved';

export interface OverlayConfig {
    mode: OverlayMode;
    opacity: number;
    fontSize: number;
}

let currentConfig: OverlayConfig = {
    mode: 'replace',
    opacity: 0.85,
    fontSize: 0.9
};

let isOverlayEnabled = false;
let translationMap: Map<number, string> = new Map();
let activeLineObserver: MutationObserver | null = null;

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
    return doc.querySelectorAll('.SpicyLyricsScrollContainer .line, .LyricsContent .line, .LyricsContainer .line');
}

function findLyricsContainer(doc: Document): Element | null {
    return doc.querySelector('.SpicyLyricsScrollContainer') || 
           doc.querySelector('.LyricsContent') || 
           doc.querySelector('.LyricsContainer');
}

function extractLineText(line: Element): string {
    const words = line.querySelectorAll('.word, .syllable, .letterGroup, .letter');
    if (words.length > 0) {
        return Array.from(words).map(w => w.textContent || '').join('');
    }
    return line.textContent?.trim() || '';
}

function isLineActive(line: Element): boolean {
    return line.classList.contains('Active') ||
           line.classList.contains('active') ||
           line.classList.contains('current') ||
           line.classList.contains('is-active') ||
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
    // No longer needed for positioning since we use inline siblings
    // Active line tracking is handled by setupActiveLineObserver
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
    try {
        const lines = getLyricLines(doc);
        if (!lines || lines.length === 0) {
            debug('No lyrics lines found for interleaved mode');
            return;
        }
        
        // Remove any existing interleaved translations
        doc.querySelectorAll('.slt-interleaved-translation').forEach(el => el.remove());
        
        lines.forEach((line, index) => {
            try {
                const translation = translationMap.get(index);
                const originalText = extractLineText(line);
                
                // Check if this is a music break (empty line or just symbols)
                const isBreak = !originalText.trim() || /^[♪♫•\-–—\s]+$/.test(originalText.trim());
                
                // Skip if no translation and not a break, or if translation matches original
                if (!translation && !isBreak) return;
                if (translation === originalText) return;
                
                // Ensure line has a parent before proceeding
                if (!line.parentNode) {
                    warn('Line element has no parent, skipping:', index);
                    return;
                }
                
                line.classList.add('slt-overlay-parent');
                (line as HTMLElement).dataset.sltIndex = index.toString();
                
                const translationEl = doc.createElement('div');
                translationEl.className = 'slt-interleaved-translation';
                translationEl.dataset.forLine = index.toString();
                
                if (isBreak) {
                    translationEl.textContent = '• • •';
                    translationEl.classList.add('slt-music-break');
                } else {
                    translationEl.textContent = translation || '';
                }
                
                if (isLineActive(line)) translationEl.classList.add('active');
                
                // Insert translation directly after the line element
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

function renderTranslations(doc: Document): void {
    if (!isOverlayEnabled || translationMap.size === 0) return;
    
    switch (currentConfig.mode) {
        case 'replace':
            applyReplaceMode(doc);
            break;
        case 'interleaved':
            applyInterleavedMode(doc);
            break;
    }
}

// Throttle state for active line changes
let lastActiveLineUpdate = 0;
const ACTIVE_LINE_THROTTLE_MS = 50;

function isDocumentValid(doc: Document): boolean {
    try {
        // Check if document is still accessible and not detached
        return doc && doc.body !== null && doc.defaultView !== null;
    } catch {
        return false;
    }
}

function onActiveLineChanged(doc: Document): void {
    if (!isOverlayEnabled) return;
    
    // Check if document is still valid (prevents crashes with closed PIP windows)
    if (!isDocumentValid(doc)) {
        // Clean up resources for this invalid document
        const observer = activeLineObservers.get(doc);
        if (observer) {
            try { observer.disconnect(); } catch {}
            activeLineObservers.delete(doc);
        }
        const interval = activeLinePollIntervals.get(doc);
        if (interval) {
            clearInterval(interval);
            activeLinePollIntervals.delete(doc);
        }
        return;
    }
    
    // Throttle updates to prevent excessive DOM manipulation
    const now = Date.now();
    if (now - lastActiveLineUpdate < ACTIVE_LINE_THROTTLE_MS) {
        return;
    }
    lastActiveLineUpdate = now;
    
    try {
        if (currentConfig.mode === 'interleaved') {
            const lines = getLyricLines(doc);
            if (!lines || lines.length === 0) return;
            
            // Find translations that are siblings of lines
            const translations = doc.querySelectorAll('.slt-interleaved-translation');
            translations.forEach((translationEl) => {
                try {
                    const lineIndex = parseInt((translationEl as HTMLElement).dataset.forLine || '-1', 10);
                    if (lineIndex >= 0 && lineIndex < lines.length) {
                        const line = lines[lineIndex];
                        if (line) {
                            const shouldBeActive = isLineActive(line);
                            const isActive = translationEl.classList.contains('active');
                            // Only toggle if state changed to minimize reflows
                            if (shouldBeActive !== isActive) {
                                translationEl.classList.toggle('active', shouldBeActive);
                            }
                        }
                    }
                } catch (e) {
                    // Silently ignore individual element errors
                }
            });
        }
    } catch (err) {
        // Silently ignore to prevent crash loops
    }
}

// Store intervals per document to prevent memory leaks
const activeLinePollIntervals = new Map<Document, ReturnType<typeof setInterval>>();
const activeLineObservers = new Map<Document, MutationObserver>();

function setupActiveLineObserver(doc: Document): void {
    try {
        // Validate document before setup
        if (!isDocumentValid(doc)) {
            debug('Document not valid for observer setup');
            return;
        }
        
        // Clean up existing observer for this document
        const existingObserver = activeLineObservers.get(doc);
        if (existingObserver) {
            existingObserver.disconnect();
            activeLineObservers.delete(doc);
        }
        
        // Clean up existing interval for this document
        const existingInterval = activeLinePollIntervals.get(doc);
        if (existingInterval) {
            clearInterval(existingInterval);
            activeLinePollIntervals.delete(doc);
        }
        
        // Also clean up legacy single observer if present
        if (activeLineObserver) {
            activeLineObserver.disconnect();
            activeLineObserver = null;
        }
        
        const lyricsContainer = findLyricsContainer(doc);
        if (!lyricsContainer) {
            debug('No lyrics container found for observer setup');
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            try {
                let activeChanged = false;
                
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes') {
                        const target = mutation.target as HTMLElement;
                        if (target && (target.classList?.contains('line') || target.closest?.('.line'))) {
                            activeChanged = true;
                            break;
                        }
                    }
                    // Only trigger on childList if it's adding/removing line elements
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        const hasLineChange = Array.from(mutation.addedNodes).some(node => 
                            node.nodeType === Node.ELEMENT_NODE && 
                            ((node as Element).classList?.contains('line') || (node as Element).querySelector?.('.line'))
                        );
                        if (hasLineChange) {
                            activeChanged = true;
                            break;
                        }
                    }
                }
                
                if (activeChanged) {
                    onActiveLineChanged(doc);
                }
            } catch (e) {
                // Silently ignore mutation callback errors
            }
        });
        
        observer.observe(lyricsContainer, {
            attributes: true,
            attributeFilter: ['class', 'data-active'],
            subtree: true,
            childList: true
        });
        
        activeLineObservers.set(doc, observer);
        
        // Use a longer interval (250ms instead of 100ms) to reduce CPU usage
        // The MutationObserver handles most active line changes, this is just a fallback
        const intervalId = setInterval(() => {
            // Early exit if document is no longer valid (e.g., PIP window closed)
            if (!isDocumentValid(doc)) {
                clearInterval(intervalId);
                activeLinePollIntervals.delete(doc);
                const obs = activeLineObservers.get(doc);
                if (obs) {
                    try { obs.disconnect(); } catch {}
                    activeLineObservers.delete(doc);
                }
                return;
            }
            if (isOverlayEnabled && currentConfig.mode === 'interleaved') {
                onActiveLineChanged(doc);
            }
        }, 250);
        
        activeLinePollIntervals.set(doc, intervalId);
    } catch (err) {
        warn('Failed to setup active line observer:', err);
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
    
    // Clean up all document-specific observers and intervals
    activeLineObservers.forEach((observer, doc) => {
        observer.disconnect();
    });
    activeLineObservers.clear();
    
    activeLinePollIntervals.forEach((interval, doc) => {
        clearInterval(interval);
    });
    activeLinePollIntervals.clear();
    
    // Also clean up legacy single observer if present
    if (activeLineObserver) {
        activeLineObserver.disconnect();
        activeLineObserver = null;
    }
    
    const cleanup = (doc: Document) => {
        const overlay = doc.getElementById('spicy-translate-overlay');
        if (overlay) overlay.remove();
        
        const interleavedOverlay = doc.getElementById('slt-interleaved-overlay');
        if (interleavedOverlay) interleavedOverlay.remove();
        
        doc.querySelectorAll('.slt-interleaved-translation').forEach(el => el.remove());
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
    
    if (wasEnabled) {
        disableOverlay();
    }
    
    currentConfig = { ...currentConfig, ...config };
    
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
    filter: blur(0.3px);
}

.slt-interleaved-translation.slt-music-break {
    color: rgba(255, 255, 255, 0.3);
    font-size: calc(0.35em * var(--slt-overlay-font-scale, 1));
    letter-spacing: 0.3em;
    padding: 8px 0 16px 0;
}

.slt-interleaved-translation:not(.active) {
    opacity: 0.6;
    filter: blur(0.4px);
    text-shadow: 0 0 0 transparent;
}

.slt-interleaved-translation.active {
    color: #fff;
    opacity: 1;
    font-weight: 600;
    filter: none;
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
