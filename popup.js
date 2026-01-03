// DOM elements
const bookmarksContainer = document.getElementById('bookmarksContainer');
const emptyState = document.getElementById('emptyState');
const treeView = document.getElementById('treeView');

// Add bookmark form elements
const addBookmarkSection = document.getElementById('addBookmarkSection');
const addBookmarkForm = document.getElementById('addBookmarkForm');
const newBookmarkTitle = document.getElementById('newBookmarkTitle');
const segmentDomain = document.getElementById('segmentDomain');
const segmentPath = document.getElementById('segmentPath');
const segmentParams = document.getElementById('segmentParams');
const tag3Input = document.getElementById('tag3');
const tag3Group = document.getElementById('tag3Group');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const mainView = document.getElementById('mainView');

let allBookmarks = [];
let pendingBookmarkData = null;

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
  newBookmarkTitle.value = title;
  
  // Parse URL into segments
  const urlSegments = parseURL(url);
  
  // Display segments (read-only)
  segmentDomain.textContent = urlSegments.domain || 'N/A';
  segmentPath.textContent = urlSegments.path || '/';
  segmentParams.textContent = urlSegments.params || 'None';
  
  // Handle tag3 (params) - required if params exist
  if (urlSegments.params) {
    tag3Input.value = urlSegments.params;
    tag3Input.required = true;
    tag3Group.style.display = 'block';
  } else {
    tag3Input.value = '';
    tag3Input.required = false;
    tag3Group.style.display = 'none';
  }
  
  addBookmarkSection.style.display = 'block';
  mainView.style.display = 'none';
  
  // Focus on title input
  setTimeout(() => {
    newBookmarkTitle.focus();
    newBookmarkTitle.select();
  }, 100);
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
  addBookmarkForm.reset();
}

// Handle save new bookmark
function handleSaveNewBookmark(e) {
  e.preventDefault();
  
  if (!pendingBookmarkData) return;
  
  const title = newBookmarkTitle.value.trim();
  const tag3 = tag3Input.value.trim();
  
  // Get tag1 and tag2 directly from URL segments
  const urlSegments = parseURL(pendingBookmarkData.url);
  const tag1 = urlSegments.domain || '';
  const tag2 = urlSegments.path || '/';
  
  // Validate required fields
  if (!tag1 || !tag2) {
    alert('Invalid URL: missing domain or path');
    return;
  }
  
  // If params exist, tag3 must be filled
  if (urlSegments.params && !tag3) {
    alert('Level 3 tag is required when URL has parameters');
    return;
  }
  
  const newBookmark = {
    id: Date.now().toString(),
    url: pendingBookmarkData.url,
    title: title,
    dateAdded: new Date().toISOString(),
    tag1: tag1,
    tag2: tag2,
    tag3: tag3 || null
  };
  
  allBookmarks.push(newBookmark);
  
  chrome.storage.sync.set({ bookmarks: allBookmarks }, () => {
    hideAddForm();
    displayBookmarks(allBookmarks);
  });
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
  
  // Build tree structure (only 2 levels)
  const tree = {};
  
  bookmarks.forEach(bookmark => {
    const tag1 = bookmark.tag1 || 'Uncategorized';
    const tag2 = bookmark.tag2 || 'Uncategorized';
    
    if (!tree[tag1]) {
      tree[tag1] = {};
    }
    if (!tree[tag1][tag2]) {
      tree[tag1][tag2] = [];
    }
    
    tree[tag1][tag2].push(bookmark);
  });
  
  // Render tree
  Object.keys(tree).sort().forEach(tag1 => {
    const level1 = createTreeNode(tag1, 1);
    const level1Children = document.createElement('div');
    level1Children.className = 'tree-children expanded'; // Start expanded
    
    Object.keys(tree[tag1]).sort().forEach(tag2 => {
      const level2 = createTreeNode(tag2, 2);
      const level2Children = document.createElement('div');
      level2Children.className = 'tree-children expanded'; // Start expanded
      
      tree[tag1][tag2].forEach(bookmark => {
        const bookmarkEl = createTreeBookmarkElement(bookmark);
        level2Children.appendChild(bookmarkEl);
      });
      
      level2.appendChild(level2Children);
      level1Children.appendChild(level2);
    });
    
    level1.appendChild(level1Children);
    treeView.appendChild(level1);
  });
}

// Create tree node
function createTreeNode(label, level) {
  const node = document.createElement('div');
  node.className = `tree-level-${level}`;
  
  const header = document.createElement('div');
  header.className = 'tree-node-header';
  
  const leftSection = document.createElement('div');
  leftSection.className = 'tree-node-left';
  
  const toggle = document.createElement('span');
  toggle.className = 'tree-toggle expanded'; // Start expanded
  toggle.textContent = '▶';
  
  const labelEl = document.createElement('span');
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
  
  const title = document.createElement('div');
  title.className = 'tree-bookmark-title';
  title.textContent = bookmark.title;
  
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
