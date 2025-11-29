/**
 * CSS Styles for Spicy Lyric Translater
 * Minimal styles to avoid interference with Spicy Lyrics' own styling
 */

export const styles = `
/* Spicy Lyric Translater - Minimal Styles */

/* Loading animation for translate button */
@keyframes spicy-translate-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

#TranslateToggle.loading svg {
    animation: spicy-translate-spin 1s linear infinite;
}

/* Settings modal styles - these are in our own modal */
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
.spicy-translate-settings input[type="text"],
.spicy-translate-settings button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    background: var(--spice-button, #535353);
    color: var(--spice-text, #fff);
    cursor: pointer;
    font-size: 14px;
}

.spicy-translate-settings input[type="text"] {
    min-width: 200px;
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
    flex-shrink: 0;
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

/* Inline translation - minimal styling, inherits from Spicy Lyrics */
.spicy-inline-translation {
    display: block;
    font-size: 0.8em;
    opacity: 0.65;
    margin-top: 2px;
}

/* Hide original content - screen reader accessible hide */
.spicy-hidden-original {
    position: absolute !important;
    opacity: 0 !important;
    pointer-events: none !important;
}

/* Translation replacement - inherit all styles from parent */
.spicy-translation-replacement {
    /* Inherit everything from parent line element */
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
