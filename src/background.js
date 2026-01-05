// 初始化右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-to-slicemark",
    title: "添加到 SliceMark",
    contexts: ["all"]
  });
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "add-to-slicemark") {
    // 生成唯一ID
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    // 初始化收藏项
    const newItem = {
      id,
      url: tab.url || info.pageUrl,
      text: "marktext",
      len: 3,
      position: { row: 1, col: 1 }
    };
    // 存储临时编辑项
    await chrome.storage.local.set({ editingItem: newItem });
    // 打开编辑弹窗
    chrome.windows.create({
      url: "src/edit.html",
      type: "popup",
      width: 420,
      height: 300
    });
  }
});

// 监听编辑完成的消息
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === "SAVE_ITEM") {
    // 获取现有画布数据
    const { canvas = { totalCols: 5, rows: [] } } = await chrome.storage.local.get("canvas");
    // 计算新项的布局
    const newItem = msg.data;
    
    // 更新画布数据 - 添加到新行的顶部
    // 创建新行并插入到顶部（索引0）
    const newRow = { items: [newItem], height: 60 };
    newItem.position = { row: 1, col: 1 };
    canvas.rows.unshift(newRow);
    
    // 更新后续行的行号
    for (let i = 1; i < canvas.rows.length; i++) {
      canvas.rows[i].items.forEach(item => {
        item.position.row = i + 1;
      });
    }
    
    // 保存画布数据
    await chrome.storage.local.set({ canvas });
    // 清空临时编辑项
    await chrome.storage.local.remove("editingItem");
    sendResponse({ success: true });
    
    // 返回true表示异步响应
    return true;
  }
});

// 布局计算核心函数
function calculateLayout(canvas, item) {
  let targetRowIdx = 0;
  let targetCol = 1;
  let needNewRow = true;

  // 遍历现有行找空位
  for (let rowIdx = 0; rowIdx < canvas.rows.length; rowIdx++) {
    const row = canvas.rows[rowIdx];
    const colOccupied = new Array(5).fill(false);
    
    // 标记已占用列
    row.items.forEach(i => {
      for (let c = i.position.col - 1; c < i.position.col - 1 + i.len; c++) {
        colOccupied[c] = true;
      }
    });

    // 找连续空位
    for (let c = 0; c <= 5 - item.len; c++) {
      const isFree = colOccupied.slice(c, c + item.len).every(v => !v);
      if (isFree) {
        targetRowIdx = rowIdx;
        targetCol = c + 1;
        needNewRow = false;
        break;
      }
    }
    if (!needNewRow) break;
  }
  return { targetRowIdx, targetCol, needNewRow };
}