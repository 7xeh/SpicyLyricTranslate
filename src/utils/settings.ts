import { storage } from './storage';
import { state } from './state';
import { SUPPORTED_LANGUAGES, clearTranslationCache, setPreferredApi } from './translator';
import { debug, info, isDebugEnabled, setDebugMode } from './debug';
import { getTrackCacheStats, getAllCachedTracks, deleteTrackCache, clearAllTrackCache } from './trackCache';
import { VERSION, REPO_URL, checkForUpdates, getUpdateInfo } from './updater';
import { OverlayMode } from './translationOverlay';
import { reapplyTranslations } from './core';

const SETTINGS_ID = 'spicy-lyric-translater-settings';

function createNativeToggle(id: string, label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
    const row = document.createElement('div');
    row.className = 'x-settings-row';
    row.innerHTML = `
        <div class="x-settings-firstColumn">
            <label class="e-91000-text encore-text-body-small encore-internal-color-text-subdued" for="${id}">${label}</label>
        </div>
        <div class="x-settings-secondColumn">
            <label class="x-toggle-wrapper">
                <input id="${id}" class="x-toggle-input" type="checkbox" ${checked ? 'checked' : ''}>
                <span class="x-toggle-indicatorWrapper">
                    <span class="x-toggle-indicator"></span>
                </span>
            </label>
        </div>
    `;
    
    const input = row.querySelector('input') as HTMLInputElement;
    input?.addEventListener('change', () => onChange(input.checked));
    
    return row;
}

function createNativeDropdown(id: string, label: string, options: { value: string; text: string }[], currentValue: string, onChange: (value: string) => void): HTMLElement {
    const row = document.createElement('div');
    row.className = 'x-settings-row';
    row.innerHTML = `
        <div class="x-settings-firstColumn">
            <label class="e-91000-text encore-text-body-small encore-internal-color-text-subdued" for="${id}">${label}</label>
        </div>
        <div class="x-settings-secondColumn">
            <span>
                <select class="main-dropDown-dropDown" id="${id}">
                    ${options.map(opt => `<option value="${opt.value}" ${opt.value === currentValue ? 'selected' : ''}>${opt.text}</option>`).join('')}
                </select>
            </span>
        </div>
    `;
    
    const select = row.querySelector('select') as HTMLSelectElement;
    select?.addEventListener('change', () => onChange(select.value));
    
    return row;
}

function createNativeButton(id: string, label: string, buttonText: string, onClick: () => void): HTMLElement {
    const row = document.createElement('div');
    row.className = 'x-settings-row';
    row.innerHTML = `
        <div class="x-settings-firstColumn">
            <label class="e-91000-text encore-text-body-small encore-internal-color-text-subdued" for="${id}">${label}</label>
        </div>
        <div class="x-settings-secondColumn">
            <button id="${id}" class="Button-sc-y0gtbx-0 Button-buttonSecondary-small-useBrowserDefaultFocusStyle encore-text-body-small-bold e-91000-button--small" data-encore-id="buttonSecondary" type="button">${buttonText}</button>
        </div>
    `;
    
    const button = row.querySelector('button') as HTMLButtonElement;
    button?.addEventListener('click', onClick);
    
    return row;
}

