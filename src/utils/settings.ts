import { storage } from './storage';
import { SUPPORTED_LANGUAGES, clearTranslationCache, setPreferredApi } from './translator';
import { debug } from './debug';

declare const require: any;

export async function registerSettings(): Promise<void> {
    while (typeof Spicetify === 'undefined' || !Spicetify.Platform) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
        const spcrSettings = typeof require !== 'undefined' ? require('spcr-settings') : null;
        const SettingsSection = spcrSettings?.SettingsSection;
        
        if (SettingsSection) {
            const settings = new SettingsSection('Spicy Lyric Translater', 'spicy-lyric-translater-settings');
            
            const languageNames = SUPPORTED_LANGUAGES.map(l => l.name);
            const currentLangIndex = SUPPORTED_LANGUAGES.findIndex(
                l => l.code === (storage.get('target-language') || 'en')
            );
            
            settings.addDropDown(
                'target-language',
                'Target Language',
                languageNames,
                currentLangIndex >= 0 ? currentLangIndex : 0,
                () => {
                    const selectedName = settings.getFieldValue('target-language');
                    const lang = SUPPORTED_LANGUAGES.find(l => l.name === selectedName);
                    if (lang) {
                        storage.set('target-language', lang.code);
                    }
                }
            );
            
            const apiOptions = ['Google Translate', 'LibreTranslate', 'Custom API'];
            const currentApiIndex = (() => {
                const api = storage.get('preferred-api') || 'google';
                switch (api) {
                    case 'libretranslate': return 1;
                    case 'custom': return 2;
                    default: return 0;
                }
            })();
            
            settings.addDropDown(
                'preferred-api',
                'Preferred Translation API',
                apiOptions,
                currentApiIndex,
                () => {
                    const selectedIndex = settings.getFieldValue('preferred-api');
                    const apis = ['google', 'libretranslate', 'custom'];
                    const api = apis[selectedIndex] || 'google';
                    storage.set('preferred-api', api);
                    setPreferredApi(api as 'google' | 'libretranslate' | 'custom', storage.get('custom-api-url') || '');
                }
            );
            
            settings.addInput(
                'custom-api-url',
                'Custom API URL',
                storage.get('custom-api-url') || '',
                () => {
                    const url = settings.getFieldValue('custom-api-url');
                    storage.set('custom-api-url', url);
                    setPreferredApi(
                        (storage.get('preferred-api') as 'google' | 'libretranslate' | 'custom') || 'google',
                        url
                    );
                }
            );
            
            settings.addToggle(
                'auto-translate',
                'Auto-Translate on Song Change',
                storage.get('auto-translate') === 'true',
                () => {
                    const value = settings.getFieldValue('auto-translate');
                    storage.set('auto-translate', String(value));
                }
            );
            
            settings.addToggle(
                'show-notifications',
                'Show Notifications',
                storage.get('show-notifications') !== 'false',
                () => {
                    const value = settings.getFieldValue('show-notifications');
                    storage.set('show-notifications', String(value));
                }
            );
            
            settings.addButton(
                'clear-cache',
                'Clear Translation Cache',
                'Clear Cache',
                () => {
                    clearTranslationCache();
                    const showNotifications = storage.get('show-notifications') !== 'false';
                    if (showNotifications && Spicetify.showNotification) {
                        Spicetify.showNotification('Translation cache cleared!');
                    }
                }
            );
            
            settings.pushSettings();
            debug('Settings registered successfully');
        }
    } catch (e) {
        debug('Using built-in settings modal (spcr-settings not available)');
    }
}

export default registerSettings;
