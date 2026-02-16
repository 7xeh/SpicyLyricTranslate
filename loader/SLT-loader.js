(async function() {
    const API_HOST = "7xeh.dev";
    const EXTENSION_BASE_URL = "https://7xeh.dev/apps/spicylyrictranslate/releases";
    const DEBUG_MODE = localStorage.getItem('spicy-lyric-translater:debug-mode') === 'true';
    
    const log = {
        debug: (...args) => DEBUG_MODE && console.log('[SLT-Loader]', ...args),
        info: (...args) => console.log('[SLT-Loader]', ...args),
        warn: (...args) => console.warn('[SLT-Loader]', ...args),
        error: (...args) => console.error('[SLT-Loader]', ...args)
    };

    const SLT_Observer = {
        _observer: null,
        _watches: new Map(),
        _watchId: 0,
        
        _init() {
            if (this._observer) return;
            
            this._observer = new MutationObserver((mutations) => {
                if (this._watches.size === 0) return;
                
                for (const [id, watch] of this._watches.entries()) {
                    try {
                        const element = watch.root.querySelector(watch.selector);
                        if (element) {
                            log.debug(`SLT_Observer: "${watch.selector}" found`);
                            watch.resolve(element);
                            this._watches.delete(id);
                        }
                    } catch (e) {
                        log.debug(`SLT_Observer: error checking "${watch.selector}"`, e);
                    }
                }
                
                if (this._watches.size === 0) {
                    this._disconnect();
                }
            });
            
            log.debug('SLT_Observer: initialized');
        },
        
        _ensureObserving() {
            if (!this._observer) this._init();
            
            const target = document.body;
            if (target && target.nodeType === Node.ELEMENT_NODE) {
                try {
                    this._observer.observe(target, {
                        childList: true,
                        subtree: true
                    });
                } catch (e) {
                    log.debug('SLT_Observer: observe error', e);
                }
            }
        },
        
        _disconnect() {
            if (this._observer) {
                this._observer.disconnect();
                log.debug('SLT_Observer: disconnected (no active watches)');
            }
        },
        
        watch(selector, timeout, root, resolve) {
            const id = ++this._watchId;
            
            this._watches.set(id, {
                selector,
                root,
                resolve,
                timeoutId: setTimeout(() => {
                    if (this._watches.has(id)) {
                        log.debug(`SLT_Observer: "${selector}" timeout after ${timeout}ms`);
                        this._watches.delete(id);
                        resolve(null);
                        
                        if (this._watches.size === 0) {
                            this._disconnect();
                        }
                    }
                }, timeout)
            });
            
            this._ensureObserving();
            return id;
        },
        
        unwatch(id) {
            const watch = this._watches.get(id);
            if (watch) {
                clearTimeout(watch.timeoutId);
                this._watches.delete(id);
                
                if (this._watches.size === 0) {
                    this._disconnect();
                }
            }
        },
        
        clear() {
            for (const [id, watch] of this._watches.entries()) {
                clearTimeout(watch.timeoutId);
            }
            this._watches.clear();
            this._disconnect();
        }
    };

    const waitForElm = (selector, timeout = 10000, root = document) => {
        return new Promise((resolve) => {
            const existing = root.querySelector(selector);
            if (existing) {
                log.debug(`waitForElm: "${selector}" found immediately`);
                return resolve(existing);
            }
            
            if (!document.body) {
                const bodyWait = setInterval(() => {
                    if (document.body) {
                        clearInterval(bodyWait);
                        SLT_Observer.watch(selector, timeout, root, resolve);
                    }
                }, 50);
                setTimeout(() => {
                    clearInterval(bodyWait);
                    resolve(null);
                }, timeout);
                return;
            }
            
            SLT_Observer.watch(selector, timeout, root, resolve);
        });
    };

    const waitForSpicetify = () => {
        return new Promise((resolve, reject) => {
            const check = () => {
                if (
                    typeof Spicetify !== 'undefined' &&
                    Spicetify.Platform &&
                    Spicetify.Player &&
                    Spicetify.Player.data
                ) {
                    log.debug('Spicetify is ready');
                    resolve();
                    return true;
                }
                return false;
            };
            
            if (check()) return;
            
            const interval = setInterval(() => {
                if (check()) {
                    clearInterval(interval);
                }
            }, 100);
            
            setTimeout(() => {
                clearInterval(interval);
                const error = new Error('Spicetify not found or not ready after 30 seconds');
                log.error('Spicetify timeout - aborting extension load', error);
                reject(error);
            }, 30000);
        });
    };

    const getCurrentTrackUri = () => {
        try {
            if (Spicetify?.Player?.data?.item?.uri) {
                return Spicetify.Player.data.item.uri;
            }
            if (Spicetify?.Player?.data?.track?.uri) {
                return Spicetify.Player.data.track.uri;
            }
        } catch (e) {
            log.debug('Could not get track URI:', e);
        }
        return null;
    };

    const getCacheKey = (targetLang) => {
        const trackUri = getCurrentTrackUri();
        if (!trackUri) return null;
        return `${trackUri}:${targetLang || 'auto'}`;
    };

    const normalizeTrackUri = (uri) => {
        if (!uri) return null;
        return uri.replace(/[^a-zA-Z0-9:]/g, '_');
    };

    const escapeHtml = (value) => {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    let _spicyLyricsAvailable = null;
    let _lastSpicyLyricsCheck = 0;
    const SPICY_LYRICS_CHECK_INTERVAL = 30000;

    const isSpicyLyricsAvailable = async () => {
        const now = Date.now();
        
        if (_spicyLyricsAvailable !== null && (now - _lastSpicyLyricsCheck) < SPICY_LYRICS_CHECK_INTERVAL) {
            return _spicyLyricsAvailable;
        }
        
        _lastSpicyLyricsCheck = now;
        
        const spicyLyricsPage = document.querySelector('#SpicyLyricsPage');
        if (spicyLyricsPage) {
            _spicyLyricsAvailable = true;
            log.debug('Spicy Lyrics: detected via DOM');
            return true;
        }
        
        const spicyLyricsExtension = document.querySelector('[data-spicy-lyrics]') ||
                                     document.querySelector('.spicy-lyrics-cinema') ||
                                     document.querySelector('.Cinema--Container');
        if (spicyLyricsExtension) {
            _spicyLyricsAvailable = true;
            log.debug('Spicy Lyrics: detected via extension markers');
            return true;
        }
        
        try {
            if (typeof Spicetify !== 'undefined' && Spicetify.Platform?.History) {
                const currentPath = Spicetify.Platform.History.location?.pathname || '';
                if (currentPath.includes('lyrics') || currentPath.includes('spicy')) {
                    _spicyLyricsAvailable = true;
                    log.debug('Spicy Lyrics: detected via route');
                    return true;
                }
            }
        } catch (e) {
            log.debug('Spicy Lyrics: route check failed', e);
        }
        
        _spicyLyricsAvailable = false;
        return false;
    };

    const waitForSpicyLyrics = async (timeout = 5000) => {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await isSpicyLyricsAvailable()) {
                return true;
            }
            await new Promise(r => setTimeout(r, 500));
        }
        
        log.debug('Spicy Lyrics: not detected within timeout');
        return false;
    };

    const resetSpicyLyricsCheck = () => {
        _spicyLyricsAvailable = null;
        _lastSpicyLyricsCheck = 0;
    };

    const getVersion = async () => {
        const response = await fetch(`https://${API_HOST}/apps/spicylyrictranslate/api/version.php?action=version&_=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch version');
        const data = await response.json();
        return data.version;
    };

    const loadExtension = async (version) => {
        window._spicy_lyric_translater_metadata = { 
            LoadedVersion: version,
            LoadedAt: Date.now(),
            IsLoader: true,
            utils: {
                waitForElm,
                getCurrentTrackUri,
                getCacheKey,
                normalizeTrackUri,
                isSpicyLyricsAvailable,
                waitForSpicyLyrics,
                resetSpicyLyricsCheck,
                observer: SLT_Observer,
                log
            }
        };
        
        const url = `${EXTENSION_BASE_URL}/v${version}/spicy-lyric-translater.js?_=${Date.now()}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load extension: ${response.status}`);
        
        const code = await response.text();
        
        const script = document.createElement('script');
        script.textContent = code;
        document.head.appendChild(script);
        
        log.info(`Loaded version ${version}`);
    };

    const showError = (message) => {
        const safeMessage = escapeHtml(message || 'Unknown error');

        waitForElm('.Root__main-view', 15000).then(() => {
            const waitForModal = setInterval(() => {
                if (typeof Spicetify !== 'undefined' && Spicetify.PopupModal) {
                    clearInterval(waitForModal);
                    Spicetify.PopupModal.display({
                        title: "Spicy Lyric Translater - Error",
                        content: `
                            <div style="text-align: center; padding: 16px 0;">
                                <h3 style="margin: 0 0 12px; font-size: 1.2rem; font-weight: 600;">
                                    Failed to load extension
                                </h3>
                                <p style="margin: 0 0 16px; opacity: 0.7;">
                                    ${safeMessage}
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
            
            setTimeout(() => clearInterval(waitForModal), 10000);
        });
    };

    const load = async (retries = 3) => {
        try {
            await waitForSpicetify();
        } catch (err) {
            log.error('Required dependency unavailable:', err);
            showError('Spicetify is not available. Please fully restart Spotify and try again.');
            return;
        }

        let lastError;
        
        for (let i = 0; i < retries; i++) {
            try {
                const version = await getVersion();
                await loadExtension(version);
                return;
            } catch (err) {
                lastError = err;
                log.warn(`Load attempt ${i + 1} failed:`, err);
                
                if (i < retries - 1) {
                    const delay = 2000 * Math.pow(1.5, i);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }

        log.error('Failed to load after all retries:', lastError);
        showError(lastError?.message || 'Unknown error');
    };

    load();
})();