# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do NOT** open a public issue
2. Email the maintainer directly or use GitHub's private vulnerability reporting
3. Include detailed information about the vulnerability
4. Allow time for a fix before public disclosure

## Data & Privacy

This extension:

- **Does NOT** collect any personal data
- **Does NOT** send any data to external servers except for translation requests
- **Does NOT** store any sensitive information
- Uses Google Translate API (public endpoint) for translations
- Caches translations locally in your browser's localStorage only

## Translation API

The extension uses publicly available translation APIs:
- Primary: Google Translate (gtx endpoint)
- Fallback: LibreTranslate public instances

No authentication tokens or API keys are required or stored.

## Permissions

This extension only interacts with:
- Spotify's DOM (through Spicetify)
- Browser localStorage (for caching)
- External translation APIs (read-only requests)

## Dependencies

We keep dependencies minimal and regularly updated:
- `esbuild` - Build tool (dev only)
- `typescript` - Type checking (dev only)

No runtime dependencies are bundled.
