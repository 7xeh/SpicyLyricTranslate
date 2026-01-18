/**
 * Spicy Lyric Translater - Loader/Entrypoint
 * This small loader fetches the latest version from the API and dynamically loads the extension.
 * Users install this file once, and updates happen automatically on Spotify restart.
 * 
 * @author 7xeh
 */

(async function() {
    const API_HOST = "7xeh.dev";
    const EXTENSION_BASE_URL = "https://7xeh.dev/apps/spicylyrictranslate/releases";
    
    const log = {
        info: (...args) => console.log("[SpicyLyricTranslater] [Loader]", ...args),
        error: (...args) => console.error("[SpicyLyricTranslater] [Loader]", ...args),
        warn: (...args) => console.warn("[SpicyLyricTranslater] [Loader]", ...args)
    };

    const getVersionFromAPI = async () => {
        const response = await fetch(`https://${API_HOST}/apps/spicylyrictranslate/api/version.php?action=version&_=${Date.now()}`);
        if (!response.ok) throw new Error("Failed to fetch version");
        const data = await response.json();
        return data.version;
    };

    const loadExtension = async (version) => {
        // Store loaded version in metadata
        window._spicy_lyric_translater_metadata = { 
            LoadedVersion: version,
            LoadedAt: Date.now()
        };
        
        // Dynamically load the extension script
        const scriptUrl = `${EXTENSION_BASE_URL}/v${version}/spicy-lyric-translater.js?_=${Date.now()}`;
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.onload = () => {
                log.info(`Loaded version ${version}`);
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load extension from ${scriptUrl}`));
            };
            document.head.appendChild(script);
        });
    };

    const showError = (message) => {
        // Wait for Spicetify to be available
        const waitForSpicetify = setInterval(() => {
            if (typeof Spicetify !== 'undefined' && Spicetify.PopupModal) {
                clearInterval(waitForSpicetify);
                Spicetify.PopupModal.display({
                    title: "Spicy Lyric Translater",
                    content: `
                        <div style="text-align: center; padding: 16px 0;">
                            <h2 style="margin: 0 0 12px; font-size: 1.5rem; font-weight: 600;">
                                Failed to load extension
                            </h2>
                            <p style="margin: 0 0 16px; opacity: 0.7;">
                                ${message}
                            </p>
                            <p style="margin: 0 0 8px;">
                                Please check your network connection and try restarting Spotify.
                            </p>
                            <p style="margin: 16px 0 0; font-size: 0.9rem; opacity: 0.7;">
                                If the problem persists, visit 
                                <a href="https://github.com/7xeh/SpicyLyricTranslate" style="text-decoration: underline;">GitHub</a>
                            </p>
                        </div>
                    `,
                    isLarge: false
                });
            }
        }, 100);
    };

    const load = async () => {
        // Wait for Spicetify to be available
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (
                    typeof Spicetify !== 'undefined' &&
                    Spicetify.React !== undefined &&
                    Spicetify.ReactDOM !== undefined &&
                    Spicetify.Platform !== undefined
                ) {
                    clearInterval(interval);
                    resolve();
                }
            }, 50);
        });

        let version;
        let lastError;

        // Try to fetch version with retries
        for (let i = 0; i < 5; i++) {
            try {
                version = await getVersionFromAPI();
                log.info(`Fetched version: ${version}`);
                break;
            } catch (err) {
                lastError = err;
                log.warn(`Attempt ${i + 1} failed:`, err.message);
                await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
            }
        }

        if (!version) {
            log.error("Failed to fetch version after 5 attempts:", lastError);
            showError("Couldn't connect to update server after multiple attempts.");
            return;
        }

        // Try to load extension with retries
        for (let i = 0; i < 3; i++) {
            try {
                await loadExtension(version);
                return; // Success!
            } catch (err) {
                lastError = err;
                log.warn(`Load attempt ${i + 1} failed:`, err.message);
                await new Promise(r => setTimeout(r, 500));
            }
        }

        log.error("Failed to load extension after 3 attempts:", lastError);
        showError("Couldn't load the extension files.");
    };

    load();
})();
