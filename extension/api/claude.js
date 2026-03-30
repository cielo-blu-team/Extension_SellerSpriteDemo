/**
 * Claude API呼び出しラッパー
 * レビュー分析専用
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 3000;
const TIMEOUT_MS = 60000; // AI分析は最大60秒

export class ClaudeAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  // APIキーがHTTPヘッダーとして使用可能か検証
  _validateKey() {
    if (!this.apiKey) {
      throw new Error('APIキーが入力されていません');
    }
    // ISO-8859-1範囲外（> U+00FF）の文字が含まれていると fetch がエラーになる
    if (!/^[\x00-\xFF]+$/.test(this.apiKey)) {
      throw new Error('APIキーに使用できない文字が含まれています。コピー時に全角文字や特殊記号が混入していないか確認してください');
    }
    if (!this.apiKey.startsWith('sk-ant-')) {
      throw new Error('APIキーの形式が正しくありません。「sk-ant-api03-...」で始まるキーを入力してください');
    }
  }

  // 疎通テスト
  async testConnection() {
    this._validateKey();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
        signal: controller.signal,
      });

      // レスポンスボディを読んで詳細なエラー情報を取得
      const data = await response.json().catch(() => null);
      const apiMessage = data?.error?.message || null;
      const errorType = data?.error?.type || null;

      if (response.status === 401) {
        const hint = this._authErrorHint(apiMessage);
        throw new Error(`APIキーが認証されませんでした。${hint}`);
      }
      if (response.status === 403) {
        throw new Error(`アクセスが拒否されました。${apiMessage || 'このキーには必要な権限がありません。'}`);
      }
      if (response.status === 400) {
        // モデル名やリクエスト形式の問題 → 疎通自体は成功
        if (errorType === 'invalid_request_error' && apiMessage?.includes('model')) {
          return { success: true, message: '接続成功（モデル名要確認）' };
        }
        return { success: true, message: '接続成功' };
      }
      if (!response.ok) {
        throw new Error(`接続エラー（HTTP ${response.status}）: ${apiMessage || '不明なエラー'}`);
      }

      return { success: true, message: '接続成功' };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('タイムアウトしました。ネットワーク環境を確認してください');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 401エラーの原因を推測してヒントを返す
  _authErrorHint(apiMessage) {
    if (!apiMessage) {
      return '以下を確認してください：\n・「sk-ant-api03-...」で始まるキーか\n・コピー時に余分なスペースが含まれていないか\n・Anthropic Consoleで発行済みの有効なキーか';
    }
    if (apiMessage.includes('invalid x-api-key')) {
      return 'キーの値が正しくありません。Anthropic Console（console.anthropic.com）で再発行したキーを入力してください。';
    }
    if (apiMessage.includes('disabled') || apiMessage.includes('deactivated')) {
      return 'このAPIキーは無効化されています。Anthropic Consoleで新しいキーを発行してください。';
    }
    return apiMessage;
  }

  // レビュー分析
  async analyzeReviews(asin, productTitle, reviews) {
    const { positive, negative } = reviews;
    if (!positive.length && !negative.length) {
      throw new Error('分析するレビューがありません');
    }

    const positiveText = positive
      .map((r, i) => `[${i + 1}] ★${r.rating} ${r.title ? r.title + '\n' : ''}${r.body}`)
      .join('\n\n');
    const negativeText = negative
      .map((r, i) => `[${i + 1}] ★${r.rating} ${r.title ? r.title + '\n' : ''}${r.body}`)
      .join('\n\n');

    const prompt = `あなたは世界最高水準のマーケターの思考を持つAmazon OEMリサーチアシスタントです。
以下のレビューを分析し、JSON形式のみで回答してください。

【商品名】${productTitle}
【ASIN】${asin}
【高評価レビュー（★4以上・${positive.length}件）】
${positiveText || '（なし）'}

【低評価レビュー（★2以下・${negative.length}件）】
${negativeText || '（なし）'}

以下の4つの観点で分析してください。

1. persona（購買ペルソナ 5W1H）
   - who: 誰が買っているか（上位3属性・割合付き）
   - when: いつ買うか（購買タイミング 上位3パターン・割合付き）
   - where: どこで使うか（使用場所 上位3パターン・割合付き）
   - what: 何のために買うか（目的 上位3パターン・割合付き）
   - why: なぜ今買ったか（購買トリガー 上位3パターン・割合付き）
   - how: どうやって知ったか（流入経路 上位3パターン・割合付き）

2. pros（本文に見られる高評価ポイント・称賛内容）各5件
   - topic: トピック名
   - percent: 言及割合（%）
   - review_quote: レビューからの引用（30文字以内）

3. cons（本文に見られる低評価ポイント・不満・改善要望）各5件
   - topic: トピック名
   - percent: 言及割合（%）
   - review_quote: レビューからの引用（30文字以内）

4. usage_scenes（使用シーン）各5件
   - scene: シーン名
   - percent: 言及割合（%）
   - review_quote: レビューからの引用（30文字以内）

以下の形式で、ラッパーキーを付けずに直接JSON形式のみで回答してください。説明文は不要です。
{"persona":{...},"pros":[...],"cons":[...],"usage_scenes":[...]}`;

    this._validateKey();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });

      const respData = await response.json().catch(() => null);
      const respMessage = respData?.error?.message || null;

      if (response.status === 401) {
        const hint = this._authErrorHint(respMessage);
        throw new Error(`APIキー認証エラー: ${hint}`);
      }
      if (response.status === 403) {
        throw new Error(`アクセス拒否: ${respMessage || '設定画面でAPIキーを確認してください'}`);
      }
      if (response.status === 429) {
        throw new Error('レート制限に達しました。しばらく待ってから再試行してください');
      }
      if (!response.ok) {
        throw new Error(`分析に失敗しました（HTTP ${response.status}）: ${respMessage || '不明なエラー'}`);
      }

      const content = respData?.content?.[0]?.text || '';

      // JSONパース（マークダウンコードブロック除去）
      const jsonText = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(jsonText);

      return { success: true, result: parsed };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('分析がタイムアウトしました。再試行してください');
      }
      if (err instanceof SyntaxError) {
        throw new Error('分析結果の解析に失敗しました。再試行してください');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
