// DOM elements
const bookmarksContainer = document.getElementById('bookmarksContainer');
const emptyState = document.getElementById('emptyState');
const treeView = document.getElementById('treeView');

// Add bookmark form elements
const addBookmarkSection = document.getElementById('addBookmarkSection');
const addBookmarkForm = document.getElementById('addBookmarkForm');
const wordsContainer = document.getElementById('wordsContainer');
const closeFormBtn = document.getElementById('closeFormBtn');
const mainView = document.getElementById('mainView');

let allBookmarks = [];
let pendingBookmarkData = null;
let selectionStack = []; // Stack to track selected words in order

// Get existing tags for a domain
function getExistingTagsForDomain(domain) {
  const existingTags = new Set();
  
  allBookmarks.forEach(bookmark => {
    if (bookmark.level1Tag) existingTags.add(bookmark.level1Tag);
    if (bookmark.level2Tag) existingTags.add(bookmark.level2Tag);
    if (bookmark.level3Tag) existingTags.add(bookmark.level3Tag);
  });
  
  return Array.from(existingTags);
}

// Load bookmarks on popup open
document.addEventListener('DOMContentLoaded', () => {
  loadBookmarks();
  checkPendingBookmark();
  

  
  // Form event listeners
  addBookmarkForm.addEventListener('submit', handleSaveNewBookmark);
  closeFormBtn.addEventListener('click', hideAddForm);
  cancelFormBtn.addEventListener('click', hideAddForm);
});

// Check if there's a pending bookmark to add
function checkPendingBookmark() {
  chrome.storage.local.get(['pendingBookmark'], (result) => {
    if (result.pendingBookmark) {
      const { url, title, timestamp } = result.pendingBookmark;
      
      // Only show if timestamp is recent (within 2 seconds)
      if (Date.now() - timestamp < 2000) {
        showAddForm(url, title);
      }
      
      // Clear pending bookmark
      chrome.storage.local.remove(['pendingBookmark']);
    }
  });
}

// Show add bookmark form
function showAddForm(url, title) {
  pendingBookmarkData = { url, title };
  selectionStack = []; // Reset selection stack
  
  // Parse URL and extract words
  const urlSegments = parseURL(url);
  const words = extractWords(urlSegments, title);
  
  // Auto-select default: domain as L1
  if (words.length > 0 && words[0].type === 'domain') {
    selectionStack.push(words[0].text);
  }
  
  // Get existing tags for the domain
  const existingTags = getExistingTagsForDomain(null);
  
  // Render word selection UI
  renderWords(words, existingTags, url, title);
  
  addBookmarkSection.style.display = 'block';
  mainView.style.display = 'none';
  
  // Update UI with default selections
  updateWordButtons();
}

// Extract words from URL segments
function extractWords(urlSegments, title) {
  const words = [];
  
  // Add domain
  if (urlSegments.domain) {
    words.push({ text: urlSegments.domain, type: 'domain' });
  }
  
  // Add path segments
  if (urlSegments.path && urlSegments.path !== '/') {
    const pathParts = urlSegments.path.split('/').filter(p => p);
    pathParts.forEach(part => {
      words.push({ text: part, type: 'path' });
    });
    if (pathParts.length === 0) {
      words.push({ text: urlSegments.path, type: 'path' });
    }
  } else if (urlSegments.path === '/') {
    words.push({ text: '/', type: 'path' });
  }
  
  // Add title words
  if (title) {
    const titleWords = title.split(/[\s\-_|.,:;()]+/).filter(w => w && w.length > 1);
    titleWords.forEach(word => {
      words.push({ text: word, type: 'title' });
    });
  }
  
  // Add params
  if (urlSegments.params) {
    const paramParts = urlSegments.params.split('&').filter(p => p);
    paramParts.forEach(part => {
      // Only add param if it's not too long
      if (part.length <= 32) {
        words.push({ text: part, type: 'param' });
      }
    });
  }
  
  // Add existing tags from all bookmarks (not just the domain)
  const allExistingTags = getExistingTagsForDomain(null);
  words.push(...allExistingTags.map(tag => ({ text: tag, type: 'existing' })));
  
  // If domain is selected as L1, add existing L2 tags for that domain
  if (selectionStack.length === 1 && selectionStack[0] === urlSegments.domain) {
    const l2Tags = new Set();
    allBookmarks.forEach(bookmark => {
      if (bookmark.level1Tag === urlSegments.domain && bookmark.level2Tag) {
        l2Tags.add(bookmark.level2Tag);
      }
    });
    words.push(...Array.from(l2Tags).map(tag => ({ text: tag, type: 'existing-l2' })));
  }
  
  return words;
}

