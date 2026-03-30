/**
 * Service Worker - API呼び出し・キャッシュ管理
 * CORS制限を回避するためBackground側でAPI呼び出しを行う
 */

import { SellerSpriteAPI } from '../api/sellersprite.js';
import { ClaudeAPI } from '../api/claude.js';

const CACHE_TTL = {
  categoryNode: 7 * 24 * 60 * 60 * 1000, // 7日
};

// インストール時に設定画面を開く
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});

// メッセージハンドラ
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((err) => {
      console.error('[EC Lens SW] エラー:', message.type, err);
      sendResponse({ error: err.message || '不明なエラーが発生しました' });
    });
  return true; // 非同期レスポンスのためtrueを返す
});

async function handleMessage(message, sender) {
  const { type } = message;

  switch (type) {
    case 'GET_SETTINGS':
      return getSettings();

    case 'SEARCH_ANALYSIS':
      return handleSearchAnalysis(message.keyword);

    case 'ASIN_ANALYSIS':
      return handleAsinAnalysis(message.asin, message.keyword);

    case 'REVIEW_ANALYSIS':
      return handleReviewAnalysis(message.asin, message.productTitle, message.reviews);

    case 'TEST_SELLERSPRITE_KEY':
      return testSellerSpriteKey(message.secretKey);

    case 'TEST_ANTHROPIC_KEY':
      return testAnthropicKey(message.apiKey);

    case 'CLEAR_CACHE':
      return clearCache();

    case 'OPEN_OPTIONS':
      chrome.runtime.openOptionsPage();
      return { success: true };

    default:
      throw new Error(`不明なメッセージタイプ: ${type}`);
  }
}

// 設定取得
async function getSettings() {
  const result = await chrome.storage.local.get([
    'sellerSpriteKey',
    'anthropicKey',
    'extensionEnabled',
    'searchPageEnabled',
    'asinPageEnabled',
  ]);
  return {
    sellerSpriteKey: result.sellerSpriteKey || '',
    anthropicKey: result.anthropicKey || '',
    extensionEnabled: result.extensionEnabled !== false,
    searchPageEnabled: result.searchPageEnabled !== false,
    asinPageEnabled: result.asinPageEnabled !== false,
  };
}

// 検索結果ページ分析
async function handleSearchAnalysis(keyword) {
  const settings = await getSettings();
  if (!settings.sellerSpriteKey) {
    throw new Error('SellerSprite APIキーが設定されていません');
  }

  // セッションキャッシュチェック
  const cacheKey = `search_${keyword}`;
  const cached = await getSessionCache(cacheKey);
  if (cached) return cached;

  const api = new SellerSpriteAPI(settings.sellerSpriteKey);

  const [keywordData, productData] = await Promise.allSettled([
    api.keywordMiner(keyword),
    api.productResearch(keyword),
  ]);

  // 生データをログ出力（SW DevToolsで確認）
  if (keywordData.status === 'fulfilled') {
    console.log('[EC Lens SW] keywordMiner raw:', JSON.stringify(keywordData.value).slice(0, 500));
  } else {
    console.error('[EC Lens SW] keywordMiner error:', keywordData.reason.message);
  }
  if (productData.status === 'fulfilled') {
    console.log('[EC Lens SW] productResearch raw:', JSON.stringify(productData.value).slice(0, 500));
  } else {
    console.error('[EC Lens SW] productResearch error:', productData.reason.message);
  }

  const result = {
    keyword,
    keywordData: keywordData.status === 'fulfilled' ? keywordData.value : null,
    keywordError: keywordData.status === 'rejected' ? keywordData.reason.message : null,
    productData: productData.status === 'fulfilled' ? productData.value : null,
    productError: productData.status === 'rejected' ? productData.reason.message : null,
  };

  await setSessionCache(cacheKey, result);
  return result;
}

// 商品詳細ページ分析
async function handleAsinAnalysis(asin, keyword) {
  const settings = await getSettings();
  if (!settings.sellerSpriteKey) {
    throw new Error('SellerSprite APIキーが設定されていません');
  }

  // セッションキャッシュチェック
  const cacheKey = `asin_${asin}`;
  const cached = await getSessionCache(cacheKey);
  if (cached) return cached;

  const api = new SellerSpriteAPI(settings.sellerSpriteKey);

  const [asinDetail, salesPrediction, trafficKeyword, googleTrends, bsrPrediction] =
    await Promise.allSettled([
      api.asinDetail('JP', asin),
      api.salesPredictionAsin(asin),
      api.trafficKeyword(asin),
      api.googleTrends(keyword || asin),
      api.salesPredictionBsr(asin),
    ]);

  const result = {
    asin,
    asinDetail: asinDetail.status === 'fulfilled' ? asinDetail.value : null,
    asinDetailError: asinDetail.status === 'rejected' ? asinDetail.reason.message : null,
    salesPrediction: salesPrediction.status === 'fulfilled' ? salesPrediction.value : null,
    salesPredictionError: salesPrediction.status === 'rejected' ? salesPrediction.reason.message : null,
    trafficKeyword: trafficKeyword.status === 'fulfilled' ? trafficKeyword.value : null,
    trafficKeywordError: trafficKeyword.status === 'rejected' ? trafficKeyword.reason.message : null,
    googleTrends: googleTrends.status === 'fulfilled' ? googleTrends.value : null,
    googleTrendsError: googleTrends.status === 'rejected' ? googleTrends.reason.message : null,
    bsrPrediction: bsrPrediction.status === 'fulfilled' ? bsrPrediction.value : null,
    bsrPredictionError: bsrPrediction.status === 'rejected' ? bsrPrediction.reason.message : null,
  };

  await setSessionCache(cacheKey, result);
  return result;
}

// AIレビュー分析
async function handleReviewAnalysis(asin, productTitle, reviews) {
  const settings = await getSettings();
  if (!settings.anthropicKey) {
    throw new Error('Anthropic APIキーが設定されていません');
  }

  const claude = new ClaudeAPI(settings.anthropicKey);
  return claude.analyzeReviews(asin, productTitle, reviews);
}

// SellerSprite APIキーテスト
async function testSellerSpriteKey(secretKey) {
  const api = new SellerSpriteAPI(secretKey);
  return api.checkVisits();
}

// Anthropic APIキーテスト
async function testAnthropicKey(apiKey) {
  const claude = new ClaudeAPI(apiKey);
  return claude.testConnection();
}

// キャッシュクリア
async function clearCache() {
  await chrome.storage.session.clear();
  // localキャッシュはcategoryNode以外は削除しない
  return { success: true };
}

// セッションキャッシュ取得
async function getSessionCache(key) {
  const result = await chrome.storage.session.get(key);
  return result[key] || null;
}

// セッションキャッシュ保存
async function setSessionCache(key, value) {
  await chrome.storage.session.set({ [key]: value });
}
