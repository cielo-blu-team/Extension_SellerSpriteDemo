/**
 * モーダルコンポーネント（5タブ）
 * 商品詳細ページのフローティングボタン押下後に表示
 */

export class Modal {
  constructor() {
    this.el = null;
    this.activeTab = 'overview';
    this.data = null;
    this.asin = null;
    this.reviewHandler = null;
    this._charts = {}; // Chart.jsインスタンス管理
  }

  render(asin) {
    this.asin = asin;
    const modal = document.createElement('div');
    modal.id = 'ec-lens-modal-overlay';
    modal.innerHTML = `
      <style>
        #ec-lens-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        #ec-lens-modal {
          background: #fff;
          width: 760px;
          max-width: 96vw;
          max-height: 86vh;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        #ec-lens-modal-header {
          background: #1A237E;
          color: #fff;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        #ec-lens-modal-header .ec-lens-asin {
          font-size: 12px;
          color: #90CAF9;
          margin-right: 8px;
        }
        #ec-lens-modal-header .ec-lens-title {
          font-size: 13px;
          font-weight: 600;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        #ec-lens-modal-close {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.7);
          font-size: 20px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }
        #ec-lens-modal-close:hover { color: #fff; }
        #ec-lens-modal-tabs {
          display: flex;
          border-bottom: 2px solid #E0E0E0;
          background: #F5F5F5;
          flex-shrink: 0;
          overflow-x: auto;
        }
        .ec-lens-tab-btn {
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          background: transparent;
          cursor: pointer;
          white-space: nowrap;
          color: #555;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          transition: color 0.15s;
        }
        .ec-lens-tab-btn.active {
          color: #1560BD;
          border-bottom-color: #1560BD;
          font-weight: 700;
        }
        .ec-lens-tab-btn:hover:not(.active) { color: #1560BD; }
        #ec-lens-modal-body {
          overflow-y: auto;
          flex: 1;
          padding: 16px;
          font-size: 12px;
          color: #333;
          line-height: 1.6;
        }
        /* 共通テーブル */
        .ec-lens-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .ec-lens-table th {
          background: #1A237E;
          color: #fff;
          padding: 7px 10px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
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
          font-size: 10px;
          color: #777;
          margin-bottom: 2px;
        }
        .ec-lens-overview-card .value {
          font-size: 17px;
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
          font-size: 11px;
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
          font-size: 11px;
          font-weight: 700;
        }
        .ec-lens-5w1h-card .card-body {
          padding: 8px 10px;
          font-size: 11px;
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
          font-size: 12px;
        }
        /* チャートエリア */
        .ec-lens-chart-wrap {
          position: relative;
          height: 220px;
          margin-bottom: 14px;
          background: #FAFAFA;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          padding: 10px;
        }
        .ec-lens-chart-title {
          font-size: 11px;
          font-weight: 700;
          color: #444;
          margin-bottom: 6px;
        }
      </style>
      <div id="ec-lens-modal">
        <div id="ec-lens-modal-header">
          <span class="ec-lens-asin">${asin}</span>
          <span class="ec-lens-title" id="ec-lens-modal-title">データ取得中...</span>
          <button id="ec-lens-modal-close">×</button>
        </div>
        <div id="ec-lens-modal-tabs">
          <button class="ec-lens-tab-btn active" data-tab="overview">商品概要</button>
          <button class="ec-lens-tab-btn" data-tab="sales">売上推移</button>
          <button class="ec-lens-tab-btn" data-tab="keywords">流入KW</button>
          <button class="ec-lens-tab-btn" data-tab="trends">市場トレンド</button>
          <button class="ec-lens-tab-btn" data-tab="reviews">AIレビュー</button>
        </div>
        <div id="ec-lens-modal-body">
          ${this._renderLoading()}
        </div>
      </div>
    `;

    this.el = modal;
    this._bindEvents();
    return modal;
  }

