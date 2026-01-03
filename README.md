# SliceMark

A flexible and agile Chrome extension for managing bookmarks with tagging and segmentation capabilities.

## Features

- **Right-click Context Menu**: Save any webpage or link to SliceMark by right-clicking
- **Tag Management**: Add and filter bookmarks by custom tags
- **Search Functionality**: Quickly find bookmarks by title or URL
- **Clean Interface**: Modern, intuitive popup interface
- **One-click Open**: Open bookmarks in new tabs with a single click

## Installation

### For Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `slicemark` directory
5. The extension icon should appear in your Chrome toolbar

### Creating Icons

You need to add icon files in the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can create these using any image editor or online icon generator.

## Usage

### Adding Bookmarks

1. Right-click on any webpage or link
2. Select "Add to SliceMark" from the context menu
3. The bookmark will be saved automatically

### Managing Bookmarks

1. Click the SliceMark extension icon in your Chrome toolbar
2. View all your saved bookmarks
3. Add tags by typing in the tag input field (comma-separated)
4. Search bookmarks by title/URL or filter by tags
5. Click "Open" to open a bookmark in a new tab
6. Click "Delete" to remove a bookmark

## File Structure

```
slicemark/
├── manifest.json       # Extension configuration
├── background.js       # Background service worker for context menu
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic and bookmark management
├── styles.css         # Popup styling
├── icons/             # Extension icons
└── README.md          # This file
```

## Technologies Used

- Chrome Extension Manifest V3
- Vanilla JavaScript
- Chrome Storage API
- Chrome Context Menus API
- Chrome Tabs API

## License

MIT
