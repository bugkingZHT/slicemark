function buildPrefixTree(urls) {
  if (urls.length === 0) return [];
  
  return urls.map(item => {
    let displayUrl = item.url;
    try {
      const url = new URL(item.url);
      const pathParts = url.pathname.split('/').filter(p => p);
      const firstPath = pathParts.length > 0 ? '/' + pathParts[0] : '';
      displayUrl = url.hostname + firstPath;
    } catch (e) {
      displayUrl = item.url;
    }
    
    return {
      url: item.url,
      displayUrl: displayUrl,
      title: item.title,
      labels: item.labels || [],
      color: item.color || '#ffffff',
      id: item.id || Date.now() + Math.random()
    };
  });
}

function renderTree(tree, container) {
  tree.forEach(node => {
    const line = document.createElement('div');
    line.className = 'tree-line';
    
    const tagDiv = document.createElement('span');
    tagDiv.className = 'tree-tag';
    
    const circle = document.createElement('div');
    circle.className = 'tag-circle';
    circle.style.backgroundColor = node.color;
    circle.onclick = () => openColorPicker(node, 'bookmarks');
    tagDiv.appendChild(circle);
    
    const text = document.createElement('span');
    text.className = 'tree-text';
    text.textContent = node.displayUrl;
    text.setAttribute('data-full-url', node.url);
    text.style.cursor = 'pointer';
    text.onclick = () => {
      showOpenToast();
      window.open(node.url, '_blank');
    };
    
    const labelsDiv = document.createElement('span');
    labelsDiv.className = 'tree-labels';
    labelsDiv.style.cursor = 'pointer';
    labelsDiv.onclick = () => {
      showOpenToast();
      window.open(node.url, '_blank');
    };
    const fullLabels = node.labels.join(', ');
    labelsDiv.setAttribute('data-full-labels', fullLabels);
    node.labels.forEach((label, idx) => {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'label-tag';
      labelSpan.style.color = '#00bfff';
      labelSpan.textContent = label;
      labelSpan.setAttribute('data-full-label', label);
      labelsDiv.appendChild(labelSpan);
    });
    
    const optionsDiv = document.createElement('span');
    optionsDiv.className = 'tree-options';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'tree-btn tree-btn-edit';
    editBtn.textContent = '✎';
    editBtn.onclick = () => openEditPanel(node, 'bookmarks');
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tree-btn tree-btn-delete';
    deleteBtn.textContent = '🗑';
    deleteBtn.onclick = () => deleteItem(node.url, 'bookmarks');
    
    optionsDiv.appendChild(editBtn);
    optionsDiv.appendChild(deleteBtn);
    
    line.appendChild(tagDiv);
    line.appendChild(text);
    line.appendChild(labelsDiv);
    line.appendChild(optionsDiv);
    container.appendChild(line);
  });
}

function renderTextMarks(textmarks, container) {
  textmarks.forEach(item => {
    const line = document.createElement('div');
    line.className = 'tree-line';
    
    const tagDiv = document.createElement('span');
    tagDiv.className = 'tree-tag';
    
    const circle = document.createElement('div');
    circle.className = 'tag-circle';
    circle.style.backgroundColor = item.color || '#ffffff';
    circle.onclick = () => openColorPicker(item, 'textmarks');
    tagDiv.appendChild(circle);
    
    const text = document.createElement('span');
    text.className = 'tree-text';
    text.textContent = item.text;
    text.setAttribute('data-full-url', item.text);
    text.style.cursor = 'pointer';
    text.onclick = () => {
      navigator.clipboard.writeText(item.text).then(() => showCopyToast());
    };
    
    const labelsDiv = document.createElement('span');
    labelsDiv.className = 'tree-labels';
    labelsDiv.style.cursor = 'pointer';
    labelsDiv.onclick = () => {
      navigator.clipboard.writeText(item.text).then(() => showCopyToast());
    };
    const fullLabels = (item.labels || []).join(', ');
    labelsDiv.setAttribute('data-full-labels', fullLabels);
    (item.labels || []).forEach((label, idx) => {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'label-tag';
      labelSpan.style.color = '#00bfff';
      labelSpan.textContent = label;
      labelSpan.setAttribute('data-full-label', label);
      labelsDiv.appendChild(labelSpan);
    });
    
    const optionsDiv = document.createElement('span');
    optionsDiv.className = 'tree-options';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'tree-btn tree-btn-edit';
    editBtn.textContent = '✎';
    editBtn.onclick = () => openEditPanel(item, 'textmarks');
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tree-btn tree-btn-delete';
    deleteBtn.textContent = '🗑';
    deleteBtn.onclick = () => deleteItem(item.text, 'textmarks');
    
    optionsDiv.appendChild(editBtn);
    optionsDiv.appendChild(deleteBtn);
    
    line.appendChild(tagDiv);
    line.appendChild(text);
    line.appendChild(labelsDiv);
    line.appendChild(optionsDiv);
    container.appendChild(line);
  });
}

