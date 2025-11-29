"use strict";
var SpicyLyricTranslater = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/app.ts
  var app_exports = {};
  __export(app_exports, {
    default: () => app_default
  });

  // src/utils/icons.ts
  var Icons = {
    // Translate icon (globe/language icon)
    Translate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2.01h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
    </svg>`,
    // Translate off icon
    TranslateOff: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2.01h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
        <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    // Settings icon
    Settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>`,
    // Loading spinner
    Loading: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="spicy-translate-loading">
        <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
    </svg>`
  };

  // src/utils/storage.ts
  var STORAGE_PREFIX = "spicy-lyric-translater:";
  var storage = {
    get(key) {
      try {
        return localStorage.getItem(STORAGE_PREFIX + key);
      } catch (e) {
        console.error("[SpicyLyricTranslater] Storage get error:", e);
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, value);
      } catch (e) {
        console.error("[SpicyLyricTranslater] Storage set error:", e);
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(STORAGE_PREFIX + key);
      } catch (e) {
        console.error("[SpicyLyricTranslater] Storage remove error:", e);
      }
    },
    getJSON(key, defaultValue) {
      try {
        const value = this.get(key);
        if (value === null)
          return defaultValue;
        return JSON.parse(value);
      } catch (e) {
        console.error("[SpicyLyricTranslater] Storage getJSON error:", e);
        return defaultValue;
      }
    },
    setJSON(key, value) {
      try {
        this.set(key, JSON.stringify(value));
      } catch (e) {
        console.error("[SpicyLyricTranslater] Storage setJSON error:", e);
      }
    }
  };
  var storage_default = storage;

  // src/utils/translator.ts
  var CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1e3;
  var SUPPORTED_LANGUAGES = [
    { code: "af", name: "Afrikaans" },
    { code: "sq", name: "Albanian" },
    { code: "am", name: "Amharic" },
    { code: "ar", name: "Arabic" },
    { code: "hy", name: "Armenian" },
    { code: "az", name: "Azerbaijani" },
    { code: "eu", name: "Basque" },
    { code: "be", name: "Belarusian" },
    { code: "bn", name: "Bengali" },
    { code: "bs", name: "Bosnian" },
    { code: "bg", name: "Bulgarian" },
    { code: "ca", name: "Catalan" },
    { code: "ceb", name: "Cebuano" },
    { code: "zh", name: "Chinese (Simplified)" },
    { code: "zh-TW", name: "Chinese (Traditional)" },
    { code: "hr", name: "Croatian" },
    { code: "cs", name: "Czech" },
    { code: "da", name: "Danish" },
    { code: "nl", name: "Dutch" },
    { code: "en", name: "English" },
    { code: "eo", name: "Esperanto" },
    { code: "et", name: "Estonian" },
    { code: "fi", name: "Finnish" },
    { code: "fr", name: "French" },
    { code: "gl", name: "Galician" },
    { code: "ka", name: "Georgian" },
    { code: "de", name: "German" },
    { code: "el", name: "Greek" },
    { code: "gu", name: "Gujarati" },
    { code: "ht", name: "Haitian Creole" },
    { code: "ha", name: "Hausa" },
    { code: "haw", name: "Hawaiian" },
    { code: "he", name: "Hebrew" },
    { code: "hi", name: "Hindi" },
    { code: "hmn", name: "Hmong" },
    { code: "hu", name: "Hungarian" },
    { code: "is", name: "Icelandic" },
    { code: "ig", name: "Igbo" },
    { code: "id", name: "Indonesian" },
    { code: "ga", name: "Irish" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "jv", name: "Javanese" },
    { code: "kn", name: "Kannada" },
    { code: "kk", name: "Kazakh" },
    { code: "km", name: "Khmer" },
    { code: "rw", name: "Kinyarwanda" },
    { code: "ko", name: "Korean" },
    { code: "ku", name: "Kurdish" },
    { code: "ky", name: "Kyrgyz" },
    { code: "lo", name: "Lao" },
    { code: "la", name: "Latin" },
    { code: "lv", name: "Latvian" },
    { code: "lt", name: "Lithuanian" },
    { code: "lb", name: "Luxembourgish" },
    { code: "mk", name: "Macedonian" },
    { code: "mg", name: "Malagasy" },
    { code: "ms", name: "Malay" },
    { code: "ml", name: "Malayalam" },
    { code: "mt", name: "Maltese" },
    { code: "mi", name: "Maori" },
    { code: "mr", name: "Marathi" },
    { code: "mn", name: "Mongolian" },
    { code: "my", name: "Myanmar (Burmese)" },
    { code: "ne", name: "Nepali" },
    { code: "no", name: "Norwegian" },
    { code: "ny", name: "Nyanja (Chichewa)" },
    { code: "or", name: "Odia (Oriya)" },
    { code: "ps", name: "Pashto" },
    { code: "fa", name: "Persian" },
    { code: "pl", name: "Polish" },
    { code: "pt", name: "Portuguese" },
    { code: "pa", name: "Punjabi" },
    { code: "ro", name: "Romanian" },
    { code: "ru", name: "Russian" },
    { code: "sm", name: "Samoan" },
    { code: "gd", name: "Scots Gaelic" },
    { code: "sr", name: "Serbian" },
    { code: "st", name: "Sesotho" },
    { code: "sn", name: "Shona" },
    { code: "sd", name: "Sindhi" },
    { code: "si", name: "Sinhala" },
    { code: "sk", name: "Slovak" },
    { code: "sl", name: "Slovenian" },
    { code: "so", name: "Somali" },
    { code: "es", name: "Spanish" },
    { code: "su", name: "Sundanese" },
    { code: "sw", name: "Swahili" },
    { code: "sv", name: "Swedish" },
    { code: "tl", name: "Tagalog (Filipino)" },
    { code: "tg", name: "Tajik" },
    { code: "ta", name: "Tamil" },
    { code: "tt", name: "Tatar" },
    { code: "te", name: "Telugu" },
    { code: "th", name: "Thai" },
    { code: "tr", name: "Turkish" },
    { code: "tk", name: "Turkmen" },
    { code: "uk", name: "Ukrainian" },
    { code: "ur", name: "Urdu" },
    { code: "ug", name: "Uyghur" },
    { code: "uz", name: "Uzbek" },
    { code: "vi", name: "Vietnamese" },
    { code: "cy", name: "Welsh" },
    { code: "xh", name: "Xhosa" },
    { code: "yi", name: "Yiddish" },
    { code: "yo", name: "Yoruba" },
    { code: "zu", name: "Zulu" }
  ];
  function getCachedTranslation(text, targetLang) {
    const cache = storage_default.getJSON("translation-cache", {});
    const key = `${targetLang}:${text}`;
    const cached = cache[key];
    if (cached) {
      if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
        return cached.translation;
      }
    }
    return null;
  }
  function cacheTranslation(text, targetLang, translation) {
    const cache = storage_default.getJSON("translation-cache", {});
    const key = `${targetLang}:${text}`;
    cache[key] = {
      translation,
      timestamp: Date.now()
    };
    const keys = Object.keys(cache);
    if (keys.length > 1e3) {
      const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      const toRemove = sorted.slice(0, keys.length - 1e3);
      toRemove.forEach((k) => delete cache[k]);
    }
    storage_default.setJSON("translation-cache", cache);
  }
  async function translateWithGoogle(text, targetLang) {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodedText}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }
    const data = await response.json();
    const detectedLang = data[2] || "unknown";
    if (data && data[0]) {
      let translation = "";
      for (const sentence of data[0]) {
        if (sentence && sentence[0]) {
          translation += sentence[0];
        }
      }
      if (translation) {
        return { translation, detectedLang };
      }
    }
    throw new Error("Invalid response from Google Translate");
  }
  async function translateWithLibreTranslate(text, targetLang) {
    const url = "https://libretranslate.de/translate";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target: targetLang,
        format: "text"
      })
    });
    if (!response.ok) {
      throw new Error(`LibreTranslate API error: ${response.status}`);
    }
    const data = await response.json();
    return data.translatedText;
  }
  function isSameLanguage(detected, target) {
    if (!detected || detected === "unknown")
      return false;
    const normalizedDetected = detected.toLowerCase().split("-")[0];
    const normalizedTarget = target.toLowerCase().split("-")[0];
    return normalizedDetected === normalizedTarget;
  }
  async function translateText(text, targetLang) {
    const cached = getCachedTranslation(text, targetLang);
    if (cached) {
      return {
        originalText: text,
        translatedText: cached,
        targetLanguage: targetLang
      };
    }
    try {
      const result = await translateWithGoogle(text, targetLang);
      if (isSameLanguage(result.detectedLang, targetLang)) {
        cacheTranslation(text, targetLang, text);
        return {
          originalText: text,
          translatedText: text,
          detectedLanguage: result.detectedLang,
          targetLanguage: targetLang
        };
      }
      cacheTranslation(text, targetLang, result.translation);
      return {
        originalText: text,
        translatedText: result.translation,
        detectedLanguage: result.detectedLang,
        targetLanguage: targetLang
      };
    } catch (googleError) {
      console.warn("[SpicyLyricTranslater] Google Translate failed, trying fallback:", googleError);
      try {
        const translation = await translateWithLibreTranslate(text, targetLang);
        cacheTranslation(text, targetLang, translation);
        return {
          originalText: text,
          translatedText: translation,
          targetLanguage: targetLang
        };
      } catch (libreError) {
        console.error("[SpicyLyricTranslater] All translation services failed:", libreError);
        throw new Error("Translation failed. Please try again later.");
      }
    }
  }
  async function translateLyrics(lines, targetLang) {
    const results = [];
    const separator = "\n###LYRIC_LINE###\n";
    const combinedText = lines.filter((l) => l.trim()).join(separator);
    if (!combinedText.trim()) {
      return lines.map((line) => ({
        originalText: line,
        translatedText: line,
        targetLanguage: targetLang
      }));
    }
    try {
      const result = await translateText(combinedText, targetLang);
      const translatedLines = result.translatedText.split(/\n?###LYRIC_LINE###\n?/);
      let translatedIndex = 0;
      for (const line of lines) {
        if (line.trim()) {
          results.push({
            originalText: line,
            translatedText: translatedLines[translatedIndex] || line,
            targetLanguage: targetLang
          });
          translatedIndex++;
        } else {
          results.push({
            originalText: line,
            translatedText: line,
            targetLanguage: targetLang
          });
        }
      }
    } catch (error) {
      console.error("[SpicyLyricTranslater] Batch translation failed, falling back to line-by-line:", error);
      for (const line of lines) {
        if (line.trim()) {
          try {
            const result = await translateText(line, targetLang);
            results.push(result);
          } catch {
            results.push({
              originalText: line,
              translatedText: line,
              targetLanguage: targetLang
            });
          }
        } else {
          results.push({
            originalText: line,
            translatedText: line,
            targetLanguage: targetLang
          });
        }
      }
    }
    return results;
  }
  function clearTranslationCache() {
    storage_default.remove("translation-cache");
  }

  // src/styles/main.ts
  var styles = `
/* Spicy Lyric Translater Styles */

/* Translation toggle button in ViewControls */
#SpicyLyricsPage .ViewControls #TranslateToggle {
    display: flex;
    align-items: center;
    justify-content: center;
}

