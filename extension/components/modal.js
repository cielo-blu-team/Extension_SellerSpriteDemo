/**
 * スティッキーパネルコンポーネント（5タブ）
 * 商品詳細ページ下部に固定表示
 */

import { Chart } from 'chart.js/auto';

export class Modal {
  constructor() {
    this.el = null;
    this.activeTab = 'overview';
    this.data = null;
    this.asin = null;
    this.reviewHandler = null;
    this._charts = {};
    this._expanded = false;
    this._analyzeHandler = null;
  }

  render(asin) {
    this.asin = asin;
    const panel = document.createElement('div');
    panel.id = 'ec-lens-panel';
    panel.innerHTML = `
      <style>
        #ec-lens-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 999999;
          font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
        }
        #ec-lens-panel-header {
          background: #1A237E;
          color: #fff;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          user-select: none;
        }
        #ec-lens-panel-brand {
          font-size: 15px;
          font-weight: 700;
          color: #90CAF9;
          white-space: nowrap;
          cursor: pointer;
        }
        #ec-lens-panel-divider {
          width: 1px;
          height: 14px;
          background: rgba(255,255,255,0.3);
        }
        #ec-lens-panel-asin {
          font-size: 13px;
          font-weight: 600;
          color: #90CAF9;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(144,202,249,0.3);
          border-radius: 4px;
          padding: 2px 6px;
          white-space: nowrap;
          letter-spacing: 0.5px;
        }
        #ec-lens-copy-asin {
          background: none;
          border: 1px solid rgba(144,202,249,0.4);
          border-radius: 3px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 12px;
          padding: 2px 6px;
          white-space: nowrap;
          transition: background 0.15s;
        }
        #ec-lens-copy-asin:hover {
          background: rgba(255,255,255,0.15);
          color: #fff;
        }
        #ec-lens-panel-title {
          font-size: 14px;
          font-weight: 500;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          min-width: 0;
        }
        #ec-lens-analyze-btn {
          background: #1560BD;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 5px 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        #ec-lens-analyze-btn:hover:not(:disabled) { background: #1976D2; }
        #ec-lens-analyze-btn:disabled {
          background: rgba(255,255,255,0.15);
          cursor: default;
        }
        .ec-lens-hdr-btn {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.65);
          font-size: 17px;
          cursor: pointer;
          padding: 2px 6px;
          line-height: 1;
          flex-shrink: 0;
        }
        .ec-lens-hdr-btn:hover { color: #fff; }
        .ec-lens-spinner-sm {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: ec-lens-spin-sm 0.6s linear infinite;
          vertical-align: middle;
          margin-right: 4px;
        }
        @keyframes ec-lens-spin-sm { to { transform: rotate(360deg); } }
        #ec-lens-resize-handle {
          height: 6px;
          background: #E8EAF6;
          cursor: ns-resize;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          user-select: none;
        }
        #ec-lens-resize-handle:hover { background: #C5CAE9; }
        #ec-lens-resize-handle::after {
          content: '';
          width: 32px;
          height: 2px;
          background: #9FA8DA;
          border-radius: 1px;
        }
        #ec-lens-panel-body-wrap {
          background: #fff;
          display: none;
          flex-direction: column;
          height: 50vh;
        }
        #ec-lens-panel-body-wrap.open {
          display: flex;
        }
        #ec-lens-panel-tabs {
          display: flex;
          border-bottom: 2px solid #E0E0E0;
          background: #F5F5F5;
          flex-shrink: 0;
          overflow-x: auto;
        }
        .ec-lens-tab-btn {
          padding: 9px 14px;
          font-size: 14px;
          font-weight: 500;
          border: none;
          background: transparent;
          cursor: pointer;
          white-space: nowrap;
          color: #555;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          transition: color 0.15s;
          font-family: inherit;
        }
        .ec-lens-tab-btn.active {
          color: #1560BD;
          border-bottom-color: #1560BD;
          font-weight: 700;
        }
        .ec-lens-tab-btn:hover:not(.active) { color: #1560BD; }
        #ec-lens-panel-body {
          overflow-y: auto;
          flex: 1;
          padding: 14px 16px;
          font-size: 14px;
          color: #333;
          line-height: 1.6;
        }
        /* 共通テーブル */
        .ec-lens-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 14px;
        }
        .ec-lens-table th {
          background: #1A237E;
          color: #fff;
          padding: 7px 10px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
        }
        .ec-lens-table td {
          padding: 6px 10px;
          border-bottom: 1px solid #E0E0E0;
        }
        .ec-lens-table tr:hover td { background: #F5F7FF; }
        /* 概要グリッド */
        .ec-lens-overview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .ec-lens-overview-card {
          background: #F5F7FF;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          padding: 10px 12px;
        }
        .ec-lens-overview-card .label {
          font-size: 12px;
          color: #777;
          margin-bottom: 2px;
        }
        .ec-lens-overview-card .value {
          font-size: 19px;
          font-weight: 700;
          color: #1A237E;
        }
        .ec-lens-overview-card .value.sm { font-size: 13px; }
        /* バッジ行 */
        .ec-lens-badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .ec-lens-pill {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }
        .ec-lens-pill.good { background: #E8F5E9; color: #2E7D32; }
        .ec-lens-pill.warn { background: #FFF3E0; color: #E65100; }
        .ec-lens-pill.info { background: #E3F2FD; color: #1560BD; }
        .ec-lens-pill.gray { background: #F5F5F5; color: #555; }
        /* 割合バー */
        .ec-lens-percent-bar {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ec-lens-percent-bar .bar-track {
          flex: 1;
          height: 6px;
          background: #E0E0E0;
          border-radius: 3px;
          overflow: hidden;
        }
        .ec-lens-percent-bar .bar-fill {
          height: 100%;
          border-radius: 3px;
        }
        .ec-lens-percent-bar .bar-fill.green { background: #2E7D32; }
        .ec-lens-percent-bar .bar-fill.red { background: #C62828; }
        .ec-lens-percent-bar .bar-fill.blue { background: #1560BD; }
        /* 5W1Hグリッド */
        .ec-lens-5w1h-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .ec-lens-5w1h-card {
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          overflow: hidden;
        }
        .ec-lens-5w1h-card .card-head {
          background: #1A237E;
          color: #fff;
          padding: 5px 10px;
          font-size: 13px;
          font-weight: 700;
        }
        .ec-lens-5w1h-card .card-body {
          padding: 8px 10px;
          font-size: 13px;
        }
        .ec-lens-5w1h-card .card-body li {
          padding: 2px 0;
          border-bottom: 1px solid #F0F0F0;
          list-style: none;
          display: flex;
          justify-content: space-between;
        }
        .ec-lens-5w1h-card .card-body li:last-child { border-bottom: none; }
        /* スケルトン */
        .ec-lens-skeleton {
          background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%);
          background-size: 200% 100%;
          animation: ec-lens-shimmer 1.2s infinite;
          border-radius: 4px;
        }
        @keyframes ec-lens-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        /* エラー表示 */
        .ec-lens-tab-error {
          color: #C62828;
          background: #FFF8F8;
          border: 1px solid #FFCDD2;
          border-radius: 6px;
          padding: 12px;
          margin: 8px 0;
          font-size: 14px;
        }
        /* チャートエリア */
        .ec-lens-chart-wrap {
          position: relative;
          height: 180px;
          margin-bottom: 14px;
          background: #FAFAFA;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          padding: 10px;
        }
        .ec-lens-chart-title {
          font-size: 13px;
          font-weight: 700;
          color: #444;
          margin-bottom: 6px;
        }
      </style>
      <div id="ec-lens-panel-header">
        <span id="ec-lens-panel-brand">EC Lens</span>
        <div id="ec-lens-panel-divider"></div>
        <span id="ec-lens-panel-asin">${asin}</span>
        <button id="ec-lens-copy-asin" title="ASINをコピー">コピー</button>
        <span id="ec-lens-panel-title" id="ec-lens-panel-toggle-area">商品を分析できます</span>
        <button id="ec-lens-analyze-btn">分析する ▶</button>
        <button class="ec-lens-hdr-btn" id="ec-lens-panel-toggle" title="開閉">▲</button>
        <button class="ec-lens-hdr-btn" id="ec-lens-panel-close" title="閉じる">×</button>
      </div>
      <div id="ec-lens-panel-body-wrap">
        <div id="ec-lens-resize-handle"></div>
        <div id="ec-lens-panel-tabs">
          <button class="ec-lens-tab-btn active" data-tab="overview">商品概要</button>
          <button class="ec-lens-tab-btn" data-tab="sales">売上推移</button>
          <button class="ec-lens-tab-btn" data-tab="keywords">流入KW</button>
          <button class="ec-lens-tab-btn" data-tab="trends">市場トレンド</button>
          <button class="ec-lens-tab-btn" data-tab="reviews">AIレビュー</button>
        </div>
        <div id="ec-lens-panel-body"></div>
      </div>
    `;

    this.el = panel;
    this._bindEvents();
    return panel;
  }

