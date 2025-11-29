# Spicy Lyric Translater

A Spicetify extension that adds real-time translation to [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics).

![Spicetify](https://img.shields.io/badge/Spicetify-Extension-1DB954?style=flat-square&logo=spotify&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## Features

- 🌍 **Translate Button** - Adds a translation toggle to the Spicy Lyrics view controls bar (next to romanize, fullscreen, etc.)
- 🔄 **20+ Languages** - Supports English, Spanish, French, German, Japanese, Korean, Chinese, and many more
- 🧠 **Smart Detection** - Automatically skips translation if lyrics are already in your target language
- 💾 **Caching** - Caches translations for 7 days to reduce API calls and improve performance
- ⚙️ **Customizable** - Right-click the translate button to access settings
- 🔁 **Auto-Translate** - Optionally translate lyrics automatically when they load

## Requirements

- [Spicetify](https://spicetify.app/) installed and configured
- [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics) extension installed

## Installation

### Easy Install (Recommended)

1. Download [`spicy-lyric-translater.js`](./dist/spicy-lyric-translater.js) from the `builds` folder
2. Copy it to your Spicetify Extensions folder:
   - **Windows:** `%APPDATA%\spicetify\Extensions\`
   - **Linux/macOS:** `~/.config/spicetify/Extensions/`
3. Run these commands:
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
2. Open Spicy Lyrics (click the lyrics button in the player bar)
3. You'll see a new **translate button** (🌐) in the view controls bar
4. Click the button to enable/disable translation
5. **Right-click** the button to open settings

### Settings

Right-click the translate button to access:

- **Target Language** - Choose your preferred language
- **Show Original** - Display original lyrics alongside translations
- **Auto-Translate** - Automatically translate when lyrics load
- **Clear Cache** - Remove cached translations

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

The extension uses Google Translate's API with LibreTranslate as a fallback. It detects the source language and skips translation if it matches your target language (e.g., won't translate English to English). Translations are cached locally for 7 days.

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

Contributions welcome! Feel free to open issues or submit pull requests.

---

Made with ❤️ for the Spicetify community
