/**
 * 設定画面スクリプト
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  bindEvents();
});

async function loadSettings() {
  const result = await chrome.storage.local.get([
    'sellerSpriteKey',
    'anthropicKey',
    'extensionEnabled',
    'searchPageEnabled',
    'asinPageEnabled',
  ]);

  if (result.sellerSpriteKey) {
    document.getElementById('sellersprite-key').value = result.sellerSpriteKey;
  }
  if (result.anthropicKey) {
    document.getElementById('anthropic-key').value = result.anthropicKey;
  }
  document.getElementById('extension-enabled').checked = result.extensionEnabled !== false;
  document.getElementById('search-page-enabled').checked = result.searchPageEnabled !== false;
  document.getElementById('asin-page-enabled').checked = result.asinPageEnabled !== false;
}

function bindEvents() {
  // パスワード表示切り替え
  document.getElementById('toggle-ss-key').addEventListener('click', () => {
    toggleVisibility('sellersprite-key', 'toggle-ss-key');
  });
  document.getElementById('toggle-ant-key').addEventListener('click', () => {
    toggleVisibility('anthropic-key', 'toggle-ant-key');
  });

  // 接続テスト
  document.getElementById('test-ss-key').addEventListener('click', () => {
    testSellerSpriteKey();
  });
  document.getElementById('test-ant-key').addEventListener('click', () => {
    testAnthropicKey();
  });

  // 設定保存
  document.getElementById('save-settings').addEventListener('click', saveSettings);

  // キャッシュクリア
  document.getElementById('clear-cache').addEventListener('click', clearCache);
}

function toggleVisibility(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '隠す';
  } else {
    input.type = 'password';
    btn.textContent = '表示';
  }
}

async function testSellerSpriteKey() {
  const key = document.getElementById('sellersprite-key').value.trim();
  const resultEl = document.getElementById('ss-test-result');

  if (!key) {
    showResult(resultEl, 'error', 'APIキーを入力してください');
    return;
  }

  showResult(resultEl, 'loading', '接続テスト中...');

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'TEST_SELLERSPRITE_KEY',
      secretKey: key,
    });
    if (result.error) {
      showResult(resultEl, 'error', result.error);
    } else {
      await chrome.storage.local.set({ sellerSpriteKey: key });
      showResult(resultEl, 'success', `接続成功・保存しました — ${result.message}`);
    }
  } catch (err) {
    showResult(resultEl, 'error', err.message || '接続エラー');
  }
}

async function testAnthropicKey() {
  const key = document.getElementById('anthropic-key').value.trim();
  const resultEl = document.getElementById('ant-test-result');

  if (!key) {
    showResult(resultEl, 'error', 'APIキーを入力してください');
    return;
  }

  showResult(resultEl, 'loading', '接続テスト中...');

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'TEST_ANTHROPIC_KEY',
      apiKey: key,
    });
    if (result.error) {
      showResult(resultEl, 'error', result.error);
    } else {
      await chrome.storage.local.set({ anthropicKey: key });
      showResult(resultEl, 'success', '接続成功・保存しました');
    }
  } catch (err) {
    showResult(resultEl, 'error', err.message || '接続エラー');
  }
}

async function saveSettings() {
  const sellerSpriteKey = document.getElementById('sellersprite-key').value.trim();
  const anthropicKey = document.getElementById('anthropic-key').value.trim();
  const extensionEnabled = document.getElementById('extension-enabled').checked;
  const searchPageEnabled = document.getElementById('search-page-enabled').checked;
  const asinPageEnabled = document.getElementById('asin-page-enabled').checked;

  await chrome.storage.local.set({
    sellerSpriteKey,
    anthropicKey,
    extensionEnabled,
    searchPageEnabled,
    asinPageEnabled,
  });

  const msg = document.getElementById('save-msg');
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 2000);
}

async function clearCache() {
  const resultEl = document.getElementById('cache-result');
  showResult(resultEl, 'loading', 'クリア中...');

  try {
    const result = await chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' });
    if (result.error) {
      showResult(resultEl, 'error', result.error);
    } else {
      showResult(resultEl, 'success', 'キャッシュをクリアしました');
    }
  } catch (err) {
    showResult(resultEl, 'error', err.message || 'エラーが発生しました');
  }
}

function showResult(el, type, message) {
  el.className = `test-result ${type}`;
  el.textContent = message;
}
