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
  tree.forEach((node, index) => {
    const line = document.createElement('div');
    line.className = 'tree-line';
    line.draggable = true;
    line.dataset.type = 'bookmarks';
    line.dataset.index = index;
    line.dataset.id = node.url;
    
    line.addEventListener('dragstart', handleDragStart);
    line.addEventListener('dragover', handleDragOver);
    line.addEventListener('drop', handleDrop);
    line.addEventListener('dragend', handleDragEnd);
    
    const tagDiv = document.createElement('span');
    tagDiv.className = 'tree-tag';
    
    const circle = document.createElement('div');
    circle.className = 'tag-circle';
    circle.style.backgroundColor = node.color;
    circle.onclick = () => openColorPicker(node, 'bookmarks');
    tagDiv.appendChild(circle);
    
    const contentDiv = document.createElement('span');
    contentDiv.className = 'tree-content';
    contentDiv.style.cursor = 'pointer';
    contentDiv.onclick = () => {
      showOpenToast();
      window.open(node.url, '_blank');
    };
    
    const fullLabels = node.labels.join(', ');
    const hoverText = fullLabels ? `${fullLabels}\n${node.url}` : node.url;
    contentDiv.setAttribute('data-hover-content', hoverText);
    contentDiv.setAttribute('title', '');
    
    node.labels.forEach((label) => {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'label-tag';
      labelSpan.style.color = '#00bfff';
      labelSpan.textContent = label;
      contentDiv.appendChild(labelSpan);
      
      const space = document.createTextNode(' ');
      contentDiv.appendChild(space);
    });
    
    const text = document.createElement('span');
    text.className = 'tree-text';
    text.textContent = node.displayUrl;
    contentDiv.appendChild(text);
    
    const optionsDiv = document.createElement('span');
    optionsDiv.className = 'tree-options';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'tree-btn tree-btn-edit';
    editBtn.textContent = '_';
    editBtn.onclick = () => openEditPanel(node, 'bookmarks');
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tree-btn tree-btn-delete';
    deleteBtn.textContent = 'X';
    deleteBtn.onclick = () => deleteItem(node.url, 'bookmarks');
    
    optionsDiv.appendChild(editBtn);
    optionsDiv.appendChild(deleteBtn);
    
    line.appendChild(tagDiv);
    line.appendChild(contentDiv);
    line.appendChild(optionsDiv);
    container.appendChild(line);
  });
}

function renderTextMarks(textmarks, container) {
  textmarks.forEach((item, index) => {
    const line = document.createElement('div');
    line.className = 'tree-line';
    line.draggable = true;
    line.dataset.type = 'textmarks';
    line.dataset.index = index;
    line.dataset.id = item.text;
    
    line.addEventListener('dragstart', handleDragStart);
    line.addEventListener('dragover', handleDragOver);
    line.addEventListener('drop', handleDrop);
    line.addEventListener('dragend', handleDragEnd);
    
    const tagDiv = document.createElement('span');
    tagDiv.className = 'tree-tag';
    
    const circle = document.createElement('div');
    circle.className = 'tag-circle';
    circle.style.backgroundColor = item.color || '#ffffff';
    circle.onclick = () => openColorPicker(item, 'textmarks');
    tagDiv.appendChild(circle);
    
    const contentDiv = document.createElement('span');
    contentDiv.className = 'tree-content';
    contentDiv.style.cursor = 'pointer';
    contentDiv.onclick = () => {
      navigator.clipboard.writeText(item.text).then(() => showCopyToast());
    };
    
    const fullLabels = (item.labels || []).join(', ');
    const hoverText = fullLabels ? `${fullLabels}\n${item.text}` : item.text;
    contentDiv.setAttribute('data-hover-content', hoverText);
    contentDiv.setAttribute('title', '');
    
    (item.labels || []).forEach((label) => {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'label-tag';
      labelSpan.style.color = '#00bfff';
      labelSpan.textContent = label;
      contentDiv.appendChild(labelSpan);
      
      const space = document.createTextNode(' ');
      contentDiv.appendChild(space);
    });
    
    const text = document.createElement('span');
    text.className = 'tree-text';
    text.textContent = item.text;
    contentDiv.appendChild(text);
    
    const optionsDiv = document.createElement('span');
    optionsDiv.className = 'tree-options';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'tree-btn tree-btn-edit';
    editBtn.textContent = '_';
    editBtn.onclick = () => openEditPanel(item, 'textmarks');
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tree-btn tree-btn-delete';
    deleteBtn.textContent = 'X';
    deleteBtn.onclick = () => deleteItem(item.text, 'textmarks');
    
    optionsDiv.appendChild(editBtn);
    optionsDiv.appendChild(deleteBtn);
    
    line.appendChild(tagDiv);
    line.appendChild(contentDiv);
    line.appendChild(optionsDiv);
    container.appendChild(line);
  });
}