function loadAndRender() {
  chrome.storage.local.get(['bookmarks', 'textmarks'], (result) => {
    const bookmarks = result.bookmarks || [];
    const textmarks = result.textmarks || [];
    
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    
    let filteredBookmarks = bookmarks;
    let filteredTextmarks = textmarks;
    
    if (searchQuery) {
      filteredBookmarks = bookmarks.filter(b => {
        return b.url.toLowerCase().includes(searchQuery) ||
               b.title.toLowerCase().includes(searchQuery) ||
               (b.labels || []).some(l => l.toLowerCase().includes(searchQuery));
      });
      
      filteredTextmarks = textmarks.filter(t => {
        return t.text.toLowerCase().includes(searchQuery) ||
               (t.labels || []).some(l => l.toLowerCase().includes(searchQuery));
      });
    }
    
    const tree = buildPrefixTree(filteredBookmarks);
    const container = document.getElementById('tree-container');
    container.innerHTML = '';
    renderTree(tree, container);
    
    const textContainer = document.getElementById('text-container');
    textContainer.innerHTML = '';
    renderTextMarks(filteredTextmarks, textContainer);
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'refresh') {
    loadAndRender();
  }
});

let currentEditNode = null;
let currentColorNode = null;
let currentDataType = null;
let pendingDeleteIdentifier = null;
let pendingDeleteType = null;

function deleteItem(identifier, dataType) {
  pendingDeleteIdentifier = identifier;
  pendingDeleteType = dataType;
  document.getElementById('confirm-dialog').style.display = 'flex';
  document.getElementById('top-bar').style.display = 'none';
}

document.getElementById('confirm-yes').addEventListener('click', () => {
  if (pendingDeleteIdentifier && pendingDeleteType) {
    chrome.storage.local.get([pendingDeleteType], (result) => {
      const items = result[pendingDeleteType] || [];
      const filteredItems = items.filter(item => {
        if (pendingDeleteType === 'bookmarks') {
          return item.url !== pendingDeleteIdentifier;
        } else {
          return item.text !== pendingDeleteIdentifier;
        }
      });
      
      chrome.storage.local.set({ [pendingDeleteType]: filteredItems }, () => {
        loadAndRender();
        document.getElementById('confirm-dialog').style.display = 'none';
        document.getElementById('top-bar').style.display = 'flex';
        pendingDeleteIdentifier = null;
        pendingDeleteType = null;
      });
    });
  }
});

document.getElementById('confirm-no').addEventListener('click', () => {
  document.getElementById('confirm-dialog').style.display = 'none';
  document.getElementById('top-bar').style.display = 'flex';
  pendingDeleteIdentifier = null;
  pendingDeleteType = null;
});

function openEditPanel(node, dataType) {
  currentEditNode = node;
  currentDataType = dataType;
  document.getElementById('edit-panel').style.display = 'flex';
  document.getElementById('color-picker').style.display = 'none';
  document.getElementById('top-bar').style.display = 'none';
  document.getElementById('label-input').value = node.labels.join(', ');
  document.getElementById('label-input').focus();
}

function closeEditPanel() {
  document.getElementById('edit-panel').style.display = 'none';
  document.getElementById('top-bar').style.display = 'flex';
  currentEditNode = null;
  currentDataType = null;
}

document.getElementById('label-input').addEventListener('blur', (e) => {
  if (!e.relatedTarget || (e.relatedTarget.id !== 'label-save' && e.relatedTarget.id !== 'label-cancel')) {
    setTimeout(() => {
      if (document.getElementById('edit-panel').style.display === 'flex') {
        closeEditPanel();
      }
    }, 100);
  }
});

function openColorPicker(node, dataType) {
  currentColorNode = node;
  currentDataType = dataType;
  document.getElementById('color-picker').style.display = 'flex';
  document.getElementById('edit-panel').style.display = 'none';
  document.getElementById('top-bar').style.display = 'none';
}

document.querySelectorAll('.color-option').forEach(option => {
  const color = option.getAttribute('data-color');
  option.style.backgroundColor = color;
  
  option.addEventListener('click', () => {
    if (!currentColorNode || !currentDataType) return;
    
    chrome.storage.local.get([currentDataType], (result) => {
      const items = result[currentDataType] || [];
      const item = items.find(b => {
        if (currentDataType === 'bookmarks') {
          return b.url === currentColorNode.url;
        } else {
          return b.text === currentColorNode.text;
        }
      });
      if (item) {
        item.color = color;
        chrome.storage.local.set({ [currentDataType]: items }, () => {
          loadAndRender();
          document.getElementById('color-picker').style.display = 'none';
          document.getElementById('top-bar').style.display = 'flex';
          currentColorNode = null;
          currentDataType = null;
        });
      }
    });
  });
});

