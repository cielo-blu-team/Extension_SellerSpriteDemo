/**
 * ポップアップスクリプト
 */

document.addEventListener('DOMContentLoaded', async () => {
  await checkStatus();
  bindEvents();
});

async function checkStatus() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const visitsRow = document.getElementById('visits-row');
  const visitsEl = document.getElementById('visits-remaining');

  try {
    const result = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });

    if (!result.extensionEnabled) {
      dot.className = 'status-dot off';
      text.textContent = '拡張機能: 無効';
      return;
    }

    if (!result.sellerSpriteKey) {
      dot.className = 'status-dot warn';
      text.textContent = 'APIキー未設定';
      return;
    }

    dot.className = 'status-dot ok';
    text.textContent = '有効 — Amazon.co.jp 対応中';

    // API残量を非同期で取得
    try {
      const visits = await chrome.runtime.sendMessage({
        type: 'TEST_SELLERSPRITE_KEY',
        secretKey: result.sellerSpriteKey,
      });
      if (!visits.error) {
        visitsRow.style.display = 'block';
        visitsEl.textContent = visits.remaining != null
          ? `${visits.remaining} / ${visits.total}`
          : '---';
      }
    } catch (_) {
      // 残量取得失敗は無視
    }
  } catch (err) {
    dot.className = 'status-dot warn';
    text.textContent = 'エラーが発生しました';
  }
}

function bindEvents() {
  document.getElementById('open-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  document.getElementById('clear-cache').addEventListener('click', async () => {
    const btn = document.getElementById('clear-cache');
    btn.disabled = true;
    btn.textContent = 'クリア中...';
    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' });
      btn.textContent = 'クリア完了';
      setTimeout(() => {
        btn.textContent = 'キャッシュをクリア';
        btn.disabled = false;
      }, 1500);
    } catch (_) {
      btn.textContent = 'エラー';
      btn.disabled = false;
    }
  });
}
