/**
 * Auto-updater for Spicy Lyric Translater
 * Checks GitHub releases for new versions and auto-installs updates
 * 
 * @author 7xeh
 */

import { storage } from './storage';

// Declare the build-time injected version constant
declare const __VERSION__: string;

// Version info - automatically injected at build time from package.json
const CURRENT_VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.0.0';
const GITHUB_REPO = '7xeh/SpicyLyricTranslate';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
const EXTENSION_FILENAME = 'spicy-lyric-translater.js';

// Self-hosted update API
const UPDATE_API_URL = 'https://7xeh.dev/apps/spicylyrictranslate/api/version.php';

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
    assets: GitHubAsset[];
}

interface GitHubAsset {
    name: string;
    browser_download_url: string;
    size: number;
    download_count: number;
}

interface UpdateState {
    isUpdating: boolean;
    progress: number;
    status: string;
}

const updateState: UpdateState = {
    isUpdating: false,
    progress: 0,
    status: ''
};

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
 * Fetch latest version from self-hosted API first, fallback to GitHub
 */
export async function getLatestVersion(): Promise<{ version: VersionInfo; release: GitHubRelease; downloadUrl: string } | null> {
    // Try self-hosted API first
    try {
        const response = await fetch(`${UPDATE_API_URL}?action=version&_=${Date.now()}`);
        
        if (response.ok) {
            const data = await response.json();
            const version = parseVersion(data.version);
            
            if (version) {
                console.log('[SpicyLyricTranslater] Got version from self-hosted API:', data.version);
                return {
                    version,
                    release: {
                        tag_name: `v${data.version}`,
                        name: `v${data.version}`,
                        html_url: data.release_notes_url || RELEASES_URL,
                        body: '',
                        published_at: new Date().toISOString(),
                        assets: [{
                            name: EXTENSION_FILENAME,
                            browser_download_url: data.download_url,
                            size: 0,
                            download_count: 0
                        }]
                    },
                    downloadUrl: data.download_url
                };
            }
        }
    } catch (error) {
        console.warn('[SpicyLyricTranslater] Self-hosted API unavailable, trying GitHub:', error);
    }
    
    // Fallback to GitHub API
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
        
        // Find download URL from assets
        const jsAsset = release.assets?.find(a => a.name.endsWith('.js'));
        const downloadUrl = jsAsset?.browser_download_url || '';
        
        return { version, release, downloadUrl };
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
 * Get the download URL for the extension JS file from a release
 */
function getExtensionDownloadUrl(release: GitHubRelease): string | null {
    if (!release.assets || release.assets.length === 0) {
        return null;
    }
    
    // Look for the .js file in assets
    const jsAsset = release.assets.find(asset => 
        asset.name.endsWith('.js') && 
        (asset.name.includes('spicy-lyric-translater') || asset.name.includes('spicylyrictranslate'))
    );
    
    if (jsAsset) {
        return jsAsset.browser_download_url;
    }
    
    // Fallback: look for any .js file
    const anyJs = release.assets.find(asset => asset.name.endsWith('.js'));
    return anyJs ? anyJs.browser_download_url : null;
}

/**
 * Download the extension file
 */
async function downloadExtension(url: string): Promise<string | null> {
    try {
        updateState.status = 'Downloading...';
        updateState.progress = 10;
        
        // Try self-hosted API download endpoint first (guaranteed CORS support)
        let response: Response | null = null;
        
        // Use the API download endpoint for CORS compatibility
        const apiDownloadUrl = `${UPDATE_API_URL}?action=latest&_=${Date.now()}`;
        
        try {
            response = await fetch(apiDownloadUrl, {
                mode: 'cors',
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`API download failed: ${response.status}`);
            }
            
            console.log('[SpicyLyricTranslater] Downloaded from self-hosted API');
        } catch (apiError) {
            console.warn('[SpicyLyricTranslater] API download failed, trying direct URL:', apiError);
            
            // Fallback to direct URL
            response = await fetch(url, {
                mode: 'cors',
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`Direct download failed: ${response.status}`);
            }
        }
        
        updateState.progress = 50;
        const content = await response.text();
        updateState.progress = 80;
        
        return content;
    } catch (error) {
        console.error('[SpicyLyricTranslater] Download failed:', error);
        return null;
    }
}

/**
 * Trigger a browser download of the extension file
 */
function triggerFileDownload(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Get the Spicetify extensions directory path based on OS
 */
function getExtensionsPath(): string {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) {
        return '%APPDATA%\\spicetify\\Extensions\\';
    } else if (platform.includes('mac')) {
        return '~/.config/spicetify/Extensions/';
    } else {
        return '~/.config/spicetify/Extensions/';
    }
}

/**
 * Install the extension update by triggering download and showing instructions
 */
async function installUpdate(content: string, version: string): Promise<boolean> {
    try {
        updateState.status = 'Preparing download...';
        updateState.progress = 90;
        
        // Trigger the file download
        triggerFileDownload(content, EXTENSION_FILENAME);
        
        // Save the version for tracking
        storage.set('pending-update-version', version);
        storage.set('pending-update-timestamp', Date.now().toString());
        
        updateState.progress = 100;
        updateState.status = 'Download started!';
        
        return true;
    } catch (error) {
        console.error('[SpicyLyricTranslater] Installation failed:', error);
        return false;
    }
}

/**
 * Perform the actual update - download, install, and prompt for reload
 */
async function performUpdate(release: GitHubRelease, version: VersionInfo, modalContent: HTMLElement): Promise<void> {
    if (updateState.isUpdating) return;
    
    updateState.isUpdating = true;
    updateState.progress = 0;
    updateState.status = 'Starting update...';
    
    const progressContainer = modalContent.querySelector('.update-progress');
    const progressBar = modalContent.querySelector('.progress-bar-fill') as HTMLElement;
    const progressText = modalContent.querySelector('.progress-text');
    const buttonsContainer = modalContent.querySelector('.update-buttons');
    
    if (progressContainer) {
        (progressContainer as HTMLElement).style.display = 'block';
    }
    if (buttonsContainer) {
        (buttonsContainer as HTMLElement).style.display = 'none';
    }
    
    const updateProgress = () => {
        if (progressBar) {
            progressBar.style.width = `${updateState.progress}%`;
        }
        if (progressText) {
            progressText.textContent = updateState.status;
        }
    };
    
    try {
        // Get download URL
        const downloadUrl = getExtensionDownloadUrl(release);
        
        if (!downloadUrl) {
            throw new Error('No download URL found in release');
        }
        
        updateProgress();
        
        // Download the extension
        const content = await downloadExtension(downloadUrl);
        
        if (!content) {
            throw new Error('Download failed');
        }
        
        updateProgress();
        
        // Install the update
        const installed = await installUpdate(content, version.text);
        
        if (!installed) {
            throw new Error('Installation failed');
        }
        
        updateProgress();
        
        // Show success message with instructions
        if (progressContainer && buttonsContainer) {
            const extensionsPath = getExtensionsPath();
            (progressContainer as HTMLElement).innerHTML = `
                <div class="update-success">
                    <span class="success-icon">✅</span>
                    <span class="success-text">Update downloaded!</span>
                </div>
                <div class="update-instructions">
                    <p><strong>To complete the update:</strong></p>
                    <ol>
                        <li>Move the downloaded file to:<br><code>${extensionsPath}</code></li>
                        <li>Replace the existing file if prompted</li>
                        <li>Run <code>spicetify apply</code> in your terminal</li>
                        <li>Restart Spotify</li>
                    </ol>
                </div>
            `;
            
            (buttonsContainer as HTMLElement).style.display = 'flex';
            (buttonsContainer as HTMLElement).innerHTML = `
                <button class="update-btn secondary" id="slt-copy-path">Copy Path</button>
                <button class="update-btn primary" id="slt-update-done">Done</button>
            `;
            
            // Add new event listeners
            setTimeout(() => {
                const copyBtn = document.getElementById('slt-copy-path');
                const doneBtn = document.getElementById('slt-update-done');
                
                if (copyBtn) {
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(extensionsPath.replace(/%APPDATA%/g, '').replace(/~/g, ''));
                        if (Spicetify.showNotification) {
                            Spicetify.showNotification('Path copied to clipboard!');
                        }
                    });
                }
                
                if (doneBtn) {
                    doneBtn.addEventListener('click', () => {
                        Spicetify.PopupModal.hide();
                    });
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('[SpicyLyricTranslater] Update failed:', error);
        
        updateState.status = 'Update failed';
        updateProgress();
        
        // Show error with manual download option
        if (progressContainer && buttonsContainer) {
            (progressContainer as HTMLElement).innerHTML = `
                <div class="update-error">
                    <span class="error-icon">❌</span>
                    <span class="error-text">Update failed. Please try manual download.</span>
                </div>
            `;
            
            (buttonsContainer as HTMLElement).style.display = 'flex';
            (buttonsContainer as HTMLElement).innerHTML = `
                <button class="update-btn secondary" id="slt-update-cancel">Cancel</button>
                <button class="update-btn primary" id="slt-manual-download">Download Manually</button>
            `;
            
            setTimeout(() => {
                const cancelBtn = document.getElementById('slt-update-cancel');
                const manualBtn = document.getElementById('slt-manual-download');
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        Spicetify.PopupModal.hide();
                    });
                }
                
                if (manualBtn) {
                    manualBtn.addEventListener('click', () => {
                        window.open(release.html_url, '_blank');
                        Spicetify.PopupModal.hide();
                    });
                }
            }, 100);
        }
    } finally {
        updateState.isUpdating = false;
    }
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
            .slt-update-modal .update-progress {
                display: none;
                background: var(--spice-card);
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 16px;
            }
            .slt-update-modal .progress-bar {
                height: 8px;
                background: var(--spice-button);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            .slt-update-modal .progress-bar-fill {
                height: 100%;
                background: #1db954;
                border-radius: 4px;
                transition: width 0.3s ease;
                width: 0%;
            }
            .slt-update-modal .progress-text {
                font-size: 13px;
                color: var(--spice-subtext);
                text-align: center;
            }
            .slt-update-modal .update-success {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #1db954;
            }
            .slt-update-modal .update-error {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #e74c3c;
            }
            .slt-update-modal .success-icon,
            .slt-update-modal .error-icon {
                font-size: 20px;
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
            .slt-update-modal .update-instructions {
                background: var(--spice-card);
                border-radius: 8px;
                padding: 16px;
                margin-top: 16px;
            }
            .slt-update-modal .update-instructions p {
                margin: 0 0 12px 0;
                color: var(--spice-text);
            }
            .slt-update-modal .update-instructions code {
                background: rgba(0, 0, 0, 0.3);
                padding: 4px 8px;
                border-radius: 4px;
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 12px;
                color: #1db954;
                word-break: break-all;
            }
            .slt-update-modal .update-instructions ol {
                margin: 0;
                padding-left: 20px;
                color: var(--spice-subtext);
            }
            .slt-update-modal .update-instructions li {
                margin-bottom: 8px;
                line-height: 1.5;
            }
            .slt-update-modal .update-instructions li:last-child {
                margin-bottom: 0;
            }
            .slt-update-modal .update-instructions li code {
                display: inline-block;
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
        <div class="update-progress">
            <div class="progress-bar">
                <div class="progress-bar-fill"></div>
            </div>
            <div class="progress-text">Starting update...</div>
        </div>
        <div class="update-buttons">
            <button class="update-btn secondary" id="slt-update-later">Later</button>
            <button class="update-btn primary" id="slt-update-now">Install Update</button>
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
                    // Start the automatic update process
                    performUpdate(release, latestVersion, content);
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
