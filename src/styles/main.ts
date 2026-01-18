/**
 * CSS Styles for Spicy Lyric Translater
 * Minimal styles to avoid interference with Spicy Lyrics' own styling
 */

export const styles = `
/* Spicy Lyric Translater - Minimal Styles */
/* Works in main page, Cinema View, and PIP popout */

/* Loading animation for translate button */
@keyframes spicy-translate-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

#TranslateToggle.loading svg {
    animation: spicy-translate-spin 1s linear infinite;
}

/* Active state for translate button */
#TranslateToggle.active svg {
    color: var(--spice-button-active, #1db954);
}

/* Error state for translate button */
#TranslateToggle.error svg {
    color: #e74c3c;
}

#TranslateToggle.error {
    animation: spicy-translate-shake 0.5s ease-in-out;
}

@keyframes spicy-translate-shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-3px); }
    40%, 80% { transform: translateX(3px); }
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

/* ========================================
   TRANSLATION DISPLAY STYLES
   ======================================== */

/* Hide original content completely when showing translation only */
.spicy-hidden-original {
    display: none !important;
    visibility: hidden !important;
    position: absolute !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
}

/* Translated text - inherits styling from parent line */
/* pointer-events: none ensures we don't interfere with Spicy Lyrics click handlers */
.spicy-translation-text {
    display: inline !important;
    pointer-events: none !important;
    /* Inherit all text styling from parent */
}

/* Wrapper for original content (used for line-synced lyrics) */
.spicy-original-wrapper {
    display: contents;
}

.spicy-original-wrapper.spicy-hidden-original {
    display: none !important;
}

/* Line that has been translated */
.line.spicy-translated {
    /* Don't change display - let Spicy Lyrics control it */
}

/* Ensure translation container doesn't interfere with clicks */
.spicy-translation-container {
    pointer-events: none !important;
}

/* ========================================
   CACHE VIEWER STYLES
   ======================================== */

.cache-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.cache-delete-btn {
    opacity: 0.6;
    transition: opacity 0.2s, background 0.2s;
}

.cache-delete-btn:hover {
    opacity: 1;
    background: #e74c3c !important;
}

/* ========================================
   CONTEXT-SPECIFIC STYLES
   For main page, Cinema View, and PIP
   ======================================== */

/* Main page styles */
#SpicyLyricsPage .LyricsContent .line .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

/* Cinema View / Fullscreen styles */
#SpicyLyricsPage.ForcedCompactMode .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

/* PIP popout styles */
.spicy-pip-wrapper .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

/* Sidebar mode styles */
#SpicyLyricsPage.SidebarMode .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

/* ========================================
   CONNECTION INDICATOR STYLES
   ======================================== */

/* Spinner animation */
@keyframes slt-ci-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.slt-ci-spinner {
    animation: slt-ci-spin 1s linear infinite;
}

/* Main container - inside topbar content right container */
.SLT_ConnectionIndicator {
    display: flex;
    align-items: center;
    margin-right: 8px;
}

.slt-ci-button {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 6px;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    max-width: 24px;
}

.slt-ci-button:hover {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    max-width: 180px;
    padding: 6px 10px;
    gap: 8px;
}

/* The status dot */
.slt-ci-dot {
    width: 8px;
    height: 8px;
    min-width: 8px;
    border-radius: 50%;
    background: #666;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.slt-ci-dot.slt-ci-connecting {
    background: #888;
    animation: slt-ci-pulse 1.5s ease-in-out infinite;
}

.slt-ci-dot.slt-ci-connected {
    background: #1db954;
}

.slt-ci-dot.slt-ci-error {
    background: #e74c3c;
}

.slt-ci-dot.slt-ci-great {
    background: #1db954;
}

.slt-ci-dot.slt-ci-ok {
    background: #ffe666;
}

.slt-ci-dot.slt-ci-bad {
    background: #ff944d;
}

.slt-ci-dot.slt-ci-horrible {
    background: #e74c3c;
}

@keyframes slt-ci-pulse {
    0%, 100% { opacity: 0.4; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.1); }
}

/* Expanded content - hidden by default */
.slt-ci-expanded {
    display: flex;
    align-items: center;
    opacity: 0;
    max-width: 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
}

.slt-ci-button:hover .slt-ci-expanded {
    opacity: 1;
    max-width: 160px;
}

.slt-ci-stats-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.65rem;
    color: var(--spice-subtext, #b3b3b3);
}

.slt-ci-ping {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 0.6rem;
    color: var(--spice-text, #fff);
}

.slt-ci-divider {
    opacity: 0.3;
    font-size: 0.5rem;
}

.slt-ci-users-count {
    display: flex;
    align-items: center;
    gap: 3px;
    color: var(--spice-text, #fff);
    font-size: 0.6rem;
}

.slt-ci-users-count svg {
    color: var(--spice-subtext, #b3b3b3);
    opacity: 0.7;
}

/* Active viewers count - green highlight */
.slt-ci-users-count.slt-ci-active .slt-ci-active-count {
    color: #1db954;
}

.slt-ci-users-count.slt-ci-active svg {
    color: #1db954;
    opacity: 0.9;
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
