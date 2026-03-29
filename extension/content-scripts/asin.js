/**
 * Content Script - 商品詳細ページ（amazon.co.jp/dp/*）
 * フローティングボタン表示 → モーダル表示 → AIレビュー分析
 */

import { FloatingButton } from '../components/floating-btn.js';
import { Modal } from '../components/modal.js';

(async function init() {
  const settings = await sendMessage({ type: 'GET_SETTINGS' });
  if (!settings.extensionEnabled || !settings.asinPageEnabled) return;

  if (!settings.sellerSpriteKey) {
    insertNoBanner();
    return;
  }

  const asin = getAsinFromUrl();
  if (!asin) return;

  const fab = new FloatingButton();
  const fabEl = fab.render();
  document.body.appendChild(fabEl);

  fab.onClick(async () => {
    const modal = new Modal();
    const productTitle = getProductTitle();
    const modalEl = modal.render(asin);
    document.body.appendChild(modalEl);

    // レビュー分析ハンドラを設定
    modal.onReviewAnalysis(async (resultEl) => {
      if (!settings.anthropicKey) {
        throw new Error('Anthropic APIキーが設定されていません。設定画面で入力してください');
      }
      const reviews = extractReviews();
      if (!reviews.positive.length && !reviews.negative.length) {
        throw new Error('このページにレビューが見つかりませんでした');
      }
      const result = await sendMessage({
        type: 'REVIEW_ANALYSIS',
        asin,
        productTitle,
        reviews,
      });
      if (result.error) throw new Error(result.error);
      modal.renderReviewResult(result.result, resultEl);
    });

    fab.setLoading();
    try {
      const data = await sendMessage({ type: 'ASIN_ANALYSIS', asin });
      if (data.error) {
        modal.setData({ error: data.error }, productTitle);
      } else {
        modal.setData(data, productTitle);
      }
    } catch (err) {
      modal.setData({ error: err.message }, productTitle);
    } finally {
      fab.setReady();
    }
  });
})();

// ── URLからASIN取得 ────────────────────────────────

function getAsinFromUrl() {
  // パターン1: /dp/XXXXXXXXXX
  const dpMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
  if (dpMatch) return dpMatch[1].toUpperCase();

  // パターン2: クエリパラメーター
  const params = new URLSearchParams(window.location.search);
  const asinParam = params.get('asin') || params.get('ASIN');
  if (asinParam && /^[A-Z0-9]{10}$/i.test(asinParam)) return asinParam.toUpperCase();

  // パターン3: ページ内のメタデータ
  const canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl) {
    const m = canonicalEl.href.match(/\/dp\/([A-Z0-9]{10})/i);
    if (m) return m[1].toUpperCase();
  }

  return null;
}

// ── 商品タイトル取得 ────────────────────────────────

function getProductTitle() {
  const selectors = [
    '#productTitle',
    '#title span',
    '.product-title-word-break',
    'h1.a-size-large span',
    'h1[data-automation-id="title"]',
    'h1',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim()) return el.textContent.trim();
  }
  return document.title.replace(/\s*[-|].*$/, '').trim();
}

// ── レビュー取得（DOMから直接） ──────────────────────

function extractReviews() {
  const positive = [];
  const negative = [];

  // 複数のセレクターパターンで対応（Amazon DOM変更に備えてフォールバック）
  const REVIEW_SELECTORS = [
    '[data-hook="review"]',                          // 標準
    '.a-section.review.aok-relative',               // 代替1
    '.a-section[data-hook="review"]',               // 代替2
    '.review',                                       // 汎用フォールバック
  ];

  const RATING_SELECTORS = [
    '[data-hook="review-star-rating"] .a-icon-alt',
    '[data-hook="cmps-review-star-rating"] .a-icon-alt',
    '.review-rating .a-icon-alt',
    'i[data-hook="review-star-rating"] .a-icon-alt',
    'i.review-rating .a-icon-alt',
    '.a-star-mini .a-icon-alt',
  ];

  const TITLE_SELECTORS = [
    '[data-hook="review-title"] > span:not(.a-icon-alt):not(.a-color-secondary)',
    '[data-hook="review-title"] span.a-size-base',
    '.review-title > span',
    'a.review-title span',
  ];

  const BODY_SELECTORS = [
    '[data-hook="review-body"] span:not(.cr-original-language-review-body span)',
    '[data-hook="review-body"] .a-expander-content span',
    '.review-text span',
    '.review-text-content span',
    '.a-expander-content.reviewText span',
  ];

  let reviewEls = [];
  for (const sel of REVIEW_SELECTORS) {
    reviewEls = Array.from(document.querySelectorAll(sel));
    if (reviewEls.length > 0) break;
  }

  for (const el of reviewEls) {
    const rating = extractRating(el, RATING_SELECTORS);
    if (rating === null) continue;

    const title = extractText(el, TITLE_SELECTORS);
    const body = extractText(el, BODY_SELECTORS);
    if (!body) continue;

    const review = { rating, title, body: body.slice(0, 500) };

    if (rating >= 4 && positive.length < 15) {
      positive.push(review);
    } else if (rating <= 2 && negative.length < 15) {
      negative.push(review);
    }
  }

  return { positive, negative };
}

function extractRating(el, selectors) {
  for (const sel of selectors) {
    const ratingEl = el.querySelector(sel);
    if (!ratingEl) continue;
    const text = ratingEl.textContent.trim();
    const m = text.match(/(\d+(?:[.,]\d+)?)/);
    if (m) return parseFloat(m[1].replace(',', '.'));
  }
  return null;
}

function extractText(el, selectors) {
  for (const sel of selectors) {
    const target = el.querySelector(sel);
    if (target && target.textContent.trim()) return target.textContent.trim();
  }
  return '';
}

// ── APIキー未設定バナー ────────────────────────────

function insertNoBanner() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position:fixed;bottom:20px;right:20px;z-index:99999;
    background:#1A237E;color:#fff;
    font-family:-apple-system,sans-serif;font-size:12px;
    padding:10px 14px;border-radius:8px;
    box-shadow:0 4px 12px rgba(0,0,0,0.4);
    max-width:260px;line-height:1.5;
  `;
  banner.innerHTML = `
    <strong>EC Lens</strong>: SellerSprite APIキー未設定<br>
    <a href="#" id="ec-lens-opt-link" style="color:#90CAF9;text-decoration:underline">設定画面を開く</a>
    <span id="ec-lens-banner-close" style="float:right;cursor:pointer;opacity:0.6;margin-left:8px">×</span>
  `;
  document.body.appendChild(banner);

  banner.querySelector('#ec-lens-opt-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  });
  banner.querySelector('#ec-lens-banner-close').addEventListener('click', () => {
    banner.remove();
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
