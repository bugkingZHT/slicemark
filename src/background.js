chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add-text-selection',
    title: 'Add TEXT to SliceMark',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'add-page-url',
    title: 'Add URL to SliceMark',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'add-text-selection') {
    const text = info.selectionText;
    if (text) {
      chrome.storage.local.get(['textmarks'], (result) => {
        const textmarks = result.textmarks || [];
        
        if (!textmarks.some(t => t.text === text)) {
          const newTextmark = { text, timestamp: Date.now(), labels: [], color: '#ffffff' };
          textmarks.push(newTextmark);
          chrome.storage.local.set({ textmarks }, () => {
            chrome.runtime.sendMessage({ action: 'refresh' });
          });
        }
      });
    }
  } else if (info.menuItemId === 'add-page-url') {
    const url = tab.url;
    const title = tab.title;
    
    chrome.storage.local.get(['bookmarks'], (result) => {
      const bookmarks = result.bookmarks || [];
      
      if (!bookmarks.some(b => b.url === url)) {
        const newBookmark = { url, title, timestamp: Date.now(), labels: title ? [title] : [], color: '#ffffff' };
        bookmarks.push(newBookmark);
        chrome.storage.local.set({ bookmarks }, () => {
          chrome.runtime.sendMessage({ action: 'refresh' });
        });
      }
    });
  }
});
