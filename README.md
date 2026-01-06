# SliceMark

A minimalist command-line style Chrome extension for managing URLs and clipboard text.

## Features

- **Sidebar Interface** - Clean side panel for managing bookmarks
- **Dual Collection** - Store URLs and clipboard text separately
- **Smart Display** - Compressed URLs (domain + first path) with full preview on hover
- **Color Tags** - Visual categorization with colored circles
- **Flexible Labels** - Add custom labels with truncation and hover preview
- **Real-time Search** - Fuzzy search across URLs, text, and labels
- **Quick Actions**
  - Click URL/labels to open in new tab
  - Click text to copy to clipboard
  - Right-click on page to add URL
  - Right-click on selected text to add to clipboard
- **Command-line Aesthetic** - Green terminal theme with Courier New font

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Storage

All data is stored locally using `chrome.storage.local` (bookmarks and textmarks).

## License

MIT
