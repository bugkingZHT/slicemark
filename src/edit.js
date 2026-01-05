// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
  // 获取临时编辑项
  const res = await chrome.storage.local.get("editingItem");
  const editingItem = res.editingItem;
  
  if (editingItem) {
    document.getElementById("textInput").value = editingItem.text;
    document.getElementById("lenInput").value = editingItem.len;
  }

  // 绑定保存按钮点击事件（移除onclick内联事件）
  document.getElementById("saveBtn").addEventListener('click', async () => {
    const text = document.getElementById("textInput").value.trim() || "marktext";
    const len = Number(document.getElementById("lenInput").value);
    const errorTip = document.getElementById("errorTip");

    // 验证宽度
    if (isNaN(len) || len < 1 || len > 5) {
      errorTip.style.display = "block";
      return;
    }
    errorTip.style.display = "none";

    // 组装编辑后的项
    const editedItem = {
      ...editingItem,
      text,
      len
    };

    // 发送保存消息到后台
    try {
      const response = await chrome.runtime.sendMessage({ type: "SAVE_ITEM", data: editedItem });
      if (response?.success) {
        // 重新加载画布以显示新添加的项
        await renderCanvas();
        // 清空表单
        document.getElementById("textInput").value = "";
        document.getElementById("lenInput").value = 3;
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  });

  document.getElementById('closeBtn').addEventListener('click', () => {
    window.close();
  });

   // 渲染画布
  renderCanvas();

  // 监听存储变化以实时更新画布
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.canvas || changes.editingItem)) {
      renderCanvas();
    }
  });
});
