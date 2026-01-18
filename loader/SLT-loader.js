/**
 * Spicy Lyric Translater - Loader
 * This is the entrypoint that users install via Spicetify.
 * It dynamically loads the actual extension from the CDN, enabling automatic updates.
 * 
 * @author 7xeh
 */
(async function() {
    const API_HOST = "7xeh.dev";
    const EXTENSION_BASE_URL = "https://7xeh.dev/apps/spicylyrictranslate/releases";
    
    /**
     * Fetch the current version from the API
     */
    const getVersion = async () => {
        const response = await fetch(`https://${API_HOST}/apps/spicylyrictranslate/api/version.php?action=version&_=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch version');
        const data = await response.json();
        return data.version;
    };

    /**
     * Load the extension module from CDN
     */
    const loadExtension = async (version) => {
        // Store metadata for the extension to read
        window._spicy_lyric_translater_metadata = { 
            LoadedVersion: version,
            LoadedAt: Date.now(),
            IsLoader: true
        };
        
        // Import the extension as a module
        const url = `${EXTENSION_BASE_URL}/v${version}/spicy-lyric-translater.js?_=${Date.now()}`;
        
        // For non-module scripts, we need to fetch and eval
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load extension: ${response.status}`);
        
        const code = await response.text();
        
        // Execute the extension code
        const script = document.createElement('script');
        script.textContent = code;
        document.head.appendChild(script);
        
        console.log(`[SpicyLyricTranslater] Loaded version ${version}`);
    };

    /**
     * Show error modal
     */
    const showError = (message) => {
        // Wait for Spicetify to be available
        const waitForSpicetify = setInterval(() => {
            if (typeof Spicetify !== 'undefined' && Spicetify.PopupModal) {
                clearInterval(waitForSpicetify);
                Spicetify.PopupModal.display({
                    title: "Spicy Lyric Translater - Error",
                    content: `
                        <div style="text-align: center; padding: 16px 0;">
                            <h3 style="margin: 0 0 12px; font-size: 1.2rem; font-weight: 600;">
                                Failed to load extension
                            </h3>
                            <p style="margin: 0 0 16px; opacity: 0.7;">
                                ${message}
                            </p>
                            <p style="margin: 0 0 8px;">
                                Please check your network connection and try restarting Spotify.
                            </p>
                            <p style="margin: 16px 0 0; font-size: 0.9rem; opacity: 0.7;">
                                Need help? Visit 
                                <a href="https://github.com/7xeh/SpicyLyricTranslate/issues" style="text-decoration: underline;">GitHub Issues</a>
                            </p>
                        </div>
                    `,
                    isLarge: false
                });
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => clearInterval(waitForSpicetify), 10000);
    };

    /**
     * Main loader logic with retries
     */
    const load = async (retries = 3) => {
        // Wait for Spicetify to be ready
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (
                    typeof Spicetify !== 'undefined' &&
                    Spicetify.Platform &&
                    Spicetify.PopupModal
                ) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });

        let lastError;
        
        for (let i = 0; i < retries; i++) {
            try {
                const version = await getVersion();
                await loadExtension(version);
                return; // Success!
            } catch (err) {
                lastError = err;
                console.warn(`[SpicyLyricTranslater] Load attempt ${i + 1} failed:`, err);
                
                if (i < retries - 1) {
                    // Wait before retry
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }

        // All retries failed
        console.error('[SpicyLyricTranslater] Failed to load after all retries:', lastError);
        showError(lastError?.message || 'Unknown error');
    };

    // Start loading
    load();
})();
