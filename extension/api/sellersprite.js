/**
 * SellerSprite API呼び出しラッパー
 * Base URL: https://api.sellersprite.com
 * 認証: secret-key ヘッダー
 */

const BASE_URL = 'https://api.sellersprite.com';
const TIMEOUT_MS = 10000;
const MARKETPLACE = 'JP';

export class SellerSpriteAPI {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }

  // 共通リクエスト
  async request(method, path, params = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      let url = `${BASE_URL}${path}`;
      const options = {
        method,
        headers: {
          'secret-key': this.secretKey,
          'Content-Type': 'application/json;charset=UTF-8',
        },
        signal: controller.signal,
      };

      if (method === 'GET') {
        const qs = new URLSearchParams(params).toString();
        if (qs) url += `?${qs}`;
      } else {
        options.body = JSON.stringify(params);
      }

      const response = await fetch(url, options);

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        throw new Error(`APIレスポンスのパースに失敗しました（${response.status}）: ${text.slice(0, 200)}`);
      }

      // 生レスポンスをログ出力（DevToolsのService Workerコンソールで確認可能）
      console.log(`[EC Lens API] ${method} ${path}`, {
        status: response.status,
        code: data.code,
        message: data.message,
        keys: data.data ? Object.keys(data.data) : Object.keys(data),
      });

      // SellerSprite API: code=1 または message="成功" が成功
      const code = data.code;
      const message = data.message || data.msg || '';
      const isSuccess =
        code === 1 || code === '1' ||
        message === '成功' ||
        (code === undefined && response.ok);

      if (!isSuccess) {
        throw new SellerSpriteError(
          code,
          message || data.error || `APIエラー（コード: ${code}, HTTP: ${response.status}）`
        );
      }

      return data.data !== undefined ? data.data : data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('タイムアウトしました。再試行してください');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // API残量確認
  async checkVisits() {
    const data = await this.request('GET', '/v1/visits');
    // data は配列: [{ module, remain, message }, ...]
    const modules = Array.isArray(data) ? data : [];
    const available = modules.filter(m => m.remain !== undefined);
    const totalRemain = available.reduce((sum, m) => sum + (m.remain || 0), 0);
    const summary = available.map(m => `${m.module}:${m.remain}`).join(', ');
    return {
      modules,
      message: summary || '利用可能モジュールなし',
    };
  }

  // キーワード挖掘
  async keywordMiner(keyword) {
    return this.request('POST', '/v1/keyword/miner', {
      keyword,
      marketplace: MARKETPLACE,
    });
  }

  // 商品リサーチ（最大50件）
  async productResearch(keyword, page = 1, size = 50) {
    return this.request('POST', '/v1/product/research', {
      keyword,
      marketplace: MARKETPLACE,
      page,
      size,
    });
  }

  // ASIN詳細
  async asinDetail(marketplace, asin) {
    return this.request('GET', `/v1/asin/${marketplace}/${asin}`);
  }

  // ASIN売上予測
  async salesPredictionAsin(asin) {
    return this.request('GET', '/v1/sales/prediction/asin', {
      asin,
      marketplace: MARKETPLACE,
    });
  }

  // BSR売上予測
  async salesPredictionBsr(asin) {
    // まずカテゴリノードIDを取得
    const nodeId = await this.getCategoryNode(asin);
    return this.request('GET', '/v1/sales/prediction/bsr', {
      nodeId,
      marketplace: MARKETPLACE,
    });
  }

  // 逆引きキーワード
  async trafficKeyword(asin, page = 1, size = 20) {
    return this.request('POST', '/v1/traffic/keyword', {
      asin,
      marketplace: MARKETPLACE,
      page,
      size,
    });
  }

  // Googleトレンド
  async googleTrends(keyword) {
    return this.request('GET', '/v1/google/trends', {
      keyword,
      marketplace: MARKETPLACE,
    });
  }

  // カテゴリノード（ローカルキャッシュ付き）
  async getCategoryNode(asin) {
    const cacheKey = `node_${asin}`;
    const cached = await chrome.storage.local.get(cacheKey);
    const now = Date.now();

    if (cached[cacheKey] && now - cached[cacheKey].timestamp < 7 * 24 * 60 * 60 * 1000) {
      return cached[cacheKey].nodeId;
    }

    const data = await this.request('GET', '/v1/product/node', {
      asin,
      marketplace: MARKETPLACE,
    });

    const nodeId = data.nodeId || data.node_id || '';
    await chrome.storage.local.set({
      [cacheKey]: { nodeId, timestamp: now },
    });

    return nodeId;
  }
}

// エラークラス
export class SellerSpriteError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'SellerSpriteError';
  }

  toUserMessage() {
    switch (this.code) {
      case 'ERROR_VISIT_MAX':
        return '本日の利用上限に達しました。明日以降に再試行してください';
      case 'ERROR_SECRET_KEY':
        return 'APIキーが無効です。設定画面で確認してください';
      default:
        return this.message || '通信エラーが発生しました。再試行してください';
    }
  }
}