// Render word selection UI
function renderWords(words, existingTags, url, title) {
  wordsContainer.innerHTML = '';
  
  // Create instruction section
  const instructionDiv = document.createElement('div');
  instructionDiv.className = 'selection-instruction';
  instructionDiv.innerHTML = '<span class="instruction-icon">💡</span> Click to select tags (L1/L2/L3 required)';
  wordsContainer.appendChild(instructionDiv);
  
  // Create emoji tags section
  const emojiSection = document.createElement('div');
  emojiSection.className = 'emoji-tags-section';
  
  const emojiTags = [
    { text: '🔴', },
    { text: '🔵', },
    { text: '🟢', },
    { text: '🟡', },
    { text: '⚪', }
  ];
  
  emojiTags.forEach(emojiTag => {
    const emojiBtn = document.createElement('button');
    emojiBtn.type = 'button';
    emojiBtn.className = 'word-btn word-type-emoji';
    emojiBtn.innerHTML = `<span class="emoji-icon">${emojiTag.text}</span>`;
    emojiBtn.dataset.word = emojiTag.text;
    
    emojiBtn.addEventListener('click', () => toggleWordSelection(emojiBtn));
    emojiSection.appendChild(emojiBtn);
  });
  
  wordsContainer.appendChild(emojiSection);
  
  // Create words section
  const wordsSection = document.createElement('div');
  wordsSection.className = 'words-section';
  
  // Filter out existing tags from words for the words section
  const wordsOnly = words.filter(word => word.type !== 'existing');
  
  wordsOnly.forEach((word, index) => {
    const wordBtn = document.createElement('button');
    wordBtn.type = 'button';
    wordBtn.className = `word-btn word-type-${word.type}`;
    wordBtn.textContent = word.text;
    wordBtn.dataset.word = word.text;
    
    wordBtn.addEventListener('click', () => toggleWordSelection(wordBtn));
    wordsSection.appendChild(wordBtn);
  });
  
  // Add words section to container
  wordsContainer.appendChild(wordsSection);
  
  // Create actions section
  const actionsSection = document.createElement('div');
  actionsSection.className = 'word-actions';
  
  // Add cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'cancel-action-btn';
  cancelBtn.innerHTML = '<span class="cancel-icon">×</span><span class="cancel-text">Cancel</span>';
  cancelBtn.title = 'Cancel bookmark creation';
  cancelBtn.addEventListener('click', hideAddForm);
  actionsSection.appendChild(cancelBtn);
  
  // Add done button
  const doneBtn = document.createElement('button');
  doneBtn.type = 'button';
  doneBtn.className = 'done-btn';
  doneBtn.innerHTML = '<span class="done-icon">✓</span><span class="done-text">Done</span>';
  doneBtn.title = 'Save bookmark';
  doneBtn.addEventListener('click', saveBookmarkFromSelection);
  actionsSection.appendChild(doneBtn);
  
  wordsContainer.appendChild(actionsSection);
}

// Toggle word selection (stack-based)
function toggleWordSelection(btnElement) {
  const word = btnElement.dataset.word;
  const index = selectionStack.indexOf(word);
  
  if (index !== -1) {
    // Word is already selected - remove it and all items after it (stack pop)
    selectionStack = selectionStack.slice(0, index);
  } else {
    // Add word to stack (stack push)
    if (selectionStack.length < 3) {
      selectionStack.push(word);
    }
  }
  
  // Update UI
  updateWordButtons();
}

