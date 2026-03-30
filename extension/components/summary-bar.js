/**
 * サマリーバーコンポーネント
 * 検索結果ページ最上部に固定表示するネイビー帯
 */

export class SummaryBar {
  constructor() {
    this.el = null;
    this.state = 'idle'; // idle | loading | loaded | error
  }

  render() {
    const bar = document.createElement('div');
    bar.id = 'ec-lens-summary-bar';
    bar.innerHTML = `
      <style>
        #ec-lens-summary-bar {
          position: relative;
          z-index: 9999;
          background: #1A237E;
          color: #fff;
          font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        #ec-lens-summary-bar .ec-lens-brand {
          font-weight: 700;
          font-size: 14px;
          color: #90CAF9;
          white-space: nowrap;
          margin-right: 4px;
        }
        #ec-lens-summary-bar .ec-lens-metrics {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          flex-wrap: wrap;
        }
        #ec-lens-summary-bar .ec-lens-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }
        #ec-lens-summary-bar .ec-lens-metric-label {
          font-size: 10px;
          color: rgba(255,255,255,0.65);
          white-space: nowrap;
        }
        #ec-lens-summary-bar .ec-lens-metric-value {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
        }
        #ec-lens-summary-bar .ec-lens-metric-value.pending {
          color: rgba(255,255,255,0.3);
        }
        #ec-lens-summary-bar .ec-lens-analyze-btn {
          background: #1560BD;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        #ec-lens-summary-bar .ec-lens-analyze-btn:hover {
          background: #1976D2;
        }
        #ec-lens-summary-bar .ec-lens-analyze-btn:disabled {
          background: rgba(255,255,255,0.2);
          cursor: default;
        }
        #ec-lens-summary-bar .ec-lens-error {
          color: #FFCDD2;
          font-size: 12px;
          flex: 1;
        }
        #ec-lens-summary-bar .ec-lens-retry-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.5);
          color: #fff;
          border-radius: 4px;
          padding: 4px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        .ec-lens-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: ec-lens-spin 0.6s linear infinite;
          vertical-align: middle;
          margin-right: 4px;
        }
        @keyframes ec-lens-spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <span class="ec-lens-brand">EC Lens</span>
      <div class="ec-lens-metrics" id="ec-lens-metrics">
        ${this._renderMetrics(null)}
      </div>
      <button class="ec-lens-analyze-btn" id="ec-lens-analyze-btn">市場を分析する ▶</button>
    `;

    this.el = bar;
    return bar;
  }

  _renderMetrics(data) {
    const metrics = [
      { label: '月間検索', key: 'searches', format: (v) => v ? `${Number(v).toLocaleString()}` : '---' },
      { label: '購買率', key: 'purchaseRate', format: (v) => v != null ? `${(v * 100).toFixed(1)}%` : '---' },
      { label: '需給比(DSR)', key: 'supplyDemandRatio', format: (v) => v != null ? v.toFixed(1) : '---' },
      { label: '平均価格', key: 'avgPrice', format: (v) => v ? `¥${Number(v).toLocaleString()}` : '---' },
      { label: '上位3社シェア', key: 'top3Share', format: (v) => v != null ? `${(v * 100).toFixed(0)}%` : '---' },
      { label: 'PPC入札額', key: 'bid', format: (v) => v ? `¥${Number(v).toLocaleString()}` : '---' },
    ];

    return metrics.map(m => {
      const value = data ? data[m.key] : null;
      const isPending = !data;
      return `
        <div class="ec-lens-metric">
          <span class="ec-lens-metric-label">${m.label}</span>
          <span class="ec-lens-metric-value${isPending ? ' pending' : ''}">${m.format(value)}</span>
        </div>
      `;
    }).join('');
  }

  setLoading() {
    this.state = 'loading';
    const btn = this.el.querySelector('#ec-lens-analyze-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="ec-lens-spinner"></span>取得中...';
  }

  setData(keywordData, productData) {
    this.state = 'loaded';

    // データ集計
    const metricsData = {};

    if (keywordData) {
      const kw = keywordData.items?.[0] ?? keywordData;
      metricsData.searches = kw.searches;
      metricsData.purchaseRate = kw.purchaseRate;
      metricsData.supplyDemandRatio = kw.supplyDemandRatio;
      metricsData.bid = kw.bid ?? kw.bidMin;
    }

    if (productData && productData.items && productData.items.length > 0) {
      const items = productData.items;
      // 平均価格
      const prices = items.map(i => i.price).filter(Boolean);
      if (prices.length) metricsData.avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      // 上位3社シェア
      const totalUnits = items.reduce((a, i) => a + (i.units || 0), 0);
      const top3Units = items.slice(0, 3).reduce((a, i) => a + (i.units || 0), 0);
      if (totalUnits > 0) metricsData.top3Share = top3Units / totalUnits;
    }

    const metricsEl = this.el.querySelector('#ec-lens-metrics');
    metricsEl.innerHTML = this._renderMetrics(metricsData);

    const btn = this.el.querySelector('#ec-lens-analyze-btn');
    btn.disabled = false;
    btn.textContent = '再取得 ▶';
  }

  setError(message) {
    this.state = 'error';
    const metricsEl = this.el.querySelector('#ec-lens-metrics');
    metricsEl.innerHTML = `<span class="ec-lens-error">${message}</span>`;

    const btn = this.el.querySelector('#ec-lens-analyze-btn');
    btn.disabled = false;
    btn.textContent = '再試行 ▶';
  }

  onAnalyzeClick(handler) {
    this.el.querySelector('#ec-lens-analyze-btn').addEventListener('click', handler);
  }
}
