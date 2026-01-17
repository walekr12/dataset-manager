# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dataset Manager** is an encrypted dataset management application for images and videos with AI tagging support. It's a pure frontend web application that runs entirely in the browser using IndexedDB for storage and Web Crypto API for encryption.

## Development Commands

### Start Development Server
```bash
npm run dev
```
Starts a local HTTP server on port 8080 and opens the browser.

### Start Production Server
```bash
npm start
```
Starts a local HTTP server on port 8080 without auto-opening.

### Install Dependencies
```bash
npm install
```

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Storage**: IndexedDB
- **Media Processing**: Canvas API, HTML5 Video
- **AI Integration**: OpenAI-compatible API via Fetch
- **Styling**: Pure CSS3 (Grid, Flexbox)

### Project Structure
```
src/
├── app.js              # Main application controller
├── crypto/             # Encryption & key management
├── db/                 # IndexedDB operations
├── ai/                 # AI API client & tag processing
├── ui/                 # UI components (grid, modal, settings, categories)
├── media/              # Image & video processors
└── utils/              # File handlers & validators
```

### Core Features
1. **End-to-End Encryption**: All files encrypted with user's master password
2. **AI Tagging**: OpenAI-compatible vision API for automatic content analysis
3. **Category Management**: Organize media into custom categories
4. **Grid View**: Thumbnail grid with resolution overlays
5. **Video Support**: Automatic keyframe extraction for previews
6. **Batch Operations**: Bulk import, tag, and delete

## Key Dependencies

- **http-server**: Local development server (dev dependency)
- No runtime dependencies - pure browser APIs

## Important Conventions

### Module System
- Uses ES6 modules (`import`/`export`)
- All JS files in `src/` are modules
- HTML loads `src/app.js` as `type="module"`

### Encryption Flow
1. User sets master password on first launch
2. Password derives AES-256 key via PBKDF2 (100k iterations)
3. All files and sensitive data encrypted before IndexedDB storage
4. Decryption happens in-memory only when needed

### Data Structure
- **Categories**: `{ id, name, description, color, createdAt }`
- **Media Items**: `{ id, categoryId, type, fileName, width, height, duration, thumbnailData, thumbnailIv, fileData, fileIv, aiTags, ... }`
- **AI Configs**: `{ id, apiUrl, apiKeyEncrypted, apiKeyIv, model, defaultPrompt, isActive }`

### UI Patterns
- Modal-based dialogs for all actions
- Grid view with lazy-loaded thumbnails
- Password lock/unlock mechanism
- Progress bars for long operations

## Security Notes

- Master password never stored, only verified via test encryption
- All encryption keys cleared from memory on lock
- API keys encrypted at rest in IndexedDB
- No data ever sent to external servers (except AI API calls)
- Suitable for NSFW/sensitive content management

## Testing

Currently no automated tests. Manual testing checklist:
1. Set master password
2. Import images and videos
3. Create categories
4. Configure AI (if available)
5. Tag individual items
6. Batch tag items
7. Lock and unlock app
8. Delete items

## Potential Issues

- **Browser Compatibility**: Requires modern browser with Web Crypto API and IndexedDB
- **Performance**: Large files (>100MB) may cause slowdowns
- **Storage Limits**: IndexedDB has browser-dependent size limits
- **AI Rate Limits**: Batch tagging may hit API rate limits

## Future Enhancements

- Tag-based search functionality
- Data export/import (with encryption)
- Custom AI prompt templates
- Electron desktop app wrapper
- Virtual scrolling for large datasets
- Dark mode theme
