/**
 * CSS Styles for Spicy Lyric Translater
 */

export const styles = `
/* Spicy Lyric Translater Styles */

/* Translation toggle button in ViewControls */
#SpicyLyricsPage .ViewControls #TranslateToggle {
    display: flex;
    align-items: center;
    justify-content: center;
}

#SpicyLyricsPage .ViewControls #TranslateToggle.active svg {
    color: var(--spice-button-active, #1db954);
}

#SpicyLyricsPage .ViewControls #TranslateToggle:hover {
    transform: scale(1.1);
}

#SpicyLyricsPage .ViewControls #TranslateToggle svg {
    width: 16px;
    height: 16px;
}

/* Loading animation for translate button */
@keyframes spicy-translate-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.spicy-translate-loading {
    animation: spicy-translate-spin 1s linear infinite;
}

#TranslateToggle.loading svg {
    animation: spicy-translate-spin 1s linear infinite;
}

/* Translated lyrics container */
.spicy-translated-line {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.spicy-translated-line .original-text {
    opacity: 0.6;
    font-size: 0.85em;
}

.spicy-translated-line .translated-text {
    color: var(--spice-text, #fff);
}

/* When showing both original and translated */
#SpicyLyricsPage.show-both-lyrics .LyricsContent .Line {
    flex-direction: column;
    gap: 4px;
}

#SpicyLyricsPage.show-both-lyrics .LyricsContent .Line .translated-line {
    font-size: 0.9em;
    opacity: 0.8;
    color: var(--spice-subtext, #b3b3b3);
}

/* Translation indicator badge */
.spicy-translate-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--spice-button-active, #1db954);
    color: #000;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    z-index: 10;
}

/* Settings modal styles */
.spicy-translate-settings {
    padding: 16px;
}

.spicy-translate-settings .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--spice-misc, #535353);
}

.spicy-translate-settings .setting-item:last-child {
    border-bottom: none;
}

.spicy-translate-settings .setting-label {
    font-weight: 500;
}

.spicy-translate-settings .setting-description {
    font-size: 12px;
    color: var(--spice-subtext, #b3b3b3);
    margin-top: 4px;
}

.spicy-translate-settings select,
.spicy-translate-settings button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    background: var(--spice-button, #535353);
    color: var(--spice-text, #fff);
    cursor: pointer;
    font-size: 14px;
}

.spicy-translate-settings select:hover,
.spicy-translate-settings button:hover {
    background: var(--spice-button-active, #1db954);
    color: #000;
}

.spicy-translate-settings .toggle-switch {
    position: relative;
    width: 48px;
    height: 24px;
    background: var(--spice-button, #535353);
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
}

.spicy-translate-settings .toggle-switch.active {
    background: var(--spice-button-active, #1db954);
}

.spicy-translate-settings .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
}

.spicy-translate-settings .toggle-switch.active::after {
    transform: translateX(24px);
}

/* Error message styles */
.spicy-translate-error {
    color: #ff4444;
    padding: 8px;
    text-align: center;
    font-size: 12px;
}

/* Inline translation display */
.spicy-inline-translation {
    display: block;
    font-size: 0.85em;
    opacity: 0.7;
    margin-top: 4px;
    font-style: italic;
    cursor: pointer;
}

/* Hide original content when showing translation only */
.spicy-hidden-original {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
}

/* Translation replacement (when hiding original) */
.spicy-translation-replacement {
    display: inline !important;
    font-style: normal !important;
    opacity: 1 !important;
    font-size: 1em !important;
    margin-top: 0 !important;
    cursor: pointer;
}

/* Ensure translated lines maintain proper styling and are clickable */
.line.spicy-translated {
    display: flex;
    flex-direction: column;
    align-items: inherit;
    cursor: pointer;
}

.line.spicy-translated .spicy-translation-replacement {
    display: block;
    width: 100%;
}

/* Translation container is clickable */
.spicy-translation-container {
    cursor: pointer;
}

.spicy-translation-container:hover {
    opacity: 0.8;
}

/* Translation loading overlay */
.spicy-translate-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.spicy-translate-overlay .loader {
    width: 40px;
    height: 40px;
    border: 3px solid var(--spice-button, #535353);
    border-top-color: var(--spice-button-active, #1db954);
    border-radius: 50%;
    animation: spicy-translate-spin 1s linear infinite;
}
`;

/**
 * Inject styles into the document
 */
export function injectStyles(): void {
    const existingStyle = document.getElementById('spicy-lyric-translater-styles');
    if (existingStyle) {
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'spicy-lyric-translater-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

/**
 * Remove styles from the document
 */
export function removeStyles(): void {
    const styleElement = document.getElementById('spicy-lyric-translater-styles');
    if (styleElement) {
        styleElement.remove();
    }
}

export default { styles, injectStyles, removeStyles };