  _bindEvents() {
    // 閉じるボタン
    this.el.querySelector('#ec-lens-modal-close').addEventListener('click', () => this.close());

    // オーバーレイクリックで閉じる
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close();
    });

    // タブ切り替え
    this.el.querySelectorAll('.ec-lens-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this._switchTab(tab);
      });
    });
  }

  _switchTab(tab) {
    // 既存チャートを破棄
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
      this.el.querySelector('#ec-lens-modal-title').textContent = productTitle;
    }
    this._renderTabContent();
  }

  _renderTabContent() {
    const body = this.el.querySelector('#ec-lens-modal-body');
    if (!this.data) {
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
          ${Array(6).fill('<div class="ec-lens-skeleton" style="height:70px"></div>').join('')}
        </div>
        <div class="ec-lens-skeleton" style="height:14px;width:40%;margin-bottom:8px"></div>
        <div class="ec-lens-skeleton" style="height:120px"></div>
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
      <div class="ec-lens-chart-title" style="margin-top:8px">日別販売数（直近30日）</div>
      <div class="ec-lens-chart-wrap">
        <canvas id="ec-lens-chart-daily"></canvas>
      </div>
      <table class="ec-lens-table" style="margin-top:12px">
        <thead><tr><th>月</th><th>販売数</th><th>売上</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#999">データなし</td></tr>'}</tbody>
      </table>
    `;
  }

  _drawSalesCharts() {
    if (!window.Chart) {
      this._loadChartJs(() => this._drawSalesCharts());
      return;
    }
    const sp = this.data.salesPrediction;
    if (!sp) return;

    // 月別グラフ
    const monthly = (sp.monthItemList || []).slice(-6);
    const monthCanvas = this.el.querySelector('#ec-lens-chart-monthly');
    if (monthCanvas && monthly.length) {
      this._charts.monthly = new window.Chart(monthCanvas, {
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

    // 日別グラフ
    const daily = (sp.dailyItemList || []).slice(-30);
    const dailyCanvas = this.el.querySelector('#ec-lens-chart-daily');
    if (dailyCanvas && daily.length) {
      this._charts.daily = new window.Chart(dailyCanvas, {
        type: 'line',
        data: {
          labels: daily.map(i => i.date || ''),
          datasets: [
            {
              label: '日別販売数（個）',
              data: daily.map(i => i.sales || 0),
              borderColor: '#1560BD',
              backgroundColor: 'rgba(21, 96, 189, 0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: 2,
            },
          ],
        },
        options: chartOptions('日', '販売数', null),
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
          <span style="font-size:11px;color:#777">BSR推定月間販売数</span>
          <span style="font-size:17px;font-weight:700;color:#1A237E;margin-left:10px">${Number(bsrValue).toLocaleString()}個</span>
        </div>
      ` : ''}
      <div class="ec-lens-chart-title">Googleトレンド（直近12ヶ月）</div>
      <div class="ec-lens-chart-wrap">
        <canvas id="ec-lens-chart-trends"></canvas>
      </div>
      ${(!trends && !this.data.googleTrendsError) ? '<p style="font-size:11px;color:#999;text-align:center">Googleトレンドデータがありません</p>' : ''}
    `;
  }

  _drawTrendsChart() {
    if (!window.Chart) {
      this._loadChartJs(() => this._drawTrendsChart());
      return;
    }
    const trends = this.data.googleTrends;
    if (!trends?.items?.length) return;

    const items = trends.items.slice(-12);
    const canvas = this.el.querySelector('#ec-lens-chart-trends');
    if (!canvas) return;

    this._charts.trends = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: items.map(i => i.date || i.month || ''),
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

  _loadChartJs(callback) {
    if (document.getElementById('ec-lens-chartjs')) {
      // スクリプトはあるがwindow.Chartがまだない→少し待つ
      setTimeout(() => { if (window.Chart) callback(); }, 200);
      return;
    }
    const script = document.createElement('script');
    script.id = 'ec-lens-chartjs';
    script.src = chrome.runtime.getURL('assets/chart.umd.js');
    script.onload = callback;
    document.head.appendChild(script);
  }

  _renderReviews() {
    return `
      <div id="ec-lens-review-initial">
        <p style="color:#555;margin-bottom:12px;line-height:1.7">
          現在表示中のAmazon商品ページからレビューを取得し、Claude AIで分析します。<br>
          高評価（4〜5星）15件 + 低評価（1〜2星）15件を自動収集します。
        </p>
        <button id="ec-lens-review-btn" style="
          background:#1560BD;color:#fff;border:none;border-radius:4px;
          padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;
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
          ${Array(6).fill('<div class="ec-lens-skeleton" style="height:100px"></div>').join('')}
        </div>
        <div class="ec-lens-skeleton" style="height:140px;margin-bottom:10px"></div>
        <div class="ec-lens-skeleton" style="height:140px;margin-bottom:10px"></div>
        <div class="ec-lens-skeleton" style="height:140px"></div>
      </div>
    `;
  }

  renderReviewResult(result, el) {
    const { persona, pros, cons, usage_scenes } = result;
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
      <h4 style="font-size:12px;font-weight:700;color:#1A237E;margin:16px 0 8px">購買ペルソナ（5W1H）</h4>
      <div class="ec-lens-5w1h-grid">
        ${Object.entries(w1hLabels).map(([key, label]) => {
          const items = persona[key] || [];
          return `
            <div class="ec-lens-5w1h-card">
              <div class="card-head">${label}</div>
              <ul class="card-body">
                ${items.slice(0, 3).map(item => `
                  <li>
                    <span>${typeof item === 'string' ? item : item.label || item.text || ''}</span>
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
        <h4 style="font-size:12px;font-weight:700;color:#1A237E;margin:16px 0 8px">${title}</h4>
        <table class="ec-lens-table" style="margin-bottom:12px">
          <thead><tr><th>トピック</th><th style="width:140px">言及割合</th><th>引用</th></tr></thead>
          <tbody>
            ${items.slice(0, 5).map(item => `
              <tr>
                <td>${item.topic || ''}</td>
                <td>
                  <div class="ec-lens-percent-bar">
                    <div class="bar-track">
                      <div class="bar-fill ${color}" style="width:${Math.min(item.percent || 0, 100)}%"></div>
                    </div>
                    <span style="font-size:11px;color:#555;white-space:nowrap">${item.percent || 0}%</span>
                  </div>
                </td>
                <td style="color:#666;font-size:11px">${item.review_quote || ''}</td>
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
    // タブが既にreviewsなら再バインド
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
  if (amount >= 10000) return `¥${Math.round(amount / 10000)}万`;
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
