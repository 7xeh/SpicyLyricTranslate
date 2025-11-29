# Contributing to Spicy Lyric Translater

Thank you for your interest in contributing! This document provides guidelines and steps for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/7xeh/spicy-lyric-translater.git
   cd spicy-lyric-translater
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Development Workflow

### Building

```bash
# Build once
npm run build

# Build with watch mode (auto-rebuilds on changes)
npm run build:watch
```

### Testing Locally

1. Build the extension
2. Copy to Spicetify:
   ```bash
   npm run deploy
   ```
3. Apply changes:
   ```bash
   spicetify apply
   ```

### Creating a Release Build

```bash
npm run release
```

This builds and copies to the `builds/` folder.

## Project Structure

```
spicy-lyric-translater/
├── src/
│   ├── app.ts              # Main extension entry point
│   ├── spicetify.d.ts      # Spicetify type definitions
│   ├── styles/
│   │   └── main.ts         # CSS styles
│   └── utils/
│       ├── icons.ts        # SVG icons
│       ├── storage.ts      # LocalStorage wrapper
│       └── translator.ts   # Translation API logic
├── builds/                  # Pre-built extension for easy installation
├── dist/                    # Build output (gitignored)
├── manifest.json            # Spicetify extension manifest
├── package.json
├── tsconfig.json
└── README.md
```

## Code Style

- Use TypeScript for all source files
- Follow existing code patterns
- Add comments for complex logic
- Keep functions focused and small

## Submitting Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test thoroughly with Spicetify and Spicy Lyrics

4. Commit with clear messages:
   ```bash
   git commit -m "Add: description of feature"
   # or
   git commit -m "Fix: description of bug fix"
   ```

5. Push and create a Pull Request

## Pull Request Guidelines

- Describe what changes were made and why
- Reference any related issues
- Include screenshots for UI changes
- Ensure the build passes
- Update README if needed

## Reporting Issues

When reporting issues, please include:

- Spicetify version
- Spicy Lyrics version
- Spotify version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

## Questions?

Feel free to open an issue for questions or discussions.

---

Thank you for contributing! 🎉
