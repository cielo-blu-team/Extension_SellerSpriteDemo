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
      const anthropicKey = settings.anthropicKey;
      if (!anthropicKey) {
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

    // ASIN分析を並列取得
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

// URLからASINを取得
function getAsinFromUrl() {
  const match = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

// 商品タイトル取得
function getProductTitle() {
  const el =
    document.querySelector('#productTitle') ||
    document.querySelector('#title') ||
    document.querySelector('h1.a-size-large');
  return el ? el.textContent.trim() : '';
}

// レビュー取得（DOMから直接）
function extractReviews() {
  const positive = [];
  const negative = [];

  // レビューリストのセレクター（Amazon DOM構造）
  const reviewEls = document.querySelectorAll(
    '[data-hook="review"], .a-section.review, .review'
  );

  reviewEls.forEach(el => {
    const ratingEl =
      el.querySelector('[data-hook="review-star-rating"] .a-icon-alt') ||
      el.querySelector('.review-rating .a-icon-alt') ||
      el.querySelector('i[data-hook="review-star-rating"]');

    const titleEl =
      el.querySelector('[data-hook="review-title"] span:not(.a-icon-alt)') ||
      el.querySelector('.review-title span');

    const bodyEl =
      el.querySelector('[data-hook="review-body"] span') ||
      el.querySelector('.review-text span') ||
      el.querySelector('.review-text-content span');

    if (!ratingEl || !bodyEl) return;

    const ratingText = ratingEl.textContent.trim();
    const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
    if (!ratingMatch) return;

    const rating = parseFloat(ratingMatch[1]);
    const title = titleEl ? titleEl.textContent.trim() : '';
    const body = bodyEl.textContent.trim();

    if (!body) return;

    const review = { rating, title, body };

    if (rating >= 4 && positive.length < 15) {
      positive.push(review);
    } else if (rating <= 2 && negative.length < 15) {
      negative.push(review);
    }
  });

  return { positive, negative };
}

// APIキー未設定バナー
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
    <strong>EC Lens</strong>: APIキー未設定<br>
    <a href="#" id="ec-lens-opt-link" style="color:#90CAF9;text-decoration:underline">設定画面を開く</a>
    <span id="ec-lens-banner-close" style="float:right;cursor:pointer;opacity:0.6">×</span>
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