// Update word buttons based on selection stack
function updateWordButtons() {
  document.querySelectorAll('.word-btn').forEach(btn => {
    const word = btn.dataset.word;
    const stackIndex = selectionStack.indexOf(word);
    
    // Remove all badges first
    const existingBadge = btn.querySelector('.level-badge');
    if (existingBadge) existingBadge.remove();
    
    // Remove all selection classes
    btn.classList.remove('selected', 'selected-1', 'selected-2', 'selected-3');
    
    if (stackIndex !== -1) {
      const level = stackIndex + 1; // 1-indexed
      btn.classList.add('selected', `selected-${level}`);
      
      // Add level badge
      const badge = document.createElement('span');
      badge.className = `level-badge level-${level}`;
      badge.textContent = `L${level}`;
      btn.appendChild(badge);
    }
  });
}

// Save bookmark from selection
function saveBookmarkFromSelection() {
  if (!pendingBookmarkData) return;
  
  const level1Tag = selectionStack[0] || null;
  const level2Tag = selectionStack[1] || null;
  const level3Tag = selectionStack[2] || null;
  
  // Validate exactly 3 tags are selected
  if (!level1Tag || !level2Tag || !level3Tag) {
    alert('Please select exactly 3 tags for tree classification');
    return;
  }
  
  const newBookmark = {
    id: Date.now().toString(),
    url: pendingBookmarkData.url,
    level1Tag: level1Tag,
    level2Tag: level2Tag,
    level3Tag: level3Tag,
    dateAdded: new Date().toISOString()
  };
  
  allBookmarks.push(newBookmark);
  
  chrome.storage.sync.set({ bookmarks: allBookmarks }, () => {
    hideAddForm();
  });
}

// Parse URL into domain, path, and params
function parseURL(url) {
  try {
    const urlObj = new URL(url);
    
    // Domain (hostname)
    const domain = urlObj.hostname;
    
    // Path (without query and hash)
    let path = urlObj.pathname;
    if (path === '/') {
      path = '/';
    }
    
    // Params (query string)
    let params = urlObj.search;
    if (params && params.startsWith('?')) {
      params = params.substring(1);
    }
    
    return {
      domain: domain,
      path: path,
      params: params
    };
  } catch (e) {
    return {
      domain: '',
      path: '/',
      params: ''
    };
  }
}

// Hide add bookmark form
function hideAddForm() {
  addBookmarkSection.style.display = 'none';
  mainView.style.display = 'flex';
  pendingBookmarkData = null;
  selectionStack = [];
  
  // Close the popup window
  window.close();
}

// Handle save new bookmark
function handleSaveNewBookmark(e) {
  e.preventDefault();
  saveBookmarkFromSelection();
}

// Load bookmarks from storage
function loadBookmarks() {
  chrome.storage.sync.get(['bookmarks'], (result) => {
    allBookmarks = result.bookmarks || [];
    displayBookmarks(allBookmarks);
  });
}

// Display bookmarks
function displayBookmarks(bookmarks) {
  if (bookmarks.length === 0) {
    emptyState.style.display = 'block';
    treeView.innerHTML = '';
    return;
  }
  
  emptyState.style.display = 'none';
  displayTreeView(bookmarks);
}

// Display bookmarks in tree structure
function displayTreeView(bookmarks) {
  treeView.innerHTML = '';
  
  // Build tree structure (3 levels)
  const tree = {};
  
  bookmarks.forEach(bookmark => {
    const level1 = bookmark.level1Tag || '-';
    const level2 = bookmark.level2Tag || '-';
    const level3 = bookmark.level3Tag || '-';
    
    if (!tree[level1]) {
      tree[level1] = {};
    }
    
    if (!tree[level1][level2]) {
      tree[level1][level2] = [];
    }
    
    tree[level1][level2].push(bookmark);
  });
  
  // Render tree
  Object.keys(tree).sort().forEach(level1 => {
    const level1Node = createTreeNode(level1, 1);
    const level1Children = document.createElement('div');
    level1Children.className = 'tree-children expanded';
    
    Object.keys(tree[level1]).sort().forEach(level2 => {
      const level2Node = createTreeNode(level2, 2);
      const level2Children = document.createElement('div');
      level2Children.className = 'tree-children expanded';
      
      tree[level1][level2].forEach(bookmark => {
        const bookmarkEl = createTreeBookmarkElement(bookmark);
        level2Children.appendChild(bookmarkEl);
      });
      
      level2Node.appendChild(level2Children);
      level1Children.appendChild(level2Node);
    });
    
    level1Node.appendChild(level1Children);
    treeView.appendChild(level1Node);
  });
}