function renderTabs(tabs, container) {
  tabs.forEach((tab, index) => {
    const line = document.createElement('div');
    line.className = 'tree-line';
    line.draggable = true;
    line.dataset.type = 'tabs';
    line.dataset.index = index;
    line.dataset.id = tab.id;
    
    line.addEventListener('dragstart', handleDragStart);
    line.addEventListener('dragover', handleDragOver);
    line.addEventListener('drop', handleDrop);
    line.addEventListener('dragend', handleDragEnd);
    
    const tagDiv = document.createElement('span');
    tagDiv.className = 'tree-tag';
    
    const circle = document.createElement('div');
    circle.className = 'tag-circle';
    circle.style.backgroundColor = tab.color || '#ffffff';
    circle.onclick = () => openColorPickerForTab(tab);
    tagDiv.appendChild(circle);
    
    const contentDiv = document.createElement('span');
    contentDiv.className = 'tree-content';
    contentDiv.style.cursor = 'pointer';
    contentDiv.onclick = () => {
      showSwitchToast();
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    };
    
    let displayUrl = tab.url;
    try {
      const url = new URL(tab.url);
      const pathParts = url.pathname.split('/').filter(p => p);
      const firstPath = pathParts.length > 0 ? '/' + pathParts[0] : '';
      displayUrl = url.hostname + firstPath;
    } catch (e) {
      displayUrl = tab.url;
    }
    
    // Use custom labels if exist, otherwise use tab title as label
    const customLabels = tab.labels || [];
    const allLabels = customLabels.length > 0 ? customLabels : (tab.title ? [tab.title] : []);
    const fullLabels = allLabels.join(', ');
    const hoverText = fullLabels ? `${fullLabels}\n${tab.url}` : tab.url;
    contentDiv.setAttribute('data-hover-content', hoverText);
    contentDiv.setAttribute('title', '');
    
    allLabels.forEach((label) => {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'label-tag';
      labelSpan.style.color = '#00bfff';
      labelSpan.textContent = label;
      contentDiv.appendChild(labelSpan);
      
      const space = document.createTextNode(' ');
      contentDiv.appendChild(space);
    });
    
    const text = document.createElement('span');
    text.className = 'tree-text';
    text.textContent = displayUrl;
    contentDiv.appendChild(text);
    
    const optionsDiv = document.createElement('span');
    optionsDiv.className = 'tree-options';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'tree-btn tree-btn-edit';
    editBtn.textContent = '_';
    editBtn.onclick = () => openEditPanelForTab(tab);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tree-btn tree-btn-delete';
    deleteBtn.textContent = 'X';
    deleteBtn.onclick = () => closeTab(tab.id);
    
    optionsDiv.appendChild(editBtn);
    optionsDiv.appendChild(deleteBtn);
    
    line.appendChild(tagDiv);
    line.appendChild(contentDiv);
    line.appendChild(optionsDiv);
    container.appendChild(line);
  });
}

