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
    const lines = getLyricLines(doc);
    
    // Remove any existing interleaved translations
    doc.querySelectorAll('.slt-interleaved-translation').forEach(el => el.remove());
    
    lines.forEach((line, index) => {
        const translation = translationMap.get(index);
        const originalText = extractLineText(line);
        
        // Check if this is a music break (empty line or just symbols)
        const isBreak = !originalText.trim() || /^[♪♫•\-–—\s]+$/.test(originalText.trim());
        
        // Skip if no translation and not a break, or if translation matches original
        if (!translation && !isBreak) return;
        if (translation === originalText) return;
        
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
        line.parentNode?.insertBefore(translationEl, line.nextSibling);
    });
    
    setupInterleavedTracking(doc);
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

function onActiveLineChanged(doc: Document): void {
    if (!isOverlayEnabled) return;
    
    const lines = getLyricLines(doc);
    
    if (currentConfig.mode === 'interleaved') {
        // Find translations that are siblings of lines
        const translations = doc.querySelectorAll('.slt-interleaved-translation');
        translations.forEach((translationEl) => {
            const lineIndex = parseInt((translationEl as HTMLElement).dataset.forLine || '-1', 10);
            if (lineIndex >= 0 && lineIndex < lines.length) {
                const line = lines[lineIndex];
                translationEl.classList.toggle('active', isLineActive(line));
            }
        });
    }
}

let activeLinePollInterval: ReturnType<typeof setInterval> | null = null;

function setupActiveLineObserver(doc: Document): void {
    if (activeLineObserver) {
        activeLineObserver.disconnect();
    }
    if (activeLinePollInterval) {
        clearInterval(activeLinePollInterval);
        activeLinePollInterval = null;
    }
    
    const lyricsContainer = findLyricsContainer(doc);
    if (!lyricsContainer) return;
    
    activeLineObserver = new MutationObserver((mutations) => {
        let activeChanged = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'attributes') {
                const target = mutation.target as HTMLElement;
                if (target.classList.contains('line') || target.closest('.line')) {
                    activeChanged = true;
                    break;
                }
            }
            if (mutation.type === 'childList') {
                activeChanged = true;
                break;
            }
        }
        
        if (activeChanged) {
            onActiveLineChanged(doc);
        }
    });
    
    activeLineObserver.observe(lyricsContainer, {
        attributes: true,
        attributeFilter: ['class', 'data-active', 'style'],
        subtree: true,
        childList: true
    });
    
    activeLinePollInterval = setInterval(() => {
        if (isOverlayEnabled && currentConfig.mode === 'interleaved') {
            onActiveLineChanged(doc);
        }
    }, 100);
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
    
    if (activeLineObserver) {
        activeLineObserver.disconnect();
        activeLineObserver = null;
    }
    
    if (activeLinePollInterval) {
        clearInterval(activeLinePollInterval);
        activeLinePollInterval = null;
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