function createNativeSettingsSection(): HTMLElement {
    const section = document.createElement('div');
    section.id = SETTINGS_ID;
    section.innerHTML = `
        <div class="x-settings-section">
            <h2 class="e-91000-text encore-text-body-medium-bold encore-internal-color-text-base">Spicy Lyric Translater</h2>
        </div>
    `;
    
    const sectionContent = section.querySelector('.x-settings-section') as HTMLElement;

    const languageOptions = SUPPORTED_LANGUAGES.map(l => ({ value: l.code, text: l.name }));
    sectionContent.appendChild(createNativeDropdown(
        'slt-settings.target-language',
        'Target Language',
        languageOptions,
        storage.get('target-language') || 'en',
        (value) => {
            storage.set('target-language', value);
            state.targetLanguage = value;
        }
    ));
    
    sectionContent.appendChild(createNativeDropdown(
        'slt-settings.overlay-mode',
        'Translation Display',
        [
            { value: 'replace', text: 'Replace (default)' },
            { value: 'interleaved', text: 'Below each line' }
        ],
        storage.get('overlay-mode') || 'replace',
        (value) => {
            const mode = value as OverlayMode;
            storage.set('overlay-mode', mode);
            state.overlayMode = mode;
            reapplyTranslations();
        }
    ));
    
    sectionContent.appendChild(createNativeDropdown(
        'slt-settings.preferred-api',
        'Translation API',
        [
            { value: 'google', text: 'Google Translate' },
            { value: 'libretranslate', text: 'LibreTranslate' },
            { value: 'custom', text: 'Custom API' }
        ],
        storage.get('preferred-api') || 'google',
        (value) => {
            const api = value as 'google' | 'libretranslate' | 'custom';
            storage.set('preferred-api', api);
            state.preferredApi = api;
            setPreferredApi(api, storage.get('custom-api-url') || '');
            
            const customRow = document.getElementById('slt-settings-custom-api-row');
            if (customRow) {
                customRow.style.display = api === 'custom' ? '' : 'none';
            }
        }
    ));
    
    const customApiRow = document.createElement('div');
    customApiRow.id = 'slt-settings-custom-api-row';
    customApiRow.className = 'x-settings-row';
    customApiRow.style.display = storage.get('preferred-api') === 'custom' ? '' : 'none';
    customApiRow.innerHTML = `
        <div class="x-settings-firstColumn">
            <label class="e-91000-text encore-text-body-small encore-internal-color-text-subdued" for="slt-settings.custom-api-url">Custom API URL</label>
        </div>
        <div class="x-settings-secondColumn">
            <input type="text" id="slt-settings.custom-api-url" class="main-dropDown-dropDown" style="width: 200px;" value="${storage.get('custom-api-url') || ''}" placeholder="https://your-api.com/translate">
        </div>
    `;
    const customApiInput = customApiRow.querySelector('input') as HTMLInputElement;
    customApiInput?.addEventListener('change', () => {
        storage.set('custom-api-url', customApiInput.value);
        state.customApiUrl = customApiInput.value;
        setPreferredApi(state.preferredApi, customApiInput.value);
    });
    sectionContent.appendChild(customApiRow);
    
    sectionContent.appendChild(createNativeToggle(
        'slt-settings.auto-translate',
        'Auto-Translate on Song Change',
        storage.get('auto-translate') === 'true',
        (checked) => {
            storage.set('auto-translate', String(checked));
            state.autoTranslate = checked;
        }
    ));
    
    sectionContent.appendChild(createNativeToggle(
        'slt-settings.show-notifications',
        'Show Notifications',
        storage.get('show-notifications') !== 'false',
        (checked) => {
            storage.set('show-notifications', String(checked));
            state.showNotifications = checked;
        }
    ));
    
    sectionContent.appendChild(createNativeToggle(
        'slt-settings.debug-mode',
        'Debug Mode (Console Logging)',
        storage.get('debug-mode') === 'true',
        (checked) => {
            setDebugMode(checked);
        }
    ));
    
    sectionContent.appendChild(createNativeButton(
        'slt-settings.view-cache',
        'View Translation Cache',
        'View Cache',
        () => openCacheViewer()
    ));

    sectionContent.appendChild(createNativeButton(
        'slt-settings.clear-cache',
        'Clear All Cached Translations',
        'Clear Cache',
        () => {
            clearAllTrackCache();
            clearTranslationCache();
            if (state.showNotifications && Spicetify.showNotification) {
                Spicetify.showNotification('All cached translations deleted!');
            }
        }
    ));
    
    sectionContent.appendChild(createNativeButton(
        'slt-settings.check-updates',
        `Version ${VERSION}`,
        'Check for Updates',
        async () => {
            const btn = document.getElementById('slt-settings.check-updates') as HTMLButtonElement;
            if (btn) {
                btn.textContent = 'Checking...';
                btn.disabled = true;
            }
            
            try {
                const updateInfo = await getUpdateInfo();
                if (updateInfo?.hasUpdate) {
                    checkForUpdates(true);
                } else {
                    if (btn) btn.textContent = 'Up to date!';
                    setTimeout(() => {
                        if (btn) {
                            btn.textContent = 'Check for Updates';
                            btn.disabled = false;
                        }
                    }, 2000);
                    if (Spicetify.showNotification) {
                        Spicetify.showNotification('You are running the latest version!');
                    }
                }
            } catch (e) {
                if (btn) {
                    btn.textContent = 'Check for Updates';
                    btn.disabled = false;
                }
                if (Spicetify.showNotification) {
                    Spicetify.showNotification('Failed to check for updates', true);
                }
            }
        }
    ));
    
    const githubRow = document.createElement('div');
    githubRow.className = 'x-settings-row';
    githubRow.innerHTML = `
        <div class="x-settings-firstColumn">
            <label class="e-91000-text encore-text-body-small encore-internal-color-text-subdued">GitHub Repository</label>
        </div>
        <div class="x-settings-secondColumn">
            <a href="${REPO_URL}" target="_blank" class="Button-sc-y0gtbx-0 Button-buttonSecondary-small-iconTrailing-useBrowserDefaultFocusStyle encore-text-body-small-bold e-91000-button--small e-91000-button--trailing" data-encore-id="buttonSecondary">View<span aria-hidden="true" class="e-91000-button__icon-wrapper"><svg data-encore-id="icon" role="img" aria-hidden="true" class="e-91000-icon e-91000-baseline" viewBox="0 0 16 16" style="--encore-icon-height: var(--encore-graphic-size-decorative-smaller); --encore-icon-width: var(--encore-graphic-size-decorative-smaller);"><path d="M1 2.75A.75.75 0 0 1 1.75 2H7v1.5H2.5v11h10.219V9h1.5v6.25a.75.75 0 0 1-.75.75H1.75a.75.75 0 0 1-.75-.75z"></path><path d="M15 1v4.993a.75.75 0 1 1-1.5 0V3.56L8.78 8.28a.75.75 0 0 1-1.06-1.06l4.72-4.72h-2.433a.75.75 0 0 1 0-1.5z"></path></svg></span></a>
        </div>
    `;
    sectionContent.appendChild(githubRow);
    
    const shortcutRow = document.createElement('div');
    shortcutRow.className = 'x-settings-row';
    shortcutRow.innerHTML = `
        <div class="x-settings-firstColumn">
            <span class="e-91000-text encore-text-marginal encore-internal-color-text-subdued">Keyboard shortcut: Alt+T to toggle translation</span>
        </div>
    `;
    sectionContent.appendChild(shortcutRow);
    
    return section;
}

