/**
 * Auto-updater for Spicy Lyric Translater
 * Checks GitHub releases for new versions
 */

// Version info from manifest
const CURRENT_VERSION = '1.4.2';
const GITHUB_REPO = '7xeh/SpicyLyricTranslate';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;

interface VersionInfo {
    major: number;
    minor: number;
    patch: number;
    text: string;
}

interface GitHubRelease {
    tag_name: string;
    name: string;
    html_url: string;
    body: string;
    published_at: string;
}

let hasShownUpdateNotice = false;
let lastCheckTime = 0;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes minimum between checks

/**
 * Parse a version string into components
 */
function parseVersion(version: string): VersionInfo | null {
    // Remove 'v' prefix if present
    const cleanVersion = version.replace(/^v/, '');
    const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)/);
    
    if (!match) {
        return null;
    }
    
    return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
        text: cleanVersion
    };
}

/**
 * Compare two versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: VersionInfo, v2: VersionInfo): number {
    if (v1.major !== v2.major) {
        return v1.major > v2.major ? 1 : -1;
    }
    if (v1.minor !== v2.minor) {
        return v1.minor > v2.minor ? 1 : -1;
    }
    if (v1.patch !== v2.patch) {
        return v1.patch > v2.patch ? 1 : -1;
    }
    return 0;
}

/**
 * Get current extension version
 */
export function getCurrentVersion(): VersionInfo {
    return parseVersion(CURRENT_VERSION) || {
        major: 1,
        minor: 0,
        patch: 0,
        text: CURRENT_VERSION
    };
}

/**
 * Fetch latest version from GitHub
 */
export async function getLatestVersion(): Promise<{ version: VersionInfo; release: GitHubRelease } | null> {
    try {
        const response = await fetch(GITHUB_API_URL, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            console.warn('[SpicyLyricTranslater] Failed to fetch latest version:', response.status);
            return null;
        }
        
        const release: GitHubRelease = await response.json();
        const version = parseVersion(release.tag_name);
        
        if (!version) {
            console.warn('[SpicyLyricTranslater] Failed to parse version from tag:', release.tag_name);
            return null;
        }
        
        return { version, release };
    } catch (error) {
        console.error('[SpicyLyricTranslater] Error fetching latest version:', error);
        return null;
    }
}

/**
 * Check if an update is available
 */
export async function isUpdateAvailable(): Promise<boolean> {
    const latest = await getLatestVersion();
    if (!latest) return false;
    
    const current = getCurrentVersion();
    return compareVersions(latest.version, current) > 0;
}

/**
 * Show update notification modal
 */
function showUpdateModal(currentVersion: VersionInfo, latestVersion: VersionInfo, release: GitHubRelease): void {
    const content = document.createElement('div');
    content.className = 'slt-update-modal';
    content.innerHTML = `
        <style>
            .slt-update-modal {
                padding: 16px;
                color: var(--spice-text);
            }
            .slt-update-modal .update-header {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 16px;
                color: var(--spice-text);
            }
            .slt-update-modal .version-info {
                background: var(--spice-card);
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 16px;
            }
            .slt-update-modal .version-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            .slt-update-modal .version-row:last-child {
                margin-bottom: 0;
            }
            .slt-update-modal .version-label {
                color: var(--spice-subtext);
            }
            .slt-update-modal .version-value {
                font-weight: 600;
                color: var(--spice-text);
            }
            .slt-update-modal .version-new {
                color: #1db954;
            }
            .slt-update-modal .release-notes {
                background: var(--spice-card);
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 16px;
                max-height: 200px;
                overflow-y: auto;
            }
            .slt-update-modal .release-notes-title {
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--spice-text);
            }
            .slt-update-modal .release-notes-content {
                color: var(--spice-subtext);
                font-size: 13px;
                white-space: pre-wrap;
                line-height: 1.5;
            }
            .slt-update-modal .update-buttons {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            .slt-update-modal .update-btn {
                padding: 10px 20px;
                border-radius: 20px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.2s;
            }
            .slt-update-modal .update-btn.primary {
                background: #1db954;
                color: #000;
            }
            .slt-update-modal .update-btn.primary:hover {
                background: #1ed760;
                transform: scale(1.02);
            }
            .slt-update-modal .update-btn.secondary {
                background: var(--spice-card);
                color: var(--spice-text);
            }
            .slt-update-modal .update-btn.secondary:hover {
                background: var(--spice-button);
            }
        </style>
        <div class="update-header">🎉 A new version is available!</div>
        <div class="version-info">
            <div class="version-row">
                <span class="version-label">Current Version:</span>
                <span class="version-value">${currentVersion.text}</span>
            </div>
            <div class="version-row">
                <span class="version-label">Latest Version:</span>
                <span class="version-value version-new">${latestVersion.text}</span>
            </div>
        </div>
        ${release.body ? `
            <div class="release-notes">
                <div class="release-notes-title">What's New:</div>
                <div class="release-notes-content">${formatReleaseNotes(release.body)}</div>
            </div>
        ` : ''}
        <div class="update-buttons">
            <button class="update-btn secondary" id="slt-update-later">Later</button>
            <button class="update-btn primary" id="slt-update-now">Download Update</button>
        </div>
    `;
    
    if (Spicetify.PopupModal) {
        Spicetify.PopupModal.display({
            title: 'Spicy Lyric Translater - Update Available',
            content: content,
            isLarge: true
        });
        
        // Add event listeners
        setTimeout(() => {
            const laterBtn = document.getElementById('slt-update-later');
            const updateBtn = document.getElementById('slt-update-now');
            
            if (laterBtn) {
                laterBtn.addEventListener('click', () => {
                    Spicetify.PopupModal.hide();
                });
            }
            
            if (updateBtn) {
                updateBtn.addEventListener('click', () => {
                    window.open(release.html_url, '_blank');
                    Spicetify.PopupModal.hide();
                });
            }
        }, 100);
    }
}

