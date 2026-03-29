/**
 * Claude API呼び出しラッパー
 * レビュー分析専用
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 3000;
const TIMEOUT_MS = 60000; // AI分析は最大60秒

export class ClaudeAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  // 疎通テスト
  async testConnection() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
        signal: controller.signal,
      });

      if (response.status === 401) {
        throw new Error('APIキーが無効です');
      }
      if (!response.ok && response.status !== 400) {
        throw new Error(`接続エラー: ${response.status}`);
      }

      return { success: true, message: '接続成功' };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('タイムアウトしました');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // レビュー分析
  async analyzeReviews(asin, productTitle, reviews) {
    const { positive, negative } = reviews;

    if (!positive.length && !negative.length) {
      throw new Error('分析するレビューがありません');
    }

    const positiveText = positive
      .map((r, i) => `[${i + 1}] ★${r.rating} ${r.title}\n${r.body}`)
      .join('\n\n');
    const negativeText = negative
      .map((r, i) => `[${i + 1}] ★${r.rating} ${r.title}\n${r.body}`)
      .join('\n\n');

    const prompt = `あなたは世界最高水準のマーケターの思考を持つAmazon OEMリサーチアシスタントです。
以下のレビューを分析し、JSON形式のみで回答してください。

【商品名】${productTitle}
【ASIN】${asin}
【高評価レビュー（4-5星）】
${positiveText || '（高評価レビューなし）'}

【低評価レビュー（1-2星）】
${negativeText || '（低評価レビューなし）'}

以下の4つの観点で分析してください。

1. persona（購買ペルソナ 5W1H）
   - who: 誰が買っているか（上位3属性・割合付き）
   - when: いつ買うか（購買タイミング 上位3パターン・割合付き）
   - where: どこで使うか（使用場所 上位3パターン・割合付き）
   - what: 何のために買うか（目的 上位3パターン・割合付き）
   - why: なぜ今買ったか（購買トリガー 上位3パターン・割合付き）
   - how: どうやって知ったか（流入経路 上位3パターン・割合付き）

2. pros（高評価ポイント）各5件
   - topic: トピック名
   - percent: 言及割合（%）
   - review_quote: レビューからの引用（30文字以内）

3. cons（低評価ポイント）各5件
   - topic: トピック名
   - percent: 言及割合（%）
   - review_quote: レビューからの引用（30文字以内）

4. usage_scenes（使用シーン）各5件
   - scene: シーン名
   - percent: 言及割合（%）
   - review_quote: レビューからの引用（30文字以内）

必ずJSON形式のみで回答してください。説明文は不要です。`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });

      if (response.status === 401) {
        throw new Error('Anthropic APIキーが無効です。設定画面で確認してください');
      }
      if (response.status === 429) {
        throw new Error('分析に失敗しました。しばらく後に再試行してください（レート制限）');
      }
      if (!response.ok) {
        throw new Error(`分析に失敗しました（HTTPエラー: ${response.status}）`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';

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