function injectSettingsIntoPage(): void {
    if (document.getElementById(SETTINGS_ID)) {
        return;
    }
    
    const settingsContainer = document.querySelector('.x-settings-container') || 
                              document.querySelector('[data-testid="settings-page"]') ||
                              document.querySelector('main.x-settings-container');
    if (!settingsContainer) {
        debug('Settings container not found');
        return;
    }
    
    debug('Found settings container, injecting settings...');
    
    const settingsSection = createNativeSettingsSection();
    
    const spicyLyricsSettings = document.getElementById('spicy-lyrics-settings');
    const spicyLyricsDevSettings = document.getElementById('spicy-lyrics-dev-settings');
    
    if (spicyLyricsDevSettings) {
        spicyLyricsDevSettings.after(settingsSection);
        debug('Settings injected after spicy-lyrics-dev-settings');
    } else if (spicyLyricsSettings) {
        spicyLyricsSettings.after(settingsSection);
        debug('Settings injected after spicy-lyrics-settings');
    } else {
        const allSections = settingsContainer.querySelectorAll('.x-settings-section');
        if (allSections.length > 0) {
            const lastSection = allSections[allSections.length - 1];
            const lastSectionParent = lastSection.closest('div:not(.x-settings-section):not(.x-settings-container)') || lastSection;
            lastSectionParent.after(settingsSection);
            debug('Settings injected after last settings section');
        } else {
            settingsContainer.appendChild(settingsSection);
            debug('Settings appended to settings container');
        }
    }
    
    debug('Settings injected into Spotify settings page');
}

