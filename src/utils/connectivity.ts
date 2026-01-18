/**
 * Connection Indicator Component for Spicy Lyric Translater
 * Shows connectivity status, latency, and active user count
 * 
 * @author 7xeh
 */

import { storage } from './storage';

// API Configuration
const API_BASE = 'https://7xeh.dev/apps/spicylyrictranslate/api/connectivity.php';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const LATENCY_CHECK_INTERVAL = 10000; // 10 seconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds

// Latency thresholds (ms)
const LATENCY_THRESHOLDS = {
    GREAT: 150,
    OK: 300,
    BAD: 500,
} as const;

// Connection states
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

// Component state
interface ConnectionIndicatorState {
    state: ConnectionState;
    sessionId: string | null;
    latencyMs: number | null;
    totalUsers: number;
    activeUsers: number;
    isViewingLyrics: boolean;
    region: string;
    lastHeartbeat: number;
    isInitialized: boolean;
}

const indicatorState: ConnectionIndicatorState = {
    state: 'disconnected',
    sessionId: null,
    latencyMs: null,
    totalUsers: 0,
    activeUsers: 0,
    isViewingLyrics: false,
    region: '',
    lastHeartbeat: 0,
    isInitialized: false
};

// Timers
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let latencyInterval: ReturnType<typeof setInterval> | null = null;
let jitterInterval: ReturnType<typeof setInterval> | null = null;

// DOM elements
let containerElement: HTMLElement | null = null;

/**
 * Get latency class based on ms value
 */
function getLatencyClass(latencyMs: number): string {
    if (latencyMs <= LATENCY_THRESHOLDS.GREAT) return 'slt-ci-great';
    if (latencyMs <= LATENCY_THRESHOLDS.OK) return 'slt-ci-ok';
    if (latencyMs <= LATENCY_THRESHOLDS.BAD) return 'slt-ci-bad';
    return 'slt-ci-horrible';
}

/**
 * Get spinner SVG
 */