function loadAndRender() {
  chrome.storage.local.get(['bookmarks', 'textmarks', 'tabMetadata'], (result) => {
    const bookmarks = result.bookmarks || [];
    const textmarks = result.textmarks || [];
    const tabMetadata = result.tabMetadata || {};
    
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
    
    // Load and render tabs
    chrome.tabs.query({}, (tabs) => {
      let enhancedTabs = tabs.map(tab => {
        const metadata = tabMetadata[tab.id] || {};
        return {
          ...tab,
          labels: metadata.labels || [],
          color: metadata.color || '#ffffff'
        };
      });
      
      if (searchQuery) {
        enhancedTabs = enhancedTabs.filter(tab => {
          return tab.url.toLowerCase().includes(searchQuery) ||
                 tab.title.toLowerCase().includes(searchQuery) ||
                 (tab.labels || []).some(l => l.toLowerCase().includes(searchQuery));
        });
      }
      
      const tabContainer = document.getElementById('tab-container');
      tabContainer.innerHTML = '';
      renderTabs(enhancedTabs, tabContainer);
    });
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
let draggedElement = null;
let draggedType = null;
let dropLine = null;
let currentEditTab = null;
let currentColorTab = null;

function processReorder(items, draggedId, targetId, insertBefore, storageKey) {
  // 查找被拖拽元素在数组中的索引位置
  const draggedIndex = items.findIndex(item => {
    return (item.url === draggedId) || (item.text === draggedId);
  });
  
  // 查找目标元素在数组中的索引位置
  const targetIndex = items.findIndex(item => {
    return (item.url === targetId) || (item.text === targetId);
  });
  
  console.log('Dragged Index:', draggedIndex);
  console.log('Target Index:', targetIndex);
  
  // 如果任一索引无效，直接返回
  if (draggedIndex === -1 || targetIndex === -1) {
    console.log('Invalid index, return');
    return;
  }
  
  // 如果拖拽到自己，不做任何操作
  if (draggedIndex === targetIndex) {
    console.log('Drag to self, return');
    return;
  }
  
  // 步骤2: 复制被拖拽的元素
  const draggedItem = items[draggedIndex];
  const draggedItemCopy = JSON.parse(JSON.stringify(draggedItem));
  
  // 步骤3: 计算插入位置（目标位置之前或之后）
  let insertPosition;
  if (insertBefore) {
    // 插入到目标元素之前
    insertPosition = targetIndex;
  } else {
    // 插入到目标元素之后
    insertPosition = targetIndex + 1;
  }
  
  console.log('Insert Position:', insertPosition);
  
  // 步骤4: 在目标位置插入复制的元素
  items.splice(insertPosition, 0, draggedItemCopy);
  
  console.log('After Insert:', items.map((item, idx) => ({
    index: idx,
    id: item.url || item.text
  })));
  
  // 步骤5: 删除原位置的元素
  // 注意：如果原位置在插入位置之前，插入后索引会后移1位
  const deletePosition = draggedIndex < insertPosition ? draggedIndex : draggedIndex + 1;
  
  console.log('Delete Position:', deletePosition);
  
  items.splice(deletePosition, 1);
  
  console.log('After Delete:', items.map((item, idx) => ({
    index: idx,
    id: item.url || item.text
  })));
  
  // 步骤6: 保存更新后的数组，触发重新渲染
  // 使用保存的draggedTypeKey，避免在异步回调中依赖外部变量
  console.log('Storage key used:', storageKey);
  chrome.storage.local.set({ [storageKey]: items }, () => {
    console.log('=== Drag Drop End ===');
    loadAndRender();
  });
}

function handleDragStart(e) {
  draggedElement = e.target;
  draggedType = e.target.dataset.type;
  
  const img = document.createElement('div');
  img.style.width = '1px';
  img.style.height = '1px';
  img.style.opacity = '0';
  document.body.appendChild(img);
  e.dataTransfer.setDragImage(img, 0, 0);
  setTimeout(() => document.body.removeChild(img), 0);
  
  requestAnimationFrame(() => {
    e.target.style.opacity = '0.3';
  });
  
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  const targetType = e.currentTarget.dataset.type;
  if (targetType !== draggedType || e.currentTarget === draggedElement) {
    return false;
  }
  
  if (dropLine && dropLine.parentNode) {
    dropLine.parentNode.removeChild(dropLine);
  }
  
  dropLine = document.createElement('div');
  dropLine.style.height = '2px';
  dropLine.style.background = '#ffff00';
  dropLine.style.margin = '0';
  dropLine.style.padding = '0';
  dropLine.style.pointerEvents = 'none';
  
  const rect = e.currentTarget.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;
  
  if (e.clientY < midpoint) {
    e.currentTarget.parentNode.insertBefore(dropLine, e.currentTarget);
  } else {
    e.currentTarget.parentNode.insertBefore(dropLine, e.currentTarget.nextSibling);
  }
  
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  const targetElement = e.currentTarget;
  const targetType = targetElement.dataset.type;
  
  if (targetType !== draggedType || draggedElement === targetElement) {
    return false;
  }
  
  const draggedId = draggedElement.dataset.id;
  const targetId = targetElement.dataset.id;
  
  const rect = targetElement.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;
  const insertBefore = e.clientY < midpoint;
  
  console.log('=== Drag Drop Start ===');
  console.log('Dragged ID:', draggedId);
  console.log('Target ID:', targetId);
  console.log('Insert Before:', insertBefore);
  console.log('Dragged Type:', draggedType);
  
  if (draggedType === 'tabs') {
    // Handle tabs reordering
    chrome.storage.local.get(['tabMetadata'], (result) => {
      const tabMetadata = result.tabMetadata || {};
      chrome.tabs.query({}, (allTabs) => {
        const draggedTabId = parseInt(draggedId);
        const targetTabId = parseInt(targetId);
        
        const draggedTab = allTabs.find(t => t.id === draggedTabId);
        const targetTab = allTabs.find(t => t.id === targetTabId);
        
        if (!draggedTab || !targetTab) return;
        
        const targetIndex = targetTab.index;
        const newIndex = insertBefore ? targetIndex : targetIndex + 1;
        
        chrome.tabs.move(draggedTabId, { index: newIndex }, () => {
          loadAndRender();
        });
      });
    });
  } else {
    // Handle bookmarks/textmarks reordering
    chrome.storage.local.get([draggedType], (result) => {
      console.log('Result from storage:', result);
      
      const storageKeys = Object.keys(result);
      const storageValues = Object.values(result);
      console.log('Storage keys:', storageKeys);
      console.log('Storage values:', storageValues);
      
      if (storageKeys.length > 0) {
        storageKey = storageKeys[0];
      }
      
      const items = storageValues.length > 0 ? storageValues[0] : [];
      console.log('Original Items from Storage:', items);
      
      processReorder(items, draggedId, targetId, insertBefore, storageKey);
    });
  }
  
  return false;
}

function handleDragEnd(e) {
  if (dropLine && dropLine.parentNode) {
    dropLine.parentNode.removeChild(dropLine);
    dropLine = null;
  }
  
  if (draggedElement) {
    draggedElement.style.opacity = '1';
  }
  
  draggedElement = null;
  draggedType = null;
  draggedTypeKey = null;
}

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
  currentEditTab = null;
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
    if (currentColorTab) {
      // Handle tab color change
      chrome.storage.local.get(['tabMetadata'], (result) => {
        const tabMetadata = result.tabMetadata || {};
        if (!tabMetadata[currentColorTab.id]) {
          tabMetadata[currentColorTab.id] = {};
        }
        tabMetadata[currentColorTab.id].color = color;
        tabMetadata[currentColorTab.id].labels = currentColorTab.labels || [];
        
        chrome.storage.local.set({ tabMetadata }, () => {
          loadAndRender();
          document.getElementById('color-picker').style.display = 'none';
          document.getElementById('top-bar').style.display = 'flex';
          currentColorTab = null;
        });
      });
    } else if (currentColorNode && currentDataType) {
      // Handle bookmark/textmark color change
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
    }
  });
});