function isOnSettingsPage(): boolean {
    const hasSettingsContainer = !!document.querySelector('.x-settings-container');
    const hasSettingsTestId = !!document.querySelector('[data-testid="settings-page"]');
    const pathCheck = window.location.pathname.includes('preferences') || 
                      window.location.pathname.includes('settings') ||
                      window.location.href.includes('preferences') ||
                      window.location.href.includes('settings');
    
    let historyCheck = false;
    try {
        const location = Spicetify.Platform?.History?.location;
        if (location) {
            historyCheck = location.pathname?.includes('preferences') || 
                          location.pathname?.includes('settings') ||
                          false;
        }
    } catch (e) {

    }
    
    return hasSettingsContainer || hasSettingsTestId || pathCheck || historyCheck;
}

function watchForSettingsPage(): void {
    debug('Starting settings page watcher...');
    
    if (isOnSettingsPage()) {
        debug('Already on settings page, injecting...');
        setTimeout(injectSettingsIntoPage, 100);
        setTimeout(injectSettingsIntoPage, 500);
    }
    
    if (Spicetify.Platform?.History) {
        Spicetify.Platform.History.listen((location: any) => {
            debug('Navigation detected:', location?.pathname);
            if (location?.pathname?.includes('preferences') || location?.pathname?.includes('settings')) {
                setTimeout(injectSettingsIntoPage, 100);
                setTimeout(injectSettingsIntoPage, 300);
                setTimeout(injectSettingsIntoPage, 500);
                setTimeout(injectSettingsIntoPage, 1000);
            }
        });
    }
    
    const observer = new MutationObserver((mutations) => {
        const settingsContainer = document.querySelector('.x-settings-container') || 
                                  document.querySelector('[data-testid="settings-page"]');
        if (settingsContainer && !document.getElementById(SETTINGS_ID)) {
            debug('Settings container detected via MutationObserver');
            injectSettingsIntoPage();
        }
        
        const ourSettings = document.getElementById(SETTINGS_ID);
        const spicyLyricsDevSettings = document.getElementById('spicy-lyrics-dev-settings');
        if (ourSettings && spicyLyricsDevSettings && ourSettings.previousElementSibling !== spicyLyricsDevSettings) {
            spicyLyricsDevSettings.after(ourSettings);
            debug('Repositioned settings after spicy-lyrics-dev-settings');
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function createSettingsUI(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'slt-settings-container';
    container.innerHTML = `
        <style>
            .slt-settings-container {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .slt-setting-row {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .slt-setting-row label {
                font-size: 14px;
                font-weight: 500;
                color: var(--spice-text);
            }
            .slt-setting-row select,
            .slt-setting-row input[type="text"] {
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid var(--spice-button-disabled);
                background: var(--spice-card);
                color: var(--spice-text);
                font-size: 14px;
            }
            .slt-setting-row select:focus,
            .slt-setting-row input[type="text"]:focus {
                outline: none;
                border-color: var(--spice-button);
            }
            .slt-toggle-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .slt-toggle {
                position: relative;
                width: 40px;
                height: 20px;
            }
            .slt-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .slt-toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--spice-button-disabled);
                transition: .3s;
                border-radius: 20px;
            }
            .slt-toggle-slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                transition: .3s;
                border-radius: 50%;
            }
            .slt-toggle input:checked + .slt-toggle-slider {
                background-color: var(--spice-button);
            }
            .slt-toggle input:checked + .slt-toggle-slider:before {
                transform: translateX(20px);
            }
            .slt-button {
                padding: 10px 20px;
                border-radius: 500px;
                border: none;
                background: var(--spice-button);
                color: var(--spice-text);
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.1s, background 0.2s;
            }
            .slt-button:hover {
                transform: scale(1.02);
                background: var(--spice-button-active);
            }
            .slt-button:active {
                transform: scale(0.98);
            }
            .slt-description {
                font-size: 12px;
                color: var(--spice-subtext);
                margin-top: -4px;
            }
        </style>
        
        <div class="slt-setting-row">
            <label for="slt-target-language">Target Language</label>
            <select id="slt-target-language">
                ${SUPPORTED_LANGUAGES.map(l => 
                    `<option value="${l.code}" ${l.code === (storage.get('target-language') || 'en') ? 'selected' : ''}>${l.name}</option>`
                ).join('')}
            </select>
        </div>
        
        <div class="slt-setting-row">
            <label for="slt-overlay-mode">Translation Display</label>
            <select id="slt-overlay-mode">
                <option value="replace" ${(storage.get('overlay-mode') || 'replace') === 'replace' ? 'selected' : ''}>Replace (default)</option>
                <option value="interleaved" ${storage.get('overlay-mode') === 'interleaved' ? 'selected' : ''}>Below each line</option>
            </select>
            <span class="slt-description">How translated lyrics are displayed</span>
        </div>
        
        <div class="slt-setting-row">
            <label for="slt-preferred-api">Translation API</label>
            <select id="slt-preferred-api">
                <option value="google" ${(storage.get('preferred-api') || 'google') === 'google' ? 'selected' : ''}>Google Translate</option>
                <option value="libretranslate" ${storage.get('preferred-api') === 'libretranslate' ? 'selected' : ''}>LibreTranslate</option>
                <option value="custom" ${storage.get('preferred-api') === 'custom' ? 'selected' : ''}>Custom API</option>
            </select>
        </div>
        
        <div class="slt-setting-row" id="slt-custom-api-row" style="display: ${storage.get('preferred-api') === 'custom' ? 'flex' : 'none'}">
            <label for="slt-custom-api-url">Custom API URL</label>
            <input type="text" id="slt-custom-api-url" value="${storage.get('custom-api-url') || ''}" placeholder="https://your-api.com/translate">
            <span class="slt-description">LibreTranslate-compatible API endpoint</span>
        </div>
        
        <div class="slt-setting-row slt-toggle-row">
            <label for="slt-auto-translate">Auto-Translate on Song Change</label>
            <label class="slt-toggle">
                <input type="checkbox" id="slt-auto-translate" ${storage.get('auto-translate') === 'true' ? 'checked' : ''}>
                <span class="slt-toggle-slider"></span>
            </label>
        </div>
        
        <div class="slt-setting-row slt-toggle-row">
            <label for="slt-show-notifications">Show Notifications</label>
            <label class="slt-toggle">
                <input type="checkbox" id="slt-show-notifications" ${storage.get('show-notifications') !== 'false' ? 'checked' : ''}>
                <span class="slt-toggle-slider"></span>
            </label>
        </div>
        
        <div class="slt-setting-row slt-toggle-row">
            <label for="slt-debug-mode">Debug Mode (Console Logging)</label>
            <label class="slt-toggle">
                <input type="checkbox" id="slt-debug-mode" ${storage.get('debug-mode') === 'true' ? 'checked' : ''}>
                <span class="slt-toggle-slider"></span>
            </label>
        </div>
        
        <div class="slt-setting-row">
            <button class="slt-button" id="slt-view-cache">View Translation Cache</button>
        </div>
        
        <div class="slt-setting-row" style="flex-direction: row; justify-content: space-between; align-items: center;">
            <div>
                <span style="font-size: 13px; color: var(--spice-subtext);">Version ${VERSION}</span>
                <span style="margin: 0 8px; color: var(--spice-subtext);">•</span>
                <a href="${REPO_URL}" target="_blank" style="font-size: 13px; color: var(--spice-button);">GitHub</a>
            </div>
            <button class="slt-button" id="slt-check-updates" style="padding: 8px 16px; font-size: 12px;">Check for Updates</button>
        </div>
        
        <div class="slt-setting-row" style="padding-top: 0; opacity: 0.6;">
            <span class="slt-description">Keyboard shortcut: Alt+T to toggle translation</span>
        </div>
    `;
    
    setTimeout(() => {
        const targetLangSelect = container.querySelector('#slt-target-language') as HTMLSelectElement;
        const overlayModeSelect = container.querySelector('#slt-overlay-mode') as HTMLSelectElement;
        const preferredApiSelect = container.querySelector('#slt-preferred-api') as HTMLSelectElement;
        const customApiUrlInput = container.querySelector('#slt-custom-api-url') as HTMLInputElement;
        const customApiRow = container.querySelector('#slt-custom-api-row') as HTMLElement;
        const autoTranslateCheckbox = container.querySelector('#slt-auto-translate') as HTMLInputElement;
        const showNotificationsCheckbox = container.querySelector('#slt-show-notifications') as HTMLInputElement;
        const debugModeCheckbox = container.querySelector('#slt-debug-mode') as HTMLInputElement;
        const viewCacheButton = container.querySelector('#slt-view-cache') as HTMLButtonElement;
        const checkUpdatesButton = container.querySelector('#slt-check-updates') as HTMLButtonElement;
        
        targetLangSelect?.addEventListener('change', () => {
            storage.set('target-language', targetLangSelect.value);
            state.targetLanguage = targetLangSelect.value;
        });
        
        overlayModeSelect?.addEventListener('change', () => {
            const mode = overlayModeSelect.value as OverlayMode;
            storage.set('overlay-mode', mode);
            state.overlayMode = mode;
            reapplyTranslations();
        });
        
        preferredApiSelect?.addEventListener('change', () => {
            const api = preferredApiSelect.value as 'google' | 'libretranslate' | 'custom';
            storage.set('preferred-api', api);
            state.preferredApi = api;
            setPreferredApi(api, customApiUrlInput?.value || '');
            
            if (customApiRow) {
                customApiRow.style.display = api === 'custom' ? 'flex' : 'none';
            }
        });
        
        customApiUrlInput?.addEventListener('change', () => {
            storage.set('custom-api-url', customApiUrlInput.value);
            state.customApiUrl = customApiUrlInput.value;
            setPreferredApi(state.preferredApi, customApiUrlInput.value);
        });
        
        autoTranslateCheckbox?.addEventListener('change', () => {
            storage.set('auto-translate', String(autoTranslateCheckbox.checked));
            state.autoTranslate = autoTranslateCheckbox.checked;
        });
        
        showNotificationsCheckbox?.addEventListener('change', () => {
            storage.set('show-notifications', String(showNotificationsCheckbox.checked));
            state.showNotifications = showNotificationsCheckbox.checked;
        });
        
        debugModeCheckbox?.addEventListener('change', () => {
            setDebugMode(debugModeCheckbox.checked);
        });
        
        viewCacheButton?.addEventListener('click', () => {
            Spicetify.PopupModal?.hide();
            setTimeout(() => openCacheViewer(), 150);
        });
        
        checkUpdatesButton?.addEventListener('click', async () => {
            checkUpdatesButton.textContent = 'Checking...';
            checkUpdatesButton.disabled = true;
            
            try {
                const updateInfo = await getUpdateInfo();
                if (updateInfo?.hasUpdate) {
                    Spicetify.PopupModal?.hide();
                    setTimeout(() => checkForUpdates(true), 150);
                } else {
                    checkUpdatesButton.textContent = 'Up to date!';
                    setTimeout(() => {
                        checkUpdatesButton.textContent = 'Check for Updates';
                        checkUpdatesButton.disabled = false;
                    }, 2000);
                    if (Spicetify.showNotification) {
                        Spicetify.showNotification('You are running the latest version!');
                    }
                }
            } catch (e) {
                checkUpdatesButton.textContent = 'Check for Updates';
                checkUpdatesButton.disabled = false;
                if (Spicetify.showNotification) {
                    Spicetify.showNotification('Failed to check for updates', true);
                }
            }
        });
    }, 0);
    
    return container;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function createCacheViewerUI(): HTMLElement {
    const stats = getTrackCacheStats();
    const cachedTracks = getAllCachedTracks();
    
    const container = document.createElement('div');
    container.className = 'slt-cache-viewer';
    container.innerHTML = `
        <style>
            .slt-cache-viewer {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                max-height: 60vh;
            }
            .slt-cache-stats {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                padding: 12px;
                background: var(--spice-card);
                border-radius: 8px;
            }
            .slt-stat {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .slt-stat-label {
                font-size: 11px;
                color: var(--spice-subtext);
                text-transform: uppercase;
            }
            .slt-stat-value {
                font-size: 18px;
                font-weight: 600;
                color: var(--spice-text);
            }
            .slt-cache-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                overflow-y: auto;
                max-height: 300px;
                padding-right: 8px;
            }
            .slt-cache-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 12px;
                background: var(--spice-card);
                border-radius: 6px;
                gap: 12px;
            }
            .slt-cache-item-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
                flex: 1;
                min-width: 0;
            }
            .slt-cache-item-title {
                font-size: 13px;
                font-weight: 500;
                color: var(--spice-text);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .slt-cache-item-artist {
                font-size: 12px;
                color: var(--spice-subtext);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .slt-cache-item-meta {
                font-size: 11px;
                color: var(--spice-subtext);
                opacity: 0.7;
            }
            .slt-cache-delete {
                padding: 6px 10px;
                border-radius: 4px;
                border: none;
                background: rgba(255, 80, 80, 0.2);
                color: #ff5050;
                font-size: 12px;
                cursor: pointer;
                transition: background 0.2s;
                flex-shrink: 0;
            }
            .slt-cache-delete:hover {
                background: rgba(255, 80, 80, 0.4);
            }
            .slt-cache-delete-all {
                padding: 10px 20px;
                border-radius: 500px;
                border: none;
                background: rgba(255, 80, 80, 0.2);
                color: #ff5050;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }
            .slt-cache-delete-all:hover {
                background: rgba(255, 80, 80, 0.4);
            }
            .slt-empty-cache {
                text-align: center;
                padding: 24px;
                color: var(--spice-subtext);
                font-size: 14px;
            }
            .slt-cache-actions {
                display: flex;
                justify-content: center;
                padding-top: 8px;
            }
        </style>
        
        <div class="slt-cache-stats">
            <div class="slt-stat">
                <span class="slt-stat-label">Cached Tracks</span>
                <span class="slt-stat-value" id="slt-stat-tracks">${stats.trackCount}</span>
            </div>
            <div class="slt-stat">
                <span class="slt-stat-label">Total Lines</span>
                <span class="slt-stat-value" id="slt-stat-lines">${stats.totalLines}</span>
            </div>
            <div class="slt-stat">
                <span class="slt-stat-label">Cache Size</span>
                <span class="slt-stat-value" id="slt-stat-size">${formatBytes(stats.sizeBytes)}</span>
            </div>
            <div class="slt-stat">
                <span class="slt-stat-label">Oldest Entry</span>
                <span class="slt-stat-value">${stats.oldestTimestamp ? formatDate(stats.oldestTimestamp) : 'N/A'}</span>
            </div>
        </div>
        
        <div class="slt-cache-list" id="slt-cache-list">
            ${cachedTracks.length === 0 ? 
                '<div class="slt-empty-cache">No cached translations</div>' :
                cachedTracks
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((track, index) => {
                        const trackId = track.trackUri.replace('spotify:track:', '');
                        return `
                        <div class="slt-cache-item" data-uri="${track.trackUri}" data-lang="${track.targetLang}">
                            <div class="slt-cache-item-info">
                                <span class="slt-cache-item-title">Track ID: ${trackId}</span>
                                <span class="slt-cache-item-meta">${track.sourceLang} → ${track.targetLang} · ${track.lineCount} lines · ${formatDate(track.timestamp)}</span>
                            </div>
                            <button class="slt-cache-delete" data-index="${index}">Delete</button>
                        </div>
                    `}).join('')
            }
        </div>
        
        ${cachedTracks.length > 0 ? `
        <div class="slt-cache-actions">
            <button class="slt-cache-delete-all" id="slt-delete-all-cache">Delete All Cached Translations</button>
        </div>
        ` : ''}
    `;
    
    setTimeout(() => {
        container.querySelectorAll('.slt-cache-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = (e.target as HTMLElement).closest('.slt-cache-item') as HTMLElement;
                if (item) {
                    const uri = item.dataset.uri;
                    const lang = item.dataset.lang;
                    if (uri) {
                        deleteTrackCache(uri, lang);
                        item.remove();
                        
                        const newStats = getTrackCacheStats();
                        const tracksEl = container.querySelector('#slt-stat-tracks');
                        const linesEl = container.querySelector('#slt-stat-lines');
                        const sizeEl = container.querySelector('#slt-stat-size');
                        if (tracksEl) tracksEl.textContent = String(newStats.trackCount);
                        if (linesEl) linesEl.textContent = String(newStats.totalLines);
                        if (sizeEl) sizeEl.textContent = formatBytes(newStats.sizeBytes);
                        
                        const list = container.querySelector('#slt-cache-list');
                        if (list && list.querySelectorAll('.slt-cache-item').length === 0) {
                            list.innerHTML = '<div class="slt-empty-cache">No cached translations</div>';
                            const actionsDiv = container.querySelector('.slt-cache-actions');
                            if (actionsDiv) actionsDiv.remove();
                        }
                    }
                }
            });
        });
        
        const deleteAllBtn = container.querySelector('#slt-delete-all-cache');
        deleteAllBtn?.addEventListener('click', () => {
            clearAllTrackCache();
            clearTranslationCache();
            
            const tracksEl = container.querySelector('#slt-stat-tracks');
            const linesEl = container.querySelector('#slt-stat-lines');
            const sizeEl = container.querySelector('#slt-stat-size');
            if (tracksEl) tracksEl.textContent = '0';
            if (linesEl) linesEl.textContent = '0';
            if (sizeEl) sizeEl.textContent = '0 B';
            
            const list = container.querySelector('#slt-cache-list');
            if (list) list.innerHTML = '<div class="slt-empty-cache">No cached translations</div>';
            
            const actionsDiv = container.querySelector('.slt-cache-actions');
            if (actionsDiv) actionsDiv.remove();
            
            if (state.showNotifications && Spicetify.showNotification) {
                Spicetify.showNotification('All cached translations deleted!');
            }
        });
    }, 0);
    
    return container;
}

function openCacheViewer(): void {
    if (Spicetify.PopupModal) {
        Spicetify.PopupModal.display({
            title: 'Translation Cache',
            content: createCacheViewerUI(),
            isLarge: true
        });
    }
}

export function openSettingsModal(): void {
    if (Spicetify.PopupModal) {
        Spicetify.PopupModal.display({
            title: 'Spicy Lyric Translater Settings',
            content: createSettingsUI(),
            isLarge: false
        });
    }
}

export async function registerSettings(): Promise<void> {
    while (typeof Spicetify === 'undefined' || !Spicetify.Platform) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    watchForSettingsPage();

    if (Spicetify.Platform?.History) {
        const registerMenuItem = () => {
            if ((Spicetify as any).Menu) {
                try {
                    new (Spicetify as any).Menu.Item(
                        'Spicy Lyric Translater',
                        false,
                        openSettingsModal
                    ).register();
                    info('Settings menu item registered');
                    return true;
                } catch (e) {
                    debug('Menu.Item not available:', e);
                }
            }
            return false;
        };
        
        if (!registerMenuItem()) {
            setTimeout(registerMenuItem, 2000);
        }
    }

    debug('Settings registration complete');
}

export default registerSettings;
