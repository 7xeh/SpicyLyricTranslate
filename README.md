# Spicy Lyric Translater

A Spicetify extension that adds real-time translation to [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics).

![Spicetify](https://img.shields.io/badge/Spicetify-Extension-1DB954?style=flat-square&logo=spotify&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## Features

- 🌍 **Translate Button** - Adds a translation toggle to the Spicy Lyrics view controls bar (next to romanize, fullscreen, etc.)
- 🔄 **100+ Languages** - Supports English, Spanish, French, German, Japanese, Korean, Chinese, and many more
- 🧠 **Smart Detection** - Automatically skips translation if lyrics are already in your target language
- 💾 **Smart Caching** - Caches translations locally with intelligent cache management
- 📊 **Cache Viewer** - View, manage, and delete individual cached translations
- ⚙️ **Customizable** - Right-click the translate button to access settings
- 🔁 **Auto-Translate** - Optionally translate lyrics automatically when they load
- ⌨️ **Keyboard Shortcut** - Press `Alt+T` to quickly toggle translation
- 🔌 **Multiple APIs** - Google Translate (primary), LibreTranslate (fallback), or custom API
- 🖼️ **Multi-View Support** - Works in main view, Cinema View, and Picture-in-Picture mode
- 📴 **Offline Support** - Uses cached translations when offline

## Preview

![Preview](https://github.com/7xeh/SpicyLyricTranslate/blob/main/preview.png)

## Requirements

- [Spicetify](https://spicetify.app/) installed and configured  
- [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics) extension installed

## Installation

### Easy Install (Recommended)

Download and run the official installer script:

[Install Spicy Lyric Translater — Installer Script](https://github.com/7xeh/SpicyLyricTranslate/releases/download/v1.4.1/Install.Spicetify.+.SpicyTranslate.cmd)

This script automates installation and setup.

### Manual Install

1. Download `spicy-lyric-translater.js` from the `builds` folder  
2. Copy it to your Spicetify Extensions folder:
   - **Windows:** `%APPDATA%\spicetify\Extensions\`
   - **Linux/macOS:** `~/.config/spicetify/Extensions/`
3. Run:
   ```bash
   spicetify config extensions spicy-lyric-translater.js
   spicetify apply
   ```
4. Restart Spotify

### Spicetify Marketplace

*Coming soon!*

### Build from Source

1. Clone this repository  
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build:
   ```bash
   npm run build
   ```
4. The built file will be at `dist/spicy-lyric-translater.js`

## Usage

1. Open Spotify and play a song with lyrics  
2. Open Spicy Lyrics (via the lyrics button in the player bar)  
3. You'll see a new **translate button** (🌐) in the view controls bar  
4. Click to enable/disable translation  
5. **Right-click** for settings  
6. Press **Alt+T** to quickly toggle translation

### Settings

Access settings by right-clicking the translate button:

- **Target Language** – Choose from 100+ languages  
- **Preferred API** – Select Google Translate, LibreTranslate, or a custom API  
- **Custom API URL** – Use your own translation endpoint  
- **Auto-Translate** – Automatically translate when lyrics load  
- **Show Notifications** – Toggle translation status notifications  
- **View Cache** – Browse and manage cached translations  
- **Clear All** – Remove all stored translations  

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+T` | Toggle translation on/off |

### API (Developer)

Access the extension programmatically via `window.SpicyLyricTranslater`:

```javascript
SpicyLyricTranslater.enable()           // Enable translation
SpicyLyricTranslater.disable()          // Disable translation
SpicyLyricTranslater.toggle()           // Toggle translation
SpicyLyricTranslater.setLanguage('es')  // Set target language
SpicyLyricTranslater.showSettings()     // Open settings modal
SpicyLyricTranslater.showCacheViewer()  // Open cache viewer
SpicyLyricTranslater.clearCache()       // Clear all cached translations
SpicyLyricTranslater.getCacheStats()    // Get cache statistics
SpicyLyricTranslater.getState()         // Get current extension state
```  

## Supported Languages

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | en | Korean | ko |  
| Spanish | es | Chinese (Simplified) | zh |  
| French | fr | Chinese (Traditional) | zh-TW |  
| German | de | Arabic | ar |  
| Italian | it | Hindi | hi |  
| Portuguese | pt | Dutch | nl |  
| Russian | ru | Polish | pl |  
| Japanese | ja | Turkish | tr |  
| Vietnamese | vi | Thai | th |  
| Indonesian | id | Ukrainian | uk |  

## How It Works

1. **Translation** - Uses Google Translate API with LibreTranslate as fallback
2. **Language Detection** - Automatically detects source language and skips if already in target language
3. **Batch Processing** - Translates all lyrics at once for efficiency with rate limiting
4. **Smart Caching** - Results cached locally (up to 500 entries) with 7-day expiry
5. **Retry Logic** - Automatic retries with exponential backoff on failures
6. **Offline Mode** - Falls back to cached translations when offline

## Technical Details

- **Storage**: Uses browser localStorage with `spicy-lyric-translater:` prefix
- **Cache Limit**: 500 entries max, automatically prunes oldest entries
- **Rate Limiting**: 100ms minimum delay between API calls
- **Retry Policy**: Up to 3 retries with exponential backoff

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Watch mode (auto-rebuild on changes)
npm run build:watch

# Deploy to Spicetify (Windows)
npm run deploy
```

## Credits

- [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics) by Spikerko  
- [Spicetify](https://spicetify.app/)  
- Translation powered by Google Translate  

## Contributing

Contributions welcome! Submit issues or PRs anytime.

---

Made with ❤️ for the Spicetify community
