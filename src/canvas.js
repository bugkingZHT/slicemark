// Shared Canvas Module

// 拖拽相关变量
let dragSrcEl = null;
let insertPosition = null;
let resizeState = null; // { card, item, edge: 'left'|'right', startX, startCol, startLen }

// 渲染画布核心函数
async function renderCanvas() {
  const container = document.getElementById("canvasContent");
  // 获取画布数据
  const { canvas = { totalCols: 5, rows: [] } } = await chrome.storage.local.get("canvas");

  // 清空容器
  container.innerHTML = "";

  // 无数据时显示提示
  if (canvas.rows.length === 0 || canvas.rows.every(row => row.items.length === 0)) {
    const emptyRow = document.createElement("div");
    emptyRow.className = "canvas-row";
    emptyRow.innerHTML = '<div class="empty-row-tip">暂无收藏项</div>';
    container.appendChild(emptyRow);
    return;
  }

  // 遍历行渲染
  canvas.rows.forEach((row, rowIdx) => {
    if (row.items.length === 0) return;
    
    // 创建行容器
    const rowDom = document.createElement("div");
    rowDom.className = "canvas-row";
    rowDom.dataset.row = rowIdx + 1;
    rowDom.draggable = true;
    rowDom.style.cursor = 'move';

    // 遍历项渲染卡片
    row.items.forEach(item => {
      const card = document.createElement("div");
      card.className = "slicemark-card";
      card.dataset.id = item.id;
      card.dataset.url = item.url;
      
      // 计算卡片宽度（5列=100%）
      card.style.width = `${(item.len / 5) * 100}%`;
      
      // 计算卡片左边距（基于列位置）
      if (item.position && item.position.col) {
        const leftMargin = ((item.position.col - 1) / 5) * 100;
        card.style.marginLeft = `${leftMargin}%`;
      }
      
      // 添加左侧拖拽手柄
      const leftHandle = document.createElement("div");
      leftHandle.className = "resize-handle left-handle";
      leftHandle.addEventListener('mousedown', (e) => handleResizeStart(e, card, item, 'left'));
      card.appendChild(leftHandle);
      
      // 添加右侧拖拽手柄
      const rightHandle = document.createElement("div");
      rightHandle.className = "resize-handle right-handle";
      rightHandle.addEventListener('mousedown', (e) => handleResizeStart(e, card, item, 'right'));
      card.appendChild(rightHandle);
      
      // 创建卡片内容容器
      const cardContent = document.createElement("div");
      cardContent.style.cssText = 'display: flex; align-items: center; justify-content: space-between; width: 100%; height: 100%; pointer-events: auto;';
      
      // 添加文本内容
      const textSpan = document.createElement("span");
      textSpan.textContent = item.text;
      textSpan.style.flex = '1';
      textSpan.style.overflow = 'hidden';
      textSpan.style.textOverflow = 'ellipsis';
      textSpan.style.whiteSpace = 'nowrap';
      
      // 添加删除按钮
      const deleteBtn = document.createElement("span");
      deleteBtn.textContent = '×';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.width = '20px';
      deleteBtn.style.height = '20px';
      deleteBtn.style.display = 'flex';
      deleteBtn.style.alignItems = 'center';
      deleteBtn.style.justifyContent = 'center';
      deleteBtn.style.borderRadius = '50%';
      deleteBtn.style.backgroundColor = '#ff4d4f';
      deleteBtn.style.color = 'white';
      deleteBtn.style.fontSize = '14px';
      deleteBtn.style.marginLeft = '8px';
      deleteBtn.style.flexShrink = '0';
      
      // 绑定删除事件
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        if (confirm('确定要删除这个收藏项吗？')) {
          const { canvas = { totalCols: 5, rows: [] } } = await chrome.storage.local.get("canvas");
          
          for (let i = 0; i < canvas.rows.length; i++) {
            const itemIndex = canvas.rows[i].items.findIndex(cardItem => cardItem.id === item.id);
            if (itemIndex > -1) {
              canvas.rows[i].items.splice(itemIndex, 1);
              break;
            }
          }
          
          canvas.rows = canvas.rows.filter(row => row.items.length > 0);
          await chrome.storage.local.set({ canvas });
          await renderCanvas();
        }
      });
      
      cardContent.appendChild(textSpan);
      cardContent.appendChild(deleteBtn);
      card.appendChild(cardContent);

      // 绑定点击跳转事件
      cardContent.addEventListener("click", () => {
        chrome.tabs.create({ url: item.url });
      });

      rowDom.appendChild(card);
    });
    
    // 绑定行的拖拽事件
    rowDom.addEventListener('dragstart', handleDragStart);
    rowDom.addEventListener('dragover', handleDragOver);
    rowDom.addEventListener('dragenter', handleDragEnter);
    rowDom.addEventListener('dragleave', handleDragLeave);
    rowDom.addEventListener('dragend', handleDropAndEnd);

    container.appendChild(rowDom);
  });
}

// 拖拽开始处理
function handleDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', '');
  // const img = new Image();
  // img.src = '';
  // e.dataTransfer.setDragImage(img, 0, 0);
  this.classList.add('dragging');
}

