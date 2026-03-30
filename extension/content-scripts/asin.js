/**
 * Content Script - 商品詳細ページ（amazon.co.jp/dp/*）
 * 画面下部スティッキーパネル表示 → APIデータ取得 → AIレビュー分析
 */

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

  const productTitle = getProductTitle();
  const panel = new Modal();
  const panelEl = panel.render(asin);
  document.body.appendChild(panelEl);

  // 商品タイトルをヘッダーに表示
  if (productTitle) {
    panelEl.querySelector('#ec-lens-panel-title').textContent = productTitle;
  }

  // レビュー分析ハンドラを設定
  panel.onReviewAnalysis(async (resultEl) => {
    resultEl.innerHTML = '<div style="color:#555;padding:8px 0">レビュー件数を確認中...</div>';

    // 推定件数が300件超の場合は事前確認
    const estimatedCount = getProductReviewCount();
    if (estimatedCount && estimatedCount > 100) {
      const confirmed = await new Promise((resolve) => {
        resultEl.innerHTML = `
          <div style="padding:12px;background:#fff8e1;border:1px solid #ffe082;border-radius:6px;margin:8px 0;font-size:14px;line-height:1.6;">
            <div style="color:#5d4037;margin-bottom:10px;">
              このASINには約<strong>${estimatedCount.toLocaleString()}</strong>件のレビューがあります。<br>
              高評価・低評価それぞれ最大200件を取得し分析します（1〜2分程度）。実行しますか？
            </div>
            <button id="ec-lens-confirm-yes" style="background:#1A237E;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;margin-right:8px;font-size:13px;">実行する</button>
            <button id="ec-lens-confirm-no" style="background:#e0e0e0;color:#333;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:13px;">キャンセル</button>
          </div>`;
        resultEl.querySelector('#ec-lens-confirm-yes').addEventListener('click', () => resolve(true));
        resultEl.querySelector('#ec-lens-confirm-no').addEventListener('click', () => resolve(false));
      });
      if (!confirmed) {
        resultEl.innerHTML = '<div style="color:#999;padding:8px 0">キャンセルしました</div>';
        return;
      }
    }

    resultEl.innerHTML = '<div style="color:#555;padding:8px 0">レビューを取得中...</div>';

    // バリエーション商品は親ASIN（canonical）でレビューを取得
    const reviewAsin = getReviewAsin();
    const reviews = await fetchAllReviews(reviewAsin, (pos, neg) => {
      resultEl.innerHTML = `<div style="color:#555;padding:8px 0">レビューを取得中... 高評価${pos}件 / 低評価${neg}件</div>`;
    });

    if (!reviews.positive.length && !reviews.negative.length) {
      throw new Error('レビューが見つかりませんでした');
    }

    const total = reviews.positive.length + reviews.negative.length;
    resultEl.innerHTML = `<div style="color:#555;padding:8px 0">Claude分析中... (高評価${reviews.positive.length}件 / 低評価${reviews.negative.length}件 / 計${total}件)</div>`;

    const result = await sendMessage({
      type: 'REVIEW_ANALYSIS',
      asin,
      productTitle,
      reviews,
    });
    if (result.error) throw new Error(result.error);
    panel.renderReviewResult(result.result, resultEl);
  });

  // 分析ボタンのハンドラ
  panel.onAnalyzeClick(async () => {
    panel.setLoading();
    try {
      const data = await sendMessage({ type: 'ASIN_ANALYSIS', asin, keyword: productTitle });
      if (data.error) {
        panel.setData({ error: data.error }, productTitle);
      } else {
        panel.setData(data, productTitle);
      }
    } catch (err) {
      panel.setData({ error: err.message }, productTitle);
    } finally {
      panel.setReady();
    }
  });
})();

// ── レビュー用ASIN取得（バリエーション商品は親ASINを優先） ──────

function getReviewAsin() {
  const canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl) {
    const m = canonicalEl.href.match(/\/dp\/([A-Z0-9]{10})/i);
    if (m) return m[1].toUpperCase();
  }
  return getAsinFromUrl();
}

// ── 商品ページから推定レビュー件数取得 ────────────────────

function getProductReviewCount() {
  const selectors = [
    '#acrCustomerReviewText',
    '#acrCustomerReviewLink span',
    '[data-hook="total-review-count"]',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const m = el.textContent.replace(/[,，、\s]/g, '').match(/(\d+)/);
      if (m) return parseInt(m[1]);
    }
  }
  return null;
}

// ── URLからASIN取得 ────────────────────────────────

