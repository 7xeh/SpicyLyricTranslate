import { debug, warn } from './debug';

export type OverlayMode = 'replace' | 'interleaved' | 'side-by-side';

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
    return doc.querySelectorAll('.LyricsContent .line, .LyricsContainer .line');
}

function findLyricsContainer(doc: Document): Element | null {
    return doc.querySelector('.LyricsContent') || doc.querySelector('.LyricsContainer');
}

function extractLineText(line: Element): string {
    const words = line.querySelectorAll('.word, .syllable, .letterGroup, .letter');
    if (words.length > 0) {
        return Array.from(words).map(w => w.textContent || '').join('');
    }
    return line.textContent?.trim() || '';
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

function applyInterleavedMode(doc: Document): void {
    const lines = getLyricLines(doc);
    
    lines.forEach((line, index) => {
        const existingTranslation = line.querySelector('.slt-interleaved-translation');
        if (existingTranslation) existingTranslation.remove();
        
        const translation = translationMap.get(index);
        if (!translation) return;
        
        const originalText = extractLineText(line);
        if (translation === originalText) return;
        
        line.classList.add('slt-overlay-parent');
        
        const translationEl = document.createElement('div');
        translationEl.className = 'slt-interleaved-translation';
        translationEl.textContent = translation;
        
        const isActive = line.classList.contains('active') || line.classList.contains('current');
        if (isActive) translationEl.classList.add('active');
        
        line.appendChild(translationEl);
    });
}

function applySideBySideMode(doc: Document): void {
    const container = doc.getElementById('spicy-translate-overlay');
    if (!container) return;
    
    const lines = getLyricLines(doc);
    container.innerHTML = '';
    
    lines.forEach((line, index) => {
        const translation = translationMap.get(index);
        if (!translation) return;
        
        const overlayLine = document.createElement('div');
        overlayLine.className = 'slt-overlay-line';
        overlayLine.textContent = translation;
        overlayLine.dataset.index = index.toString();
        
        const isActive = line.classList.contains('active') || line.classList.contains('current');
        if (isActive) {
            overlayLine.classList.add('active');
        }
        
        container.appendChild(overlayLine);
    });
    
    const lyricsContainer = findLyricsContainer(doc);
    if (lyricsContainer && !lyricsContainer.classList.contains('slt-side-by-side-container')) {
        lyricsContainer.classList.add('slt-side-by-side-container');
        lyricsContainer.appendChild(container);
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
    
    if (currentConfig.mode === 'side-by-side') {
        const lyricsContainer = findLyricsContainer(doc);
        if (lyricsContainer && !lyricsContainer.contains(container)) {
            lyricsContainer.appendChild(container);
        }
    }
    
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
        case 'side-by-side':
            applySideBySideMode(doc);
            break;
    }
}

function onActiveLineChanged(doc: Document): void {
    if (!isOverlayEnabled) return;
    
    const lines = getLyricLines(doc);
    
    if (currentConfig.mode === 'interleaved') {
        lines.forEach((line) => {
            const translationEl = line.querySelector('.slt-interleaved-translation');
            if (translationEl) {
                const isActive = line.classList.contains('active') || line.classList.contains('current');
                translationEl.classList.toggle('active', isActive);
            }
        });
    } else if (currentConfig.mode === 'side-by-side') {
        const container = doc.getElementById('spicy-translate-overlay');
        if (!container) return;
        
        const overlayLines = container.querySelectorAll('.slt-overlay-line');
        
        lines.forEach((line, index) => {
            const isActive = line.classList.contains('active') || line.classList.contains('current');
            const overlayLine = Array.from(overlayLines).find(
                ol => (ol as HTMLElement).dataset.index === index.toString()
            );
            
            if (overlayLine) {
                overlayLine.classList.toggle('active', isActive);
                if (isActive) {
                    overlayLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
}

function setupActiveLineObserver(doc: Document): void {
    if (activeLineObserver) {
        activeLineObserver.disconnect();
    }
    
    const lyricsContainer = findLyricsContainer(doc);
    if (!lyricsContainer) return;
    
    activeLineObserver = new MutationObserver((mutations) => {
        let activeChanged = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target as HTMLElement;
                if (target.classList.contains('line')) {
                    activeChanged = true;
                    break;
                }
            }
        }
        
        if (activeChanged) {
            onActiveLineChanged(doc);
        }
    });
    
    activeLineObserver.observe(lyricsContainer, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    });
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
    
    if (activeLineObserver) {
        activeLineObserver.disconnect();
        activeLineObserver = null;
    }
    
    const cleanup = (doc: Document) => {
        const overlay = doc.getElementById('spicy-translate-overlay');
        if (overlay) overlay.remove();
        
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
        
        doc.querySelectorAll('.slt-overlay-parent, .slt-side-by-side-container, .spicy-translated').forEach(el => {
            el.classList.remove('slt-overlay-parent', 'slt-side-by-side-container', 'spicy-translated');
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
    font-size: calc(0.85em * var(--slt-overlay-font-scale, 0.9));
    color: var(--spice-subtext, rgba(255, 255, 255, 0.7));
    opacity: var(--slt-overlay-opacity, 0.85);
    margin-top: 4px;
    margin-bottom: 8px;
    padding: 0 2px;
    line-height: 1.3;
    pointer-events: none;
    transition: opacity 0.2s ease, color 0.2s ease;
    position: relative;
    z-index: 1;
}

.line.active .slt-interleaved-translation,
.line.current .slt-interleaved-translation,
.slt-interleaved-translation.active {
    color: var(--spice-text, #fff);
    opacity: 1;
}

.line:not(.active):not(.current) .slt-interleaved-translation {
    opacity: 0.5;
}

.slt-side-by-side-container {
    display: flex;
    gap: 24px;
}

.spicy-translate-overlay.overlay-mode-side-by-side {
    flex: 0 0 40%;
    max-width: 40%;
    overflow-y: auto;
    padding: 16px;
    opacity: var(--slt-overlay-opacity, 0.85);
}

.spicy-translate-overlay.overlay-mode-side-by-side .slt-overlay-line {
    padding: 8px 0;
    font-size: calc(1em * var(--slt-overlay-font-scale, 0.9));
    color: var(--spice-subtext, rgba(255, 255, 255, 0.6));
    transition: color 0.2s ease, background 0.2s ease;
    border-radius: 4px;
}

.spicy-translate-overlay.overlay-mode-side-by-side .slt-overlay-line.active {
    color: var(--spice-text, #fff);
    background: rgba(255, 255, 255, 0.05);
}

.spicy-pip-wrapper .slt-interleaved-translation {
    font-size: calc(0.75em * var(--slt-overlay-font-scale, 0.9));
    margin-top: 2px;
    margin-bottom: 4px;
}

.Cinema--Container .slt-interleaved-translation,
#SpicyLyricsPage.ForcedCompactMode .slt-interleaved-translation {
    font-size: calc(0.8em * var(--slt-overlay-font-scale, 0.9));
}

#SpicyLyricsPage.SidebarMode .slt-interleaved-translation {
    font-size: calc(0.7em * var(--slt-overlay-font-scale, 0.9));
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