function saveLabel() {
  const labelText = document.getElementById('label-input').value;
  const labels = labelText.split(',').map(l => l.trim()).filter(l => l);
  
  if (currentEditTab) {
    // Handle tab label save
    chrome.storage.local.get(['tabMetadata'], (result) => {
      const tabMetadata = result.tabMetadata || {};
      if (!tabMetadata[currentEditTab.id]) {
        tabMetadata[currentEditTab.id] = {};
      }
      tabMetadata[currentEditTab.id].labels = labels;
      tabMetadata[currentEditTab.id].color = currentEditTab.color || '#ffffff';
      
      chrome.storage.local.set({ tabMetadata }, () => {
        loadAndRender();
        document.getElementById('edit-panel').style.display = 'none';
        document.getElementById('top-bar').style.display = 'flex';
        currentEditTab = null;
      });
    });
  } else if (currentEditNode && currentDataType) {
    // Handle bookmark/textmark label save
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
    currentColorTab = null;
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

function closeTab(tabId) {
  chrome.tabs.remove(tabId, () => {
    // Clean up metadata
    chrome.storage.local.get(['tabMetadata'], (result) => {
      const tabMetadata = result.tabMetadata || {};
      delete tabMetadata[tabId];
      chrome.storage.local.set({ tabMetadata }, () => {
        loadAndRender();
      });
    });
  });
}

function openColorPickerForTab(tab) {
  currentColorTab = tab;
  currentColorNode = null;
  currentDataType = null;
  document.getElementById('color-picker').style.display = 'flex';
  document.getElementById('edit-panel').style.display = 'none';
  document.getElementById('top-bar').style.display = 'none';
}

function openEditPanelForTab(tab) {
  currentEditTab = tab;
  currentEditNode = null;
  currentDataType = null;
  document.getElementById('edit-panel').style.display = 'flex';
  document.getElementById('color-picker').style.display = 'none';
  document.getElementById('top-bar').style.display = 'none';
  // Default to tab title if no labels exist
  const defaultLabel = tab.labels.length > 0 ? tab.labels.join(', ') : tab.title;
  document.getElementById('label-input').value = defaultLabel;
  document.getElementById('label-input').focus();
}

function showSwitchToast() {
  const toast = document.getElementById('copy-toast');
  const searchInput = document.getElementById('search-input');
  searchInput.style.opacity = '0';
  toast.style.display = 'inline';
  toast.textContent = 'SWITCHING TO TAB';
  setTimeout(() => {
    toast.style.display = 'none';
    searchInput.style.opacity = '1';
  }, 1000);
}

loadAndRender();

// Collapse functionality
document.getElementById('tree-header').addEventListener('click', () => {
  document.getElementById('tree-header').classList.toggle('collapsed');
  document.getElementById('tree-container').classList.toggle('collapsed');
});

document.getElementById('text-header').addEventListener('click', () => {
  document.getElementById('text-header').classList.toggle('collapsed');
  document.getElementById('text-container').classList.toggle('collapsed');
});

document.getElementById('tab-header').addEventListener('click', () => {
  document.getElementById('tab-header').classList.toggle('collapsed');
  document.getElementById('tab-container').classList.toggle('collapsed');
});

// Listen for tab changes to auto-update
chrome.tabs.onCreated.addListener(() => {
  loadAndRender();
});

chrome.tabs.onRemoved.addListener(() => {
  loadAndRender();
});

chrome.tabs.onUpdated.addListener(() => {
  loadAndRender();
});

chrome.tabs.onActivated.addListener(() => {
  loadAndRender();
});
