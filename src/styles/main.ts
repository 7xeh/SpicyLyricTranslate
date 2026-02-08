export const styles = `
@keyframes spicy-translate-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

#TranslateToggle.loading svg {
    animation: spicy-translate-spin 1s linear infinite;
}

#TranslateToggle.active svg {
    color: var(--spice-button-active, #1db954);
}

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

.spicy-hidden-original {
    display: none !important;
    visibility: hidden !important;
    position: absolute !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
}

.spicy-translation-text {
    display: inline !important;
    pointer-events: none !important;
}

.spicy-original-wrapper {
    display: contents;
}

.spicy-original-wrapper.spicy-hidden-original {
    display: none !important;
}

.line.spicy-translated {}

.spicy-translation-container {
    pointer-events: none !important;
}

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

#SpicyLyricsPage .LyricsContent .line .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

#SpicyLyricsPage.ForcedCompactMode .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

.spicy-pip-wrapper .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

#SpicyLyricsPage.SidebarMode .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

body.SpicySidebarLyrics__Active #SpicyLyricsPage .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

body.SpicySidebarLyrics__Active #SpicyLyricsPage .slt-interleaved-translation {
    font-size: calc(0.65em * var(--slt-overlay-font-scale, 1));
    margin-top: 2px;
    margin-bottom: 4px;
}

@keyframes slt-ci-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.slt-ci-spinner {
    animation: slt-ci-spin 1s linear infinite;
}

.SLT_ConnectionIndicator {
    display: flex;
    align-items: center;
    margin-right: 8px;
    position: relative;
    z-index: 100;
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
    overflow: visible;
    white-space: nowrap;
}

.slt-ci-button:hover {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 6px 10px;
    gap: 8px;
}

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

.slt-ci-expanded {
    display: flex;
    align-items: center;
    opacity: 0;
    width: 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
}

.slt-ci-button:hover .slt-ci-expanded {
    opacity: 1;
    width: auto;
    margin-left: 8px;
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

.slt-ci-users-count.slt-ci-active .slt-ci-active-count {
    color: #1db954;
}

.slt-ci-users-count.slt-ci-active svg {
    color: #1db954;
    opacity: 0.9;
}

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
    padding: 4px 0 12px 0;
    line-height: 1.2;
    pointer-events: none;
    transition: opacity 0.3s ease, color 0.3s ease, text-shadow 0.3s ease, filter 0.3s ease;
    text-align: left;
    white-space: normal;
    word-wrap: break-word;
    letter-spacing: 0.01em;
}

.slt-interleaved-translation:not(.active) {
    opacity: 0.5;
    filter: blur(var(--slt-blur-amount, 1.5px));
}

/* Sync blur with SpicyLyrics line blur when available */
.line.Sung + .slt-interleaved-translation:not(.active),
.line.NotSung + .slt-interleaved-translation:not(.active) {
    filter: blur(calc(var(--BlurAmount, 1.5px) * 0.8));
}

.line.Active + .slt-interleaved-translation {
    filter: blur(0px) !important;
    opacity: 1 !important;
}

.slt-interleaved-translation.active {
    color: var(--spice-text, #fff);
    opacity: 1;
    font-weight: 600;
    text-shadow: 
        0 0 var(--text-shadow-blur-radius, 20px) rgba(255, 255, 255, 0.3),
        0 0 calc(var(--text-shadow-blur-radius, 20px) * 0.5) rgba(255, 255, 255, 0.2);
    filter: none;
}

/* Line-type gradient sync for translation elements */
.slt-sync-translation.slt-interleaved-translation {
    --gradient-alpha: 0.85;
    --gradient-alpha-end: 0.5;
    --gradient-position: -20%;
    color: transparent !important;
    background-image: linear-gradient(
        180deg,
        rgba(255, 255, 255, var(--gradient-alpha)) var(--gradient-position),
        rgba(255, 255, 255, var(--gradient-alpha-end)) calc(var(--gradient-position) + 20%)
    ) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
}

.slt-sync-translation.slt-interleaved-translation.active {
    text-shadow: 
        0 0 var(--text-shadow-blur-radius, 8px) rgba(255, 255, 255, var(--text-shadow-opacity-decimal, 0.3)),
        0 0 calc(var(--text-shadow-blur-radius, 8px) * 2) rgba(255, 255, 255, calc(var(--text-shadow-opacity-decimal, 0.3) * 0.5));
}

/* Sung translations should be fully revealed */
.line.Sung + .slt-sync-translation.slt-interleaved-translation {
    --gradient-position: 100%;
}

/* Not sung translations should be dimmed */
.line.NotSung + .slt-sync-translation.slt-interleaved-translation {
    --gradient-position: -20%;
    opacity: 0.51;
}

.spicy-pip-wrapper .slt-interleaved-overlay .slt-interleaved-translation,
.spicy-pip-wrapper .slt-interleaved-translation {
    font-size: calc(0.82em * var(--slt-overlay-font-scale, 1));
}

.Cinema--Container .slt-interleaved-overlay .slt-interleaved-translation,
.Cinema--Container .slt-interleaved-translation,
#SpicyLyricsPage.ForcedCompactMode .slt-interleaved-overlay .slt-interleaved-translation,
#SpicyLyricsPage.ForcedCompactMode .slt-interleaved-translation {
    font-size: calc(0.88em * var(--slt-overlay-font-scale, 1));
}

#SpicyLyricsPage.SidebarMode .slt-interleaved-overlay .slt-interleaved-translation,
#SpicyLyricsPage.SidebarMode .slt-interleaved-translation {
    font-size: calc(0.78em * var(--slt-overlay-font-scale, 1));
}

body.SpicySidebarLyrics__Active .slt-interleaved-overlay .slt-interleaved-translation,
body.SpicySidebarLyrics__Active .slt-interleaved-translation {
    font-size: calc(0.65em * var(--slt-overlay-font-scale, 1));
    margin-top: 1px;
    margin-bottom: 3px;
}

/* ============================================
   SYNCHRONIZED WORD-LEVEL HIGHLIGHTING STYLES
   ============================================ */

/* Line container for synchronized lyrics */
.slt-sync-line {
    position: relative;
    display: block;
    margin: 8px 0;
    transition: opacity 0.3s ease, filter 0.3s ease;
}

/* Original text layer */
.slt-sync-original {
    display: block;
    line-height: 1.4;
}

/* Translation text layer */
.slt-sync-translation {
    display: block;
    font-size: 0.75em;
    margin-top: 4px;
    line-height: 1.3;
    opacity: 0.7;
}

/* Word span base styles */
.slt-sync-word {
    display: inline;
    transition: 
        opacity 0.15s ease-out,
        color 0.15s ease-out,
        text-shadow 0.2s cubic-bezier(0.25, 0.1, 0.25, 1),
        transform 0.15s ease-out;
    will-change: opacity, color, text-shadow;
}

/* ============================================
   WORD STATE: PAST (Already sung)
   ============================================ */
.slt-sync-word.slt-word-past {
    opacity: 1;
    --gradient-alpha: 0.85;
    --gradient-alpha-end: 0.5;
    --gradient-position: 100%;
    background-image: linear-gradient(
        180deg,
        rgba(255, 255, 255, var(--gradient-alpha)) var(--gradient-position),
        rgba(255, 255, 255, var(--gradient-alpha-end)) calc(var(--gradient-position) + 20%)
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.slt-sync-translation .slt-sync-word.slt-word-past {
    opacity: 0.9;
}

/* ============================================
   WORD STATE: ACTIVE (Currently being sung)
   ============================================ */
.slt-sync-word.slt-word-active {
    opacity: 1;
    color: #fff;
    text-shadow: 
        0 0 var(--text-shadow-blur-radius, 10px) rgba(255, 255, 255, var(--text-shadow-opacity-decimal, 0.5)),
        0 0 calc(var(--text-shadow-blur-radius, 10px) * 2) rgba(255, 255, 255, calc(var(--text-shadow-opacity-decimal, 0.5) * 0.6));
    transform: scale(1.02);
}

.slt-sync-translation .slt-sync-word.slt-word-active {
    opacity: 1;
    color: #fff;
    text-shadow: 
        0 0 var(--text-shadow-blur-radius, 8px) rgba(255, 255, 255, var(--text-shadow-opacity-decimal, 0.4)),
        0 0 calc(var(--text-shadow-blur-radius, 8px) * 2) rgba(255, 255, 255, calc(var(--text-shadow-opacity-decimal, 0.4) * 0.5));
}

/* Gradient progress effect for active word - mirrors Spicy Lyrics */
.slt-sync-word.slt-word-active {
    --gradient-alpha: 0.85;
    --gradient-alpha-end: 0.5;
    --gradient-offset: 0%;
    background-image: linear-gradient(
        180deg,
        rgba(255, 255, 255, var(--gradient-alpha)) var(--gradient-position, -20%),
        rgba(255, 255, 255, var(--gradient-alpha-end)) calc(var(--gradient-position, -20%) + 20% + var(--gradient-offset))
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* ============================================
   WORD STATE: FUTURE (Upcoming words)
   ============================================ */
.slt-sync-word.slt-word-future {
    opacity: 0.51;
    --gradient-alpha: 0.85;
    --gradient-alpha-end: 0.5;
    --gradient-position: -20%;
    background-image: linear-gradient(
        180deg,
        rgba(255, 255, 255, var(--gradient-alpha)) var(--gradient-position),
        rgba(255, 255, 255, var(--gradient-alpha-end)) calc(var(--gradient-position) + 20%)
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.slt-sync-translation .slt-sync-word.slt-word-future {
    opacity: 0.4;
}

/* ============================================
   LINE STATES
   ============================================ */

/* Line: Sung (past lines) */
.slt-sync-line.slt-line-sung {
    opacity: 0.6;
    filter: blur(0.5px);
}

.slt-sync-line.slt-line-sung .slt-sync-word {
    opacity: 0.9;
    color: rgba(255, 255, 255, 0.85);
    text-shadow: none;
}

/* Line: Active (current line) */
.slt-sync-line.slt-line-active {
    opacity: 1;
    filter: none;
}

.slt-sync-line.slt-line-active .slt-sync-translation {
    opacity: 1;
}

/* Active line container highlight */
.slt-sync-line.slt-active-line-container {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    padding: 8px 12px;
    margin: 4px -12px;
}

/* Line: Not Sung (future lines) */
.slt-sync-line.slt-line-notsung {
    opacity: 0.5;
    filter: blur(1px);
}

.slt-sync-line.slt-line-notsung .slt-sync-word {
    opacity: 0.3;
    color: rgba(255, 255, 255, 0.7);
}

.slt-sync-line.slt-line-notsung .slt-sync-translation {
    opacity: 0.4;
}

/* ============================================
   SMOOTH SCROLL CONTAINER STYLES
   ============================================ */
.slt-lyrics-scroll-container {
    overflow-y: scroll;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
}

.slt-lyrics-scroll-container::-webkit-scrollbar {
    display: none; /* Chrome/Safari/Opera */
}

/* Ensure smooth scrolling on the lyrics container */
#SpicyLyricsPage .SpicyLyricsScrollContainer,
#SpicyLyricsPage .LyricsContent,
.LyricsContainer .LyricsContent {
    scroll-behavior: smooth;
}

/* ============================================
   INTEGRATION WITH SPICY LYRICS EXISTING STYLES
   ============================================ */

/* Sync word highlighting within existing Spicy Lyrics lines */
#SpicyLyricsPage .line .slt-sync-word.slt-word-past,
.SpicyLyricsScrollContainer .line .slt-sync-word.slt-word-past {
    opacity: 1;
    color: #fff;
}

#SpicyLyricsPage .line .slt-sync-word.slt-word-active,
.SpicyLyricsScrollContainer .line .slt-sync-word.slt-word-active {
    opacity: 1;
    color: #fff;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

#SpicyLyricsPage .line .slt-sync-word.slt-word-future,
.SpicyLyricsScrollContainer .line .slt-sync-word.slt-word-future {
    opacity: 0.3;
    color: rgba(255, 255, 255, 0.8);
}

/* Translation overlay synced with line state */
.line.Sung + .slt-sync-translation .slt-sync-word {
    opacity: 0.9;
    color: rgba(255, 255, 255, 0.9);
}

.line.Active + .slt-sync-translation {
    opacity: 1 !important;
    filter: none !important;
}

.line.Active + .slt-sync-translation .slt-sync-word.slt-word-active {
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.line.NotSung + .slt-sync-translation .slt-sync-word {
    opacity: 0.3;
}

/* ============================================
   ANIMATION KEYFRAMES
   ============================================ */

@keyframes slt-word-glow-pulse {
    0% {
        text-shadow: 
            0 0 4px rgba(255, 255, 255, 0.4),
            0 0 8px rgba(255, 255, 255, 0.2);
    }
    50% {
        text-shadow: 
            0 0 12px rgba(255, 255, 255, 0.6),
            0 0 24px rgba(255, 255, 255, 0.4),
            0 0 36px rgba(255, 255, 255, 0.2);
    }
    100% {
        text-shadow: 
            0 0 10px rgba(255, 255, 255, 0.5),
            0 0 20px rgba(255, 255, 255, 0.3);
    }
}

/* Active word glow animation */
.slt-sync-word.slt-word-active.slt-animate-glow {
    animation: slt-word-glow-pulse 0.3s ease-out forwards;
}

/* Smooth word transition for entering active state */
@keyframes slt-word-activate {
    0% {
        opacity: 0.3;
        transform: scale(1);
    }
    100% {
        opacity: 1;
        transform: scale(1.02);
    }
}

.slt-sync-word.slt-word-active {
    animation: slt-word-activate 0.15s ease-out forwards;
}

/* ============================================
   RESPONSIVE ADJUSTMENTS
   ============================================ */

/* Sidebar mode */
body.SpicySidebarLyrics__Active .slt-sync-line {
    margin: 4px 0;
}

body.SpicySidebarLyrics__Active .slt-sync-translation {
    font-size: 0.65em;
    margin-top: 2px;
}

body.SpicySidebarLyrics__Active .slt-sync-word.slt-word-active {
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
}

/* PiP mode */
.spicy-pip-wrapper .slt-sync-line {
    margin: 6px 0;
}

.spicy-pip-wrapper .slt-sync-translation {
    font-size: 0.8em;
}

/* Cinema/Fullscreen mode */
.Cinema--Container .slt-sync-line,
#SpicyLyricsPage.ForcedCompactMode .slt-sync-line {
    margin: 12px 0;
}

.Cinema--Container .slt-sync-translation,
#SpicyLyricsPage.ForcedCompactMode .slt-sync-translation {
    font-size: 0.85em;
    margin-top: 6px;
}

.Cinema--Container .slt-sync-word.slt-word-active,
#SpicyLyricsPage.ForcedCompactMode .slt-sync-word.slt-word-active {
    text-shadow: 
        0 0 15px rgba(255, 255, 255, 0.6),
        0 0 30px rgba(255, 255, 255, 0.4),
        0 0 45px rgba(255, 255, 255, 0.2);
}
`;

import { getOverlayStyles } from '../utils/translationOverlay';

export function injectStyles(): void {
    const existingStyle = document.getElementById('spicy-lyric-translater-styles');
    if (existingStyle) {
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'spicy-lyric-translater-styles';
    styleElement.textContent = styles + getOverlayStyles();
    document.head.appendChild(styleElement);
}

export function removeStyles(): void {
    const styleElement = document.getElementById('spicy-lyric-translater-styles');
    if (styleElement) {
        styleElement.remove();
    }
}

export default { styles, injectStyles, removeStyles };