function getSpinnerIcon(size: number = 14): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="slt-ci-spinner">
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>`;
}

/**
 * Create the connection indicator DOM element
 * Minimalist button that expands on hover
 */
function createIndicatorElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'SLT_ConnectionIndicator';
    container.innerHTML = `
        <div class="slt-ci-button" title="Connection Status">
            <div class="slt-ci-dot"></div>
            <div class="slt-ci-expanded">
                <div class="slt-ci-stats-row">
                    <span class="slt-ci-ping">--ms</span>
                    <span class="slt-ci-divider">•</span>
                    <span class="slt-ci-users-count slt-ci-total" title="Total installed">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <span class="slt-ci-total-count">0</span>
                    </span>
                    <span class="slt-ci-divider">•</span>
                    <span class="slt-ci-users-count slt-ci-active" title="Viewing lyrics">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        <span class="slt-ci-active-count">0</span>
                    </span>
                </div>
            </div>
        </div>
    `;
    return container;
}

/**
 * Update the indicator UI based on current state
 */
function updateUI(): void {
    if (!containerElement) return;
    
    const button = containerElement.querySelector('.slt-ci-button');
    const dot = containerElement.querySelector('.slt-ci-dot');
    const pingEl = containerElement.querySelector('.slt-ci-ping');
    const totalCountEl = containerElement.querySelector('.slt-ci-total-count');
    const activeCountEl = containerElement.querySelector('.slt-ci-active-count');
    
    if (!button || !dot) return;

    // Remove all state classes
    dot.classList.remove('slt-ci-connecting', 'slt-ci-connected', 'slt-ci-error', 'slt-ci-great', 'slt-ci-ok', 'slt-ci-bad', 'slt-ci-horrible');

    switch (indicatorState.state) {
        case 'connected':
            dot.classList.add('slt-ci-connected');
            if (indicatorState.latencyMs !== null) {
                dot.classList.add(getLatencyClass(indicatorState.latencyMs));
                if (pingEl) pingEl.textContent = `${indicatorState.latencyMs}ms`;
            }
            if (totalCountEl) totalCountEl.textContent = `${indicatorState.totalUsers}`;
            if (activeCountEl) activeCountEl.textContent = `${indicatorState.activeUsers}`;
            button.setAttribute('title', `Connected • ${indicatorState.latencyMs}ms • ${indicatorState.totalUsers} installed • ${indicatorState.activeUsers} viewing`);
            break;

        case 'connecting':
        case 'reconnecting':
            dot.classList.add('slt-ci-connecting');
            if (pingEl) pingEl.textContent = '--ms';
            button.setAttribute('title', 'Connecting...');
            break;

        case 'error':
            dot.classList.add('slt-ci-error');
            if (pingEl) pingEl.textContent = 'Error';
            button.setAttribute('title', 'Connection error - retrying...');
            break;

        case 'disconnected':
        default:
            if (pingEl) pingEl.textContent = '--ms';
            button.setAttribute('title', 'Disconnected');
            break;
    }

    // Add Tippy tooltip
    if (typeof Spicetify !== 'undefined' && Spicetify.Tippy && button && !(button as any)._tippy) {
        Spicetify.Tippy(button, {
            ...Spicetify.TippyProps,
            delay: [200, 0],
            allowHTML: true,
            content: getTooltipContent(),
            onShow(instance: any) {
                instance.setContent(getTooltipContent());
            }
        });
    } else if ((button as any)?._tippy) {
        (button as any)._tippy.setContent(getTooltipContent());
    }
}

/**
 * Get tooltip content based on current state
 */
function getTooltipContent(): string {
    switch (indicatorState.state) {
        case 'connected':
            return `
                <div style="display:flex;flex-direction:column;gap:6px;padding:4px 0;font-size:12px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="width:6px;height:6px;border-radius:50%;background:#1db954;"></span>
                        <span>Connected to <b>SLT Server</b></span>
                    </div>
                    <div style="display:flex;gap:12px;color:rgba(255,255,255,0.7);">
                        <span>Ping: <b style="color:#fff">${indicatorState.latencyMs}ms</b></span>
                    </div>
                    <div style="display:flex;gap:12px;color:rgba(255,255,255,0.7);">
                        <span>Installed: <b style="color:#fff">${indicatorState.totalUsers}</b></span>
                        <span>Viewing: <b style="color:#1db954">${indicatorState.activeUsers}</b></span>
                    </div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.5);border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;margin-top:2px;">
                        No personal data collected.
                    </div>
                </div>
            `;
        case 'connecting':
        case 'reconnecting':
            return `<span style="font-size:12px;">Connecting to SLT server...</span>`;
        case 'error':
            return `<span style="font-size:12px;color:#e74c3c;">Connection error - retrying...</span>`;
        default:
            return `<span style="font-size:12px;">Disconnected</span>`;
    }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = CONNECTION_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

/**
 * Measure latency by pinging the server
 */
async function measureLatency(): Promise<number | null> {
    try {
        const startTime = performance.now();
        const response = await fetchWithTimeout(`${API_BASE}?action=ping&_=${Date.now()}`);
        
        if (!response.ok) return null;
        
        await response.json();
        const latency = Math.round(performance.now() - startTime);
        return latency;
    } catch (error) {
        console.warn('[SpicyLyricTranslater] Latency check failed:', error);
        return null;
    }
}

/**
 * Send heartbeat to server
 */
async function sendHeartbeat(): Promise<boolean> {
    try {
        const params = new URLSearchParams({
            action: 'heartbeat',
            session: indicatorState.sessionId || '',
            version: storage.get('extension-version') || '1.0.0',
            active: indicatorState.isViewingLyrics ? 'true' : 'false'
        });

        const response = await fetchWithTimeout(`${API_BASE}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            indicatorState.sessionId = data.sessionId || indicatorState.sessionId;
            indicatorState.totalUsers = data.totalUsers || 0;
            indicatorState.activeUsers = data.activeUsers || 0;
            indicatorState.region = data.region || '';
            indicatorState.lastHeartbeat = Date.now();
            
            if (indicatorState.state !== 'connected') {
                indicatorState.state = 'connected';
                updateUI();
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.warn('[SpicyLyricTranslater] Heartbeat failed:', error);
        return false;
    }
}

/**
 * Connect to the connectivity service
 */