function getAsinFromUrl() {
  const dpMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
  if (dpMatch) return dpMatch[1].toUpperCase();

  const params = new URLSearchParams(window.location.search);
  const asinParam = params.get('asin') || params.get('ASIN');
  if (asinParam && /^[A-Z0-9]{10}$/i.test(asinParam)) return asinParam.toUpperCase();

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

// ── レビュー取得（複数ページ・最大1,000件） ────────────────

const REVIEW_SELECTORS = [
  '[data-hook="review"]',
  '.a-section.review.aok-relative',
  '.a-section[data-hook="review"]',
  '.review',
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

// 任意のDocumentからレビュー抽出
function extractReviewsFromDoc(doc) {
  let reviewEls = [];
  for (const sel of REVIEW_SELECTORS) {
    reviewEls = Array.from(doc.querySelectorAll(sel));
    if (reviewEls.length > 0) break;
  }
  const results = [];
  for (const el of reviewEls) {
    const rating = extractRating(el, RATING_SELECTORS);
    if (rating === null) continue;
    const title = extractText(el, TITLE_SELECTORS);
    const body = extractText(el, BODY_SELECTORS);
    if (!body) continue;
    results.push({ rating, title, body: body.slice(0, 200) });
  }
  return results;
}

// ブロック・CAPTCHA検出
function isBlocked(resp, html) {
  if (resp.url.includes('/ap/signin') || resp.url.includes('/gp/sign-in')) return 'login';
  if (resp.url.includes('/errors/validateCaptcha') || resp.url.includes('captcha')) return 'captcha';
  if (resp.status === 429 || resp.status === 503) return 'rate_limit';
  // HTMLにCAPTCHA要素が含まれる場合
  if (html && html.includes('Type the characters you see in this image')) return 'captcha';
  return null;
}

// 1ページ分のレビューページを取得
// 戻り値: レビュー配列 / [] = 最終ページ越え / null = ブロック/エラー
// ASINごとに有効なレビューURLパスをキャッシュ
const _reviewPathCache = {};

async function fetchReviewPage(asin, page) {
  const params = `?ie=UTF8&pageNumber=${page}&reviewerType=all_reviews&sortBy=recent`;
  // 候補URLパス（ASINによって異なるため両方試す）
  const paths = _reviewPathCache[asin]
    ? [_reviewPathCache[asin]]
    : [
        `https://www.amazon.co.jp/product-reviews/${asin}/`,
        `https://www.amazon.co.jp/gp/product-reviews/${asin}/`,
      ];

  for (const basePath of paths) {
    try {
      const resp = await fetch(basePath + params, { credentials: 'include' });
      if (resp.status === 404) continue; // 別のパスを試す
      if (!resp.ok) return null;
      const html = await resp.text();
      const blockReason = isBlocked(resp, html);
      if (blockReason) return { blocked: blockReason };
      const doc = new DOMParser().parseFromString(html, 'text/html');
      // 成功したパスをキャッシュ
      if (!_reviewPathCache[asin]) _reviewPathCache[asin] = basePath;
      return extractReviewsFromDoc(doc);
    } catch (_) {
      continue;
    }
  }
  return null;
}

// ★4以上200件・★2以下200件・最大400件取得（1ページずつ順次・ランダム遅延）
// ログイン必須・ブロックの場合は現在ページのDOMにフォールバック
async function fetchAllReviews(asin, onProgress) {
  const positive = []; // ★4以上
  const negative = []; // ★2以下
  const MAX_PER_CATEGORY = 200;
  const MAX_PAGES = 20; // 最大20ページ（10件/ページ × 20 = 200件）

  let page = 1;
  let blocked = false;
  let noAddPages = 0; // 追加ゼロのページ数

  while (page <= MAX_PAGES && (positive.length < MAX_PER_CATEGORY || negative.length < MAX_PER_CATEGORY)) {
    const res = await fetchReviewPage(asin, page);

    if (res === null) break;
    if (res.blocked) { blocked = true; break; }

    let anyAdded = false;
    if (res.length > 0) {
      for (const r of res) {
        if (r.rating >= 4 && positive.length < MAX_PER_CATEGORY) { positive.push(r); anyAdded = true; }
        else if (r.rating <= 2 && negative.length < MAX_PER_CATEGORY) { negative.push(r); anyAdded = true; }
      }
    } else {
      break; // 最終ページ越え
    }

    if (onProgress) onProgress(positive.length, negative.length);
    if (positive.length >= MAX_PER_CATEGORY && negative.length >= MAX_PER_CATEGORY) break;

    // 連続して追加なし → 残りのカテゴリは存在しないと判断
    if (!anyAdded) { noAddPages++; if (noAddPages >= 5) break; } else noAddPages = 0;

    page++;
    // 人間のブラウジングに近いランダム遅延（1.5〜3秒）
    const delay = 1500 + Math.random() * 1500;
    await new Promise(r => setTimeout(r, delay));
  }

  // ブロックまたはレビューゼロの場合、現在ページのDOMから抽出
  if (blocked || (positive.length === 0 && negative.length === 0)) {
    const domReviews = extractReviewsFromDoc(document);
    for (const r of domReviews) {
      if (r.rating >= 4) positive.push(r);
      else if (r.rating <= 2) negative.push(r);
    }
    if (onProgress) onProgress(positive.length, negative.length);
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
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          const msg = chrome.runtime.lastError.message || '';
          if (msg.includes('Extension context invalidated') || msg.includes('Could not establish connection')) {
            reject(new Error('拡張機能が更新されました。ページを再読み込みしてください（Cmd+R）'));
          } else {
            reject(new Error(msg));
          }
        } else {
          resolve(response);
        }
      });
    } catch (e) {
      reject(new Error('拡張機能が更新されました。ページを再読み込みしてください（Cmd+R）'));
    }
  });
}