#SpicyLyricsPage .ViewControls #TranslateToggle.active svg {
    color: var(--spice-button-active, #1db954);
}

#SpicyLyricsPage .ViewControls #TranslateToggle:hover {
    transform: scale(1.1);
}

#SpicyLyricsPage .ViewControls #TranslateToggle svg {
    width: 16px;
    height: 16px;
}

/* Loading animation for translate button */
@keyframes spicy-translate-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.spicy-translate-loading {
    animation: spicy-translate-spin 1s linear infinite;
}

#TranslateToggle.loading svg {
    animation: spicy-translate-spin 1s linear infinite;
}

/* Translated lyrics container */
.spicy-translated-line {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.spicy-translated-line .original-text {
    opacity: 0.6;
    font-size: 0.85em;
}

.spicy-translated-line .translated-text {
    color: var(--spice-text, #fff);
}

/* When showing both original and translated */
#SpicyLyricsPage.show-both-lyrics .LyricsContent .Line {
    flex-direction: column;
    gap: 4px;
}

#SpicyLyricsPage.show-both-lyrics .LyricsContent .Line .translated-line {
    font-size: 0.9em;
    opacity: 0.8;
    color: var(--spice-subtext, #b3b3b3);
}

/* Translation indicator badge */
.spicy-translate-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--spice-button-active, #1db954);
    color: #000;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    z-index: 10;
}

