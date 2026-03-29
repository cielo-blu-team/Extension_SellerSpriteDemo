/**
 * Content Script - 検索結果ページ（amazon.co.jp/s?k=*）
 * サマリーバーの挿入と商品カードへのバッジ付与を行う
 */

import { SummaryBar } from '../components/summary-bar.js';
import { applyBadgeToCard } from '../components/product-badge.js';

(async function init() {
  // 設定確認
  const settings = await sendMessage({ type: 'GET_SETTINGS' });
  if (!settings.extensionEnabled || !settings.searchPageEnabled) return;

  // APIキー未設定の場合はバナー表示
  if (!settings.sellerSpriteKey) {
    insertNoBanner();
    return;
  }

  const keyword = getSearchKeyword();
  if (!keyword) return;

  const bar = new SummaryBar();
  const barEl = bar.render();

  // ヘッダー直下に挿入
  const insertTarget =
    document.querySelector('#search > span:first-child') ||
    document.querySelector('[data-component-type="s-search-results"]') ||
    document.querySelector('.s-result-list') ||
    document.body.firstElementChild;

  if (insertTarget) {
    insertTarget.parentNode.insertBefore(barEl, insertTarget);
  }

  bar.onAnalyzeClick(() => runAnalysis(keyword, bar));

  // MutationObserver で動的追加カードにも対応
  observeNewCards(null); // バッジはanalysis後に付与
})();

async function runAnalysis(keyword, bar) {
  bar.setLoading();

  try {
    const result = await sendMessage({ type: 'SEARCH_ANALYSIS', keyword });

    if (result.error) {
      bar.setError(result.error);
      return;
    }

    bar.setData(result.keywordData, result.productData);

    // 商品カードにバッジ付与
    if (result.productData?.items) {
      applyBadgesFromProductData(result.productData.items);
    }
  } catch (err) {
    bar.setError(err.message || '通信エラーが発生しました。再試行してください');
  }
}

function applyBadgesFromProductData(items) {
  // ASINをキーにしてマップ作成
  const asinMap = {};
  items.forEach(item => {
    if (item.asin) asinMap[item.asin] = item;
  });

  // 各商品カードにバッジを付与
  const cards = document.querySelectorAll('[data-asin]');
  cards.forEach(card => {
    const asin = card.dataset.asin;
    if (asin && asinMap[asin]) {
      applyBadgeToCard(card, asinMap[asin]);
    }
  });
}

function observeNewCards(asinMap) {
  const observer = new MutationObserver(() => {
    if (!asinMap) return;
    const cards = document.querySelectorAll('[data-asin]:not([data-ec-lens-badge])');
    cards.forEach(card => {
      const asin = card.dataset.asin;
      if (asin && asinMap[asin]) {
        applyBadgeToCard(card, asinMap[asin]);
        card.dataset.ecLensBadge = 'true';
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function getSearchKeyword() {
  const params = new URLSearchParams(window.location.search);
  return params.get('k') || '';
}

function insertNoBanner() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    background:#1A237E;color:#fff;
    font-family:-apple-system,sans-serif;font-size:13px;
    padding:10px 16px;text-align:center;position:relative;z-index:9999;
  `;
  banner.innerHTML = `
    <strong>EC Lens</strong>：SellerSprite APIキーが設定されていません。
    <a href="#" id="ec-lens-settings-link" style="color:#90CAF9;text-decoration:underline;margin-left:8px">設定画面を開く</a>
  `;
  document.body.insertAdjacentElement('afterbegin', banner);

  banner.querySelector('#ec-lens-settings-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  });
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