// Create tree node
function createTreeNode(label, level, realPath = null) {
  const node = document.createElement('div');
  node.className = `tree-level-${level}`;
  
  const header = document.createElement('div');
  header.className = 'tree-node-header';
  
  const leftSection = document.createElement('div');
  leftSection.className = 'tree-node-left';
  
  const toggle = document.createElement('span');
  toggle.className = 'tree-toggle expanded';
  toggle.textContent = '▶';
  
  const labelEl = document.createElement('div');
  labelEl.className = 'tree-node-label';
  labelEl.textContent = label;
  
  leftSection.appendChild(toggle);
  leftSection.appendChild(labelEl);
  header.appendChild(leftSection);
  node.appendChild(header);
  
  // Click to toggle
  header.addEventListener('click', () => {
    const children = node.querySelector('.tree-children');
    if (children) {
      toggle.classList.toggle('expanded');
      children.classList.toggle('expanded');
    }
  });
  
  return node;
}

// Create tree bookmark element
function createTreeBookmarkElement(bookmark) {
  const div = document.createElement('div');
  div.className = 'tree-bookmark-item';
  
  // Make entire item clickable to open
  div.addEventListener('click', (e) => {
    // Only open if not clicking delete button
    if (!e.target.closest('.delete-btn')) {
      openBookmark(bookmark.url);
    }
  });
  
  const content = document.createElement('div');
  content.className = 'tree-bookmark-content';
  
  // Use the highest level tag as the title
  let titleText = 'Bookmark';
  if (bookmark.level3Tag) {
    titleText = bookmark.level3Tag;
  } else if (bookmark.level2Tag) {
    titleText = bookmark.level2Tag;
  } else if (bookmark.level1Tag) {
    titleText = bookmark.level1Tag;
  }
  
  const title = document.createElement('div');
  title.className = 'tree-bookmark-title';
  title.textContent = titleText;
  
  const url = document.createElement('div');
  url.className = 'tree-bookmark-url';
  url.textContent = bookmark.url;
  
  content.appendChild(title);
  content.appendChild(url);
  
  const actions = document.createElement('div');
  actions.className = 'tree-bookmark-actions';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '×';
  deleteBtn.className = 'delete-btn';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteBookmark(bookmark.id);
  });
  
  actions.appendChild(deleteBtn);
  
  div.appendChild(content);
  div.appendChild(actions);
  
  return div;
}

// Open bookmark in new tab
function openBookmark(url) {
  chrome.tabs.create({ url: url });
}

// Delete bookmark
function deleteBookmark(id) {
  if (!confirm('Are you sure you want to delete this bookmark?')) {
    return;
  }
  
  allBookmarks = allBookmarks.filter(b => b.id !== id);
  chrome.storage.sync.set({ bookmarks: allBookmarks }, () => {
    displayBookmarks(allBookmarks);
  });
}

// Filter bookmarks
function filterBookmarks() {
  displayBookmarks(allBookmarks);
}

// Function to collapse all tree nodes
function collapseAllNodes() {
  const allToggles = document.querySelectorAll('.tree-toggle');
  const allChildren = document.querySelectorAll('.tree-children');
  
  allToggles.forEach(toggle => {
    toggle.classList.remove('expanded');
  });
  
  allChildren.forEach(children => {
    children.classList.remove('expanded');
  });
}

// Add event listener to the collapse all button
document.addEventListener('DOMContentLoaded', () => {
  const collapseAllBtn = document.getElementById('collapseAllBtn');
  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', collapseAllNodes);
  }
});
