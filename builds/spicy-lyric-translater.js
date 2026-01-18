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
    </svg>`,
    // Connection/Signal icon
    Connection: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>`,
    // Users icon
    Users: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>`
  };

  // src/utils/storage.ts
  var STORAGE_PREFIX = "spicy-lyric-translater:";
  var MAX_STORAGE_SIZE_BYTES = 4 * 1024 * 1024;
  function isLocalStorageAvailable() {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  function getStorageSize() {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
    } catch (e) {
    }
    return total * 2;
  }
  var storage = {
    get(key) {
      try {
        if (!isLocalStorageAvailable())
          return null;
        return localStorage.getItem(STORAGE_PREFIX + key);
      } catch (e) {
        console.error("[SpicyLyricTranslater] Storage get error:", e);
        return null;
      }
    },
    set(key, value) {
      try {
        if (!isLocalStorageAvailable())
          return false;
        if (value.length > 1e4) {
          const currentSize = getStorageSize();
          if (currentSize + value.length * 2 > MAX_STORAGE_SIZE_BYTES) {
            console.warn("[SpicyLyricTranslater] Storage limit approaching, clearing old cache");
            this.remove("translation-cache");
          }
        }
        localStorage.setItem(STORAGE_PREFIX + key, value);
        return true;
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.warn("[SpicyLyricTranslater] Storage quota exceeded, clearing cache");
          this.remove("translation-cache");
          try {
            localStorage.setItem(STORAGE_PREFIX + key, value);
            return true;
          } catch {
            return false;
          }
        }
        console.error("[SpicyLyricTranslater] Storage set error:", e);
        return false;
      }
    },
    remove(key) {
      try {
        if (!isLocalStorageAvailable())
          return;
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
        return this.set(key, JSON.stringify(value));
      } catch (e) {
        console.error("[SpicyLyricTranslater] Storage setJSON error:", e);
        return false;
      }
    },
    /**
     * Get storage usage statistics
     */
    getStats() {
      const used = getStorageSize();
      return {
        usedBytes: used,
        maxBytes: MAX_STORAGE_SIZE_BYTES,
        percentUsed: Math.round(used / MAX_STORAGE_SIZE_BYTES * 100)
      };
    },
    /**
     * Clear all extension storage
     */
    clearAll() {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (e) {
        console.error("[SpicyLyricTranslater] Storage clearAll error:", e);
      }
    }
  };
  var storage_default = storage;

  // src/utils/translator.ts
  var preferredApi = "google";
  var customApiUrl = "";
  var RATE_LIMIT = {
    minDelayMs: 100,
    // Minimum delay between API calls
    maxDelayMs: 2e3,
    // Maximum delay (for exponential backoff)
    maxRetries: 3,
    // Maximum retry attempts
    backoffMultiplier: 2
    // Exponential backoff multiplier
  };
  var lastApiCallTime = 0;
  var BATCH_SEPARATOR = "\n\u200B\u2063\u200B\n";
  var BATCH_SEPARATOR_REGEX = /\n?[\u200B\u2063]+\n?/g;
  async function rateLimitedDelay() {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    if (timeSinceLastCall < RATE_LIMIT.minDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT.minDelayMs - timeSinceLastCall));
    }
    lastApiCallTime = Date.now();
  }
  async function retryWithBackoff(fn, maxRetries = RATE_LIMIT.maxRetries, baseDelay = RATE_LIMIT.minDelayMs) {
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await rateLimitedDelay();
        return await fn();
      } catch (error) {
        lastError = error;
        if (error instanceof Error && error.message.includes("40")) {
          throw error;
        }
        if (attempt < maxRetries) {
          const delay = Math.min(
            baseDelay * Math.pow(RATE_LIMIT.backoffMultiplier, attempt),
            RATE_LIMIT.maxDelayMs
          );
          console.log(`[SpicyLyricTranslater] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError || new Error("All retry attempts failed");
  }
  function setPreferredApi(api, customUrl2) {
    preferredApi = api;
    if (customUrl2 !== void 0) {
      customApiUrl = customUrl2;
    }
    console.log(`[SpicyLyricTranslater] API preference set to: ${api}${api === "custom" ? ` (${customUrl2})` : ""}`);
  }
  var CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1e3;
  var MAX_CACHE_ENTRIES = 500;
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
  function cacheTranslation(text, targetLang, translation, api) {
    const cache = storage_default.getJSON("translation-cache", {});
    const key = `${targetLang}:${text}`;
    cache[key] = {
      translation,
      timestamp: Date.now(),
      api
    };
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
      const now = Date.now();
      const sorted = keys.map((k) => ({ key: k, entry: cache[k] })).sort((a, b) => a.entry.timestamp - b.entry.timestamp);
      const toRemove = sorted.filter(
        (item) => now - item.entry.timestamp > CACHE_EXPIRY
      ).map((item) => item.key);
      const remaining = keys.length - toRemove.length;
      if (remaining > MAX_CACHE_ENTRIES) {
        const validSorted = sorted.filter(
          (item) => now - item.entry.timestamp <= CACHE_EXPIRY
        );
        const additionalRemove = validSorted.slice(0, remaining - MAX_CACHE_ENTRIES).map((item) => item.key);
        toRemove.push(...additionalRemove);
      }
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
  async function translateWithCustomApi(text, targetLang) {
    if (!customApiUrl) {
      throw new Error("Custom API URL not configured");
    }
    try {
      const response = await fetch(customApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text,
          q: text,
          // Alternative field name
          source: "auto",
          source_lang: "auto",
          sourceLang: "auto",
          target: targetLang,
          target_lang: targetLang,
          targetLang,
          to: targetLang,
          format: "text"
        })
      });
      if (!response.ok) {
        throw new Error(`Custom API error: ${response.status}`);
      }
      const data = await response.json();
      const translation = data.translatedText || data.translated_text || data.translation || data.result || data.text || data.translations && data.translations[0]?.text || data.data && data.data.translatedText || Array.isArray(data) && data[0]?.translatedText;
      if (translation) {
        return {
          translation,
          detectedLang: data.detectedLanguage || data.detected_language || data.sourceLang || data.src
        };
      }
      throw new Error("Could not parse translation from API response");
    } catch (error) {
      console.error("[SpicyLyricTranslater] Custom API error:", error);
      throw error;
    }
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
    const tryGoogle = async () => {
      const result = await translateWithGoogle(text, targetLang);
      return { translation: result.translation, detectedLang: result.detectedLang };
    };
    const tryLibreTranslate = async () => {
      const translation = await translateWithLibreTranslate(text, targetLang);
      return { translation, detectedLang: void 0 };
    };
    const tryCustom = async () => {
      const result = await translateWithCustomApi(text, targetLang);
      return { translation: result.translation, detectedLang: result.detectedLang };
    };
    let primaryApi;
    let fallbackApis = [];
    switch (preferredApi) {
      case "libretranslate":
        primaryApi = tryLibreTranslate;
        fallbackApis = [{ name: "google", fn: tryGoogle }];
        break;
      case "custom":
        primaryApi = tryCustom;
        fallbackApis = [{ name: "google", fn: tryGoogle }, { name: "libretranslate", fn: tryLibreTranslate }];
        break;
      case "google":
      default:
        primaryApi = tryGoogle;
        fallbackApis = [{ name: "libretranslate", fn: tryLibreTranslate }];
        break;
    }
    try {
      const result = await primaryApi();
      if (result.detectedLang && isSameLanguage(result.detectedLang, targetLang)) {
        cacheTranslation(text, targetLang, text, preferredApi);
        return {
          originalText: text,
          translatedText: text,
          detectedLanguage: result.detectedLang,
          targetLanguage: targetLang,
          wasTranslated: false
        };
      }
      cacheTranslation(text, targetLang, result.translation, preferredApi);
      return {
        originalText: text,
        translatedText: result.translation,
        detectedLanguage: result.detectedLang,
        targetLanguage: targetLang,
        wasTranslated: true
      };
    } catch (primaryError) {
      console.warn(`[SpicyLyricTranslater] Primary API (${preferredApi}) failed, trying fallbacks:`, primaryError);
      for (const fallbackApi of fallbackApis) {
        try {
          const result = await fallbackApi.fn();
          if (result.detectedLang && isSameLanguage(result.detectedLang, targetLang)) {
            cacheTranslation(text, targetLang, text, fallbackApi.name);
            return {
              originalText: text,
              translatedText: text,
              detectedLanguage: result.detectedLang,
              targetLanguage: targetLang,
              wasTranslated: false
            };
          }
          cacheTranslation(text, targetLang, result.translation, fallbackApi.name);
          return {
            originalText: text,
            translatedText: result.translation,
            detectedLanguage: result.detectedLang,
            targetLanguage: targetLang,
            wasTranslated: true
          };
        } catch (fallbackError) {
          console.warn(`[SpicyLyricTranslater] Fallback API (${fallbackApi.name}) failed:`, fallbackError);
          continue;
        }
      }
      console.error("[SpicyLyricTranslater] All translation services failed");
      throw new Error("Translation failed. Please try again later.");
    }
  }
  async function translateLyrics(lines, targetLang) {
    const results = [];
    const cachedResults = /* @__PURE__ */ new Map();
    const uncachedLines = [];
    lines.forEach((line, index) => {
      if (!line.trim()) {
        cachedResults.set(index, {
          originalText: line,
          translatedText: line,
          targetLanguage: targetLang,
          wasTranslated: false
        });
      } else {
        const cached = getCachedTranslation(line, targetLang);
        if (cached) {
          cachedResults.set(index, {
            originalText: line,
            translatedText: cached,
            targetLanguage: targetLang,
            wasTranslated: cached !== line
          });
        } else {
          uncachedLines.push({ index, text: line });
        }
      }
    });
    if (uncachedLines.length === 0) {
      console.log("[SpicyLyricTranslater] All lines found in cache");
      return lines.map((_, index) => cachedResults.get(index));
    }
    console.log(`[SpicyLyricTranslater] ${cachedResults.size} cached, ${uncachedLines.length} to translate`);
    const combinedText = uncachedLines.map((l) => l.text).join(BATCH_SEPARATOR);
    try {
      const result = await retryWithBackoff(() => translateText(combinedText, targetLang));
      const translatedLines = result.translatedText.split(BATCH_SEPARATOR_REGEX);
      uncachedLines.forEach((item, i) => {
        const translation = translatedLines[i]?.trim() || item.text;
        cachedResults.set(item.index, {
          originalText: item.text,
          translatedText: translation,
          targetLanguage: targetLang,
          wasTranslated: result.wasTranslated && translation !== item.text
        });
      });
    } catch (error) {
      console.error("[SpicyLyricTranslater] Batch translation failed, falling back to line-by-line:", error);
      for (const item of uncachedLines) {
        try {
          const result = await retryWithBackoff(() => translateText(item.text, targetLang));
          cachedResults.set(item.index, result);
        } catch {
          cachedResults.set(item.index, {
            originalText: item.text,
            translatedText: item.text,
            targetLanguage: targetLang,
            wasTranslated: false
          });
        }
      }
    }
    for (let i = 0; i < lines.length; i++) {
      results.push(cachedResults.get(i));
    }
    return results;
  }
  function clearTranslationCache() {
    storage_default.remove("translation-cache");
  }
  function getCacheStats() {
    const cache = storage_default.getJSON("translation-cache", {});
    const keys = Object.keys(cache);
    if (keys.length === 0) {
      return { entries: 0, oldestTimestamp: null, sizeBytes: 0 };
    }
    const timestamps = keys.map((k) => cache[k].timestamp);
    const sizeBytes = JSON.stringify(cache).length * 2;
    return {
      entries: keys.length,
      oldestTimestamp: Math.min(...timestamps),
      sizeBytes
    };
  }
  function getCachedTranslations() {
    const cache = storage_default.getJSON("translation-cache", {});
    const entries = [];
    for (const key of Object.keys(cache)) {
      const [lang, ...textParts] = key.split(":");
      const original = textParts.join(":");
      entries.push({
        original,
        translated: cache[key].translation,
        language: lang,
        date: new Date(cache[key].timestamp),
        api: cache[key].api
      });
    }
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());
    return entries;
  }
  function deleteCachedTranslation(original, language) {
    const cache = storage_default.getJSON("translation-cache", {});
    const key = `${language}:${original}`;
    if (cache[key]) {
      delete cache[key];
      storage_default.setJSON("translation-cache", cache);
      return true;
    }
    return false;
  }
  function isOffline() {
    return typeof navigator !== "undefined" && !navigator.onLine;
  }

  // src/styles/main.ts
  var styles = `
/* Spicy Lyric Translater - Minimal Styles */
/* Works in main page, Cinema View, and PIP popout */

/* Loading animation for translate button */
@keyframes spicy-translate-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

#TranslateToggle.loading svg {
    animation: spicy-translate-spin 1s linear infinite;
}

/* Active state for translate button */
#TranslateToggle.active svg {
    color: var(--spice-button-active, #1db954);
}

/* Error state for translate button */
#TranslateToggle.error svg {
    color: #e74c3c;
}

#TranslateToggle.error {
    animation: spicy-translate-shake 0.5s ease-in-out;
}

@keyframes spicy-translate-shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-3px); }
    40%, 80% { transform: translateX(3px); }
}

/* Settings modal styles - these are in our own modal */
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
.spicy-translate-settings input[type="text"],
.spicy-translate-settings button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    background: var(--spice-button, #535353);
    color: var(--spice-text, #fff);
    cursor: pointer;
    font-size: 14px;
}

.spicy-translate-settings input[type="text"] {
    min-width: 200px;
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
    flex-shrink: 0;
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

/* ========================================
   TRANSLATION DISPLAY STYLES
   ======================================== */

/* Hide original content completely when showing translation only */
.spicy-hidden-original {
    display: none !important;
    visibility: hidden !important;
    position: absolute !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
}

/* Translated text - inherits styling from parent line */
/* pointer-events: none ensures we don't interfere with Spicy Lyrics click handlers */
.spicy-translation-text {
    display: inline !important;
    pointer-events: none !important;
    /* Inherit all text styling from parent */
}

/* Wrapper for original content (used for line-synced lyrics) */
.spicy-original-wrapper {
    display: contents;
}

.spicy-original-wrapper.spicy-hidden-original {
    display: none !important;
}

/* Line that has been translated */
.line.spicy-translated {
    /* Don't change display - let Spicy Lyrics control it */
}

/* Ensure translation container doesn't interfere with clicks */
.spicy-translation-container {
    pointer-events: none !important;
}

/* ========================================
   CACHE VIEWER STYLES
   ======================================== */

.cache-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.cache-delete-btn {
    opacity: 0.6;
    transition: opacity 0.2s, background 0.2s;
}

.cache-delete-btn:hover {
    opacity: 1;
    background: #e74c3c !important;
}

/* ========================================
   CONTEXT-SPECIFIC STYLES
   For main page, Cinema View, and PIP
   ======================================== */

/* Main page styles */
#SpicyLyricsPage .LyricsContent .line .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

/* Cinema View / Fullscreen styles */
#SpicyLyricsPage.ForcedCompactMode .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

/* PIP popout styles */
.spicy-pip-wrapper .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

/* Sidebar mode styles */
#SpicyLyricsPage.SidebarMode .spicy-translation-text {
    color: inherit;
    font-family: inherit;
}

/* ========================================
   CONNECTION INDICATOR STYLES
   ======================================== */

/* Spinner animation */
@keyframes slt-ci-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.slt-ci-spinner {
    animation: slt-ci-spin 1s linear infinite;
}

/* Main container - inside topbar content right container */
.SLT_ConnectionIndicator {
    display: flex;
    align-items: center;
    margin-right: 8px;
    position: relative;
    z-index: 100;
}

.slt-ci-button {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 6px;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: visible;
    white-space: nowrap;
}

.slt-ci-button:hover {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 6px 10px;
    gap: 8px;
}

/* The status dot */
.slt-ci-dot {
    width: 8px;
    height: 8px;
    min-width: 8px;
    border-radius: 50%;
    background: #666;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.slt-ci-dot.slt-ci-connecting {
    background: #888;
    animation: slt-ci-pulse 1.5s ease-in-out infinite;
}

.slt-ci-dot.slt-ci-connected {
    background: #1db954;
}

.slt-ci-dot.slt-ci-error {
    background: #e74c3c;
}

.slt-ci-dot.slt-ci-great {
    background: #1db954;
}

.slt-ci-dot.slt-ci-ok {
    background: #ffe666;
}

.slt-ci-dot.slt-ci-bad {
    background: #ff944d;
}

.slt-ci-dot.slt-ci-horrible {
    background: #e74c3c;
}

@keyframes slt-ci-pulse {
    0%, 100% { opacity: 0.4; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.1); }
}

/* Expanded content - hidden by default */
.slt-ci-expanded {
    display: flex;
    align-items: center;
    opacity: 0;
    width: 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
}

.slt-ci-button:hover .slt-ci-expanded {
    opacity: 1;
    width: auto;
    margin-left: 8px;
}

.slt-ci-stats-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.65rem;
    color: var(--spice-subtext, #b3b3b3);
}

.slt-ci-ping {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 0.6rem;
    color: var(--spice-text, #fff);
}

.slt-ci-divider {
    opacity: 0.3;
    font-size: 0.5rem;
}

.slt-ci-users-count {
    display: flex;
    align-items: center;
    gap: 3px;
    color: var(--spice-text, #fff);
    font-size: 0.6rem;
}

.slt-ci-users-count svg {
    color: var(--spice-subtext, #b3b3b3);
    opacity: 0.7;
}

/* Active viewers count - green highlight */
.slt-ci-users-count.slt-ci-active .slt-ci-active-count {
    color: #1db954;
}

.slt-ci-users-count.slt-ci-active svg {
    color: #1db954;
    opacity: 0.9;
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

  // src/utils/updater.ts
  var getLoadedVersion = () => {
    const metadata = window._spicy_lyric_translater_metadata;
    if (metadata?.LoadedVersion) {
      return metadata.LoadedVersion;
    }
    return true ? "1.5.2" : "0.0.0";
  };
  var CURRENT_VERSION = getLoadedVersion();
  var GITHUB_REPO = "7xeh/SpicyLyricTranslate";
  var GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
  var RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
  var EXTENSION_FILENAME = "spicy-lyric-translater.js";
  var UPDATE_API_URL = "https://7xeh.dev/apps/spicylyrictranslate/api/version.php";
  var updateState = {
    isUpdating: false,
    progress: 0,
    status: ""
  };
  var hasShownUpdateNotice = false;
  var lastCheckTime = 0;
  var CHECK_INTERVAL_MS = 5 * 60 * 1e3;
  function parseVersion(version) {
    const cleanVersion = version.replace(/^v/, "");
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
  function compareVersions(v1, v2) {
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
  function getCurrentVersion() {
    return parseVersion(CURRENT_VERSION) || {
      major: 1,
      minor: 0,
      patch: 0,
      text: CURRENT_VERSION
    };
  }
  async function getLatestVersion() {
    try {
      const response = await fetch(`${UPDATE_API_URL}?action=version&_=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        const version = parseVersion(data.version);
        if (version) {
          console.log("[SpicyLyricTranslater] Got version from self-hosted API:", data.version);
          return {
            version,
            release: {
              tag_name: `v${data.version}`,
              name: `v${data.version}`,
              html_url: data.release_notes_url || RELEASES_URL,
              body: "",
              published_at: (/* @__PURE__ */ new Date()).toISOString(),
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
      console.warn("[SpicyLyricTranslater] Self-hosted API unavailable, trying GitHub:", error);
    }
    try {
      const response = await fetch(GITHUB_API_URL, {
        headers: {
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (!response.ok) {
        console.warn("[SpicyLyricTranslater] Failed to fetch latest version:", response.status);
        return null;
      }
      const release = await response.json();
      const version = parseVersion(release.tag_name);
      if (!version) {
        console.warn("[SpicyLyricTranslater] Failed to parse version from tag:", release.tag_name);
        return null;
      }
      const jsAsset = release.assets?.find((a) => a.name.endsWith(".js"));
      const downloadUrl = jsAsset?.browser_download_url || "";
      return { version, release, downloadUrl };
    } catch (error) {
      console.error("[SpicyLyricTranslater] Error fetching latest version:", error);
      return null;
    }
  }
  async function performUpdate(release, version, modalContent) {
    if (updateState.isUpdating)
      return;
    updateState.isUpdating = true;
    updateState.progress = 0;
    updateState.status = "Preparing update...";
    const progressContainer = modalContent.querySelector(".update-progress");
    const progressBar = modalContent.querySelector(".progress-bar-fill");
    const progressText = modalContent.querySelector(".progress-text");
    const buttonsContainer = modalContent.querySelector(".update-buttons");
    if (progressContainer) {
      progressContainer.style.display = "block";
    }
    if (buttonsContainer) {
      buttonsContainer.style.display = "none";
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
      storage.set("pending-update-version", version.text);
      storage.set("pending-update-timestamp", Date.now().toString());
      updateState.progress = 30;
      updateState.status = "Preparing to update...";
      updateProgress();
      await new Promise((r) => setTimeout(r, 500));
      updateState.progress = 60;
      updateState.status = "Ready to reload...";
      updateProgress();
      await new Promise((r) => setTimeout(r, 500));
      updateState.progress = 100;
      updateState.status = "Reloading Spotify...";
      updateProgress();
      await new Promise((r) => setTimeout(r, 300));
      if (window._spicy_lyric_translater_metadata) {
        window._spicy_lyric_translater_metadata = {};
      }
      window.location.reload();
    } catch (error) {
      console.error("[SpicyLyricTranslater] Update failed:", error);
      updateState.status = "Update failed";
      updateProgress();
      if (progressContainer && buttonsContainer) {
        progressContainer.innerHTML = `
                <div class="update-error">
                    <span class="error-icon">\u274C</span>
                    <span class="error-text">Update failed. Please try restarting Spotify.</span>
                </div>
            `;
        buttonsContainer.style.display = "flex";
        buttonsContainer.innerHTML = `
                <button class="update-btn secondary" id="slt-update-cancel">Cancel</button>
                <button class="update-btn primary" id="slt-reload-now">Reload Now</button>
            `;
        setTimeout(() => {
          const cancelBtn = document.getElementById("slt-update-cancel");
          const reloadBtn = document.getElementById("slt-reload-now");
          if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
              Spicetify.PopupModal.hide();
              updateState.isUpdating = false;
            });
          }
          if (reloadBtn) {
            reloadBtn.addEventListener("click", () => {
              window.location.reload();
            });
          }
        }, 100);
      }
      updateState.isUpdating = false;
    }
  }
  function showUpdateModal(currentVersion, latestVersion, release) {
    const content = document.createElement("div");
    content.className = "slt-update-modal";
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
        <div class="update-header">\u{1F389} A new version is available!</div>
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
        ` : ""}
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
        title: "Spicy Lyric Translater - Update Available",
        content,
        isLarge: true
      });
      setTimeout(() => {
        const laterBtn = document.getElementById("slt-update-later");
        const updateBtn = document.getElementById("slt-update-now");
        if (laterBtn) {
          laterBtn.addEventListener("click", () => {
            Spicetify.PopupModal.hide();
          });
        }
        if (updateBtn) {
          updateBtn.addEventListener("click", () => {
            performUpdate(release, latestVersion, content);
          });
        }
      }, 100);
    }
  }
  function formatReleaseNotes(body) {
    return body.replace(/^### (.*)/gm, "<strong>$1</strong>").replace(/^## (.*)/gm, '<strong style="font-size: 14px;">$1</strong>').replace(/^# (.*)/gm, '<strong style="font-size: 16px;">$1</strong>').replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/^- (.*)/gm, "\u2022 $1").replace(/\n/g, "<br>");
  }
  async function checkForUpdates(force = false) {
    const now = Date.now();
    if (!force && now - lastCheckTime < CHECK_INTERVAL_MS) {
      return;
    }
    lastCheckTime = now;
    if (!force && hasShownUpdateNotice) {
      return;
    }
    try {
      const latest = await getLatestVersion();
      if (!latest)
        return;
      const current = getCurrentVersion();
      if (compareVersions(latest.version, current) > 0) {
        console.log(`[SpicyLyricTranslater] Update available: ${current.text} \u2192 ${latest.version.text}`);
        showUpdateModal(current, latest.version, latest.release);
        hasShownUpdateNotice = true;
      } else {
        console.log("[SpicyLyricTranslater] Already on latest version:", current.text);
      }
    } catch (error) {
      console.error("[SpicyLyricTranslater] Error checking for updates:", error);
    }
  }
  function startUpdateChecker(intervalMs = 30 * 60 * 1e3) {
    setTimeout(() => {
      checkForUpdates();
    }, 5e3);
    setInterval(() => {
      checkForUpdates();
    }, intervalMs);
    console.log("[SpicyLyricTranslater] Update checker started");
  }
  async function getUpdateInfo() {
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
  var VERSION = CURRENT_VERSION;
  var REPO_URL = RELEASES_URL;

  // src/utils/connectivity.ts
  var API_BASE = "https://7xeh.dev/apps/spicylyrictranslate/api/connectivity.php";
  var HEARTBEAT_INTERVAL = 3e4;
  var LATENCY_CHECK_INTERVAL = 1e4;
  var CONNECTION_TIMEOUT = 5e3;
  var LATENCY_THRESHOLDS = {
    GREAT: 150,
    OK: 300,
    BAD: 500
  };
  var indicatorState = {
    state: "disconnected",
    sessionId: null,
    latencyMs: null,
    totalUsers: 0,
    activeUsers: 0,
    isViewingLyrics: false,
    region: "",
    lastHeartbeat: 0,
    isInitialized: false
  };
  var heartbeatInterval = null;
  var latencyInterval = null;
  var jitterInterval = null;
  var containerElement = null;
  function getLatencyClass(latencyMs) {
    if (latencyMs <= LATENCY_THRESHOLDS.GREAT)
      return "slt-ci-great";
    if (latencyMs <= LATENCY_THRESHOLDS.OK)
      return "slt-ci-ok";
    if (latencyMs <= LATENCY_THRESHOLDS.BAD)
      return "slt-ci-bad";
    return "slt-ci-horrible";
  }
  function createIndicatorElement() {
    const container = document.createElement("div");
    container.className = "SLT_ConnectionIndicator";
    container.innerHTML = `
        <div class="slt-ci-button" title="Connection Status">
            <div class="slt-ci-dot"></div>
            <div class="slt-ci-expanded">
                <div class="slt-ci-stats-row">
                    <span class="slt-ci-ping">--ms</span>
                    <span class="slt-ci-divider">\u2022</span>
                    <span class="slt-ci-users-count slt-ci-total" title="Total installed">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <span class="slt-ci-total-count">0</span>
                    </span>
                    <span class="slt-ci-divider">\u2022</span>
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
  function updateUI() {
    if (!containerElement)
      return;
    const button = containerElement.querySelector(".slt-ci-button");
    const dot = containerElement.querySelector(".slt-ci-dot");
    const pingEl = containerElement.querySelector(".slt-ci-ping");
    const totalCountEl = containerElement.querySelector(".slt-ci-total-count");
    const activeCountEl = containerElement.querySelector(".slt-ci-active-count");
    if (!button || !dot)
      return;
    dot.classList.remove("slt-ci-connecting", "slt-ci-connected", "slt-ci-error", "slt-ci-great", "slt-ci-ok", "slt-ci-bad", "slt-ci-horrible");
    switch (indicatorState.state) {
      case "connected":
        dot.classList.add("slt-ci-connected");
        if (indicatorState.latencyMs !== null) {
          dot.classList.add(getLatencyClass(indicatorState.latencyMs));
          if (pingEl)
            pingEl.textContent = `${indicatorState.latencyMs}ms`;
        }
        if (totalCountEl)
          totalCountEl.textContent = `${indicatorState.totalUsers}`;
        if (activeCountEl)
          activeCountEl.textContent = `${indicatorState.activeUsers}`;
        button.setAttribute("title", `Connected \u2022 ${indicatorState.latencyMs}ms \u2022 ${indicatorState.totalUsers} installed \u2022 ${indicatorState.activeUsers} viewing`);
        break;
      case "connecting":
      case "reconnecting":
        dot.classList.add("slt-ci-connecting");
        if (pingEl)
          pingEl.textContent = "--ms";
        button.setAttribute("title", "Connecting...");
        break;
      case "error":
        dot.classList.add("slt-ci-error");
        if (pingEl)
          pingEl.textContent = "Error";
        button.setAttribute("title", "Connection error - retrying...");
        break;
      case "disconnected":
      default:
        if (pingEl)
          pingEl.textContent = "--ms";
        button.setAttribute("title", "Disconnected");
        break;
    }
    if (typeof Spicetify !== "undefined" && Spicetify.Tippy && button && !button._tippy) {
      Spicetify.Tippy(button, {
        ...Spicetify.TippyProps,
        delay: [200, 0],
        allowHTML: true,
        content: getTooltipContent(),
        onShow(instance) {
          instance.setContent(getTooltipContent());
        }
      });
    } else if (button?._tippy) {
      button._tippy.setContent(getTooltipContent());
    }
  }
  function getTooltipContent() {
    switch (indicatorState.state) {
      case "connected":
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
      case "connecting":
      case "reconnecting":
        return `<span style="font-size:12px;">Connecting to SLT server...</span>`;
      case "error":
        return `<span style="font-size:12px;color:#e74c3c;">Connection error - retrying...</span>`;
      default:
        return `<span style="font-size:12px;">Disconnected</span>`;
    }
  }
  async function fetchWithTimeout(url, options = {}, timeout = CONNECTION_TIMEOUT) {
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
  async function measureLatency() {
    try {
      const startTime = performance.now();
      const response = await fetchWithTimeout(`${API_BASE}?action=ping&_=${Date.now()}`);
      if (!response.ok)
        return null;
      await response.json();
      const latency = Math.round(performance.now() - startTime);
      return latency;
    } catch (error) {
      console.warn("[SpicyLyricTranslater] Latency check failed:", error);
      return null;
    }
  }
  async function sendHeartbeat() {
    try {
      const params = new URLSearchParams({
        action: "heartbeat",
        session: indicatorState.sessionId || "",
        version: storage.get("extension-version") || "1.0.0",
        active: indicatorState.isViewingLyrics ? "true" : "false"
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
        indicatorState.region = data.region || "";
        indicatorState.lastHeartbeat = Date.now();
        if (indicatorState.state !== "connected") {
          indicatorState.state = "connected";
          updateUI();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.warn("[SpicyLyricTranslater] Heartbeat failed:", error);
      return false;
    }
  }
  async function connect() {
    indicatorState.state = "connecting";
    updateUI();
    try {
      const params = new URLSearchParams({
        action: "connect",
        version: storage.get("extension-version") || "1.0.0"
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
        indicatorState.region = data.region || "";
        indicatorState.state = "connected";
        indicatorState.lastHeartbeat = Date.now();
        const latency = await measureLatency();
        indicatorState.latencyMs = latency;
        updateUI();
        console.log("[SpicyLyricTranslater] Connected to connectivity service");
        return true;
      }
      throw new Error("Connection failed");
    } catch (error) {
      console.warn("[SpicyLyricTranslater] Connection failed:", error);
      indicatorState.state = "error";
      updateUI();
      setTimeout(() => {
        if (indicatorState.state === "error") {
          indicatorState.state = "reconnecting";
          updateUI();
          connect();
        }
      }, 5e3);
      return false;
    }
  }
  async function disconnect() {
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
    if (indicatorState.sessionId) {
      try {
        const params = new URLSearchParams({
          action: "disconnect",
          session: indicatorState.sessionId
        });
        await fetch(`${API_BASE}?${params}`);
      } catch (e) {
      }
    }
    indicatorState.state = "disconnected";
    indicatorState.sessionId = null;
    indicatorState.latencyMs = null;
    indicatorState.activeUsers = 0;
    updateUI();
  }
  function applyJitter() {
    if (indicatorState.latencyMs === null)
      return;
    const jitter = indicatorState.latencyMs + Math.floor(Math.random() * 5 - 2);
    indicatorState.latencyMs = Math.max(1, jitter);
    if (containerElement) {
      const pingEl = containerElement.querySelector(".slt-ci-ping");
      const dot = containerElement.querySelector(".slt-ci-dot");
      if (pingEl && indicatorState.latencyMs !== null) {
        pingEl.textContent = `${indicatorState.latencyMs}ms`;
      }
      if (dot && indicatorState.latencyMs !== null) {
        dot.classList.remove("slt-ci-great", "slt-ci-ok", "slt-ci-bad", "slt-ci-horrible");
        dot.classList.add(getLatencyClass(indicatorState.latencyMs));
      }
    }
  }
  function startPeriodicChecks() {
    heartbeatInterval = setInterval(async () => {
      const success = await sendHeartbeat();
      if (!success && indicatorState.state === "connected") {
        indicatorState.state = "reconnecting";
        updateUI();
        connect();
      }
    }, HEARTBEAT_INTERVAL);
    latencyInterval = setInterval(async () => {
      const latency = await measureLatency();
      if (latency !== null) {
        indicatorState.latencyMs = latency;
        updateUI();
      }
    }, LATENCY_CHECK_INTERVAL);
    jitterInterval = setInterval(applyJitter, 1e3);
  }
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
        resolve(document.querySelector(selector));
      }, timeout);
    });
  }
  async function appendToDOM() {
    if (containerElement && containerElement.parentNode) {
      return true;
    }
    const topBarContentRight = await waitForElement(".main-topBar-topbarContentRight");
    if (topBarContentRight) {
      containerElement = createIndicatorElement();
      topBarContentRight.insertBefore(containerElement, topBarContentRight.firstChild);
      console.log("[SpicyLyricTranslater] Connection indicator appended to topbar content right");
      return true;
    }
    console.log("[SpicyLyricTranslater] Could not find topbar content right container after waiting");
    return false;
  }
  async function initConnectionIndicator() {
    if (indicatorState.isInitialized)
      return;
    console.log("[SpicyLyricTranslater] Initializing connection indicator...");
    const appended = await appendToDOM();
    if (!appended) {
      console.log("[SpicyLyricTranslater] Could not find container for connection indicator");
      return;
    }
    indicatorState.isInitialized = true;
    const connected = await connect();
    if (connected) {
      startPeriodicChecks();
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (latencyInterval) {
          clearInterval(latencyInterval);
          latencyInterval = null;
        }
        if (jitterInterval) {
          clearInterval(jitterInterval);
          jitterInterval = null;
        }
      } else {
        if (indicatorState.state === "connected") {
          latencyInterval = setInterval(async () => {
            const latency = await measureLatency();
            if (latency !== null) {
              indicatorState.latencyMs = latency;
              updateUI();
            }
          }, LATENCY_CHECK_INTERVAL);
          jitterInterval = setInterval(applyJitter, 1e3);
          measureLatency().then((latency) => {
            if (latency !== null) {
              indicatorState.latencyMs = latency;
              updateUI();
            }
          });
        }
      }
    });
    window.addEventListener("beforeunload", () => {
      disconnect();
    });
  }
  function getConnectionState() {
    return { ...indicatorState };
  }
  async function refreshConnection() {
    await disconnect();
    await connect();
    if (indicatorState.state === "connected") {
      startPeriodicChecks();
    }
  }
  function setViewingLyrics(isViewing) {
    if (indicatorState.isViewingLyrics !== isViewing) {
      indicatorState.isViewingLyrics = isViewing;
      if (indicatorState.state === "connected") {
        sendHeartbeat().then(() => updateUI());
      }
    }
  }

  // src/app.ts
  var state = {
    isEnabled: false,
    isTranslating: false,
    targetLanguage: storage.get("target-language") || "en",
    autoTranslate: storage.get("auto-translate") === "true",
    showNotifications: storage.get("show-notifications") !== "false",
    // Default to true
    preferredApi: storage.get("preferred-api") || "google",
    customApiUrl: storage.get("custom-api-url") || "",
    lastTranslatedSongUri: null,
    translatedLyrics: /* @__PURE__ */ new Map(),
    lastViewMode: null,
    translationAbortController: null
  };
  var viewControlsObserver = null;
  var lyricsObserver = null;
  function formatBytes(bytes) {
    if (bytes === 0)
      return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }
  function truncateText(text, maxLength) {
    if (text.length <= maxLength)
      return text;
    return text.substring(0, maxLength - 3) + "...";
  }
  function waitForElement2(selector, timeout = 1e4) {
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
    return !!(document.querySelector("#SpicyLyricsPage") || document.querySelector(".spicy-pip-wrapper #SpicyLyricsPage") || document.querySelector(".Cinema--Container") || document.querySelector(".spicy-lyrics-cinema"));
  }
  function getViewControls() {
    const pipWindow = getPIPWindow();
    if (pipWindow) {
      const pipViewControls = pipWindow.document.querySelector("#SpicyLyricsPage .ViewControls");
      if (pipViewControls)
        return pipViewControls;
    }
    return document.querySelector("#SpicyLyricsPage .ViewControls") || document.querySelector(".Cinema--Container .ViewControls") || document.querySelector(".spicy-pip-wrapper .ViewControls") || document.querySelector(".ViewControls");
  }
  function getPIPWindow() {
    try {
      const docPiP = globalThis.documentPictureInPicture;
      if (docPiP && docPiP.window) {
        return docPiP.window;
      }
    } catch (e) {
    }
    return null;
  }
  function getLyricsContent() {
    const pipWindow = getPIPWindow();
    if (pipWindow) {
      const pipContent = pipWindow.document.querySelector("#SpicyLyricsPage .LyricsContent") || pipWindow.document.querySelector(".LyricsContainer .LyricsContent");
      if (pipContent)
        return pipContent;
    }
    return document.querySelector("#SpicyLyricsPage .LyricsContent") || document.querySelector(".spicy-pip-wrapper .LyricsContent") || document.querySelector(".Cinema--Container .LyricsContent") || document.querySelector(".LyricsContainer .LyricsContent") || document.querySelector(".LyricsContent");
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
    insertTranslateButtonIntoDocument(document);
    const pipWindow = getPIPWindow();
    if (pipWindow) {
      insertTranslateButtonIntoDocument(pipWindow.document);
    }
  }
  function insertTranslateButtonIntoDocument(doc) {
    const viewControls = doc.querySelector("#SpicyLyricsPage .ViewControls") || doc.querySelector(".ViewControls");
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
    if (button) {
      button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
      button.classList.toggle("active", state.isEnabled);
      const buttonWithTippy = button;
      if (buttonWithTippy._tippy) {
        buttonWithTippy._tippy.setContent(state.isEnabled ? "Disable Translation" : "Enable Translation");
      }
    }
    const pipWindow = getPIPWindow();
    if (pipWindow) {
      const pipButton = pipWindow.document.querySelector("#TranslateToggle");
      if (pipButton) {
        pipButton.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
        pipButton.classList.toggle("active", state.isEnabled);
      }
    }
  }
  function restoreButtonState() {
    const button = document.querySelector("#TranslateToggle");
    if (button) {
      button.classList.remove("loading");
      button.classList.remove("error");
      button.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
    }
    const pipWindow = getPIPWindow();
    if (pipWindow) {
      const pipButton = pipWindow.document.querySelector("#TranslateToggle");
      if (pipButton) {
        pipButton.classList.remove("loading");
        pipButton.classList.remove("error");
        pipButton.innerHTML = state.isEnabled ? Icons.Translate : Icons.TranslateOff;
      }
    }
  }
  function setButtonErrorState(hasError) {
    const button = document.querySelector("#TranslateToggle");
    if (button) {
      button.classList.toggle("error", hasError);
    }
    const pipWindow = getPIPWindow();
    if (pipWindow) {
      const pipButton = pipWindow.document.querySelector("#TranslateToggle");
      if (pipButton) {
        pipButton.classList.toggle("error", hasError);
      }
    }
  }
  async function handleTranslateToggle() {
    let button = document.querySelector("#TranslateToggle");
    const pipWindow = getPIPWindow();
    if (!button && pipWindow) {
      button = pipWindow.document.querySelector("#TranslateToggle");
    }
    if (state.isTranslating) {
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
  async function waitForLyricsAndTranslate(retries = 10, delay = 500) {
    console.log("[SpicyLyricTranslater] Waiting for lyrics to load...");
    let previousContentHash = "";
    let stableCount = 0;
    const requiredStableIterations = 2;
    for (let i = 0; i < retries; i++) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (!isSpicyLyricsOpen()) {
        console.log("[SpicyLyricTranslater] SpicyLyrics not open, stopping retry");
        return;
      }
      if (state.isTranslating) {
        console.log("[SpicyLyricTranslater] Already translating, stopping retry");
        return;
      }
      const lines = getLyricsLines();
      if (lines.length === 0) {
        console.log(`[SpicyLyricTranslater] Attempt ${i + 1}/${retries}: No lyrics found yet`);
        previousContentHash = "";
        stableCount = 0;
        continue;
      }
      const currentContent = Array.from(lines).slice(0, 5).map((l) => l.textContent?.trim() || "").join("|");
      const currentHash = currentContent.substring(0, 100);
      if (currentHash === previousContentHash && currentHash.length > 0) {
        stableCount++;
        console.log(`[SpicyLyricTranslater] Attempt ${i + 1}/${retries}: Lyrics stable (${stableCount}/${requiredStableIterations})`);
        if (stableCount >= requiredStableIterations) {
          console.log(`[SpicyLyricTranslater] Found ${lines.length} stable lyrics lines after ${i + 1} attempts`);
          await translateCurrentLyrics();
          return;
        }
      } else {
        console.log(`[SpicyLyricTranslater] Attempt ${i + 1}/${retries}: Lyrics content changed, resetting stability counter`);
        stableCount = 0;
      }
      previousContentHash = currentHash;
    }
    console.log("[SpicyLyricTranslater] Gave up waiting for stable lyrics after", retries, "attempts");
  }
  function getLyricsLines() {
    let lines = document.querySelectorAll("#SpicyLyricsPage .LyricsContent .line:not(.musical-line)");
    if (lines.length === 0) {
      lines = document.querySelectorAll(".LyricsContent .line:not(.musical-line)");
    }
    if (lines.length === 0) {
      lines = document.querySelectorAll(".LyricsContainer .line:not(.musical-line)");
    }
    if (lines.length > 0) {
      console.log(`[SpicyLyricTranslater] Found ${lines.length} lyrics lines in main document`);
      return lines;
    }
    const pipWindow = getPIPWindow();
    if (pipWindow) {
      lines = pipWindow.document.querySelectorAll("#SpicyLyricsPage .LyricsContent .line:not(.musical-line)");
      if (lines.length === 0) {
        lines = pipWindow.document.querySelectorAll(".LyricsContent .line:not(.musical-line)");
      }
      if (lines.length === 0) {
        lines = pipWindow.document.querySelectorAll(".LyricsContainer .line:not(.musical-line)");
      }
      if (lines.length > 0) {
        console.log(`[SpicyLyricTranslater] Found ${lines.length} lyrics lines in PIP`);
        return lines;
      }
    }
    console.log("[SpicyLyricTranslater] No lyrics lines found");
    return lines;
  }
  function extractLineText(lineElement) {
    if (lineElement.classList.contains("musical-line")) {
      return "";
    }
    const letterGroups = lineElement.querySelectorAll(".letterGroup");
    if (letterGroups.length > 0) {
      const parts = [];
      const children = lineElement.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.classList.contains("letterGroup")) {
          const letters = child.querySelectorAll(".letter");
          const word = Array.from(letters).map((letter) => letter.textContent || "").join("");
          if (word)
            parts.push(word);
        } else if (child.classList.contains("word") && !child.classList.contains("dot")) {
          const text2 = child.textContent?.trim();
          if (text2 && text2 !== "\u2022")
            parts.push(text2);
        } else if (child.classList.contains("word-group")) {
          const text2 = child.textContent?.trim();
          if (text2 && text2 !== "\u2022")
            parts.push(text2);
        }
      }
      if (parts.length > 0) {
        return parts.join(" ").trim();
      }
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
    if (isOffline()) {
      const cacheStats = getCacheStats();
      if (cacheStats.entries > 0) {
        console.log("[SpicyLyricTranslater] Offline - will use cached translations only");
        if (state.showNotifications && typeof Spicetify !== "undefined" && Spicetify.showNotification) {
          Spicetify.showNotification("Offline - using cached translations");
        }
      } else {
        console.log("[SpicyLyricTranslater] Offline with no cache available");
        if (state.showNotifications && typeof Spicetify !== "undefined" && Spicetify.showNotification) {
          Spicetify.showNotification("Offline - translations unavailable", true);
        }
        return;
      }
    }
    const lines = getLyricsLines();
    if (lines.length === 0) {
      console.log("[SpicyLyricTranslater] No lyrics lines found, waiting...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const retryLines = getLyricsLines();
      if (retryLines.length === 0) {
        console.log("[SpicyLyricTranslater] Still no lyrics lines found");
        return;
      }
      return translateCurrentLyrics();
    }
    state.isTranslating = true;
    const button = document.querySelector("#TranslateToggle");
    if (button) {
      button.classList.add("loading");
      button.innerHTML = Icons.Loading;
    }
    const pipWindow = getPIPWindow();
    if (pipWindow) {
      const pipButton = pipWindow.document.querySelector("#TranslateToggle");
      if (pipButton) {
        pipButton.classList.add("loading");
        pipButton.innerHTML = Icons.Loading;
      }
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
        restoreButtonState();
        return;
      }
      console.log("[SpicyLyricTranslater] Translating", nonEmptyTexts.length, "lines...");
      const translations = await translateLyrics(lineTexts, state.targetLanguage);
      console.log("[SpicyLyricTranslater] Translation complete, got", translations.length, "results");
      const wasActuallyTranslated = translations.some((t) => t.wasTranslated === true);
      state.translatedLyrics.clear();
      translations.forEach((result, index) => {
        state.translatedLyrics.set(lineTexts[index], result.translatedText);
      });
      applyTranslations(lines);
      if (state.showNotifications && typeof Spicetify !== "undefined" && Spicetify.showNotification) {
        if (wasActuallyTranslated) {
          Spicetify.showNotification("Lyrics translated successfully!");
        } else {
          Spicetify.showNotification("Lyrics are already in the target language");
        }
      }
    } catch (error) {
      console.error("[SpicyLyricTranslater] Translation failed:", error);
      if (state.showNotifications && typeof Spicetify !== "undefined" && Spicetify.showNotification) {
        Spicetify.showNotification("Translation failed. Please try again.", true);
      }
      setButtonErrorState(true);
      setTimeout(() => setButtonErrorState(false), 3e3);
    } finally {
      state.isTranslating = false;
      restoreButtonState();
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
        restoreLineText(line);
        line.dataset.originalText = originalText;
        line.dataset.lineIndex = index.toString();
        line.classList.add("spicy-translated");
        const contentElements = line.querySelectorAll(".word, .syllable, .letterGroup, .word-group, .letter");
        if (contentElements.length > 0) {
          contentElements.forEach((el) => {
            el.classList.add("spicy-hidden-original");
          });
        } else {
          const existingWrapper = line.querySelector(".spicy-original-wrapper");
          if (!existingWrapper) {
            const originalContent = line.innerHTML;
            const wrapper = document.createElement("span");
            wrapper.className = "spicy-original-wrapper spicy-hidden-original";
            wrapper.innerHTML = originalContent;
            line.innerHTML = "";
            line.appendChild(wrapper);
          }
        }
        const translationSpan = document.createElement("span");
        translationSpan.className = "spicy-translation-container spicy-translation-text";
        translationSpan.textContent = translatedText;
        line.appendChild(translationSpan);
      }
    });
    correctLyricsScroll();
  }
  function correctLyricsScroll() {
    requestAnimationFrame(() => {
      const activeLine = document.querySelector(".LyricsContent .line.active, .LyricsContent .line.current") || document.querySelector(".LyricsContainer .line.active, .LyricsContainer .line.current");
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: "auto", block: "center" });
      }
      const pipWindow = getPIPWindow();
      if (pipWindow) {
        const pipActiveLine = pipWindow.document.querySelector(".LyricsContent .line.active, .LyricsContent .line.current") || pipWindow.document.querySelector(".LyricsContainer .line.active, .LyricsContainer .line.current");
        if (pipActiveLine) {
          pipActiveLine.scrollIntoView({ behavior: "auto", block: "center" });
        }
      }
    });
  }
  function restoreLineText(line) {
    const hiddenElements = line.querySelectorAll(".spicy-hidden-original");
    hiddenElements.forEach((el) => {
      el.classList.remove("spicy-hidden-original");
    });
    const translationTexts = line.querySelectorAll(".spicy-translation-container");
    translationTexts.forEach((el) => el.remove());
    const wrapper = line.querySelector(".spicy-original-wrapper");
    if (wrapper) {
      const originalContent = wrapper.innerHTML;
      wrapper.remove();
      if (line.innerHTML.trim() === "" || !line.querySelector(".word, .syllable, .letterGroup, .letter")) {
        line.innerHTML = originalContent;
      }
    }
    const wordElements = line.querySelectorAll(".word[data-original-word]");
    wordElements.forEach((wordEl) => {
      const el = wordEl;
      if (el.dataset.originalWord !== void 0) {
        el.textContent = el.dataset.originalWord;
        delete el.dataset.originalWord;
      }
    });
  }
  function removeTranslations() {
    const documents = [document];
    const pipWindow = getPIPWindow();
    if (pipWindow) {
      documents.push(pipWindow.document);
    }
    documents.forEach((doc) => {
      const translations = doc.querySelectorAll(".spicy-translation-container");
      translations.forEach((el) => el.remove());
      const hiddenElements = doc.querySelectorAll(".spicy-hidden-original");
      hiddenElements.forEach((el) => {
        el.classList.remove("spicy-hidden-original");
      });
      const wrappers = doc.querySelectorAll(".spicy-original-wrapper");
      wrappers.forEach((wrapper) => {
        const parent = wrapper.parentElement;
        if (parent) {
          const originalContent = wrapper.innerHTML;
          wrapper.remove();
          if (parent.innerHTML.trim() === "" || !parent.querySelector(".word, .syllable, .letterGroup, .letter")) {
            parent.innerHTML = originalContent;
          }
        }
      });
      const translatedLines = doc.querySelectorAll(".spicy-translated");
      translatedLines.forEach((line) => {
        line.classList.remove("spicy-translated");
      });
      const wordElements = doc.querySelectorAll(".word[data-original-word]");
      wordElements.forEach((wordEl) => {
        const el = wordEl;
        if (el.dataset.originalWord !== void 0) {
          el.textContent = el.dataset.originalWord;
          delete el.dataset.originalWord;
        }
      });
    });
    state.translatedLyrics.clear();
  }
  function showSettingsModal() {
    if (typeof Spicetify === "undefined" || !Spicetify.PopupModal) {
      alert("Settings not available - Spicetify PopupModal not found");
      return;
    }
    const languageOptions = SUPPORTED_LANGUAGES.map((lang) => `<option value="${lang.code}" ${lang.code === state.targetLanguage ? "selected" : ""}>${lang.name}</option>`).join("");
    const apiOptions = `
        <option value="google" ${state.preferredApi === "google" ? "selected" : ""}>Google Translate</option>
        <option value="libretranslate" ${state.preferredApi === "libretranslate" ? "selected" : ""}>LibreTranslate</option>
        <option value="custom" ${state.preferredApi === "custom" ? "selected" : ""}>Custom API</option>
    `;
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
                <div class="setting-label">Preferred API</div>
                <div class="setting-description">Select the translation service to use</div>
            </div>
            <select id="spicy-translate-api-select">
                ${apiOptions}
            </select>
        </div>
        <div class="setting-item" id="spicy-translate-custom-api-container" style="display: ${state.preferredApi === "custom" ? "flex" : "none"}">
            <div>
                <div class="setting-label">Custom API URL</div>
                <div class="setting-description">Enter your custom translation API endpoint</div>
            </div>
            <input type="text" id="spicy-translate-custom-api-url" placeholder="https://your-api.com/translate" value="${state.customApiUrl}" />
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
                <div class="setting-label">Show Notifications</div>
                <div class="setting-description">Show notifications for translation status</div>
            </div>
            <div class="toggle-switch ${state.showNotifications ? "active" : ""}" id="spicy-translate-notifications"></div>
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Translation Cache</div>
                <div class="setting-description">${getCacheStats().entries} cached translations (${formatBytes(getCacheStats().sizeBytes)})</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="spicy-translate-view-cache">View Cache</button>
                <button id="spicy-translate-clear-cache">Clear All</button>
            </div>
        </div>
        <div class="setting-item">
            <div>
                <div class="setting-label">Version</div>
                <div class="setting-description">v${VERSION} \u2022 <a href="${REPO_URL}" target="_blank" style="color: var(--spice-button-active);">View on GitHub</a></div>
            </div>
            <button id="spicy-translate-check-updates">Check for Updates</button>
        </div>
        <div class="setting-item" style="border-bottom: none; opacity: 0.7; font-size: 12px;">
            <div>
                <div class="setting-description">Keyboard shortcut: Alt+T to toggle translation</div>
            </div>
        </div>
    `;
    setTimeout(() => {
      const langSelect = document.getElementById("spicy-translate-lang-select");
      const apiSelect = document.getElementById("spicy-translate-api-select");
      const customApiContainer = document.getElementById("spicy-translate-custom-api-container");
      const customApiUrlInput = document.getElementById("spicy-translate-custom-api-url");
      const autoToggle = document.getElementById("spicy-translate-auto");
      const notificationsToggle = document.getElementById("spicy-translate-notifications");
      const viewCacheBtn = document.getElementById("spicy-translate-view-cache");
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
      if (apiSelect) {
        apiSelect.addEventListener("change", () => {
          state.preferredApi = apiSelect.value;
          storage.set("preferred-api", state.preferredApi);
          setPreferredApi(state.preferredApi, state.customApiUrl);
          if (customApiContainer) {
            customApiContainer.style.display = state.preferredApi === "custom" ? "flex" : "none";
          }
        });
      }
      if (customApiUrlInput) {
        customApiUrlInput.addEventListener("change", () => {
          state.customApiUrl = customApiUrlInput.value;
          storage.set("custom-api-url", state.customApiUrl);
          setPreferredApi(state.preferredApi, state.customApiUrl);
        });
      }
      if (autoToggle) {
        autoToggle.addEventListener("click", () => {
          state.autoTranslate = !state.autoTranslate;
          storage.set("auto-translate", state.autoTranslate.toString());
          autoToggle.classList.toggle("active", state.autoTranslate);
        });
      }
      if (notificationsToggle) {
        notificationsToggle.addEventListener("click", () => {
          state.showNotifications = !state.showNotifications;
          storage.set("show-notifications", state.showNotifications.toString());
          notificationsToggle.classList.toggle("active", state.showNotifications);
        });
      }
      if (viewCacheBtn) {
        viewCacheBtn.addEventListener("click", () => {
          Spicetify.PopupModal.hide();
          setTimeout(() => showCacheViewerModal(), 150);
        });
      }
      if (clearCacheBtn) {
        clearCacheBtn.addEventListener("click", () => {
          clearTranslationCache();
          if (state.showNotifications && Spicetify.showNotification) {
            Spicetify.showNotification("Translation cache cleared!");
          }
          Spicetify.PopupModal.hide();
          setTimeout(() => showSettingsModal(), 100);
        });
      }
      const checkUpdatesBtn = document.getElementById("spicy-translate-check-updates");
      if (checkUpdatesBtn) {
        checkUpdatesBtn.addEventListener("click", async () => {
          checkUpdatesBtn.textContent = "Checking...";
          checkUpdatesBtn.setAttribute("disabled", "true");
          try {
            const info = await getUpdateInfo();
            if (info?.hasUpdate) {
              Spicetify.PopupModal.hide();
              setTimeout(() => checkForUpdates(true), 150);
            } else {
              if (Spicetify.showNotification) {
                Spicetify.showNotification("You're on the latest version!");
              }
              checkUpdatesBtn.textContent = "Check for Updates";
              checkUpdatesBtn.removeAttribute("disabled");
            }
          } catch (error) {
            checkUpdatesBtn.textContent = "Check for Updates";
            checkUpdatesBtn.removeAttribute("disabled");
            if (Spicetify.showNotification) {
              Spicetify.showNotification("Failed to check for updates", true);
            }
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
  function showCacheViewerModal() {
    if (typeof Spicetify === "undefined" || !Spicetify.PopupModal) {
      return;
    }
    const cachedItems = getCachedTranslations();
    const stats = getCacheStats();
    const content = document.createElement("div");
    content.className = "spicy-translate-settings";
    if (cachedItems.length === 0) {
      content.innerHTML = `
            <div style="text-align: center; padding: 20px; opacity: 0.7;">
                <p>No cached translations yet.</p>
                <p style="font-size: 12px;">Translations will be cached here as you use the extension.</p>
            </div>
            <div class="setting-item" style="border-bottom: none;">
                <button id="spicy-cache-back">Back to Settings</button>
            </div>
        `;
    } else {
      const itemsHtml = cachedItems.slice(0, 50).map((item, index) => `
            <div class="cache-item" data-index="${index}" style="padding: 8px 0; border-bottom: 1px solid var(--spice-misc, #535353);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 11px; opacity: 0.6; margin-bottom: 2px;">${item.language.toUpperCase()} \u2022 ${item.api ? item.api.toUpperCase() + " \u2022 " : ""}${item.date.toLocaleDateString()}</div>
                        <div style="font-size: 13px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.original}">${truncateText(item.original, 40)}</div>
                        <div style="font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.translated}">${truncateText(item.translated, 40)}</div>
                    </div>
                    <button class="cache-delete-btn" data-original="${encodeURIComponent(item.original)}" data-lang="${item.language}" style="padding: 4px 8px; font-size: 12px; flex-shrink: 0;">\u2715</button>
                </div>
            </div>
        `).join("");
      content.innerHTML = `
            <div style="margin-bottom: 12px; opacity: 0.7; font-size: 12px;">
                Showing ${Math.min(cachedItems.length, 50)} of ${stats.entries} cached translations (${formatBytes(stats.sizeBytes)})
            </div>
            <div id="spicy-cache-list" style="max-height: 300px; overflow-y: auto;">
                ${itemsHtml}
            </div>
            <div class="setting-item" style="border-bottom: none; margin-top: 12px; display: flex; gap: 8px;">
                <button id="spicy-cache-back">Back to Settings</button>
                <button id="spicy-cache-clear-all" style="background: #e74c3c;">Clear All</button>
            </div>
        `;
    }
    setTimeout(() => {
      const backBtn = document.getElementById("spicy-cache-back");
      const clearAllBtn = document.getElementById("spicy-cache-clear-all");
      const deleteButtons = document.querySelectorAll(".cache-delete-btn");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          Spicetify.PopupModal.hide();
          setTimeout(() => showSettingsModal(), 100);
        });
      }
      if (clearAllBtn) {
        clearAllBtn.addEventListener("click", () => {
          clearTranslationCache();
          if (state.showNotifications && Spicetify.showNotification) {
            Spicetify.showNotification("Translation cache cleared!");
          }
          Spicetify.PopupModal.hide();
          setTimeout(() => showSettingsModal(), 100);
        });
      }
      deleteButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const button = e.target;
          const original = decodeURIComponent(button.dataset.original || "");
          const lang = button.dataset.lang || "";
          if (deleteCachedTranslation(original, lang)) {
            const cacheItem = button.closest(".cache-item");
            if (cacheItem) {
              cacheItem.remove();
            }
            const newStats = getCacheStats();
            const countDisplay = content.querySelector('div[style*="margin-bottom: 12px"]');
            if (countDisplay) {
              const remaining = getCachedTranslations().length;
              countDisplay.textContent = `Showing ${Math.min(remaining, 50)} of ${newStats.entries} cached translations (${formatBytes(newStats.sizeBytes)})`;
            }
          }
        });
      });
    }, 100);
    Spicetify.PopupModal.display({
      title: "Translation Cache",
      content,
      isLarge: true
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
    console.log("[SpicyLyricTranslater] Lyrics view detected, initializing...");
    setViewingLyrics(true);
    let viewControls = await waitForElement2("#SpicyLyricsPage .ViewControls", 3e3);
    if (!viewControls) {
      viewControls = await waitForElement2(".spicy-pip-wrapper .ViewControls", 3e3);
    }
    if (!viewControls) {
      viewControls = await waitForElement2(".Cinema--Container .ViewControls", 3e3);
    }
    if (!viewControls) {
      viewControls = await waitForElement2(".ViewControls", 3e3);
    }
    if (!viewControls) {
      const pipWindow = getPIPWindow();
      if (pipWindow) {
        viewControls = pipWindow.document.querySelector("#SpicyLyricsPage .ViewControls");
      }
    }
    if (viewControls) {
      console.log("[SpicyLyricTranslater] ViewControls found, inserting button");
      insertTranslateButton();
      injectStylesIntoPIP();
      setupViewControlsObserver();
    } else {
      console.log("[SpicyLyricTranslater] ViewControls not found, will retry...");
    }
    setupLyricsObserver();
    if (state.autoTranslate) {
      if (!state.isEnabled) {
        state.isEnabled = true;
        storage.set("translation-enabled", "true");
        updateButtonState();
      }
      waitForLyricsAndTranslate(10, 800);
    }
  }
  function injectStylesIntoPIP() {
    const pipWindow = getPIPWindow();
    if (!pipWindow)
      return;
    if (pipWindow.document.getElementById("spicy-lyric-translater-styles"))
      return;
    const mainStyles = document.getElementById("spicy-lyric-translater-styles");
    if (mainStyles) {
      const pipStyles = pipWindow.document.createElement("style");
      pipStyles.id = "spicy-lyric-translater-styles";
      pipStyles.textContent = mainStyles.textContent;
      pipWindow.document.head.appendChild(pipStyles);
      console.log("[SpicyLyricTranslater] Injected styles into PIP window");
    }
  }
  function onSpicyLyricsClose() {
    setViewingLyrics(false);
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
    console.log("[SpicyLyricTranslater] Setting up page observer...");
    if (isSpicyLyricsOpen()) {
      console.log("[SpicyLyricTranslater] Lyrics view already open");
      onSpicyLyricsOpen();
    }
    const mainView = document.querySelector(".Root__main-view") || document.body;
    const observerTarget = mainView;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const isLyricsNode = (node) => {
            if (node.nodeType !== Node.ELEMENT_NODE)
              return false;
            const el = node;
            return el.id === "SpicyLyricsPage" || el.classList?.contains("Cinema--Container") || el.classList?.contains("spicy-lyrics-cinema") || el.classList?.contains("spicy-pip-wrapper") || !!el.querySelector("#SpicyLyricsPage") || !!el.querySelector(".Cinema--Container") || !!el.querySelector(".spicy-pip-wrapper");
          };
          const added = Array.from(mutation.addedNodes).some(isLyricsNode);
          const removed = Array.from(mutation.removedNodes).some(isLyricsNode);
          if (added) {
            console.log("[SpicyLyricTranslater] Lyrics view opened");
            onSpicyLyricsOpen();
          }
          if (removed) {
            console.log("[SpicyLyricTranslater] Lyrics view closed");
            onSpicyLyricsClose();
          }
        }
      }
    });
    observer.observe(observerTarget, {
      childList: true,
      subtree: true
    });
    console.log(`[SpicyLyricTranslater] Observer attached to ${observerTarget === document.body ? "document.body" : ".Root__main-view"}`);
    setupPIPObserver();
  }
  function setupPIPObserver() {
    const docPiP = globalThis.documentPictureInPicture;
    if (!docPiP)
      return;
    docPiP.addEventListener("enter", (event) => {
      console.log("[SpicyLyricTranslater] PIP window opened");
      const pipWindow = event.window;
      if (pipWindow) {
        setTimeout(() => {
          injectStylesIntoPIP();
          insertTranslateButton();
          setupPIPLyricsObserver(pipWindow);
          if (state.isEnabled && state.translatedLyrics.size > 0) {
            const lines = getLyricsLines();
            if (lines.length > 0) {
              applyTranslations(lines);
            }
          }
        }, 1e3);
      }
    });
  }
  function setupPIPLyricsObserver(pipWindow) {
    const lyricsContent = pipWindow.document.querySelector(".LyricsContent");
    if (!lyricsContent) {
      setTimeout(() => setupPIPLyricsObserver(pipWindow), 500);
      return;
    }
    const pipObserver = new MutationObserver((mutations) => {
      if (!state.isEnabled || state.isTranslating)
        return;
      const hasNewContent = mutations.some(
        (m) => m.type === "childList" && m.addedNodes.length > 0 && Array.from(m.addedNodes).some(
          (n) => n.nodeType === Node.ELEMENT_NODE && n.classList?.contains("line")
        )
      );
      if (hasNewContent && !state.isTranslating) {
        setTimeout(() => {
          if (!state.isTranslating && state.isEnabled) {
            translateCurrentLyrics();
          }
        }, 300);
      }
    });
    pipObserver.observe(lyricsContent, {
      childList: true,
      subtree: true
    });
  }
  function getCurrentViewMode() {
    const pipWindow = getPIPWindow();
    if (pipWindow && pipWindow.document.querySelector("#SpicyLyricsPage")) {
      return "pip";
    }
    const page = document.querySelector("#SpicyLyricsPage");
    if (!page)
      return "none";
    if (page.classList.contains("SidebarMode"))
      return "sidebar";
    if (page.classList.contains("ForcedCompactMode"))
      return "compact";
    if (document.fullscreenElement)
      return "fullscreen";
    const isInFullscreenContainer = !!document.querySelector(".Cinema--Container #SpicyLyricsPage");
    if (isInFullscreenContainer)
      return "cinema";
    return "normal";
  }
  function setupViewModeObserver() {
    setInterval(() => {
      const currentMode = getCurrentViewMode();
      if (state.lastViewMode !== null && state.lastViewMode !== currentMode && currentMode !== "none") {
        console.log(`[SpicyLyricTranslater] View mode changed: ${state.lastViewMode} -> ${currentMode}`);
        setTimeout(() => {
          insertTranslateButton();
          if (state.isEnabled && state.translatedLyrics.size > 0) {
            const lines = getLyricsLines();
            if (lines.length > 0) {
              applyTranslations(lines);
            }
          } else if (state.isEnabled) {
            translateCurrentLyrics();
          }
        }, 500);
      }
      state.lastViewMode = currentMode;
    }, 1e3);
  }
  function setupKeyboardShortcut() {
    document.addEventListener("keydown", (e) => {
      if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        e.stopPropagation();
        if (isSpicyLyricsOpen()) {
          handleTranslateToggle();
        }
      }
    });
  }
  async function initialize() {
    while (typeof Spicetify === "undefined" || !Spicetify.Platform) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log("[SpicyLyricTranslater] Initializing...");
    state.isEnabled = storage.get("translation-enabled") === "true";
    state.targetLanguage = storage.get("target-language") || "en";
    state.autoTranslate = storage.get("auto-translate") === "true";
    state.showNotifications = storage.get("show-notifications") !== "false";
    state.preferredApi = storage.get("preferred-api") || "google";
    state.customApiUrl = storage.get("custom-api-url") || "";
    setPreferredApi(state.preferredApi, state.customApiUrl);
    injectStyles();
    initConnectionIndicator();
    registerSettingsMenu();
    startUpdateChecker(30 * 60 * 1e3);
    setupKeyboardShortcut();
    setupPageObserver();
    setupViewModeObserver();
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
        console.log("[SpicyLyricTranslater] Song changed");
        state.translatedLyrics.clear();
        removeTranslations();
        if (state.autoTranslate) {
          if (!state.isEnabled) {
            state.isEnabled = true;
            storage.set("translation-enabled", "true");
            updateButtonState();
          }
          waitForLyricsAndTranslate(15, 1e3);
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
    toggle: () => {
      if (isSpicyLyricsOpen()) {
        handleTranslateToggle();
      }
    },
    setLanguage: (lang) => {
      state.targetLanguage = lang;
      storage.set("target-language", lang);
    },
    translate: translateCurrentLyrics,
    showSettings: showSettingsModal,
    showCacheViewer: showCacheViewerModal,
    clearCache: clearTranslationCache,
    getCacheStats,
    getCachedTranslations,
    deleteCachedTranslation,
    getState: () => ({ ...state }),
    checkForUpdates: () => checkForUpdates(true),
    getUpdateInfo,
    version: VERSION,
    // Connectivity features
    connectivity: {
      getState: getConnectionState,
      refresh: refreshConnection
    }
  };
  initialize().catch(console.error);
  var app_default = initialize;
  return __toCommonJS(app_exports);
})();
