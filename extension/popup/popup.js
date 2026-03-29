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
    const result = await sendMessage({ type: 'GET_SETTINGS' });

    if (!result || result.error) {
      dot.className = 'status-dot warn';
      text.textContent = result?.error || 'Service Workerと通信できません';
      return;
    }

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

    // API残量を非同期で取得（失敗しても表示は変えない）
    try {
      const visits = await sendMessage({
        type: 'TEST_SELLERSPRITE_KEY',
        secretKey: result.sellerSpriteKey,
      });
      if (visits && !visits.error && visits.remaining != null) {
        visitsRow.style.display = 'block';
        visitsEl.textContent = `${visits.remaining} / ${visits.total}`;
      }
    } catch (_) {}

  } catch (err) {
    dot.className = 'status-dot warn';
    text.textContent = err.message || 'エラーが発生しました';
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
      await sendMessage({ type: 'CLEAR_CACHE' });
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

// タイムアウト付き sendMessage（3秒で諦める）
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Service Workerが応答しません。拡張機能を再読み込みしてください'));
    }, 3000);

    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