async function connect(): Promise<boolean> {
    indicatorState.state = 'connecting';
    updateUI();

    try {
        const params = new URLSearchParams({
            action: 'connect',
            version: storage.get('extension-version') || '1.0.0'
        });

        const response = await fetchWithTimeout(`${API_BASE}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            indicatorState.sessionId = data.sessionId;
            indicatorState.totalUsers = data.totalUsers || 0;
            indicatorState.activeUsers = data.activeUsers || 0;
            indicatorState.region = data.region || '';
            indicatorState.state = 'connected';
            indicatorState.lastHeartbeat = Date.now();
            
            // Start latency measurement
            const latency = await measureLatency();
            indicatorState.latencyMs = latency;
            
            updateUI();
            console.log('[SpicyLyricTranslater] Connected to connectivity service');
            return true;
        }
        
        throw new Error('Connection failed');
    } catch (error) {
        console.warn('[SpicyLyricTranslater] Connection failed:', error);
        indicatorState.state = 'error';
        updateUI();
        
        // Retry after delay
        setTimeout(() => {
            if (indicatorState.state === 'error') {
                indicatorState.state = 'reconnecting';
                updateUI();
                connect();
            }
        }, 5000);
        
        return false;
    }
}

/**
 * Disconnect from the connectivity service
 */
async function disconnect(): Promise<void> {
    // Stop intervals
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (latencyInterval) {
        clearInterval(latencyInterval);
        latencyInterval = null;
    }
    if (jitterInterval) {
        clearInterval(jitterInterval);
        jitterInterval = null;
    }

    // Notify server
    if (indicatorState.sessionId) {
        try {
            const params = new URLSearchParams({
                action: 'disconnect',
                session: indicatorState.sessionId
            });
            await fetch(`${API_BASE}?${params}`);
        } catch (e) {
            // Ignore disconnect errors
        }
    }

    indicatorState.state = 'disconnected';
    indicatorState.sessionId = null;
    indicatorState.latencyMs = null;
    indicatorState.activeUsers = 0;
    updateUI();
}

/**
 * Apply small jitter to latency display for visual feedback
 */
function applyJitter(): void {
    if (indicatorState.latencyMs === null) return;
    
    // Add ±2ms jitter for visual feedback
    const jitter = indicatorState.latencyMs + Math.floor(Math.random() * 5 - 2);
    indicatorState.latencyMs = Math.max(1, jitter);
    
    // Only update the latency value, not the whole UI
    if (containerElement) {
        const pingEl = containerElement.querySelector('.slt-ci-ping');
        const dot = containerElement.querySelector('.slt-ci-dot');
        if (pingEl && indicatorState.latencyMs !== null) {
            pingEl.textContent = `${indicatorState.latencyMs}ms`;
        }
        if (dot && indicatorState.latencyMs !== null) {
            dot.classList.remove('slt-ci-great', 'slt-ci-ok', 'slt-ci-bad', 'slt-ci-horrible');
            dot.classList.add(getLatencyClass(indicatorState.latencyMs));
        }
    }
}

/**
 * Start periodic latency checks and heartbeats
 */
function startPeriodicChecks(): void {
    // Heartbeat every 30 seconds
    heartbeatInterval = setInterval(async () => {
        const success = await sendHeartbeat();
        if (!success && indicatorState.state === 'connected') {
            indicatorState.state = 'reconnecting';
            updateUI();
            connect();
        }
    }, HEARTBEAT_INTERVAL);

    // Latency check every 10 seconds
    latencyInterval = setInterval(async () => {
        const latency = await measureLatency();
        if (latency !== null) {
            indicatorState.latencyMs = latency;
            updateUI();
        }
    }, LATENCY_CHECK_INTERVAL);

    // Jitter removed - unnecessary visual updates causing performance overhead
    // The actual latency is updated every 10 seconds which is sufficient
}

/**
 * Get the container where the indicator should be placed
 * Places indicator in the top left title bar, always visible
 */
function getIndicatorContainer(): HTMLElement | null {
    // Primary: Root top container (always visible in top left)
    const rootTop = document.querySelector('.Root__top-container');
    if (rootTop) {
        console.log('[SpicyLyricTranslater] Found Root__top-container for connection indicator');
        return rootTop as HTMLElement;
    }

    // Alternative: Global nav bar
    const globalNav = document.querySelector('[data-testid="global-nav"]');
    if (globalNav) {
        console.log('[SpicyLyricTranslater] Found global-nav for connection indicator');
        return globalNav as HTMLElement;
    }

    // Fallback: Top bar area
    const topBar = document.querySelector('.Root__top-bar') || document.querySelector('.main-topBar-container');
    if (topBar) {
        console.log('[SpicyLyricTranslater] Found top-bar for connection indicator');
        return topBar as HTMLElement;
    }

    console.log('[SpicyLyricTranslater] No container found for connection indicator');
    return null;
}

/**
 * Wait for an element to appear in the DOM
 */
function waitForElement(selector: string, timeout: number = 10000): Promise<Element | null> {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const el = document.querySelector(selector);
            if (el) {
                obs.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Timeout fallback
        setTimeout(() => {
            observer.disconnect();
            resolve(document.querySelector(selector));
        }, timeout);
    });
}

/**
 * Append the indicator to the DOM
 */
async function appendToDOM(): Promise<boolean> {
    if (containerElement && containerElement.parentNode) {
        return true; // Already appended
    }

    // Wait for the topbar content right container (where notification bell lives)
    const topBarContentRight = await waitForElement('.main-topBar-topbarContentRight');
    if (topBarContentRight) {
        containerElement = createIndicatorElement();
        // Insert at the beginning of the container (before other buttons)
        topBarContentRight.insertBefore(containerElement, topBarContentRight.firstChild);
        console.log('[SpicyLyricTranslater] Connection indicator appended to topbar content right');
        return true;
    }

    console.log('[SpicyLyricTranslater] Could not find topbar content right container after waiting');
    return false;
}

/**
 * Remove the indicator from the DOM
 */
function removeFromDOM(): void {
    if (containerElement && containerElement.parentNode) {
        containerElement.parentNode.removeChild(containerElement);
    }
    containerElement = null;
}

/**
 * Initialize the connection indicator
 */
export async function initConnectionIndicator(): Promise<void> {
    if (indicatorState.isInitialized) return;
    
    console.log('[SpicyLyricTranslater] Initializing connection indicator...');
    
    // Create and append element (with retry/wait)
    const appended = await appendToDOM();
    if (!appended) {
        console.log('[SpicyLyricTranslater] Could not find container for connection indicator');
        return;
    }

    indicatorState.isInitialized = true;

    // Connect to service
    const connected = await connect();
    
    if (connected) {
        startPeriodicChecks();
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden, pause checks but keep connection
            if (latencyInterval) {
                clearInterval(latencyInterval);
                latencyInterval = null;
            }
            if (jitterInterval) {
                clearInterval(jitterInterval);
                jitterInterval = null;
            }
        } else {
            // Page is visible again, resume checks
            if (indicatorState.state === 'connected') {
                latencyInterval = setInterval(async () => {
                    const latency = await measureLatency();
                    if (latency !== null) {
                        indicatorState.latencyMs = latency;
                        updateUI();
                    }
                }, LATENCY_CHECK_INTERVAL);
                
                jitterInterval = setInterval(applyJitter, 1000);
                
                // Immediate latency check
                measureLatency().then(latency => {
                    if (latency !== null) {
                        indicatorState.latencyMs = latency;
                        updateUI();
                    }
                });
            }
        }
    });

    // Handle window unload
    window.addEventListener('beforeunload', () => {
        disconnect();
    });
}

/**
 * Cleanup the connection indicator
 */
export function cleanupConnectionIndicator(): void {
    disconnect();
    removeFromDOM();
    indicatorState.isInitialized = false;
}

/**
 * Get current connection state
 */
export function getConnectionState(): ConnectionIndicatorState {
    return { ...indicatorState };
}

/**
 * Force refresh connection
 */
export async function refreshConnection(): Promise<void> {
    await disconnect();
    await connect();
    if (indicatorState.state === 'connected') {
        startPeriodicChecks();
    }
}

/**
 * Set whether user is actively viewing lyrics
 * This updates the active status on the server
 */
export function setViewingLyrics(isViewing: boolean): void {
    if (indicatorState.isViewingLyrics !== isViewing) {
        indicatorState.isViewingLyrics = isViewing;
        // Send immediate heartbeat to update active status
        if (indicatorState.state === 'connected') {
            sendHeartbeat().then(() => updateUI());
        }
    }
}

export default {
    init: initConnectionIndicator,
    cleanup: cleanupConnectionIndicator,
    getState: getConnectionState,
    refresh: refreshConnection,
    setViewingLyrics: setViewingLyrics
};
