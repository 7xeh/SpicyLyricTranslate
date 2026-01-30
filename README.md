# Spicy Lyric Translator

Real-time lyric translation extension for **[Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics)** on Spicetify.

![Spicetify](https://img.shields.io/badge/Spicetify-Extension-1DB954?style=flat-square&logo=spotify&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Status](https://img.shields.io/badge/Status-Online-success?style=flat-square)

---

## Features

* **Interlinear Translation:** Displays translations directly below each original lyric line for a natural reading flow.
* **Flow Mode:** A streamlined UI mode designed to minimize background clutter and focus on the text.
* **TTML-Style Visuals:** Animated glow transitions and bloom effects that match the native Spicy Lyrics aesthetic.
* **Smart Caching:** Track-based caching system (up to 100 tracks) to ensure instant loading for repeated listens.
* **Native Integration:** Settings are injected directly into Spotify's native settings page.

---

## Changelog (v1.5.3 - v1.7.6)

* **v1.7.3 - v1.7.6:** * Improved "Below Each Line" layout for perfect DOM positioning.
    * Added music break indicators (`• • •`) for instrumental segments.
    * Reduced CPU usage by increasing polling intervals and throttling active line updates.
    * Fixed click-to-jump functionality so translations no longer block lyric navigation.
* **v1.7.0 - v1.7.2:**
    * Moved translation overlay inside the `LyricsContainer` for better scroll synchronization.
    * Improved responsive font sizing across PIP, Cinema, and Sidebar modes.
* **v1.6.7 - v1.6.9:**
    * Integrated SLT settings into the bottom of the native Spotify settings menu.
    * Fixed cache statistics reporting and improved local storage enumeration.
* **v1.6.4 - v1.6.8:**
    * Added TTML-style glow effects and cubic-bezier transitions for smooth easing.
    * Implemented subtle blur on inactive translation lines to improve visual hierarchy.
* **v1.6.0 - v1.6.3:**
    * Major stability refactor.
    * Introduced a track-based caching system using track URIs.
    * Added automatic pre-flight language detection to skip redundant translations.
    * Fixed interleaved translation blurring issues by moving them to a floating overlay.

---

## Preview

![Preview](https://github.com/7xeh/SpicyLyricTranslate/blob/main/preview.png)

---

## Quick Start

Install using **Spicetify Marketplace**:

1. Open Spicetify Marketplace.
2. Search for **Spicy Lyric Translator**.
3. Click **Install**.

Done. No additional setup required.

---

## Documentation

Full setup and usage guide:
https://7xeh.dev/apps/spicylyrictranslate/docs

---

## Status

Live status page:
https://7xeh.dev/apps/spicylyrictranslate/status/

---

## Community

Join the Discord server for support, updates, and feedback:
https://discord.gg/fXK34DeDW5

---

## Credits

Made for the Spicetify community by **7xeh**.
