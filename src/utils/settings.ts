/**
 * Settings configuration for Spicy Lyric Translater
 * Integrates with Spicetify's settings system
 */

import { storage } from './storage';
import { SUPPORTED_LANGUAGES, clearTranslationCache } from './translator';

// Dynamic import for spcr-settings (may not be available)
declare const require: any;

/**
 * Register extension settings with Spicetify
 */
export async function registerSettings(): Promise<void> {
    // Wait for Spicetify
    while (typeof Spicetify === 'undefined' || !Spicetify.Platform) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check if the spcr-settings module is available (from Spicetify Marketplace)
    try {
        // Try to dynamically require the settings module
        const spcrSettings = typeof require !== 'undefined' ? require('spcr-settings') : null;
        const SettingsSection = spcrSettings?.SettingsSection;
        
        if (SettingsSection) {
            const settings = new SettingsSection('Spicy Lyric Translater', 'spicy-lyric-translater-settings');
            
            // Target Language
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
            
            // Show Original
            settings.addToggle(
                'show-original',
                'Show Original Lyrics',
                storage.get('show-original') === 'true',
                () => {
                    storage.set('show-original', settings.getFieldValue('show-original'));
                }
            );
            
            // Auto-Translate
            settings.addToggle(
                'auto-translate',
                'Auto-Translate on Song Change',
                storage.get('auto-translate') === 'true',
                () => {
                    storage.set('auto-translate', settings.getFieldValue('auto-translate'));
                }
            );
            
            // Clear Cache Button
            settings.addButton(
                'clear-cache',
                'Clear Translation Cache',
                'Clear Cache',
                () => {
                    clearTranslationCache();
                    if (Spicetify.showNotification) {
                        Spicetify.showNotification('Translation cache cleared!');
                    }
                }
            );
            
            settings.pushSettings();
            console.log('[SpicyLyricTranslater] Settings registered successfully');
        }
    } catch (e) {
        // Settings module not available, settings will be managed through the context menu
        console.log('[SpicyLyricTranslater] Using built-in settings modal (spcr-settings not available)');
    }
}

export default registerSettings;