/* Settings modal styles */
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
.spicy-translate-settings button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    background: var(--spice-button, #535353);
    color: var(--spice-text, #fff);
    cursor: pointer;
    font-size: 14px;
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

/* Error message styles */
.spicy-translate-error {
    color: #ff4444;
    padding: 8px;
    text-align: center;
    font-size: 12px;
}

/* Inline translation display */
.spicy-inline-translation {
    display: block;
    font-size: 0.85em;
    opacity: 0.7;
    margin-top: 4px;
    font-style: italic;
    cursor: pointer;
}

/* Hide original content when showing translation only */
.spicy-hidden-original {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
}

/* Translation replacement (when hiding original) */
.spicy-translation-replacement {
    display: inline !important;
    font-style: normal !important;
    opacity: 1 !important;
    font-size: 1em !important;
    margin-top: 0 !important;
    cursor: pointer;
}

/* Ensure translated lines maintain proper styling and are clickable */
.line.spicy-translated {
    display: flex;
    flex-direction: column;
    align-items: inherit;
    cursor: pointer;
}

.line.spicy-translated .spicy-translation-replacement {
    display: block;
    width: 100%;
}

/* Translation container is clickable */
.spicy-translation-container {
    cursor: pointer;
}

.spicy-translation-container:hover {
    opacity: 0.8;
}

/* Translation loading overlay */
.spicy-translate-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.spicy-translate-overlay .loader {
    width: 40px;
    height: 40px;
    border: 3px solid var(--spice-button, #535353);
    border-top-color: var(--spice-button-active, #1db954);
    border-radius: 50%;
    animation: spicy-translate-spin 1s linear infinite;
}
`;
  function injectStyles() {
    const existingStyle = document.getElementById("spicy-lyric-translater-styles");
    if (existingStyle) {
      return;
    }
    const styleElement = document.createElement("style");
    styleElement.id = "spicy-lyric-translater-styles";
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  // src/app.ts
  var state = {
    isEnabled: false,
    isTranslating: false,
    targetLanguage: storage.get("target-language") || "en",
    showOriginal: storage.get("show-original") === "true",
    autoTranslate: storage.get("auto-translate") === "true",
    lastTranslatedSongUri: null,
    translatedLyrics: /* @__PURE__ */ new Map()
  };
  var viewControlsObserver = null;
  var lyricsObserver = null;
  function waitForElement(selector, timeout = 1e4) {
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
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }
  function isSpicyLyricsOpen() {
    return !!document.querySelector("#SpicyLyricsPage");
  }
  function getViewControls() {
    return document.querySelector("#SpicyLyricsPage .ViewControls");
  }
  function getLyricsContent() {
    return document.querySelector("#SpicyLyricsPage .LyricsContent");
  }
  function createTranslateButton() {
    const button = document.createElement("button");
    button.id = "TranslateToggle";
    button.className = "ViewControl";
    button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    if (state.isEnabled) {
      button.classList.add("active");
    }
    if (typeof Spicetify !== "undefined" && Spicetify.Tippy) {
      try {
        Spicetify.Tippy(button, {
          ...Spicetify.TippyProps,
          content: state.isEnabled ? "Disable Translation" : "Enable Translation"
        });
      } catch (e) {
        console.warn("[SpicyLyricTranslater] Failed to create tooltip:", e);
      }
    }
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleTranslateToggle();
    });
    button.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showSettingsModal();
      return false;
    });
    return button;
  }
  function insertTranslateButton() {
    const viewControls = getViewControls();
    if (!viewControls)
      return;
    if (viewControls.querySelector("#TranslateToggle"))
      return;
    const romanizeButton = viewControls.querySelector("#RomanizationToggle");
    const translateButton = createTranslateButton();
    if (romanizeButton) {
      romanizeButton.insertAdjacentElement("afterend", translateButton);
    } else {
      const firstChild = viewControls.firstChild;
      if (firstChild) {
        viewControls.insertBefore(translateButton, firstChild);
      } else {
        viewControls.appendChild(translateButton);
      }
    }
  }
  function updateButtonState() {
    const button = document.querySelector("#TranslateToggle");
    if (!button)
      return;
    button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    button.classList.toggle("active", state.isEnabled);
    const buttonWithTippy = button;
    if (buttonWithTippy._tippy) {
      buttonWithTippy._tippy.setContent(state.isEnabled ? "Disable Translation" : "Enable Translation");
    }
  }
  async function handleTranslateToggle() {
    const button = document.querySelector("#TranslateToggle");
    if (!button || state.isTranslating) {
      return;
    }
    state.isEnabled = !state.isEnabled;
    storage.set("translation-enabled", state.isEnabled.toString());
    updateButtonState();
    if (state.isEnabled) {
      await translateCurrentLyrics();
    } else {
      removeTranslations();
    }
  }
  function getLyricsLines() {
    const lines = document.querySelectorAll("#SpicyLyricsPage .LyricsContent .line:not(.musical-line)");
    return lines;
  }
  function extractLineText(lineElement) {
    if (lineElement.classList.contains("musical-line")) {
      return "";
    }
    const wordElements = lineElement.querySelectorAll(".word:not(.dot)");
    if (wordElements.length > 0) {
      const text2 = Array.from(wordElements).map((word) => word.textContent?.trim() || "").filter((t) => t.length > 0 && t !== "\u2022").join(" ").trim();
      if (text2)
        return text2;
    }
    const syllableElements = lineElement.querySelectorAll(".syllable");
    if (syllableElements.length > 0) {
      const text2 = Array.from(syllableElements).map((syl) => syl.textContent?.trim() || "").filter((t) => t.length > 0).join("").trim();
      if (text2)
        return text2;
    }
    const text = lineElement.textContent?.trim() || "";
    if (/^[•\s]+$/.test(text)) {
      return "";
    }
    return text;
  }
  async function translateCurrentLyrics() {
    if (state.isTranslating) {
      console.log("[SpicyLyricTranslater] Already translating, skipping");
      return;
    }
    const lyricsContent = getLyricsContent();
    if (!lyricsContent) {
      console.log("[SpicyLyricTranslater] No lyrics content found");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const retryContent = getLyricsContent();
      if (!retryContent) {
        console.log("[SpicyLyricTranslater] Still no lyrics content after retry");
        return;
      }
    }
    const lines = getLyricsLines();
    if (lines.length === 0) {
      console.log("[SpicyLyricTranslater] No lyrics lines found");
      return;
    }
    state.isTranslating = true;
    const button = document.querySelector("#TranslateToggle");
    if (button) {
      button.classList.add("loading");
      button.innerHTML = Icons.Loading;
    }
    try {
      const lineTexts = [];
      lines.forEach((line) => {
        const text = extractLineText(line);
        lineTexts.push(text);
      });
      console.log("[SpicyLyricTranslater] Extracted lyrics:", lineTexts.slice(0, 3), "...");
      const nonEmptyTexts = lineTexts.filter((t) => t.trim().length > 0);
      if (nonEmptyTexts.length === 0) {
        console.log("[SpicyLyricTranslater] No non-empty lyrics found");
        state.isTranslating = false;
        return;
      }
      console.log("[SpicyLyricTranslater] Translating", nonEmptyTexts.length, "lines...");
      const translations = await translateLyrics(lineTexts, state.targetLanguage);
      console.log("[SpicyLyricTranslater] Translation complete, got", translations.length, "results");
      state.translatedLyrics.clear();
      translations.forEach((result, index) => {
        state.translatedLyrics.set(lineTexts[index], result.translatedText);
      });
      applyTranslations(lines);
      if (typeof Spicetify !== "undefined" && Spicetify.showNotification) {
        Spicetify.showNotification("Lyrics translated successfully!");
      }
    } catch (error) {
      console.error("[SpicyLyricTranslater] Translation failed:", error);
      if (typeof Spicetify !== "undefined" && Spicetify.showNotification) {
        Spicetify.showNotification("Translation failed. Please try again.", true);
      }
    } finally {
      state.isTranslating = false;
      if (button) {
        button.classList.remove("loading");
        button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
      }
    }
  }
  function applyTranslations(lines) {
    lines.forEach((line, index) => {
      const originalText = extractLineText(line);
      const translatedText = state.translatedLyrics.get(originalText);
      if (translatedText && translatedText !== originalText) {
        const existingTranslation = line.querySelector(".spicy-translation-container");
        if (existingTranslation) {
          existingTranslation.remove();
        }
        line.dataset.originalText = originalText;
        line.dataset.lineIndex = index.toString();
        if (state.showOriginal) {
          const translationSpan = document.createElement("span");
          translationSpan.className = "spicy-translation-container spicy-inline-translation";
          translationSpan.textContent = translatedText;
          translationSpan.addEventListener("click", (e) => {
            e.stopPropagation();
            seekToLine(line);
          });
          line.appendChild(translationSpan);
        } else {
          const originalElements = line.querySelectorAll(".word, .syllable");
          if (originalElements.length > 0) {
            originalElements.forEach((el) => {
              el.classList.add("spicy-hidden-original");
            });
          } else {
            const originalContent = line.innerHTML;
            if (!line.querySelector(".spicy-original-content")) {
              const wrapper = document.createElement("span");
              wrapper.className = "spicy-original-content spicy-hidden-original";
              wrapper.innerHTML = originalContent;
              line.innerHTML = "";
              line.appendChild(wrapper);
            }
          }
          const translationSpan = document.createElement("span");
          translationSpan.className = "spicy-translation-container spicy-translation-replacement";
          translationSpan.textContent = translatedText;
          translationSpan.addEventListener("click", (e) => {
            e.stopPropagation();
            seekToLine(line);
          });
          line.appendChild(translationSpan);
        }
        line.classList.add("spicy-translated");
      }
    });
  }
  function seekToLine(lineElement) {
    try {
      const visibleWord = lineElement.querySelector(".word:not(.spicy-hidden-original):not(.dot), .syllable:not(.spicy-hidden-original)");
      if (visibleWord) {
        visibleWord.click();
        return;
      }
      const hiddenWord = lineElement.querySelector(".word.spicy-hidden-original, .syllable.spicy-hidden-original");
      if (hiddenWord) {
        const el = hiddenWord;
        el.classList.remove("spicy-hidden-original");
        el.style.cssText = "position: absolute; opacity: 0; pointer-events: auto;";
        requestAnimationFrame(() => {
          el.click();
          setTimeout(() => {
            el.style.cssText = "";
            el.classList.add("spicy-hidden-original");
          }, 50);
        });
        return;
      }
      const wrappedContent = lineElement.querySelector(".spicy-original-content");
      if (wrappedContent) {
        const innerWord = wrappedContent.querySelector(".word, .syllable");
        if (innerWord) {
          const el = innerWord;
          wrappedContent.classList.remove("spicy-hidden-original");
          wrappedContent.style.cssText = "position: absolute; opacity: 0; pointer-events: auto;";
          requestAnimationFrame(() => {
            el.click();
            setTimeout(() => {
              wrappedContent.style.cssText = "";
              wrappedContent.classList.add("spicy-hidden-original");
            }, 50);
          });
          return;
        }
      }
      lineElement.click();
    } catch (error) {
      console.error("[SpicyLyricTranslater] Failed to seek:", error);
    }
  }
  function removeTranslations() {
    const translations = document.querySelectorAll(".spicy-translation-container");
    translations.forEach((el) => el.remove());
    const hiddenElements = document.querySelectorAll(".spicy-hidden-original");
    hiddenElements.forEach((el) => {
      el.classList.remove("spicy-hidden-original");
    });
    const wrappedContent = document.querySelectorAll(".spicy-original-content");
    wrappedContent.forEach((wrapper) => {
      const parent = wrapper.parentElement;
      if (parent) {
        const content = wrapper.innerHTML;
        wrapper.remove();
        if (parent.innerHTML.trim() === "") {
          parent.innerHTML = content;
        }
      }
    });
    const translatedLines = document.querySelectorAll(".spicy-translated");
    translatedLines.forEach((line) => {
      line.classList.remove("spicy-translated");
    });
    state.translatedLyrics.clear();
    const page = document.querySelector("#SpicyLyricsPage");
    if (page) {
      page.classList.remove("show-both-lyrics");
    }
  }
  function showSettingsModal() {
    if (typeof Spicetify === "undefined" || !Spicetify.PopupModal) {
      alert("Settings not available - Spicetify PopupModal not found");
      return;
    }
    const languageOptions = SUPPORTED_LANGUAGES.map((lang) => `<option value="${lang.code}" ${lang.code === state.targetLanguage ? "selected" : ""}>${lang.name}</option>`).join("");
    const content = document.createElement("div");
    content.className = "spicy-translate-settings";
    content.innerHTML = `
        <div class="setting-item">
            <div>
                <div class="setting-label">Target Language</div>
                <div class="setting-description">Select the language to translate lyrics to</div>
            </div>
            <select id="spicy-translate-lang-select">
                ${languageOptions}
            </select>
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Show Original</div>
                <div class="setting-description">Show original lyrics alongside translations</div>
            </div>
            <div class="toggle-switch ${state.showOriginal ? "active" : ""}" id="spicy-translate-show-original"></div>
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Auto-Translate</div>
                <div class="setting-description">Automatically translate lyrics when they load</div>
            </div>
            <div class="toggle-switch ${state.autoTranslate ? "active" : ""}" id="spicy-translate-auto"></div>
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Clear Cache</div>
                <div class="setting-description">Clear cached translations to free up space</div>
            </div>
            <button id="spicy-translate-clear-cache">Clear Cache</button>
        </div>
    `;
    setTimeout(() => {
      const langSelect = document.getElementById("spicy-translate-lang-select");
      const showOriginalToggle = document.getElementById("spicy-translate-show-original");
      const autoToggle = document.getElementById("spicy-translate-auto");
      const clearCacheBtn = document.getElementById("spicy-translate-clear-cache");
      if (langSelect) {
        langSelect.addEventListener("change", () => {
          state.targetLanguage = langSelect.value;
          storage.set("target-language", state.targetLanguage);
          if (state.isEnabled) {
            translateCurrentLyrics();
          }
        });
      }
      if (showOriginalToggle) {
        showOriginalToggle.addEventListener("click", () => {
          state.showOriginal = !state.showOriginal;
          storage.set("show-original", state.showOriginal.toString());
          showOriginalToggle.classList.toggle("active", state.showOriginal);
        });
      }
      if (autoToggle) {
        autoToggle.addEventListener("click", () => {
          state.autoTranslate = !state.autoTranslate;
          storage.set("auto-translate", state.autoTranslate.toString());
          autoToggle.classList.toggle("active", state.autoTranslate);
        });
      }
      if (clearCacheBtn) {
        clearCacheBtn.addEventListener("click", () => {
          clearTranslationCache();
          if (Spicetify.showNotification) {
            Spicetify.showNotification("Translation cache cleared!");
          }
        });
      }
    }, 100);
    Spicetify.PopupModal.display({
      title: "Spicy Lyric Translater Settings",
      content,
      isLarge: false
    });
  }
  function setupViewControlsObserver() {
    if (viewControlsObserver) {
      viewControlsObserver.disconnect();
    }
    viewControlsObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const viewControls2 = getViewControls();
          if (viewControls2 && !viewControls2.querySelector("#TranslateToggle")) {
            insertTranslateButton();
          }
        }
      }
    });
    const viewControls = getViewControls();
    if (viewControls) {
      viewControlsObserver.observe(viewControls, {
        childList: true,
        subtree: true
      });
    }
  }
  function setupLyricsObserver() {
    if (lyricsObserver) {
      lyricsObserver.disconnect();
    }
    lyricsObserver = new MutationObserver((mutations) => {
      if (!state.isEnabled || state.isTranslating)
        return;
      const hasNewContent = mutations.some(
        (m) => m.type === "childList" && m.addedNodes.length > 0 && Array.from(m.addedNodes).some(
          (n) => n.nodeType === Node.ELEMENT_NODE && n.classList?.contains("line")
        )
      );
      if (hasNewContent && state.autoTranslate && !state.isTranslating) {
        setTimeout(() => {
          if (!state.isTranslating) {
            if (!state.isEnabled) {
              state.isEnabled = true;
              storage.set("translation-enabled", "true");
              updateButtonState();
            }
            translateCurrentLyrics();
          }
        }, 500);
      }
    });
    const lyricsContent = getLyricsContent();
    if (lyricsContent) {
      lyricsObserver.observe(lyricsContent, {
        childList: true,
        subtree: true
      });
    }
  }
  async function onSpicyLyricsOpen() {
    await waitForElement("#SpicyLyricsPage .ViewControls");
    insertTranslateButton();
    setupViewControlsObserver();
    setupLyricsObserver();
    if (state.autoTranslate) {
      setTimeout(() => {
        if (!state.isTranslating) {
          if (!state.isEnabled) {
            state.isEnabled = true;
            storage.set("translation-enabled", "true");
            updateButtonState();
          }
          translateCurrentLyrics();
        }
      }, 1e3);
    }
  }
  function onSpicyLyricsClose() {
    if (viewControlsObserver) {
      viewControlsObserver.disconnect();
      viewControlsObserver = null;
    }
    if (lyricsObserver) {
      lyricsObserver.disconnect();
      lyricsObserver = null;
    }
  }
  async function registerSettingsMenu() {
    while (!Spicetify.React || !Spicetify.ReactDOM) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    try {
      const { SettingsSection } = await import("spcr-settings");
      if (SettingsSection) {
        const settings = new SettingsSection("Spicy Lyric Translater", "spicy-lyric-translater-settings");
        const languageNames = SUPPORTED_LANGUAGES.map((l) => l.name);
        const currentLangIndex = SUPPORTED_LANGUAGES.findIndex(
          (l) => l.code === state.targetLanguage
        );
        settings.addDropDown(
          "target-language",
          "Target Language",
          languageNames,
          currentLangIndex >= 0 ? currentLangIndex : 0,
          () => {
            const selectedIndex = settings.getFieldValue("target-language");
            const lang = SUPPORTED_LANGUAGES[selectedIndex];
            if (lang) {
              state.targetLanguage = lang.code;
              storage.set("target-language", lang.code);
            }
          }
        );
        settings.addToggle(
          "show-original",
          "Show Original Lyrics (alongside translation)",
          state.showOriginal,
          () => {
            state.showOriginal = settings.getFieldValue("show-original") === "true";
            storage.set("show-original", state.showOriginal.toString());
          }
        );
        settings.addToggle(
          "auto-translate",
          "Auto-Translate on Song Change",
          state.autoTranslate,
          () => {
            state.autoTranslate = settings.getFieldValue("auto-translate") === "true";
            storage.set("auto-translate", state.autoTranslate.toString());
          }
        );
        settings.addButton(
          "clear-cache",
          "Clear Translation Cache",
          "Clear Cache",
          () => {
            clearTranslationCache();
            Spicetify.showNotification("Translation cache cleared!");
          }
        );
        settings.pushSettings();
        console.log("[SpicyLyricTranslater] Settings registered in Spicetify settings menu");
      }
    } catch (e) {
      console.log("[SpicyLyricTranslater] spcr-settings not available, using built-in settings modal");
    }
  }
  function setupPageObserver() {
    if (isSpicyLyricsOpen()) {
      onSpicyLyricsOpen();
    }
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const added = Array.from(mutation.addedNodes).some(
            (node) => node.nodeType === Node.ELEMENT_NODE && (node.id === "SpicyLyricsPage" || node.querySelector("#SpicyLyricsPage"))
          );
          const removed = Array.from(mutation.removedNodes).some(
            (node) => node.nodeType === Node.ELEMENT_NODE && (node.id === "SpicyLyricsPage" || node.querySelector("#SpicyLyricsPage"))
          );
          if (added) {
            onSpicyLyricsOpen();
          }
          if (removed) {
            onSpicyLyricsClose();
          }
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  async function initialize() {
    while (typeof Spicetify === "undefined" || !Spicetify.Platform) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log("[SpicyLyricTranslater] Initializing...");
    state.isEnabled = storage.get("translation-enabled") === "true";
    state.targetLanguage = storage.get("target-language") || "en";
    state.showOriginal = storage.get("show-original") === "true";
    state.autoTranslate = storage.get("auto-translate") === "true";
    injectStyles();
    registerSettingsMenu();
    setupPageObserver();
    if (Spicetify.Platform?.History?.listen) {
      Spicetify.Platform.History.listen(() => {
        setTimeout(() => {
          if (isSpicyLyricsOpen() && !document.querySelector("#TranslateToggle")) {
            onSpicyLyricsOpen();
          }
        }, 100);
      });
    }
    if (Spicetify.Player?.addEventListener) {
      Spicetify.Player.addEventListener("songchange", () => {
        state.translatedLyrics.clear();
        removeTranslations();
        if (state.autoTranslate && isSpicyLyricsOpen()) {
          setTimeout(() => {
            if (!state.isEnabled) {
              state.isEnabled = true;
              storage.set("translation-enabled", "true");
              updateButtonState();
            }
            translateCurrentLyrics();
          }, 1500);
        }
      });
    }
    console.log("[SpicyLyricTranslater] Initialized successfully!");
  }
  window.SpicyLyricTranslater = {
    enable: () => {
      state.isEnabled = true;
      storage.set("translation-enabled", "true");
      translateCurrentLyrics();
    },
    disable: () => {
      state.isEnabled = false;
      storage.set("translation-enabled", "false");
      removeTranslations();
    },
    setLanguage: (lang) => {
      state.targetLanguage = lang;
      storage.set("target-language", lang);
    },
    translate: translateCurrentLyrics,
    showSettings: showSettingsModal,
    clearCache: clearTranslationCache,
    getState: () => ({ ...state })
  };
  initialize().catch(console.error);
  var app_default = initialize;
  return __toCommonJS(app_exports);
})();
