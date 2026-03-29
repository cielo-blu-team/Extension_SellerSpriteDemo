/**
 * Content Script - 検索結果ページ（amazon.co.jp/s?k=*）
 * サマリーバーの挿入と商品カードへのバッジ付与を行う
 */

import { SummaryBar } from '../components/summary-bar.js';
import { applyBadgeToCard } from '../components/product-badge.js';

(async function init() {
  const settings = await sendMessage({ type: 'GET_SETTINGS' });
  if (!settings.extensionEnabled || !settings.searchPageEnabled) return;

  if (!settings.sellerSpriteKey) {
    insertNoBanner();
    return;
  }

  const keyword = getSearchKeyword();
  if (!keyword) return;

  const bar = new SummaryBar();
  const barEl = bar.render();

  // ヘッダー直下の挿入先（複数セレクターでフォールバック）
  const insertParent = findSearchResultsParent();
  if (insertParent) {
    insertParent.insertBefore(barEl, insertParent.firstChild);
  } else {
    // フォールバック：bodyの先頭
    document.body.insertAdjacentElement('afterbegin', barEl);
  }

  let asinMap = null;

  bar.onAnalyzeClick(() => runAnalysis(keyword, bar, (map) => {
    asinMap = map;
    startObserver(() => asinMap);
  }));
})();

// ── 分析実行 ───────────────────────────────────────

async function runAnalysis(keyword, bar, onComplete) {
  bar.setLoading();
  try {
    console.log('[EC Lens] 分析開始:', keyword);
    const result = await sendMessage({ type: 'SEARCH_ANALYSIS', keyword });
    console.log('[EC Lens] 分析結果:', result);

    if (!result) {
      bar.setError('レスポンスが空です。拡張機能を再読み込みしてください');
      return;
    }

    if (result.error) {
      bar.setError(result.error);
      return;
    }

    bar.setData(result.keywordData, result.productData);

    if (result.productData?.items) {
      const map = buildAsinMap(result.productData.items);
      applyBadgesAll(map);
      onComplete(map);
    }
  } catch (err) {
    console.error('[EC Lens] 分析エラー:', err);
    bar.setError(err.message || '通信エラーが発生しました。再試行してください');
  }
}

// ── ASINマップ構築 ─────────────────────────────────

function buildAsinMap(items) {
  const map = {};
  for (const item of items) {
    if (item.asin) map[item.asin] = item;
  }
  return map;
}

// ── バッジ全カードに適用 ────────────────────────────

function applyBadgesAll(asinMap) {
  const cards = findProductCards();
  for (const card of cards) {
    const asin = extractAsinFromCard(card);
    if (asin && asinMap[asin]) {
      applyBadgeToCard(card, asinMap[asin]);
      card.dataset.ecLensBadge = 'true';
    }
  }
}

// ── 商品カード検索（フォールバック付き） ───────────────

function findProductCards() {
  // data-asin 属性付きの要素が最も信頼性が高い
  const byDataAsin = Array.from(document.querySelectorAll('[data-asin]'))
    .filter(el => el.dataset.asin && el.dataset.asin.length === 10);
  if (byDataAsin.length > 0) return byDataAsin;

  // フォールバック
  return Array.from(document.querySelectorAll(
    '.s-result-item, [data-component-type="s-search-result"], .sg-col-inner .a-section'
  )).filter(el => el.querySelector('img.s-image'));
}

function extractAsinFromCard(card) {
  // data-asin属性（最優先）
  if (card.dataset.asin && /^[A-Z0-9]{10}$/i.test(card.dataset.asin)) {
    return card.dataset.asin.toUpperCase();
  }

  // 商品リンクのhref
  const link = card.querySelector('a[href*="/dp/"]') || card.querySelector('a.a-link-normal');
  if (link) {
    const m = link.href.match(/\/dp\/([A-Z0-9]{10})/i);
    if (m) return m[1].toUpperCase();
  }

  return null;
}

// ── MutationObserver（動的追加カード対応） ───────────

function startObserver(getAsinMap) {
  const observer = new MutationObserver(() => {
    const map = getAsinMap();
    if (!map) return;

    const unprocessed = findProductCards().filter(
      card => !card.dataset.ecLensBadge
    );
    for (const card of unprocessed) {
      const asin = extractAsinFromCard(card);
      if (asin && map[asin]) {
        applyBadgeToCard(card, map[asin]);
        card.dataset.ecLensBadge = 'true';
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ── 検索ページの挿入先を探す ────────────────────────

function findSearchResultsParent() {
  const candidates = [
    '#search',
    '[data-component-type="s-search-results"]',
    '.s-search-results',
    '#resultsMid',
    '#center-2',
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// ── キーワード取得 ─────────────────────────────────

function getSearchKeyword() {
  const params = new URLSearchParams(window.location.search);
  return (params.get('k') || params.get('field-keywords') || '').trim();
}

// ── APIキー未設定バナー ────────────────────────────

function insertNoBanner() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    background:#1A237E;color:#fff;
    font-family:-apple-system,sans-serif;font-size:13px;
    padding:10px 16px;text-align:center;
    position:relative;z-index:9999;
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

// ── メッセージ送信ヘルパー ─────────────────────────

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