/**
 * Show a snackbar notification about the update
 */
function showUpdateSnackbar(latestVersion: VersionInfo, release: GitHubRelease): void {
    if (Spicetify.showNotification) {
        const message = `Spicy Lyric Translater v${latestVersion.text} is available! Click to update.`;
        Spicetify.showNotification(message, false, 10000);
    }
}

/**
 * Format release notes for display
 */
function formatReleaseNotes(body: string): string {
    // Basic markdown-like formatting
    return body
        .replace(/^### (.*)/gm, '<strong>$1</strong>')
        .replace(/^## (.*)/gm, '<strong style="font-size: 14px;">$1</strong>')
        .replace(/^# (.*)/gm, '<strong style="font-size: 16px;">$1</strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*)/gm, '• $1')
        .replace(/\n/g, '<br>');
}

/**
 * Check for updates and show notification if available
 */
export async function checkForUpdates(force: boolean = false): Promise<void> {
    // Don't check too frequently
    const now = Date.now();
    if (!force && now - lastCheckTime < CHECK_INTERVAL_MS) {
        return;
    }
    lastCheckTime = now;
    
    // Don't show again unless forced
    if (!force && hasShownUpdateNotice) {
        return;
    }
    
    try {
        const latest = await getLatestVersion();
        if (!latest) return;
        
        const current = getCurrentVersion();
        
        if (compareVersions(latest.version, current) > 0) {
            console.log(`[SpicyLyricTranslater] Update available: ${current.text} → ${latest.version.text}`);
            showUpdateModal(current, latest.version, latest.release);
            hasShownUpdateNotice = true;
        } else {
            console.log('[SpicyLyricTranslater] Already on latest version:', current.text);
        }
    } catch (error) {
        console.error('[SpicyLyricTranslater] Error checking for updates:', error);
    }
}

/**
 * Start periodic update checks
 */
export function startUpdateChecker(intervalMs: number = 30 * 60 * 1000): void {
    // Check after a short delay on startup
    setTimeout(() => {
        checkForUpdates();
    }, 5000);
    
    // Then check periodically
    setInterval(() => {
        checkForUpdates();
    }, intervalMs);
    
    console.log('[SpicyLyricTranslater] Update checker started');
}

/**
 * Get update info without showing notification
 */
export async function getUpdateInfo(): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string | null;
    releaseUrl: string | null;
} | null> {
    try {
        const current = getCurrentVersion();
        const latest = await getLatestVersion();
        
        if (!latest) {
            return {
                hasUpdate: false,
                currentVersion: current.text,
                latestVersion: null,
                releaseUrl: null
            };
        }
        
        return {
            hasUpdate: compareVersions(latest.version, current) > 0,
            currentVersion: current.text,
            latestVersion: latest.version.text,
            releaseUrl: latest.release.html_url
        };
    } catch {
        return null;
    }
}

// Export version and repo info
export const VERSION = CURRENT_VERSION;
export const REPO_URL = RELEASES_URL;
