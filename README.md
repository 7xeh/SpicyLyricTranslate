# Spicy Lyric Translater

Real-time lyric translation for [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics).

![Spicetify](https://img.shields.io/badge/Spicetify-Extension-1DB954?style=flat-square&logo=spotify&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## Features

- 🌍 100+ languages supported
- 🧠 Auto-detects source language, skips if already in target
- 💾 Smart caching with cache viewer
- 🔁 Auto-translate option
- ⌨️ `Alt+T` keyboard shortcut
- 🔌 Multiple APIs (Google, LibreTranslate, custom)
- 📴 Offline support via cached translations

![Preview](https://github.com/7xeh/SpicyLyricTranslate/blob/main/preview.png)

## Requirements

- [Spicetify](https://spicetify.app/)
- [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics)

## Installation

### Spicetify Marketplace (Recommended)

1. Open Spotify → Marketplace
2. Search "Spicy Lyric Translater"
3. Click Install

### CMD Installer

[Download Installer (v1.4.1)](https://github.com/7xeh/SpicyLyricTranslate/releases/download/v1.4.1/Install.Spicetify.+.SpicyTranslate.cmd)

### Manual

```bash
# Copy spicy-lyric-translater.js to Extensions folder
# Windows: %APPDATA%\spicetify\Extensions\
# Linux/macOS: ~/.config/spicetify/Extensions/

spicetify config extensions spicy-lyric-translater.js
spicetify apply
```

### Uninstall

```bash
spicetify config extensions spicy-lyric-translater.js-
spicetify apply
```

## Usage

1. Play a song with lyrics
2. Open Spicy Lyrics
3. Click the translate button (🌐) in the controls bar
4. **Right-click** for settings

## API

```javascript
SpicyLyricTranslater.toggle()           // Toggle translation
SpicyLyricTranslater.setLanguage('es')  // Set target language
SpicyLyricTranslater.showSettings()     // Open settings
SpicyLyricTranslater.clearCache()       // Clear cache
```

## Development

```bash
npm install
npm run build
npm run deploy  # Windows only
```

## Credits

- [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics) by Spikerko
- [Spicetify](https://spicetify.app/)

---

Made with ❤️ for the Spicetify community