// 拖拽经过处理 - 计算插入位置
function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  
  // 如果悬停在行上，计算应该插入到上方还是下方
  if (this.classList.contains('canvas-row') && dragSrcEl !== this) {
    const rect = this.getBoundingClientRect();
    const mouseY = e.clientY;
    const rowMiddle = rect.top + rect.height / 2;
    
    // 移除所有旧的插入指示器
    clearInsertIndicators();
    
    // 根据鼠标位置决定插入到上方还是下方
    if (mouseY < rowMiddle) {
      this.classList.add('insert-before');
      insertPosition = { targetEl: this, position: 'before' };
    } else {
      this.classList.add('insert-after');
      insertPosition = { targetEl: this, position: 'after' };
    }
  }
  
  return false;
}

// 清除所有插入指示器
function clearInsertIndicators() {
  const indicators = document.querySelectorAll('.insert-before, .insert-after');
  indicators.forEach(el => {
    el.classList.remove('insert-before', 'insert-after');
  });
}

// 拖拽进入处理
function handleDragEnter(e) {
  // 插入指示器在 dragOver 中处理，这里保持简单
  if (this.classList.contains('canvas-row') && dragSrcEl !== this) {
    // 不再使用 drag-over 类
  }
}

// 拖拽离开处理
function handleDragLeave(e) {
  // 只有当真正离开元素时才清除（避免子元素触发）
  if (e.target === this) {
    this.classList.remove('insert-before', 'insert-after');
  }
}

// 拖拽放置和结束处理合并
async function handleDropAndEnd(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.stopPropagation();
  
  const needsUpdate = dragSrcEl && insertPosition && dragSrcEl.classList.contains('canvas-row');
  
  if (needsUpdate) {
    const { canvas = { totalCols: 5, rows: [] } } = await chrome.storage.local.get("canvas");
    const container = document.getElementById("canvasContent");
    const allRows = Array.from(container.children);
    const srcIdx = allRows.indexOf(dragSrcEl);
    const tgtIdx = allRows.indexOf(insertPosition.targetEl);
    
    if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
      const [srcRow] = canvas.rows.splice(srcIdx, 1);
      const adjustedTgtIdx = srcIdx < tgtIdx ? tgtIdx - 1 : tgtIdx;
      const finalIdx = insertPosition.position === 'before' ? adjustedTgtIdx : adjustedTgtIdx + 1;
      
      canvas.rows.splice(finalIdx, 0, srcRow);
      canvas.rows.forEach((row, idx) => {
        row.items.forEach(item => {
          item.position.row = idx + 1;
        });
      });
      
      await chrome.storage.local.set({ canvas });
      await renderCanvas();
    }
  }
  
  if (dragSrcEl) {
    dragSrcEl.classList.remove('dragging');
    if (dragSrcEl.classList.contains('canvas-row')) {
      dragSrcEl.classList.add('drop-complete');
      setTimeout(() => dragSrcEl.classList.remove('drop-complete'), 400);
    }
  }
  
  clearInsertIndicators();
  dragSrcEl = null;
  insertPosition = null;
  
  return false;
}

function handleResizeStart(e, card, item, edge) {
  e.stopPropagation();
  e.preventDefault();
  
  resizeState = {
    card,
    item,
    edge,
    startX: e.clientX,
    startCol: item.position.col,
    startLen: item.len
  };
  
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
  document.body.style.cursor = 'col-resize';
  card.classList.add('resizing');
}

function handleResizeMove(e) {
  if (!resizeState) return;
  
  const containerWidth = document.getElementById('canvasContent').offsetWidth;
  const colWidth = containerWidth / 5;
  const deltaX = e.clientX - resizeState.startX;
  const deltaCols = Math.round(deltaX / colWidth);
  
  let newCol = resizeState.startCol;
  let newLen = resizeState.startLen;
  
  if (resizeState.edge === 'left') {
    newCol = Math.max(1, Math.min(5, resizeState.startCol + deltaCols));
    newLen = Math.max(1, Math.min(5, resizeState.startLen - (newCol - resizeState.startCol)));
    if (newCol + newLen - 1 > 5) {
      newCol = 5 - newLen + 1;
    }
  } else {
    newLen = Math.max(1, Math.min(5 - resizeState.startCol + 1, resizeState.startLen + deltaCols));
  }
  
  resizeState.card.style.width = `${(newLen / 5) * 100}%`;
  resizeState.card.style.marginLeft = `${((newCol - 1) / 5) * 100}%`;
}

async function handleResizeEnd(e) {
  if (!resizeState) return;
  
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
  document.body.style.cursor = '';
  resizeState.card.classList.remove('resizing');
  
  const containerWidth = document.getElementById('canvasContent').offsetWidth;
  const colWidth = containerWidth / 5;
  const deltaX = e.clientX - resizeState.startX;
  const deltaCols = Math.round(deltaX / colWidth);
  
  let newCol = resizeState.startCol;
  let newLen = resizeState.startLen;
  
  if (resizeState.edge === 'left') {
    newCol = Math.max(1, Math.min(5, resizeState.startCol + deltaCols));
    newLen = Math.max(1, Math.min(5, resizeState.startLen - (newCol - resizeState.startCol)));
    if (newCol + newLen - 1 > 5) {
      newCol = 5 - newLen + 1;
    }
  } else {
    newLen = Math.max(1, Math.min(5 - resizeState.startCol + 1, resizeState.startLen + deltaCols));
  }
  
  const { canvas = { totalCols: 5, rows: [] } } = await chrome.storage.local.get("canvas");
  
  for (let row of canvas.rows) {
    for (let cardItem of row.items) {
      if (cardItem.id === resizeState.item.id) {
        cardItem.position.col = newCol;
        cardItem.len = newLen;
        break;
      }
    }
  }
  
  await chrome.storage.local.set({ canvas });
  resizeState = null;
  await renderCanvas();
}