  _bindEvents() {
    // 閉じるボタン
    this.el.querySelector('#ec-lens-panel-close').addEventListener('click', () => this.close());

    // 折りたたみトグル（ブランド名・タイトル・トグルボタン）
    const toggle = () => this._toggleExpand();
    this.el.querySelector('#ec-lens-panel-toggle').addEventListener('click', toggle);
    this.el.querySelector('#ec-lens-panel-brand').addEventListener('click', toggle);
    this.el.querySelector('#ec-lens-panel-title').addEventListener('click', toggle);

    // ASINコピーボタン
    this.el.querySelector('#ec-lens-copy-asin').addEventListener('click', () => {
      navigator.clipboard.writeText(this.asin).then(() => {
        const btn = this.el.querySelector('#ec-lens-copy-asin');
        btn.textContent = 'コピー済';
        setTimeout(() => { btn.textContent = 'コピー'; }, 1500);
      }).catch(() => {});
    });

    // 分析ボタン
    this.el.querySelector('#ec-lens-analyze-btn').addEventListener('click', () => {
      if (this._analyzeHandler) this._analyzeHandler();
    });

    // タブ切り替え
    this.el.querySelectorAll('.ec-lens-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });

    // リサイズハンドル（上端ドラッグで高さ調整）
    const handle = this.el.querySelector('#ec-lens-resize-handle');
    const bodyWrap = this.el.querySelector('#ec-lens-panel-body-wrap');
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = bodyWrap.offsetHeight;
      const MIN_H = 150;
      const MAX_H = Math.round(window.innerHeight * 0.8);

      const onMove = (mv) => {
        const delta = startY - mv.clientY;
        const newH = Math.min(MAX_H, Math.max(MIN_H, startH + delta));
        bodyWrap.style.height = `${newH}px`;
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
        // ドラッグ後の高さを保存
        localStorage.setItem('ec-lens-panel-height', bodyWrap.offsetHeight);
      };
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  _toggleExpand() {
    this._expanded = !this._expanded;
    const wrap = this.el.querySelector('#ec-lens-panel-body-wrap');
    const toggleBtn = this.el.querySelector('#ec-lens-panel-toggle');
    wrap.classList.toggle('open', this._expanded);
    toggleBtn.textContent = this._expanded ? '▼' : '▲';
    if (this._expanded && this.data) {
      this._renderTabContent();
    }
  }

  _expand() {
    if (!this._expanded) {
      this._expanded = true;
      const wrap = this.el.querySelector('#ec-lens-panel-body-wrap');
      wrap.classList.add('open');
      // 保存済み高さがあれば復元、なければ50vh
      const saved = localStorage.getItem('ec-lens-panel-height');
      if (saved) {
        wrap.style.height = `${saved}px`;
      } else {
        wrap.style.height = `${Math.round(window.innerHeight * 0.5)}px`;
      }
      this.el.querySelector('#ec-lens-panel-toggle').textContent = '▼';
    }
  }

  onAnalyzeClick(handler) {
    this._analyzeHandler = handler;
  }

  setLoading() {
    const btn = this.el.querySelector('#ec-lens-analyze-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="ec-lens-spinner-sm"></span>取得中...';
    this._expand();
    const body = this.el.querySelector('#ec-lens-panel-body');
    body.innerHTML = this._renderLoading();
  }

  setReady() {
    const btn = this.el.querySelector('#ec-lens-analyze-btn');
    btn.disabled = false;
    btn.textContent = '再取得 ▶';
  }

  _switchTab(tab) {
    Object.values(this._charts).forEach(c => { try { c.destroy(); } catch (_) {} });
    this._charts = {};
    this.activeTab = tab;
    this.el.querySelectorAll('.ec-lens-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this._renderTabContent();
  }

  setData(data, productTitle) {
    this.data = data;
    if (productTitle) {
      this.el.querySelector('#ec-lens-panel-title').textContent = productTitle;
    }
    this._expand();
    this._renderTabContent();
  }

  _renderTabContent() {
    const body = this.el.querySelector('#ec-lens-panel-body');
    if (!body) return;
    if (!this.data && this.activeTab !== 'reviews') {
      body.innerHTML = this._renderLoading();
      return;
    }

    switch (this.activeTab) {
      case 'overview':
        body.innerHTML = this._renderOverview();
        break;
      case 'sales':
        body.innerHTML = this._renderSales();
        this._drawSalesCharts();
        break;
      case 'keywords':
        body.innerHTML = this._renderKeywords();
        break;
      case 'trends':
        body.innerHTML = this._renderTrends();
        this._drawTrendsChart();
        break;
      case 'reviews':
        body.innerHTML = this._renderReviews();
        this._bindReviewBtn();
        break;
    }
  }

  _renderLoading() {
    return `
      <div style="padding:12px 0">
        <div class="ec-lens-skeleton" style="height:20px;width:60%;margin-bottom:12px"></div>
        <div class="ec-lens-overview-grid">
          ${Array(6).fill('<div class="ec-lens-skeleton" style="height:60px"></div>').join('')}
        </div>
        <div class="ec-lens-skeleton" style="height:14px;width:40%;margin-bottom:8px"></div>
        <div class="ec-lens-skeleton" style="height:80px"></div>
      </div>
    `;
  }

  _renderOverview() {
    const d = this.data.asinDetail;
    const sp = this.data.salesPrediction;

    if (!d && this.data.asinDetailError) {
      return `<div class="ec-lens-tab-error">データ取得エラー: ${this.data.asinDetailError}</div>`;
    }

    const monthSales = sp?.monthItemList?.slice(-1)[0];

    const cards = [
      { label: '月間販売数（推定）', value: monthSales ? `${Number(monthSales.sales || 0).toLocaleString()}個` : '---' },
      { label: '月間売上（推定）', value: monthSales ? formatRevenue(monthSales.amount) : '---' },
      { label: 'BSRランキング', value: d?.bsrRank ? `${Number(d.bsrRank).toLocaleString()}位` : '---' },
      { label: 'LQSスコア', value: d?.lqs != null ? `${d.lqs}点` : '---' },
      { label: '出品日', value: d?.availableDate ? formatDateAndAge(d.availableDate) : '---', sm: true },
      { label: 'バリエーション数', value: d?.variations != null ? `${d.variations}種` : '---' },
    ];

    const badges = [];
    if (d?.badge?.ebc) badges.push({ text: 'A+ あり', cls: 'good' });
    if (d?.badge?.video) badges.push({ text: '動画あり', cls: 'info' });
    else badges.push({ text: '動画なし', cls: 'gray' });
    if (d?.badge?.bestSeller) badges.push({ text: 'ベストセラー', cls: 'good' });
    if (d?.sellerNation) {
      const n = d.sellerNation.toUpperCase();
      badges.push({ text: `セラー: ${n}`, cls: n === 'JP' ? 'info' : 'warn' });
    }

    return `
      <div class="ec-lens-overview-grid">
        ${cards.map(c => `
          <div class="ec-lens-overview-card">
            <div class="label">${c.label}</div>
            <div class="value${c.sm ? ' sm' : ''}">${c.value}</div>
          </div>
        `).join('')}
      </div>
      <div class="ec-lens-badge-row">
        ${badges.map(b => `<span class="ec-lens-pill ${b.cls}">${b.text}</span>`).join('')}
      </div>
    `;
  }

  _renderSales() {
    const sp = this.data.salesPrediction;
    if (!sp && this.data.salesPredictionError) {
      return `<div class="ec-lens-tab-error">データ取得エラー: ${this.data.salesPredictionError}</div>`;
    }
    if (!sp) return `<div class="ec-lens-tab-error">データがありません</div>`;

    const monthly = (sp.monthItemList || []).slice(-6);
    const rows = monthly.map(item => `
      <tr>
        <td>${item.date || '---'}</td>
        <td>${Number(item.sales || 0).toLocaleString()}個</td>
        <td>${formatRevenue(item.amount || 0)}</td>
      </tr>
    `).join('');

    return `
      <div class="ec-lens-chart-title">月別販売数（直近6ヶ月）</div>
      <div class="ec-lens-chart-wrap">
        <canvas id="ec-lens-chart-monthly"></canvas>
      </div>
      <table class="ec-lens-table" style="margin-top:10px">
        <thead><tr><th>月</th><th>販売数</th><th>売上</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#999">データなし</td></tr>'}</tbody>
      </table>
    `;
  }

  _drawSalesCharts() {
    const sp = this.data.salesPrediction;
    if (!sp) return;

    const monthly = (sp.monthItemList || []).slice(-6);
    const monthCanvas = this.el.querySelector('#ec-lens-chart-monthly');
    if (monthCanvas && monthly.length) {
      this._charts.monthly = new Chart(monthCanvas, {
        type: 'bar',
        data: {
          labels: monthly.map(i => i.date || ''),
          datasets: [
            {
              label: '販売数（個）',
              data: monthly.map(i => i.sales || 0),
              backgroundColor: 'rgba(21, 96, 189, 0.75)',
              borderColor: '#1560BD',
              borderWidth: 1,
              yAxisID: 'y',
            },
            {
              label: '売上（円）',
              data: monthly.map(i => i.amount || 0),
              type: 'line',
              borderColor: '#E65100',
              backgroundColor: 'rgba(230, 81, 0, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              yAxisID: 'y2',
            },
          ],
        },
        options: chartOptions('月', '販売数', '売上'),
      });
    }
  }

  _renderKeywords() {
    const kw = this.data.trafficKeyword;
    if (!kw && this.data.trafficKeywordError) {
      return `<div class="ec-lens-tab-error">データ取得エラー: ${this.data.trafficKeywordError}</div>`;
    }
    const items = kw?.items || [];
    if (!items.length) return `<div class="ec-lens-tab-error">流入キーワードデータがありません</div>`;

    const rows = items.slice(0, 20).map(item => `
      <tr>
        <td>${item.keyword || '---'}</td>
        <td>${item.searches ? Number(item.searches).toLocaleString() : '---'}</td>
        <td>${item.rankPosition?.position ?? '---'}</td>
        <td>${item.adPosition?.position ?? '---'}</td>
        <td>${item.trafficPercentage != null ? `${(item.trafficPercentage * 100).toFixed(1)}%` : '---'}</td>
        <td>${item.bid ? `¥${Number(item.bid).toLocaleString()}` : '---'}</td>
      </tr>
    `).join('');

    return `
      <table class="ec-lens-table">
        <thead>
          <tr>
            <th>キーワード</th>
            <th>月間検索数</th>
            <th>自然順位</th>
            <th>広告順位</th>
            <th>流入割合</th>
            <th>PPC入札</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  _renderTrends() {
    const trends = this.data.googleTrends;
    const bsr = this.data.bsrPrediction;

    if (!trends && this.data.googleTrendsError) {
      return `<div class="ec-lens-tab-error">データ取得エラー: ${this.data.googleTrendsError}</div>`;
    }

    const bsrValue = bsr?.estMonthSales;

    return `
      ${bsrValue != null ? `
        <div style="margin-bottom:12px;padding:10px 14px;background:#F5F7FF;border-radius:6px;border:1px solid #E0E0E0">
          <span style="font-size:13px;color:#777">BSR推定月間販売数</span>
          <span style="font-size:19px;font-weight:700;color:#1A237E;margin-left:10px">${Number(bsrValue).toLocaleString()}個</span>
        </div>
      ` : ''}
      <div class="ec-lens-chart-title">Googleトレンド（直近12ヶ月）</div>
      <div class="ec-lens-chart-wrap">
        <canvas id="ec-lens-chart-trends"></canvas>
      </div>
      ${(!trends && !this.data.googleTrendsError) ? '<p style="font-size:13px;color:#999;text-align:center">Googleトレンドデータがありません</p>' : ''}
      ${(trends && !trends.items?.length) ? '<p style="font-size:13px;color:#999;text-align:center">このキーワードのトレンドデータは見つかりませんでした</p>' : ''}
    `;
  }

  _drawTrendsChart() {
    const trends = this.data.googleTrends;
    if (!trends?.items?.length) return;

    const items = trends.items.slice(-12);
    const canvas = this.el.querySelector('#ec-lens-chart-trends');
    if (!canvas) return;

    this._charts.trends = new Chart(canvas, {
      type: 'line',
      data: {
        labels: items.map(i => {
          if (i.date) return i.date;
          if (i.month) return i.month;
          if (i.time) return new Date(i.time).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' });
          return '';
        }),
        datasets: [
          {
            label: '検索トレンド',
            data: items.map(i => i.value || i.index || 0),
            borderColor: '#2E7D32',
            backgroundColor: 'rgba(46, 125, 50, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
          },
        ],
      },
      options: chartOptions('月', 'トレンド指数', null),
    });
  }

  _renderReviews() {
    return `
      <div id="ec-lens-review-initial">
        <p style="color:#555;margin-bottom:12px;line-height:1.7">
          現在表示中のAmazon商品ページからレビューを取得し、Claude AIで分析します。
        </p>
        <button id="ec-lens-review-btn" style="
          background:#1560BD;color:#fff;border:none;border-radius:4px;
          padding:10px 20px;font-size:15px;font-weight:600;cursor:pointer;
          font-family:inherit;
        ">AIでレビューを分析する（Claude）</button>
        <div id="ec-lens-review-result"></div>
      </div>
    `;
  }

  _bindReviewBtn() {
    const btn = this.el.querySelector('#ec-lens-review-btn');
    if (!btn || !this.reviewHandler) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '分析中...';
      const resultEl = this.el.querySelector('#ec-lens-review-result');
      resultEl.innerHTML = this._renderReviewSkeleton();
      try {
        await this.reviewHandler(resultEl);
      } catch (err) {
        resultEl.innerHTML = `<div class="ec-lens-tab-error">${err.message}</div>`;
      } finally {
        btn.disabled = false;
        btn.textContent = '再分析する（Claude）';
      }
    });
  }

  _renderReviewSkeleton() {
    return `
      <div style="margin-top:16px">
        <div class="ec-lens-5w1h-grid">
          ${Array(6).fill('<div class="ec-lens-skeleton" style="height:80px"></div>').join('')}
        </div>
        <div class="ec-lens-skeleton" style="height:100px;margin-bottom:10px"></div>
        <div class="ec-lens-skeleton" style="height:100px;margin-bottom:10px"></div>
        <div class="ec-lens-skeleton" style="height:100px"></div>
      </div>
    `;
  }

  renderReviewResult(result, el) {
    // Claudeがラッパーキーを付けて返すケースに対応（persona/pros直下にない場合、一段掘り下げる）
    let data = result;
    if (data && !data.persona && !data.pros) {
      const nested = Object.values(data).find(v => v && typeof v === 'object' && (v.persona || v.pros));
      if (nested) data = nested;
    }
    const { persona, pros, cons, usage_scenes } = data;
    const targetEl = el || this.el.querySelector('#ec-lens-review-result');
    if (!targetEl) return;

    const w1hLabels = {
      who: '誰が（Who）',
      when: 'いつ（When）',
      where: 'どこで（Where）',
      what: '何のために（What）',
      why: 'なぜ今（Why）',
      how: 'どうやって（How）',
    };

    const personaHTML = persona ? `
      <h4 style="font-size:14px;font-weight:700;color:#1A237E;margin:16px 0 8px">購買ペルソナ（5W1H）</h4>
      <div class="ec-lens-5w1h-grid">
        ${Object.entries(w1hLabels).map(([key, label]) => {
          const items = persona[key] || [];
          return `
            <div class="ec-lens-5w1h-card">
              <div class="card-head">${label}</div>
              <ul class="card-body">
                ${items.slice(0, 3).map(item => `
                  <li>
                    <span>${typeof item === 'string' ? item : item.label || item.text || item.attribute || item.timing || item.location || item.purpose || item.trigger || item.channel || ''}</span>
                    ${item.percent != null ? `<span style="color:#1560BD;font-weight:600">${item.percent}%</span>` : ''}
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
        }).join('')}
      </div>
    ` : '';

    const tableHTML = (title, items, color) => {
      if (!items || !items.length) return '';
      return `
        <h4 style="font-size:14px;font-weight:700;color:#1A237E;margin:20px 0 14px">${title}</h4>
        <table class="ec-lens-table" style="margin-bottom:16px">
          <thead><tr><th style="width:28%">トピック</th><th style="width:38%">言及割合</th><th style="width:34%">引用</th></tr></thead>
          <tbody>
            ${items.slice(0, 5).map(item => `
              <tr>
                <td>${item.topic || item.scene || ''}</td>
                <td>
                  <div class="ec-lens-percent-bar">
                    <div class="bar-track">
                      <div class="bar-fill ${color}" style="width:${Math.min(item.percent || 0, 100)}%"></div>
                    </div>
                    <span style="font-size:13px;color:#555;white-space:nowrap">${item.percent || 0}%</span>
                  </div>
                </td>
                <td style="color:#666;font-size:13px;word-break:break-all">${item.review_quote || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    };

    targetEl.innerHTML = `
      <div style="margin-top:16px">
        ${personaHTML}
        ${tableHTML('高評価ポイント', pros, 'green')}
        ${tableHTML('低評価ポイント', cons, 'red')}
        ${tableHTML('使用シーン', usage_scenes, 'blue')}
      </div>
    `;
  }

  onReviewAnalysis(handler) {
    this.reviewHandler = handler;
    if (this.activeTab === 'reviews') {
      this._bindReviewBtn();
    }
  }

  close() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}

// ユーティリティ
function formatRevenue(amount) {
  if (!amount) return '---';
  return `¥${Number(amount).toLocaleString()}`;
}

function formatDateAndAge(dateStr) {
  if (!dateStr) return '---';
  const date = new Date(dateStr);
  const now = new Date();
  const months = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  const years = (months / 12).toFixed(1);
  return `${dateStr}（約${years}年）`;
}

// Chart.js 共通オプション
function chartOptions(xLabel, y1Label, y2Label) {
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { font: { size: 11 }, boxWidth: 12 },
      },
      tooltip: {
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y;
            if (ctx.dataset.yAxisID === 'y2' || ctx.dataset.label?.includes('売上')) {
              return ` ${ctx.dataset.label}: ¥${Number(val).toLocaleString()}`;
            }
            return ` ${ctx.dataset.label}: ${Number(val).toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { size: 10 }, maxRotation: 45 },
        grid: { color: '#F0F0F0' },
      },
      y: {
        ticks: {
          font: { size: 10 },
          callback: (v) => Number(v).toLocaleString(),
        },
        grid: { color: '#F0F0F0' },
        title: y1Label ? { display: true, text: y1Label, font: { size: 10 } } : undefined,
      },
    },
  };

  if (y2Label) {
    opts.scales.y2 = {
      position: 'right',
      ticks: {
        font: { size: 10 },
        callback: (v) => `¥${Math.round(v / 10000)}万`,
      },
      grid: { drawOnChartArea: false },
      title: { display: true, text: y2Label, font: { size: 10 } },
    };
  }

  return opts;
}
