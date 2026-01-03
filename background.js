// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addToSliceMark',
    title: 'Add to SliceMark',
    contexts: ['page', 'link']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'addToSliceMark') {
    const url = info.linkUrl || tab.url;
    const title = info.selectionText || tab.title;
    
    // Store pending bookmark data
    await chrome.storage.local.set({
      pendingBookmark: { url, title, timestamp: Date.now() }
    });
    
    // Open popup by triggering action
    chrome.action.openPopup();
  }
});