function saveLabel() {
  if (!currentEditNode || !currentDataType) return;
  
  const labelText = document.getElementById('label-input').value;
  const labels = labelText.split(',').map(l => l.trim()).filter(l => l);
  
  chrome.storage.local.get([currentDataType], (result) => {
    const items = result[currentDataType] || [];
    const item = items.find(b => {
      if (currentDataType === 'bookmarks') {
        return b.url === currentEditNode.url;
      } else {
        return b.text === currentEditNode.text;
      }
    });
    if (item) {
      item.labels = labels;
      chrome.storage.local.set({ [currentDataType]: items }, () => {
        loadAndRender();
        document.getElementById('edit-panel').style.display = 'none';
        document.getElementById('top-bar').style.display = 'flex';
        currentEditNode = null;
        currentDataType = null;
      });
    }
  });
}

document.getElementById('label-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveLabel();
  }
});

document.getElementById('label-save').addEventListener('click', saveLabel);

document.getElementById('label-cancel').addEventListener('click', () => {
  closeEditPanel();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#color-picker') && !e.target.closest('.tag-circle')) {
    document.getElementById('color-picker').style.display = 'none';
    document.getElementById('top-bar').style.display = 'flex';
    currentColorNode = null;
  }
});

document.getElementById('add-current').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const url = tabs[0].url;
      const title = tabs[0].title;
      
      chrome.storage.local.get(['bookmarks'], (result) => {
        const bookmarks = result.bookmarks || [];
        
        if (bookmarks.some(b => b.url === url)) {
          document.getElementById('exist-dialog').style.display = 'flex';
          document.getElementById('top-bar').style.display = 'none';
          return;
        }
        
        const newBookmark = { url, title, timestamp: Date.now(), labels: [], color: '#ffffff' };
        bookmarks.push(newBookmark);
        
        chrome.storage.local.set({ bookmarks }, () => {
          loadAndRender();
          
          const displayUrl = getDisplayUrl(url);
          const node = {
            url: url,
            displayUrl: displayUrl,
            title: title,
            labels: [],
            color: '#ffffff'
          };
          currentEditNode = node;
          currentDataType = 'bookmarks';
          document.getElementById('edit-panel').style.display = 'flex';
          document.getElementById('color-picker').style.display = 'none';
          document.getElementById('top-bar').style.display = 'none';
          document.getElementById('label-input').value = title;
          document.getElementById('label-input').focus();
        });
      });
    }
  });
});

document.getElementById('add-text').addEventListener('click', () => {
  navigator.clipboard.readText().then(text => {
    chrome.storage.local.get(['textmarks'], (result) => {
      const textmarks = result.textmarks || [];
      
      if (textmarks.some(t => t.text === text)) {
        document.getElementById('exist-dialog').style.display = 'flex';
        document.getElementById('top-bar').style.display = 'none';
        return;
      }
      
      const newTextmark = { text, timestamp: Date.now(), labels: [], color: '#ffffff' };
      textmarks.push(newTextmark);
      
      chrome.storage.local.set({ textmarks }, () => {
        loadAndRender();
        
        openEditPanel(newTextmark, 'textmarks');
      });
    });
  });
});

document.getElementById('search-input').addEventListener('input', () => {
  loadAndRender();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'refresh') {
    loadAndRender();
  }
});

document.getElementById('exist-ok').addEventListener('click', () => {
  document.getElementById('exist-dialog').style.display = 'none';
  document.getElementById('top-bar').style.display = 'flex';
});

function showCopyToast() {
  const toast = document.getElementById('copy-toast');
  const searchInput = document.getElementById('search-input');
  searchInput.style.opacity = '0';
  toast.style.display = 'inline';
  toast.textContent = 'COPIED TO CLIPBOARD';
  setTimeout(() => {
    toast.style.display = 'none';
    searchInput.style.opacity = '1';
  }, 1000);
}

function showOpenToast() {
  const toast = document.getElementById('copy-toast');
  const searchInput = document.getElementById('search-input');
  searchInput.style.opacity = '0';
  toast.style.display = 'inline';
  toast.textContent = 'OPENING URL';
  setTimeout(() => {
    toast.style.display = 'none';
    searchInput.style.opacity = '1';
  }, 1000);
}

function getDisplayUrl(urlString) {
  try {
    const url = new URL(urlString);
    const pathParts = url.pathname.split('/').filter(p => p);
    const firstPath = pathParts.length > 0 ? '/' + pathParts[0] : '';
    return url.hostname + firstPath;
  } catch (e) {
    return urlString;
  }
}

loadAndRender();
